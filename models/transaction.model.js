const mongoose = require("mongoose");

// Define the schema for the transaction
const transactionSchema = new mongoose.Schema({
  block: {
    type: String,
    required: true,
    index: true,
  },
  event: {
    type: String,
    required: true,
    index: true,
  },
  auction_type: {
    type: String,
  },
  expiration: {
    type: String,
  },
  buyer: {
    type: String,
  },
  nft_address: {
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
  ts: {
    type: Number,
  },
});

// Create the Transaction model
const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
