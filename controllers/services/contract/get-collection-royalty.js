const { SigningCosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const retry = require("retry-as-promised").default;

exports.getCollectionRoyalty = async (nft_address) => {
  try {
    const data = await retry(
      async () => {
        const client = await SigningCosmWasmClient.connect(process.env.RPC_URL);
        const queryResult = await client.queryContractSmart(
          process.env.PALLET_CONTRACT_ADDRESS,
          {
            royalties: {
              nft: { address: nft_address },
            },
          }
        );

        return queryResult?.value || null;
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
    console.log("getCollectionRoyalty", error.message);
    return null;
  }
};
