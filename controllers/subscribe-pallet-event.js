const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");
const Transaction = require("../models/transaction.model");

const EventType = {
  SALE: "sale",
  LIST: "list_nft",
  WITHDRAW: "withdraw_listing",
};

// Initialize websocket and wsQuery variables.
let websocket;
let wsQuery;

exports.subscribeEvents = async () => {
  connectToWebSocket();
};
exports.unsubscribeEvents = async () => {
  disconnectFromWebsocket();
};

const connectToWebSocket = () => {
  try {
    // Open a new WebSocket connection
    websocket = new WebSocket(process.env.PALLET_SUBSCRIBE_URL);

    // Define the subscription request
    wsQuery = {
      jsonrpc: "2.0",
      method: "subscribe",
      id: uuidv4().toString(),
      params: {
        query: `tm.event = 'Tx' AND execute._contract_address CONTAINS '${process.env.SEI_CONTROLLER_ADDRESS}'`,
      },
    };

    websocket.on("open", () => {
      websocket.send(JSON.stringify(wsQuery));
      console.log("Sent subscribe request.");
    });

    websocket.on("message", async (event) => {
      console.log("Received event.");
      try {
        const eventData = JSON.parse(event);
        if (eventData && eventData.result && eventData.result.data) {
          const TxResult = eventData.result.data.value.TxResult;

          const block = TxResult.height;
          const ts = getBlockTime(block);

          const logs = JSON.parse(TxResult.result.log);
          const txLog = logs.length > 1 ? logs[1] : logs[0];

          let transactions = [];
          if (existType("wasm-buy_now", txLog)) {
            transactions = analyzeSaleEvents(block, ts, txLog);
          } else if (existType("wasm-create_auction", txLog)) {
            transactions = analyzeListEvents(block, ts, txLog);
          } else if (existType("wasm-cancel_auction", txLog)) {
            transactions = analyzeWithdrawEvents(block, ts, txLog);
          }

          if (transactions.length > 0) {
            await Transaction.insertMany(transactions);

            console.log(
              "Transactions inserted successfully:",
              transactions.length
            );
          }
        }
      } catch (error) {
        console.log("Event processing error:", error);
      }
    });

    websocket.on("error", (error) => {
      console.error("Websocket error:", error);
      disconnectFromWebsocket();
    });

    websocket.on("close", (error) => {
      console.error("Websocket closed:", error);
      websocket.send(JSON.stringify({ ...wsQuery, method: "unsubscribe" }));

      websocket = null;
      wsQuery = null;

      console.log("Reconnecting ...");
      // Reconnect automatically after 5 seconds
      setTimeout(() => {
        connectToWebSocket();
      }, 5000);
    });
  } catch (error) {
    console.error("Common error:", error);
    disconnectFromWebsocket();
  }
};

const disconnectFromWebsocket = () => {
  console.log("disconnecting...");

  if (!websocket || websocket.readyState !== WebSocket.OPEN) {
    return;
  }

  // Send an 'unsubscribe' message
  websocket.send(JSON.stringify({ ...wsQuery, method: "unsubscribe" }));

  // Close the WebSocket connection
  websocket.close();

  websocket = null;
  wsQuery = null;
};

const analyzeSaleEvents = (block, ts, txLog) => {
  const transactions = [];

  const messageData = getEventDataByType("message", txLog);
  const message = reduceEvents(messageData.attributes);
  const sender = message.sender;
  const eventsData = getEventDataByType("wasm-buy_now", txLog);

  for (let i = 0; i < eventsData.attributes.length; i += 5) {
    const event = reduceEvents([
      eventsData.attributes[i],
      eventsData.attributes[i + 1],
      eventsData.attributes[i + 2],
      eventsData.attributes[i + 3],
      eventsData.attributes[i + 4],
    ]);

    const transaction = {
      block,
      event: EventType.SALE,
      auction_type: "fixed_price",
      expiration: null,
      buyer: sender,
      nft_address: event.nft_address,
      nft_token_id: event.nft_token_id,
      price: calcuPrice(event.sale_price),
      seller: event.nft_seller,
      ts,
    };

    transactions.push(transaction);
  }

  return transactions;
};

const analyzeListEvents = (block, ts, txLog) => {
  const transactions = [];

  const messageData = getEventDataByType("message", txLog);
  const message = reduceEvents(messageData.attributes);
  const sender = message.sender;
  const eventsData = getEventDataByType("wasm-create_auction", txLog);

  const event = reduceEvents(eventsData.attributes);
  const transaction = {
    block,
    event: EventType.LIST,
    auction_type: "fixed_price",
    expiration: null,
    buyer: null,
    nft_address: event.nft_address,
    nft_token_id: event.nft_token_id,
    price: calcuPrice(event.min_price),
    seller: sender,
    ts,
  };

  transactions.push(transaction);

  return transactions;
};

const analyzeWithdrawEvents = (block, ts, txLog) => {
  const transactions = [];

  const messageData = getEventDataByType("message", txLog);
  const message = reduceEvents(messageData.attributes);
  const sender = message.sender;
  const eventsData = getEventDataByType("wasm-cancel_auction", txLog);

  const event = reduceEvents(eventsData.attributes);
  const transaction = {
    block,
    event: EventType.WITHDRAW,
    auction_type: "fixed_price",
    expiration: null,
    buyer: null,
    nft_address: event.nft_address,
    nft_token_id: event.nft_token_id,
    price: null,
    seller: sender,
    ts,
  };

  transactions.push(transaction);

  return transactions;
};

const reduceEvents = (events) => {
  const eventData = {};

  events.forEach((attribute) => {
    eventData[attribute.key] = attribute.value;
  });

  return eventData;
};

const existType = (type, jsonData) => {
  return jsonData.events.some((event) => event.type === type);
};

const getEventDataByType = (type, jsonData) => {
  return jsonData.events.find((event) => event.type === type);
};

const calcuPrice = (value) => {
  try {
    let price = 0;
    if (value.endsWith("usei")) {
      price = parseFloat(value.replace("usei", ""));
    } else if (value.includes("amount: Uint128")) {
      const temp = value.replace("amount: Uint128", "");
      price = parseFloat(temp.match(/\d+/)[0]);
    }

    return price / 1000000;
  } catch (error) {
    console.log(error);
    return "--";
  }
};

const getBlockTime = (block) => {
  const tempBlock = 58958158;
  const tempTimeStamp = 1708406881000;

  const sub_ts = Math.ceil((block - tempBlock) / 2.3);
  const ts = tempTimeStamp + sub_ts * 1000;
  return Math.ceil(ts / 1000);
};
