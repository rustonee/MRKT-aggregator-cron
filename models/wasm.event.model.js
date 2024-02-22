const mongoose = require("mongoose");

// Define the schema for the wasm events
const wasmEventSchema = new mongoose.Schema({
  block: {
    type: String,
  },
  tx: {
    type: String,
  },
  event: {},
  ts: {
    type: Number,
  },
});

// Create the Wasm event model
const WasmEvent = mongoose.model("WasmEvent", wasmEventSchema);

module.exports = WasmEvent;
