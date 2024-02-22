const { SigningCosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const retry = require("retry-as-promised").default;

exports.getNftInfo = async (nft_address, nft_token_id, client) => {
  try {
    const data = await retry(
      async () => {
        if (!client) {
          client = await SigningCosmWasmClient.connect(process.env.RPC_URL);
        }

        const queryResult = await client.queryContractSmart(
          process.env.PALLET_CONTRACT_ADDRESS,
          {
            nft: {
              address: nft_address,
              token_id: nft_token_id,
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
    console.log(nft_address, nft_token_id);
    console.log("getNftInfo", error.message);
    return null;
  }
};
