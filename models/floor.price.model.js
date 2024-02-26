const mongoose = require("mongoose");

const floorPriceSchema = new mongoose.Schema({
  token_address: {
    type: String,
    required: true,
    index: true,
  },
  floor: {
    type: Number,
    required: true,
  },
  ts: {
    type: Number,
    required: true,
  },
});

// Create the FollorPrice model
const FloorPrice = mongoose.model("FloorPrice", floorPriceSchema);

module.exports = FloorPrice;
