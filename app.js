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

let isFetchingJobRunning = false;
let isUpdateJobRunning = false;

// Fetching job running every 1 minute
const fetchingJob = cron.schedule("*/3 * * * * *", async function () {
  if (isFetchingJobRunning) {
    return;
  }

  isFetchingJobRunning = true;
  try {
    await collectionController.fetchCollections();
  } finally {
    isFetchingJobRunning = false;
  }
});

// Updating job running every 30 minutes
const updateJjob = cron.schedule("*/30 * * * *", async function () {
  if (isUpdateJobRunning) {
    return;
  }

  isUpdateJobRunning = true;
  try {
    await collectionController.updateCollections();
  } finally {
    isUpdateJobRunning = false;
  }
});

// Listen for the SIGINT event to stop the cron job when the app is terminated
process.on("SIGINT", function () {
  if (fetchingJob) {
    fetchingJob.stop();
  }
  if (updateJjob) {
    updateJjob.stop();
  }

  process.exit();
});
