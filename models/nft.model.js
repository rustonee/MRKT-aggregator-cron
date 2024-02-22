const mongoose = require("mongoose");

// Define the schema for the nfts
const nftSchema = new mongoose.Schema({
  token_address: {
    type: String,
    required: true,
    index: true,
  },
  token_id: {
    type: String,
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    index: true,
  },
  symbol: {
    type: String,
  },
  token_url: {
    type: String,
    required: true,
    index: true,
  },
  image: {
    type: String,
  },
  description: {
    type: String,
  },
  owner: {
    type: String,
    require: true,
  },
  price: {
    type: Number,
    require: true,
    index: true,
  },
  status: {
    type: String,
    require: true,
    index: true,
  },
  auction: {},
  verified: {
    type: String,
  },
});

// Create the NFT model
const Nft = mongoose.model("Nft", nftSchema);

module.exports = Nft;
