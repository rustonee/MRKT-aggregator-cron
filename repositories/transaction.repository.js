const mongoose = require("mongoose");
const Transaction = require("../models/transaction.model");

exports.createTransaction = async (tx) => {
  try {
    const transaction = new Transaction(tx);
    const result = await transaction.save();
    return result;
  } catch (error) {
    console.log("createTransaction:", error.message);
  }
};
