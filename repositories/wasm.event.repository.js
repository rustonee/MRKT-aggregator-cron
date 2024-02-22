const mongoose = require("mongoose");
const WasmEvent = require("../models/wasm.event.model");

exports.createWasmEvent = async (block, tx, event, ts) => {
  try {
    const wasmEvent = new WasmEvent({ block, tx, event, ts });
    const result = await wasmEvent.save();
    return result;
  } catch (error) {
    console.log("createWasmEvent:", error.message);
  }
};

exports.getAllWasmEvents = async () => {
  try {
    const results = await WasmEvent.find();
    return results;
  } catch (error) {
    console.log("getAllWasmEvents:", error.message);
  }
};

exports.findWasmEvent = async (id) => {
  try {
    const result = await WasmEvent.findById(id);
    return result;
  } catch (error) {
    console.log("deleteWasmEvent:", error.message);
  }
};

exports.deleteWasmEvent = async (id) => {
  try {
    await WasmEvent.findByIdAndDelete(id);
  } catch (error) {
    console.log("deleteWasmEvent:", error.message);
  }
};
