const collectionRepository = require("../repositories/collection.repository");
const palletUserRepository = require("../repositories/pallet.user.repository");
const floorPriceRepository = require("../repositories/floor.price.repository");

const {
  getCollectionFromPallet,
} = require("./services/http/get-collection-details");
const {
  getCollectionTotalSalesFromPallet,
} = require("./services/http/get-collection-total-sales");

const { getUserInfo } = require("./services/contract/get-user-info");

const {
  getCollectionRoyalty,
} = require("./services/contract/get-collection-royalty");

const EventType = {
  SALE: "sale",
  LIST: "list_nft",
  WITHDRAW: "withdraw_listing",
};

exports.createCollection = async (transaction, client) => {
  try {
    const collection = await collectionRepository.findCollectionByAddress(
      transaction.nft_address
    );

    if (collection) {
      let num_sales = 0;
      // if don't initialize, set from pallet
      if (collection.num_sales === -1) {
        num_sales = await getCollectionTotalSalesFromPallet(
          transaction.nft_address
        );
        if (num_sales !== -1) {
          num_sales = num_sales + 1;
        }
      }

      // if event is sale, increase volume and num_sales
      if (transaction.event === EventType.SALE) {
        await collectionRepository.updateCollectionStatus(
          transaction.nft_address,
          transaction.price,
          num_sales === -1 ? 0 : num_sales + 1
        );
      }
    } else {
      const collectionDetails = await getCollectionFromPallet(
        transaction.nft_address
      );

      const initialVolume = collectionDetails.volume;
      const totalVolume =
        initialVolume +
        (transaction.event === EventType.SALE ? transaction.price : 0);

      const initialSales = await getCollectionTotalSalesFromPallet(
        transaction.nft_address
      );
      const numSales =
        initialSales === -1
          ? initialSales
          : initialSales + (transaction.event === EventType.SALE ? 1 : 0);

      const result = await collectionRepository.createCollection({
        address: transaction.nft_address,
        name: collectionDetails.name,
        slug: collectionDetails.slug,
        symbol: collectionDetails.symbol,
        description: collectionDetails.description,
        image: collectionDetails.pfp,
        banner: collectionDetails.banner,
        creator: collectionDetails.creator,
        royalty: await getCollectionRoyalty(transaction.nft_address, client),
        chain_id: collectionDetails.chain_id,
        socials: collectionDetails.socials,
        public: true,
        volume: totalVolume,
        num_sales: numSales,
      });

      // add current floor
      await floorPriceRepository.createFloorPrice(
        transaction.nft_address,
        collectionDetails.floor,
        transaction.ts
      );

      // add collection user
      await createPalletUser(collectionDetails.creator, client);

      return result;
    }
  } catch (error) {
    console.log(`createCollection: ${transaction.nft_address}:`, error.message);
  }
};

exports.createCollectionFloor = async (transaction, client) => {
  const currentFloorPrice =
    await floorPriceRepository.getCurrentFloorPriceByTokenAddress(
      transaction.nft_address
    );
  const lastFloorPrice =
    await floorPriceRepository.getLastFloorPriceByTokenAddress(
      transaction.nft_address
    );

  if (
    currentFloorPrice &&
    lastFloorPrice &&
    currentFloorPrice < lastFloorPrice
  ) {
    await floorPriceRepository.createFloorPrice(
      transaction.nft_address,
      currentFloorPrice,
      transaction.ts
    );
  }
};

const createPalletUser = async (address, client) => {
  try {
    const user = await palletUserRepository.findUserByAddress(address);
    if (!user) {
      const palletUser = await getUserInfo(address, client);

      await palletUserRepository.createUser({
        address,
        bio: palletUser.bio,
        email: palletUser.email,
        pfp: palletUser.pfp?.key || null,
        socials: palletUser.socials,
      });
    }
  } catch (error) {
    console.log("createPalletUser:", error.message);
  }
};
