const axios = require("axios");
const retry = require("retry-as-promised").default;

exports.getNftFromPallet = async (token_address, token_id) => {
  try {
    const data = await retry(
      async () => {
        const response = await axios.get(
          `${process.env.BASE_API_URL}/v2/nfts/${token_address}/tokens/${token_id}`
        );

        const nft = response.data.tokens[0];
        return {
          name: nft.name,
          symbol: "",
          image: nft.image,
          description: "",
          attributes: nft.traits,
        };
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
