const mongoose = require("mongoose");
const { dbConfig } = require("./config/db.config");

const cron = require("node-cron");
const { CronExpression } = require("./config/cron-expression.enum");
const collectionController = require("./controllers/collection.controller");
const collectionMonitorController = require("./controllers/collection-monitor.controller");
const subscribeEventController = require("./controllers/subscribe-pallet-event");

// Connect to MongoDB
mongoose
  .connect(dbConfig.connectionUrl, dbConfig.connectionOptions)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

let isFetchCollectionJobRunning = false;
let isDeleteCollectionJobRunning = false;

const Transaction = require("./models/transaction.model");
// Starting to subscribe events from pallet
const subscribePalletEvent = async () => {
  subscribeEventController.subscribeEvents();
};

subscribePalletEvent();
/*
// Fetching job running every 5 minutes
const fetchCollectionJob = cron.schedule(
  CronExpression.EVERY_5_MINUTES,
  async function () {
    if (isFetchCollectionJobRunning) {
      return;
    }

    isFetchCollectionJobRunning = true;
    try {
      await collectionController.fetchCollections();
    } finally {
      isFetchCollectionJobRunning = false;
    }
  }
);

// Run task every day
const deleteCollectionMonitorJobs = cron.schedule(
  CronExpression.EVERY_DAY_AT_MIDNIGHT,
  async function () {
    if (isDeleteCollectionJobRunning) {
      return;
    }

    isDeleteCollectionJobRunning = true;
    try {
      await collectionMonitorController.deleteCollectionMonitors();
    } finally {
      isDeleteCollectionJobRunning = false;
    }
  }
);
*/
// Listen for the SIGINT event to stop the cron job when the app is terminated
process.on("SIGINT", function () {
  subscribeEventController.unsubscribeEvents();

  // if (fetchCollectionJob) {
  //   fetchCollectionJob.stop();
  // }

  // if (deleteCollectionMonitorJobs) {
  //   deleteCollectionMonitorJobs.stop();
  // }

  process.exit();
});
