const mongoose = require("mongoose");

// Define the schema
const nftSchema = new mongoose.Schema({
  key: {
    type: String,
    require: true,
    index: true,
  },
  id: {
    type: String,
    require: true,
  },
  int_id: {
    type: Number,
    require: true,
  },
  name: {
    type: String,
    require: true,
    index: true,
  },
  description: {
    type: String,
  },
  owner: {
    type: String,
    require: true,
  },
  status: {
    type: String,
    require: true,
    index: true,
  },
  verified: {
    type: Boolean,
  },
  image: {
    type: String,
    require: true,
  },
  last_sale: {},
  //   version: {
  //     type: String,
  //   },
  collection_key: {
    type: String,
  },
  symbol: {
    type: String,
  },
  rarity: {},
  traits: [],
  auction: [],
  bid: [],
});

// Create the model
const NFT = mongoose.model("NFT", nftSchema);

module.exports = NFT;
