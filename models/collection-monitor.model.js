const mongoose = require("mongoose");

// Define the schema for the collection monitor
const collectionMonitorSchema = new mongoose.Schema({
  contract_address: {
    type: String,
    required: true,
    index: true
  },
  floor: {
    type: Number
  },
  volume_24hr: {
    type: Number
  },
  volume: {
    type: Number
  },
  sale_count: {
    type: Number
  },
  date: {
    required: true,
    type: Date
  }
});

// Create the CollectionMonitor model
const CollectionMonitor = mongoose.model(
  "CollectionMonitor",
  collectionMonitorSchema
);

module.exports = CollectionMonitor;
