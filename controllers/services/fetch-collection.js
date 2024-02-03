const axios = require("axios");

exports.fetchCollection = async (address) => {
  try {
    const api_url = process.env.API_URL;
    const { data } = await axios.get(
      `${api_url}/nfts/${address}?get_tokens=false`
    );

    return data;
  } catch (err) {}

  return null;
};
