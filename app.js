const mongoose = require("mongoose");
const { dbConfig } = require("./config/db.config");

const cron = require("node-cron");
const collectionController = require("./controllers/collection.controller");

// Connect to MongoDB
mongoose
  .connect(dbConfig.connectionUrl, dbConfig.connectionOptions)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

cron.schedule("*/20 * * * *", async function () {
  console.log("running a task every 20 minutes");
  await collectionController.fetchCollections();
  await collectionController.updateCollections();
});
