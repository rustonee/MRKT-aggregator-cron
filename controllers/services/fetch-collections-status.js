const axios = require("axios");
const retry = require("retry-as-promised").default;

const MAX_RETRIES = 3;
const TIMEOUT = 10000;
const BACK_OFF_BASE = 1000;
const BACK_OFF_EXPONENT = 3;

exports.fetchCollectionsStatus = async (lookback, pageSize) => {
  try {
    const data = await retry(
      async () => {
        const api_url = process.env.BASE_API_URL;
        const { data } = await axios.get(
          `${api_url}/v2/collections/stats?lookback=${lookback}&pageSize=${pageSize}`
        );

        return data;
      },
      {
        max: MAX_RETRIES,
        timeout: TIMEOUT,
        backoffBase: BACK_OFF_BASE,
        backoffExponent: BACK_OFF_EXPONENT,
      }
    );

    return data;
  } catch (error) {
    console.log(error.message);
    return [];
  }
};
