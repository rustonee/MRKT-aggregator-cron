const axios = require("axios");
const { SigningCosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const { StargateClient } = require("@cosmjs/stargate");
const mongoose = require("mongoose");
const Collection = require("../models/collection.model");
const Nft = require("../models/nft.model");

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

let floors_24hr = [];

exports.fetchCollections = async () => {
  try {
    const newCollections = [];
    const activities = await getMarketActivitiesFromContract();

    // console.log("activities:", activities.length);

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
        }
      }
    }

    // console.log("new collections:", newCollections.length);

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

    for (let idx = 0; idx < collections.length; idx++) {
      const collection = collections[idx];
      const address = collection.contract_address;

      // Check if any user has the name 'Bob'
      const hasFloor = floors_24hr.some((floor) => floor.address === address);
      if (!hasFloor) {
        floors_24hr.push({
          address,
          floors: new Array(50).fill(null),
        });
      }

      const collectionDetails = await fetchCollectionDetails(address);
      if (collectionDetails) {
        const currFloor = collectionDetails.floor;

        // Set floor_24hr
        const floor_24hr = floors_24hr.find(
          (floor_24hr) => floor_24hr.address === address
        );

        floor_24hr.floors.shift();
        floor_24hr.floors.push(currFloor);

        // console.log(floor_24hr);
        // console.log("floor_24hr:", collectionDetails.floor_24hr, currFloor);

        if (collection.pfp === "") {
          collection.pfp = await getPfp(collectionDetails.slug, address);
        }

        collection.supply = collectionDetails.supply;
        collection.owners = collectionDetails.owners;
        collection.auction_count = collectionDetails.auction_count;
        collection.floor = collectionDetails.floor;
        collection.floor_24hr = floor_24hr.floors[0]
          ? floor_24hr.floors[0]
          : collection.floor_24hr;
        collection.volume = collectionDetails.volume;
        collection.volume_24hr = collectionDetails.volume_24hr;
        collection.num_sales_24hr = collectionDetails.num_sales_24hr;

        newCollections.push(collection);

        // console.log(idx + " : " + collection.contract_address);
      }

      await delay(100);

      break;
    }

    if (newCollections.length > 0) {
      await saveCollections(newCollections);
    }

    // console.log("Collection stored Successfully.");
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

const getFloor_24hr = async (address, defaultFloor) => {
  try {
    const activities = await fetchActivities(address);
    if (activities) {
      const currentTime = await getBlockTime();
      const txActivities = activities.filter((activity) => {
        const eventType = activity.event_type;
        const txTime = activity.ts;
        const oneHourAgo = new Date(
          currentTime.getTime() - 60 * 60 * 24 * 1000
        );

        if (eventType !== "list_buy_now" && new Date(txTime) >= oneHourAgo) {
          return true;
        }

        return false;
      });

      if (txActivities) {
        const floor = Math.min(
          ...txActivities.map((activity) => activity.price_value)
        );

        return Math.min(defaultFloor, floor);
      }
    }
  } catch (error) {}

  return defaultFloor;
};

const checkUrl = async (url) => {
  try {
    const response = await axios.head(url);
    if (response.status === 200) {
      return true;
    }
  } catch (error) {
    console.log(`Error occurred while checking ${url} : `, error.message);
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
    if (retryCount < MAX_RETRIES) {
      const delayTime = Math.pow(2, retryCount) * RETRY_DELAY;
      await delay(delayTime);
      return queryContract(contractAddress, queryMsg, retryCount + 1);
    } else {
      return null;
    }
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
