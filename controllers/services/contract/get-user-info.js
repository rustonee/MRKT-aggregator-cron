const { SigningCosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const retry = require("retry-as-promised").default;

exports.getUserInfo = async (address, client) => {
  try {
    const data = await retry(
      async () => {
        if (!client) {
          client = await SigningCosmWasmClient.connect(process.env.RPC_URL);
        }

        const queryResult = await client.queryContractSmart(
          process.env.PALLET_CONTRACT_ADDRESS,
          {
            user: {
              address: address,
            },
          }
        );

        return queryResult;
      },
      {
        max: 6,
        timeout: 6000,
        backoffBase: 500,
        backoffExponent: 1.5,
      }
    );

    return data;
  } catch (error) {
    console.log("getUserInfo", error.message);
    return null;
  }
};
