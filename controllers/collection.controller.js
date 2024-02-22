const mongoose = require("mongoose");
const Collection = require("../models/collection.model");
const collectionRepository = require("../repositories/collection.repository");
const palletUserRepository = require("../repositories/pallet-user.repository");

const {
  getCollectionFromPallet,
} = require("./services/http/get-collection-details");

const { getUserInfo } = require("./services/contract/get-user-info");

const {
  getCollectionRoyalty,
} = require("./services/contract/get-collection-royalty");

exports.createCollection = async (transaction, client) => {
  try {
    const collection = await collectionRepository.findCollection(
      transaction.nft_address
    );

    if (!collection) {
      const collectionDetails = await getCollectionFromPallet(
        transaction.nft_address
      );

      const result = await collectionRepository.createCollection({
        address: transaction.nft_address,
        name: collectionDetails.name,
        slug: collectionDetails.slug,
        symbol: collectionDetails.symbol,
        description: collectionDetails.num_sales_30day,
        image: collectionDetails.pfp,
        banner: collectionDetails.banner,
        creator: collectionDetails.creator,
        royalty: await getCollectionRoyalty(transaction.nft_address),
        chain_id: collectionDetails.chain_id,
        socials: collectionDetails.socials,
        public: true,
      });

      await createPalletUser(collectionDetails.creator, client);

      return result;
    }
  } catch (error) {
    console.log("createCollection:", error.message);
  }
};

const createPalletUser = async (address, client) => {
  try {
    const user = await palletUserRepository.findUser(address);
    if (!user) {
      const palletUser = await getUserInfo(address, client);

      await palletUserRepository.createUser({
        address,
        bio: palletUser.bio,
        email: palletUser.email,
        pfp: palletUser.pfp,
        socials: palletUser.socials,
      });
    }
  } catch (error) {
    console.log("createPalletUser:", error.message);
  }
};
