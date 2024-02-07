const axios = require("axios");

exports.getCollectionPfp = async (name, address) => {
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

const checkUrl = async (url) => {
  try {
    const response = await axios.head(url);
    if (response.status === 200) {
      return true;
    }
  } catch (err) {}

  return false;
};
