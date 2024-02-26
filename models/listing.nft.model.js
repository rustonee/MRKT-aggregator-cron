const mongoose = require("mongoose");

// Define the schema for the listed nfts
const listingNftSchema = new mongoose.Schema({
  nft_id: {
    type: String,
    required: true,
    index: true,
  },
  collection_address: {
    type: String,
  },
  nft_token_id: {
    type: String,
  },
  price: {
    type: Number,
  },
  seller: {
    type: String,
  },
  auction_type: {
    type: String,
  },
  expiration: {
    type: String,
  },
  ts: {
    type: Number,
  },
});

// Create the ListingNft model
const ListingNft = mongoose.model("ListingNft", listingNftSchema);

module.exports = ListingNft;
