const axios = require("axios");
const { SigningCosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const { StargateClient } = require("@cosmjs/stargate");
const mongoose = require("mongoose");
const Collection = require("../models/collection.model");
const Nft = require("../models/nft.model");

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // in milliseconds

exports.fetchNfts = async () => {
  const collections = await Collection.find();
  for (const collection of collections) {
    const countOfNfts = await getCountOfNftsFromContract(
      collection.contract_address
    );

    console.log(collection.contract_address, countOfNfts);

    await saveNfts(collection.contract_address, countOfNfts);
  }
};

const saveNfts = async (collectionAddress, count) => {
  let nfts = [];
  for (let tokenId = 0; tokenId < count; tokenId++) {
    const nft = await getNftFromContract(collectionAddress, tokenId);
    if (nft) {
      nfts.push(nft);
    }
  }

  try {
    const bulkOperations = nfts.map((nft) => {
      const { key } = nft;

      return {
        updateOne: {
          filter: { key },
          update: { $set: nft },
          upsert: true,
        },
      };
    });

    const NftModel = mongoose.model("nfts", Nft.schema);

    // Perform the bulk write operation
    await NftModel.bulkWrite(bulkOperations);
  } catch (error) {
    console.error("Error saving nfts: ", error);
  }
};

const getMarketActivitiesFromContract = async () => {
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
  } catch (err) {
    console.log(err);
    return null;
  }
};

const getCountOfNftsFromContract = async (contractAddress) => {
  try {
    const queryMsg = `{
      "num_tokens": {}
    }`;

    const { count } = await queryContract(contractAddress, queryMsg);

    return count;
  } catch (err) {
    console.log(err);
    return 0;
  }
};

const getNftFromContract = async (collectionAddress, tokenId) => {
  try {
    const queryMsg = `{
      "nft": {
        "address": "${collectionAddress}",
        "token_id": "${tokenId}"
      }
    }`;

    const nftInfo = await queryContract(
      process.env.SEI_CONTROLLER_ADDRESS,
      queryMsg
    );

    if (!nftInfo) {
      return null;
    }

    const metadata = await getMetadataOfNftFromContract(
      collectionAddress,
      tokenId
    );

    const nft = {
      key: `${nftInfo.nft_address}-${nftInfo.nft_token_id}`,
      id: nftInfo.nft_token_id,
      id_int: parseInt(nftInfo.nft_token_id),
      name: metadata?.name || nftInfo.nft_info.name,
      description: metadata?.description || nftInfo.nft_info.description,
      owner: nftInfo.owner,
      status: nftInfo.status,
      verified: nftInfo.verified,
      image: metadata?.image || "",
      last_sale: {},
      collection_key: nftInfo.nft_address,
      symbol: nftInfo.nft_info.symbol,
      rarity: {},
      traits: metadata?.attributes || [],
      auction: nftInfo.auction || [],
      bid: nftInfo.bid || [],
    };

    // console.log("nft: ", nft);

    return nft;
  } catch (err) {
    console.log(err);
    return null;
  }
};

const getMetadataOfNftFromContract = async (collectionAddress, tokenId) => {
  try {
    const queryMsg = `{
      "nft_info": {
        "token_id": "${tokenId}"
      }
    }`;

    const nftInfo = await queryContract(collectionAddress, queryMsg);
    if (nftInfo && nftInfo.token_uri) {
      const result = await axios.get(nftInfo.token_uri, { maxRedirects: 5 });
      return result.data;
    }
  } catch (err) {
    console.log(err);
  }

  return null;
};

const queryContract = async (contractAddress, queryMsg, retryCount = 0) => {
  try {
    await delay(300);

    const client = await SigningCosmWasmClient.connect(process.env.RPC_URL);
    const queryResult = await client.queryContractSmart(
      contractAddress,
      JSON.parse(queryMsg)
    );

    return queryResult;
  } catch (err) {
    if (retryCount < MAX_RETRIES) {
      const delayTime = Math.pow(2, retryCount) * RETRY_DELAY;
      console.log(`Retrying after ${delayTime} ms`);
      await delay(delayTime);
      return queryContract(contractAddress, queryMsg, retryCount + 1);
    } else {
      // throw new Error("Max retry attempts reached");
      console.log("error contract fetching", queryMsg);
      return null;
    }
  }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
