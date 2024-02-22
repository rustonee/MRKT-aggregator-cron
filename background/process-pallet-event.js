const wasmEventRepository = require("../repositories/wasm.event.repository");
const transactionRepository = require("../repositories/transaction.repository");

const collectionController = require("../controllers/collection.controller");
const nftController = require("../controllers/nft.controller");

const { SigningCosmWasmClient } = require("@cosmjs/cosmwasm-stargate");

const EventType = {
  SALE: "sale",
  LIST: "list_nft",
  WITHDRAW: "withdraw_listing",
};

exports.processWasmEvents = async () => {
  const client = await SigningCosmWasmClient.connect(process.env.RPC_URL);
  const wasmEvents = await wasmEventRepository.getAllWasmEvents();
  for (const wasmEvent of wasmEvents) {
    try {
      const block = wasmEvent.block;
      const tx = wasmEvent.tx;
      const ts = wasmEvent.ts;

      const logs = JSON.parse(wasmEvent.event.log);
      const txLog = logs.length > 1 ? logs[1] : logs[0];

      let transactions = [];
      if (existType("wasm-buy_now", txLog)) {
        transactions = analyzeSaleEvents(block, ts, txLog);
      } else if (existType("wasm-create_auction", txLog)) {
        transactions = analyzeListEvents(block, ts, txLog);
      } else if (existType("wasm-cancel_auction", txLog)) {
        transactions = analyzeWithdrawEvents(block, ts, txLog);
      }

      for (const transaction of transactions) {
        // save transaction
        await transactionRepository.createTransaction(transaction);
        // create collection if no exist
        await collectionController.createCollection(transaction, client);
        // create nft or update
        await nftController.createNft(transaction, client);
      }

      // delete processed wasm event
      await wasmEventRepository.deleteWasmEvent(wasmEvent._id);

      console.log(
        "Event processing: Transactions inserted successfully:",
        transactions.length
      );
    } catch (error) {
      console.log("Event processing error:", error);
    }
  }
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
