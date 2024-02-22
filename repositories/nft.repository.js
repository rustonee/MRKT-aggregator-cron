const mongoose = require("mongoose");
const Nft = require("../models/nft.model");
const NftTrait = require("../models/nft.trait");

exports.createNft = async (nftObject) => {
  try {
    const nft = new Nft(nftObject);
    const result = await nft.save();
    return result;
  } catch (error) {
    console.log("createNft:", error.message);
  }
};

exports.findByAddressAndTokenId = async (token_address, token_id) => {
  try {
    const result = await Nft.findOne({ token_address, token_id });
    return result;
  } catch (error) {
    console.log("findNft:", error.message);
  }
};

exports.updateNftStatus = async (token_address, token_id, update) => {
  try {
    const result = await Nft.findOneAndUpdate(
      { token_address, token_id },
      update,
      { new: true }
    );

    return result;
  } catch (error) {
    console.log("updateNftStatus:", error.message);
  }
};

exports.createNftTrait = async (trait) => {
  try {
    const nftTrait = new NftTrait(trait);
    const result = nftTrait.save();
    return result;
  } catch (error) {
    console.log("createNftTrait:", error.message);
  }
};
