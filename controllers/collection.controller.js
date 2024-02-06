const axios = require("axios");
const { SigningCosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const { StargateClient } = require("@cosmjs/stargate");
const mongoose = require("mongoose");
const Collection = require("../models/collection.model");
const CollectionMonitor = require("../models/collection-monitor.model");

exports.fetchCollections = async () => {
  try {
    const newCollections = [];
    const activities = await getMarketActivitiesFromContract();

    if (activities && activities.length > 0) {
      for (const activity of activities) {
        // Check if the new collection already exists
        const collectionExists = newCollections.some(
          (collection) => collection.contract_address === activity.nft.address
        );

        if (collectionExists) {
          continue;
        }

        const collection = await Collection.findOne({
          contract_address: activity.nft.address,
        });

        if (!collection) {
          const collectionDetails = await fetchCollection(activity.nft.address);

          if (collectionDetails) {
            collectionDetails.floor_24hr = collectionDetails.floor;

            if (collectionDetails.pfp === "") {
              const pfp = await getPfp(collectionDetails.slug, address);
              collectionDetails.pfp = pfp;
            }

            newCollections.push(collectionDetails);
          }

          await delay(300);
        }
      }
    }

    if (newCollections.length > 0) {
      await saveCollections(newCollections);
    }
  } catch (err) {
    console.log("Some error occurred while saving the Collections.", err);
  }
};

exports.updateCollections = async () => {
  try {
    let newCollections = [];

    let collections = await Collection.find();

    for (const collection of collections) {
      const address = collection.contract_address;

      const collectionDetails = await fetchCollectionDetails(address);
      if (collectionDetails) {
        if (collection.pfp === "") {
          collection.pfp = await getPfp(collectionDetails.slug, address);
        }

        collection.supply = collectionDetails.supply;
        collection.owners = collectionDetails.owners;
        collection.auction_count = collectionDetails.auction_count;
        collection.floor = collectionDetails.floor;
        collection.floor_24hr = await getFloor24hr(address);
        collection.volume = collectionDetails.volume;
        collection.volume_24hr = collectionDetails.volume_24hr;
        collection.num_sales_24hr = collectionDetails.num_sales_24hr;
        collection.royalty = await getColloectionRoyaltyFromContract(address);

        newCollections.push(collection);

        // collection monitor
        await CollectionMonitor.create({
          contract_address: collection.contract_address,
          date: new Date(),
          volume: collectionDetails.volume,
          floor: collectionDetails.floor,
          volume_24hr: collectionDetails.volume_24hr,
          sale_count: collectionDetails.num_sales_24hr,
        });
      }

      await delay(100);
    }

    if (newCollections.length > 0) {
      await saveCollections(newCollections);
    }

    console.log("done updating collections");
  } catch (err) {
    console.log("Some error occurred while saving the Collections.", err);
  }
};

const saveCollections = async (collections) => {
  try {
    const bulkOperations = collections.map((collection) => {
      const { contract_address } = collection;

      return {
        updateOne: {
          filter: { contract_address },
          update: { $set: collection },
          upsert: true,
        },
      };
    });

    const CollectionModel = mongoose.model("collections", Collection.schema);

    // Perform the bulk write operation
    await CollectionModel.bulkWrite(bulkOperations);
  } catch (error) {
    console.error("Error saving collections: ", error);
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

const getColloectionRoyaltyFromContract = async (address) => {
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
  } catch (err) {
    // console.log(err.message);
    return null;
  }
};

const fetchCollection = async (address) => {
  try {
    const api_url = process.env.API_URL;
    const { data } = await axios.get(
      `${api_url}/nfts/${address}?get_tokens=false`
    );

    return data;
  } catch (err) {}

  return null;
};

const fetchCollectionDetails = async (address) => {
  try {
    const api_url = process.env.BASE_API_URL;
    const { data } = await axios.get(`${api_url}/v2/nfts/${address}/details`);

    return data;
  } catch (err) {}

  return null;
};

const fetchActivities = async (address) => {
  try {
    const api_url = process.env.API_URL;
    const { data } = await axios.get(
      `${api_url}/marketplace/activities?chain_id=pacific-1&nft_address=${address}&page=1&page_size=300`
    );
    return data.activities;
  } catch (err) {
    console.log("error", err);
  }

  return null;
};

const getPfp = async (name, address) => {
  const asset_url = process.env.ASSET_URL;
  let pfpName = name.replaceAll("-", "").toLowerCase();

  let ret = await checkUrl(`${asset_url}/pfp/${pfpName}.png`);
  if (ret) {
    return `${asset_url}/pfp/${pfpName}.png`;
  }

  ret = await checkUrl(`${asset_url}/pfp/${pfpName}.jpg`);
  if (ret) {
    return `${asset_url}/pfp/${pfpName}.jpg`;
  }

  ret = await checkUrl(`${asset_url}/collections/pfp/${address}_pfp.png`);
  if (ret) {
    return `${asset_url}/collections/pfp/${address}_pfp.png`;
  }

  return "";
};

const getFloor24hr = async (address) => {
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const previousCollection = await CollectionMonitor.findOne({
      date: { $lte: oneDayAgo },
      contract_address: address,
    }).sort({ date: -1 });

    return previousCollection.floor;
  } catch (error) {
    return null;
  }
};

const checkUrl = async (url) => {
  try {
    const response = await axios.head(url);
    if (response.status === 200) {
      return true;
    }
  } catch (error) {
    // console.log(`Error occurred while checking ${url} : `, error.message);
  }

  return false;
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
    // if (retryCount < MAX_RETRIES) {
    //   const delayTime = Math.pow(2, retryCount) * RETRY_DELAY;
    //   await delay(delayTime);
    //   return queryContract(contractAddress, queryMsg, retryCount + 1);
    // } else {
    //   return null;
    // }
    return null;
  }
};

const getBlockTime = async () => {
  const rpc_url = process.env.RPC_URL;
  const client = await StargateClient.connect(rpc_url);
  const currBlock = await client.getBlock();
  const currBlockTime = currBlock.header.time;

  return new Date(currBlockTime);
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
