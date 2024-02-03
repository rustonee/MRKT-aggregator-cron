const CollectionMonitor = require("../models/collection-monitor.model");
const Collection = require("../models/collection.model");

const {
  fetchCollection,
  fetchCollectionSaleCount
} = require("./services/fetch-collection");

exports.saveCollectionMonitors = async () => {
  try {
    const collections = await Collection.find();

    for (const collection of collections) {
      const fetchedCollection = await fetchCollection(
        collection.contract_address
      );

      const saleCount = await fetchCollectionSaleCount(
        collection.contract_address
      );

      await CollectionMonitor.create({
        contract_address: collection.contract_address,
        date: new Date(),
        floor: fetchedCollection.floor,
        volume_24hr: fetchedCollection.volume_24hr,
        sale_count: saleCount
      });
    }

    console.log("done save collection monitors");
  } catch (error) {
    console.error(`Failed to store collection monitor with error ${error}`);
  }
};

// Delete documents of 3 days ago or older
exports.deleteCollectionMonitors = async () => {
  try {
    const date = new Date();
    date.setDate(date.getDate() - 3);

    await CollectionMonitor.deleteMany({
      date: {
        $lt: date
      }
    });

    console.log(`done clean collection monitors`);
  } catch (error) {
    console.error(`Failed to delete collection monitor with error ${error}`);
  }
};
