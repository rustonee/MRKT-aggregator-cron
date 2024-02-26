const axios = require("axios");
const retry = require("retry-as-promised").default;

exports.getNftMetadata = async (token_uri) => {
  try {
    const data = await retry(
      async () => {
        const response = await axios.get(token_uri, { maxRedirects: 5 });

        return response.data;
      },
      {
        max: 6,
        timeout: 20000,
        backoffBase: 1000,
        backoffExponent: 2,
      }
    );

    return data;
  } catch (error) {
    console.log("getNftMetadata", error.message, token_uri);
    return null;
  }
};

// exports.getNftMetadata = async (token_uri) => {
//   try {
//     const response = await axios.get(token_uri, { maxRedirects: 5 });
//     return response.data;
//   } catch (error) {
//     console.log("getNftMetadata", error.message, token_uri);
//     return null;
//   }
// };
