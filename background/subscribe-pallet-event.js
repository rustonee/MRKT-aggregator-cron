const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");
const { SigningCosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const wasmEventRepository = require("../repositories/wasm.event.repository");
const {
  getChainDate,
} = require("../controllers/services/contract/get-chain-date");

const EventType = {
  SALE: "sale",
  LIST: "list_nft",
  WITHDRAW: "withdraw_listing",
};

// Initialize websocket and wsQuery variables.
let websocket;
let wsQuery;
let client;

exports.subscribeEvents = async () => {
  connectToWebSocket();
};
exports.unsubscribeEvents = async () => {
  disconnectFromWebsocket();
};

const connectToWebSocket = async () => {
  try {
    // Open a new WebSocket connection
    websocket = new WebSocket(process.env.PALLET_SUBSCRIBE_URL);

    // Define the subscription request
    wsQuery = {
      jsonrpc: "2.0",
      method: "subscribe",
      id: uuidv4().toString(),
      params: {
        query: `tm.event = 'Tx' AND execute._contract_address CONTAINS '${process.env.PALLET_CONTRACT_ADDRESS}'`,
      },
    };

    websocket.on("open", () => {
      websocket.send(JSON.stringify(wsQuery));
      console.log("Sent subscribe request. Listening ...");
    });

    websocket.on("message", async (event) => {
      console.log("Event subscribing: Receiving event...");

      const eventData = JSON.parse(event);

      if (eventData && eventData.result && eventData.result.data) {
        const TxResult = eventData.result.data.value.TxResult;
        const block = TxResult.height;
        const tx = TxResult.tx;
        const event = TxResult.result;
        const ts = await getBlockTimestamp(block);

        await wasmEventRepository.createWasmEvent(block, tx, event, ts);
      }
    });

    websocket.on("error", (error) => {
      console.error("Websocket error:", error);
      disconnectFromWebsocket();
    });

    websocket.on("close", (error) => {
      console.error("Websocket closed:", error);

      websocket = null;
      wsQuery = null;

      console.log("Reconnecting after 100 ms ...");

      // Reconnect automatically after 100 ms
      setTimeout(() => {
        connectToWebSocket();
        console.log("Websocket reconnected");
      }, 100);
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

const getBlockTimestamp = async (block) => {
  if (!client) {
    client = await SigningCosmWasmClient.connect(process.env.RPC_URL);
  }

  const chainDate = await getChainDate(parseInt(block, 10), client);
  const ts = new Date(chainDate).getTime();
  return Math.ceil(ts / 1000);
};
