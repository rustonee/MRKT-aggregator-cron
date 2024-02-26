const mongoose = require("mongoose");
const PalletUser = require("../models/pallet.user.model");

exports.createUser = async (userObject) => {
  try {
    const user = new PalletUser(userObject);
    const result = await user.save();
    return result;
  } catch (error) {
    console.log("createUser:", error.message);
  }
};

exports.findUserByAddress = async (address) => {
  try {
    const result = await PalletUser.findOne({ address });
    return result;
  } catch (error) {
    console.log("findUser:", error.message);
  }
};
