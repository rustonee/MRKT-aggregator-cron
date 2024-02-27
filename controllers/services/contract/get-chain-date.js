const { SigningCosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const retry = require("retry-as-promised").default;

exports.getChainDate = async (block, client) => {
  try {
    const data = await retry(
      async () => {
        if (!client) {
          client = await SigningCosmWasmClient.connect(process.env.RPC_URL);
        }

        const queryResult = await client.getBlock(block);

        return queryResult.header.time;
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
    console.log("getChainDate:", error.message);
    return null;
  }
};
