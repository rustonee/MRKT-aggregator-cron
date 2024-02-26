const NftTrait = require("../models/nft.trait.model");
const nftRepository = require("../repositories/nft.repository");
const palletUserRepository = require("../repositories/pallet.user.repository");

const { getUserInfo } = require("./services/contract/get-user-info");
const { getNftInfo } = require("./services/contract/get-nft-info");
const { getNftTokenUri } = require("./services/contract/get-nft-token_uri");
const { getNftMetadata } = require("./services/http/get-nft-metadata");

const NFT_STATUS = {
  ACTIVE_AUCTION: "active_auction",
  IN_USER_CUSTODY: "in_user_custody",
};

exports.createNft = async (transaction, client) => {
  try {
    const nftChainInfo = await getNftInfo(
      transaction.nft_address,
      transaction.nft_token_id,
      client
    );

    const existedNft = await nftRepository.findByAddressAndTokenId(
      transaction.nft_address,
      transaction.nft_token_id
    );

    if (existedNft) {
      const update = {
        owner: nftChainInfo.owner,
        auction: nftChainInfo.auction,
        status: nftChainInfo.status,
        verified: nftChainInfo.verified,
      };

      if (transaction.price) {
        update.price = transaction.price;
      }

      await nftRepository.updateNftStatus(
        transaction.nft_address,
        transaction.nft_token_id,
        update
      );
    } else {
      let nftTokenUri = await getNftTokenUri(
        transaction.nft_address,
        transaction.nft_token_id,
        client
      );

      let nftMetadata = null;
      if (nftTokenUri.startsWith("data:application/json;base64")) {
        const jsonData = Buffer.from(
          nftTokenUri.substring(29),
          "base64"
        ).toString();
        nftMetadata = JSON.parse(jsonData);
        nftTokenUri = "";
      } else {
        nftMetadata = await getNftMetadata(nftTokenUri);
      }

      await nftRepository.createNft({
        token_address: transaction.nft_address,
        token_id: transaction.nft_token_id,
        name: nftMetadata.name,
        symbol: nftMetadata.symbol,
        token_url: nftTokenUri,
        image: nftMetadata.image,
        description: nftMetadata.description,
        owner: nftChainInfo.owner,
        price: transaction.price || 0,
        auction: nftChainInfo.auction,
        status: nftChainInfo.status,
        verified: nftChainInfo.verified,
      });

      await createNftTrait(
        transaction.nft_address,
        transaction.nft_token_id,
        nftMetadata.attributes
      );

      await createPalletUser(nftChainInfo.owner, client);
    }
  } catch (error) {
    console.log("createNft:", error);
  }
};

const createNftTrait = async (nft_address, nft_token_id, traits) => {
  if (traits) {
    const traitsData = traits.map(
      ({ trait_type, value, display_type, type }) => ({
        nft_address,
        nft_token_id,
        type: trait_type || type || "unknown",
        value: value.toString(),
        display_type,
      })
    );

    await NftTrait.insertMany(traitsData);
  }
};

const createPalletUser = async (address, client) => {
  try {
    const user = await palletUserRepository.findUserByAddress(address);
    if (!user) {
      const palletUser = await getUserInfo(address, client);

      await palletUserRepository.createUser({
        address,
        bio: palletUser.bio,
        email: palletUser.email,
        pfp: palletUser.pfp?.key || null,
        socials: palletUser.socials,
      });
    }
  } catch (error) {
    console.log("createPalletUser:", error.message);
  }
};
