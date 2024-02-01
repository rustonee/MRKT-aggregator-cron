const mongoose = require("mongoose");

// Define the schema for the collections
const collectionSchema = new mongoose.Schema({
  contract_address: {
    type: String,
    required: true,
    index: true,
  },
  slug: { type: String, required: true, index: true },
  chain_id: {
    type: String,
    required: true,
    index: true,
  },
  creator: {
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
  description: {
    type: String,
  },
  pfp: {
    type: String,
  },
  banner: {
    type: String,
  },
  socials: [],
  send_listing_notification: {
    type: Boolean,
  },
  calculate_rarities: {
    type: Boolean,
  },
  start_after: {
    type: String,
  },
  supply: {
    type: Number,
  },
  version: {
    type: String,
  },
  public: {
    type: Boolean,
  },
  onboard_tx_id: {
    type: Number,
  },
  creator_info: {},
  auction_count: {
    type: Number,
  },
  owners: {
    type: Number,
  },
  floor: {
    type: Number,
  },
  floor_24hr: {
    type: Number,
  },
  volume: {
    type: Number,
  },
  volume_24hr: {
    type: Number,
  },
  num_sales_24hr: {
    type: Number,
  },
});

// Create the Collection model
const Collection = mongoose.model("Collection", collectionSchema);

module.exports = Collection;
