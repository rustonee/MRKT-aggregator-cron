const mongoose = require("mongoose");

// Define the schema for the pallet user
const palletUserSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    index: true,
  },
  bio: {
    type: String,
  },
  email: {
    type: String,
  },
  pfp: {},
  socials: [],
});

// Create the PalletUser model
const PalletUser = mongoose.model("PalletUser", palletUserSchema);

module.exports = PalletUser;
