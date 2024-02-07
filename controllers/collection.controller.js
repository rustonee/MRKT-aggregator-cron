const mongoose = require("mongoose");
const Collection = require("../models/collection.model");
const CollectionMonitor = require("../models/collection-monitor.model");

const { fetchMarketActivities } = require("./services/fetch-market-activities");
const { fetchCollection } = require("./services/fetch-collection");
const {
  fetchCollectionDetails,
} = require("./services/fetch-collection-details");
const { getCollectionPfp } = require("./services/get-collection-pfp");
const { getCollectionRoyalty } = require("./services/get-collection-royalty");
const {
  getCollectionFloor24hr,
} = require("./services/get-collection-floor24hr");

exports.fetchCollections = async () => {
  try {
    const newCollections = [];
    const activities = await fetchMarketActivities();

    if (activities && activities.length > 0) {
      for (const activity of activities) {
        // Check if the new collection already exists
        const collectionExists = newCollections.some(
          (collection) => collection.contract_address === activity.nft.address
        );

        if (collectionExists) {
          continue;
        }

        const collection = await Collection.findOne({
          contract_address: activity.nft.address,
        });

        if (!collection) {
          const collectionDetails = await fetchCollection(activity.nft.address);

          if (collectionDetails) {
            collectionDetails.floor_24hr = collectionDetails.floor;

            if (collectionDetails.pfp === "") {
              const pfp = await getCollectionPfp(
                collectionDetails.slug,
                address
              );
              collectionDetails.pfp = pfp;
            }

            newCollections.push(collectionDetails);
          }

          await delay(300);
        }
      }
    }

    if (newCollections.length > 0) {
      await saveCollections(newCollections);
    }

    console.log("done fetching collections");
  } catch (err) {
    console.log("Some error occurred while saving the Collections.", err);
  }
};

exports.updateCollections = async () => {
  try {
    let newCollections = [];

    let collections = await Collection.find();

    for (const collection of collections) {
      const address = collection.contract_address;

      const collectionDetails = await fetchCollectionDetails(address);
      if (collectionDetails) {
        if (collection.pfp === "") {
          collection.pfp = await getCollectionPfp(
            collectionDetails.slug,
            address
          );
        }

        collection.supply = collectionDetails.supply;
        collection.owners = collectionDetails.owners;
        collection.auction_count = collectionDetails.auction_count;
        collection.floor = collectionDetails.floor;
        collection.floor_24hr = await getCollectionFloor24hr(address);
        collection.volume = collectionDetails.volume;
        collection.volume_24hr = collectionDetails.volume_24hr;
        collection.num_sales_24hr = collectionDetails.num_sales_24hr;
        collection.royalty = await getCollectionRoyalty(address);

        newCollections.push(collection);

        // collection monitor
        await CollectionMonitor.create({
          contract_address: collection.contract_address,
          date: new Date(),
          volume: collectionDetails.volume,
          floor: collectionDetails.floor,
          volume_24hr: collectionDetails.volume_24hr,
          sale_count: collectionDetails.num_sales_24hr,
        });
      }

      await delay(100);
    }

    if (newCollections.length > 0) {
      await saveCollections(newCollections);
    }

    console.log("done updating collections");
  } catch (err) {
    console.log("Some error occurred while saving the Collections.", err);
  }
};

const saveCollections = async (collections) => {
  try {
    const bulkOperations = collections.map((collection) => {
      const { contract_address } = collection;

      return {
        updateOne: {
          filter: { contract_address },
          update: { $set: collection },
          upsert: true,
        },
      };
    });

    const CollectionModel = mongoose.model("collections", Collection.schema);

    // Perform the bulk write operation
    await CollectionModel.bulkWrite(bulkOperations);
  } catch (error) {
    console.error("Error saving collections: ", error);
  }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
