const mongoose = require("mongoose");
const Collection = require("../models/collection.model");
const CollectionMonitor = require("../models/collection-monitor.model");

const { Lookback } = require("../config/lookback.enum");
const {
  fetchCollectionsStatus,
} = require("./services/fetch-collections-status");
const {
  getCollectionVolume24hr,
} = require("./services/get-collection-volume24hr");
const {
  getCollectionFloor24hr,
} = require("./services/get-collection-floor24hr");

const PAGE_SIZE = 100;

exports.fetchCollections = async () => {
  try {
    console.log("fetching collections ...");

    const lookbacks = [
      Lookback.LOOKBACK_ALL_TIME,
      Lookback.LOOKBACK_1_HOUR,
      Lookback.LOOKBACK_24_HOUR,
      Lookback.LOOKBACK_7_DAY,
      Lookback.LOOKBACK_30_DAY,
    ];

    const collectionsPromises = lookbacks.map(async (lookback) => {
      const collections = await fetchCollectionsStatus(lookback, PAGE_SIZE);
      await delay(300);
      return collections;
    });

    const [
      currentlyCollections,
      hourlyCollections,
      dailyCollections,
      weeklyCollections,
      monthlyCollections,
    ] = await Promise.all(collectionsPromises);

    let allCollections = [];

    [
      currentlyCollections,
      hourlyCollections,
      dailyCollections,
      weeklyCollections,
      monthlyCollections,
    ].forEach((collections) => {
      collections.forEach((collection) => {
        let exist = allCollections.some(
          (newCollection) =>
            newCollection.contract_address === collection.contract_address
        );

        if (!exist) {
          allCollections.push({
            ...collection,
            floor_24hr: 0,
            num_sales_latest: 0,
            num_sales_1hr: 0,
            num_sales_24hr: 0,
            num_sales_7day: 0,
            num_sales_30day: 0,
            volume_latest: 0,
            volume_1hr: 0,
            volume_24hr: 0,
            volume_7day: 0,
            volume_30day: 0,
          });
        }
      });
    });

    const updateCollections = (newCollection, lookback) => {
      allCollections.forEach((collection) => {
        if (collection.contract_address === newCollection.contract_address) {
          collection[`num_sales_${lookback}`] =
            newCollection.num_sales_latest || 0;
          collection[`volume_${lookback}`] = newCollection.volume_latest || 0;
        }
      });
    };

    currentlyCollections.forEach((newCollection) =>
      updateCollections(newCollection, "latest")
    );
    hourlyCollections.forEach((newCollection) =>
      updateCollections(newCollection, "1hr")
    );
    dailyCollections.forEach((newCollection) =>
      updateCollections(newCollection, "24hr")
    );
    weeklyCollections.forEach((newCollection) =>
      updateCollections(newCollection, "7day")
    );
    monthlyCollections.forEach((newCollection) =>
      updateCollections(newCollection, "30day")
    );

    if (allCollections.length > 0) {
      for (let collection of allCollections) {
        let volume_24hr = collection.volume_24hr;
        if (volume_24hr === 0) {
          volume_24hr = await getCollectionVolume24hr(
            collection.contract_address
          );

          collection.volume_24hr = volume_24hr;
        }

        collection.floor_24hr = await getCollectionFloor24hr(
          collection.contract_address
        );

        await CollectionMonitor.create({
          contract_address: collection.contract_address,
          date: new Date(),
          volume: collection.volume,
          floor: collection.floor,
          volume_24hr: volume_24hr,
          sale_count: collection.num_sales,
        });
      }

      await saveCollections(allCollections);
    }

    console.log("done fetching collections");
  } catch (err) {
    console.log("Some error occurred while saving the Collections.", err);
  }
};

const saveCollections = async (collections) => {
  try {
    const CollectionModel = mongoose.model("collections", Collection.schema);

    const updateFields = {
      floor_24hr: 0,
      num_sales_latest: 0,
      num_sales_1hr: 0,
      num_sales_24hr: 0,
      num_sales_7day: 0,
      num_sales_30day: 0,
      volume_latest: 0,
      volume_1hr: 0,
      volume_24hr: 0,
      volume_7day: 0,
      volume_30day: 0,
    };

    await CollectionModel.updateMany({}, { $set: updateFields });

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

    // Perform the bulk write operation
    await CollectionModel.bulkWrite(bulkOperations);
  } catch (error) {
    console.error("Error saving collections: ", error);
  }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
