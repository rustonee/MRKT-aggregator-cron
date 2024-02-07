const { SigningCosmWasmClient } = require("@cosmjs/cosmwasm-stargate");

exports.fetchMarketActivities = async () => {
  try {
    const queryMsg = `{
            "marketplace_activities": {
              "limit": 20,
              "start_after": 0
            }
        }`;

    const activities = await queryContract(
      process.env.SEI_CONTROLLER_ADDRESS,
      queryMsg
    );

    return activities;
  } catch (error) {
    console.log(error);
    return null;
  }
};

const queryContract = async (contractAddress, queryMsg, retryCount = 0) => {
  try {
    const client = await SigningCosmWasmClient.connect(process.env.RPC_URL);
    const queryResult = await client.queryContractSmart(
      contractAddress,
      JSON.parse(queryMsg)
    );

    return queryResult;
  } catch (error) {
    console.log(error);
    return null;
  }
};
