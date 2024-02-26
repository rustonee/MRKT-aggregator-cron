const mongoose = require("mongoose");

// Define the schema for the nft trait
const nftTraitSchema = new mongoose.Schema({
  nft_address: {
    type: String,
    require: true,
    index: true,
  },
  nft_token_id: {
    type: String,
    require: true,
    index: true,
  },
  type: {
    type: String,
    require: true,
    index: true,
  },
  value: {
    type: String,
    index: true,
  },
  display_type: {
    type: String,
  },
});

// Create the Nft Trait model
const NftTrait = mongoose.model("NftTrait", nftTraitSchema);

module.exports = NftTrait;
