const axios = require("axios");
const retry = require("retry-as-promised").default;

exports.getCollectionFromPallet = async (address) => {
  try {
    const data = await retry(
      async () => {
        const response = await axios.get(
          `${process.env.BASE_API_URL}/v2/nfts/${address}/details`
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
    console.log("getCollectionFromPallet:", error.message);
    return null;
  }
};
