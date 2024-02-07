const CollectionMonitor = require("../../models/collection-monitor.model");

exports.getCollectionFloor24hr = async (address) => {
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const previousCollection = await CollectionMonitor.findOne({
      date: { $lte: oneDayAgo },
      contract_address: address,
    }).sort({ date: -1 });

    return previousCollection.floor;
  } catch (error) {
    return null;
  }
};
