const axios = require("axios");
const retry = require("retry-as-promised").default;

const Lookback = [3600029, 86400000, 604800000, 2592000000, 10000000000000];

exports.getCollectionTotalSalesFromPallet = async (address) => {
  for (const lookback of Lookback) {
    const collections = await getCollectionStatsFromPallet(address, lookback);
    if (collections) {
      const collection = collections.find(
        (item) => item.contract_address === address
      );

      if (collection) {
        return collection.num_sales;
      }
    }
  }

  return -1;
};

const getCollectionStatsFromPallet = async (address, lookback) => {
  try {
    const data = await retry(
      async () => {
        const response = await axios.get(
          `${process.env.BASE_API_URL}/v2/collections/stats?lookback=${lookback}&pageSize=200`
        );

        return response.data;
      },
      {
        max: 6,
        timeout: 20000,
        backoffBase: 1000,
        backoffExponent: 1.5,
      }
    );

    return data;
  } catch (error) {
    console.log("getCollectionStatsFromPallet:", error.message);
    return null;
  }
};
