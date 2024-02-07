const { SigningCosmWasmClient } = require("@cosmjs/cosmwasm-stargate");

exports.getCollectionRoyalty = async (address) => {
  try {
    const queryMsg = `{
          "royalties": {
            "nft": {
              "address": "${address}"
            }
          }
        }`;

    const { value } = await queryContract(
      process.env.SEI_CONTROLLER_ADDRESS,
      queryMsg
    );

    return value;
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
