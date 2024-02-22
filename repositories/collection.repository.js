const mongoose = require("mongoose");
const Collection = require("../models/collection.model");

exports.createCollection = async (collectionObject) => {
  try {
    const collection = new Collection(collectionObject);
    const result = await collection.save();
    return result;
  } catch (error) {
    console.log("createCollection:", error.message);
  }
};

exports.findCollection = async (address) => {
  try {
    const result = await Collection.findOne({ address });
    return result;
  } catch (error) {
    console.log("findCollection:", error.message);
  }
};
