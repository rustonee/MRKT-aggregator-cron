const mongoose = require("mongoose");

// Define the schema for the collections
const collectionSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    index: true,
  },
  slug: {
    type: String,
    required: true,
    index: true,
  },
  symbol: {
    type: String,
    required: true,
    index: true,
  },
  description: {
    type: String,
  },
  image: {
    type: String,
  },
  banner: {
    type: String,
  },
  creator: {
    type: String,
  },
  royalty: {
    type: Number,
  },
  chain_id: {
    type: String,
  },
  socials: [],
  public: {
    type: Boolean,
  },
  volume: {
    type: Number,
  },
  num_sales: {
    type: Number,
  },
});

// Create the Collection model
const Collection = mongoose.model("Collection", collectionSchema);

module.exports = Collection;
