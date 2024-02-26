const mongoose = require("mongoose");
const FloorPrice = require("../models/floor.price.model");
const Nft = require("../models/nft.model");

exports.createFloorPrice = async (address, price, ts) => {
  const floorPrice = new FloorPrice({
    token_address: address,
    floor: price,
    ts,
  });

  const result = await floorPrice.save();
  return result;
};

exports.getCurrentFloorPriceByTokenAddress = async (address) => {
  try {
    const result = await Nft.aggregate([
      {
        $match: {
          token_address: address,
          status: "active_auction",
        },
      },
      {
        $group: {
          _id: {
            token_address: "$token_address",
          },
          floor: {
            $min: "$price",
          },
        },
      },
    ]);

    if (result && result[0]) {
      return result[0].floor;
    }

    return null;
  } catch (error) {
    console.log("getCurrentFloorPriceByTokenAddress:", error.message);
  }
};

exports.getLastFloorPriceByTokenAddress = async (address) => {
  try {
    const lastFloor = await FloorPrice.findOne({ token_address: address }).sort(
      { ts: -1 }
    );

    if (lastFloor) {
      return lastFloor.floor;
    }

    return null;
  } catch (error) {
    console.log("getLastFloorPriceByTokenAddress:", error.message);
  }
};
