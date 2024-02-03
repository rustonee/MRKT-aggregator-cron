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

exports.fetchCollectionSaleCount = async (address) => {
  const api_url = process.env.BASE_API_URL;
  try {
    const { data } = await axios.get(`${api_url}/v2/nfts/${address}/details`);

    return data.num_sales_24hr;
  } catch {
    return undefined;
  }
};
