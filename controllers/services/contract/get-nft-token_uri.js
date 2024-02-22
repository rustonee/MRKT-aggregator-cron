const { SigningCosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const retry = require("retry-as-promised").default;

exports.getNftTokenUri = async (nft_address, nft_token_id, client) => {
  try {
    const data = await retry(
      async () => {
        if (!client) {
          client = await SigningCosmWasmClient.connect(process.env.RPC_URL);
        }

        const queryResult = await client.queryContractSmart(nft_address, {
          nft_info: {
            token_id: nft_token_id,
          },
        });

        return queryResult?.token_uri || null;
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
    console.log("getNftTokenUri", error.message);
    return null;
  }
};
