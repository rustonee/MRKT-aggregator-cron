const mongoose = require("mongoose");
const Collection = require("../models/collection.model");
const Nft = require("../models/nft.model");
const FloorPrice = require("../models/floor.price.model");

exports.createCollection = async (collectionObject) => {
  try {
    const collection = new Collection(collectionObject);
    const result = await collection.save();
    return result;
  } catch (error) {
    console.log("createCollection:", error.message);
  }
};

exports.findCollectionByAddress = async (address) => {
  try {
    const result = await Collection.findOne({ address });
    return result;
  } catch (error) {
    console.log("findCollection:", error.message);
  }
};

exports.updateCollectionStatus = async (address, price) => {
  try {
    const result = await Collection.updateOne(
      { address },
      {
        $inc: {
          volume: price,
          num_sales: 1,
        },
      }
    );

    return result;
  } catch (error) {
    console.log("updateNftStatus:", error.message);
  }
};
