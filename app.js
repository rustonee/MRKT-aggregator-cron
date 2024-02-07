const mongoose = require("mongoose");
const { dbConfig } = require("./config/db.config");

const cron = require("node-cron");
const { CronExpression } = require("./config/cron-expression.enum");
const collectionController = require("./controllers/collection.controller");
const collectionMonitorController = require("./controllers/collection-monitor.controller");

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
let isUpdateCollectionJobRunning = false;
let isSaveCollectionMonitorsJobRunning = false;
let isDeleteCollectionJobRunning = false;

// Fetching job running every 30 minutes
const fetchCollectionJob = cron.schedule(
  CronExpression.EVERY_30_MINUTES,
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

// Updating job running every 5 minutes
const updateCollectionJob = cron.schedule(
  CronExpression.EVERY_5_MINUTES,
  async function () {
    if (isUpdateCollectionJobRunning) {
      return;
    }

    isUpdateCollectionJobRunning = true;
    try {
      await collectionController.updateCollections();
    } finally {
      isUpdateCollectionJobRunning = false;
    }
  }
);

// Run task every 5 minutes
// const saveColltionMonitorsJob = cron.schedule(
//   CronExpression.EVERY_5_MINUTES,
//   async function () {
//     if (isSaveCollectionMonitorsJobRunning) {
//       return;
//     }

//     isSaveCollectionMonitorsJobRunning = true;
//     try {
//       await collectionMonitorController.saveCollectionMonitors();
//     } finally {
//       isSaveCollectionMonitorsJobRunning = false;
//     }
//   }
// );

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

// Listen for the SIGINT event to stop the cron job when the app is terminated
process.on("SIGINT", function () {
  if (fetchCollectionJob) {
    fetchCollectionJob.stop();
  }

  if (updateCollectionJob) {
    updateCollectionJob.stop();
  }

  // if (saveColltionMonitorsJob) {
  //   saveColltionMonitorsJob.stop();
  // }

  if (deleteCollectionMonitorJobs) {
    deleteCollectionMonitorJobs.stop();
  }

  process.exit();
});
