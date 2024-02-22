const mongoose = require("mongoose");
const { dbConfig } = require("./config/db.config");

const cron = require("node-cron");
const { CronExpression } = require("./config/cron-expression.enum");

const subscribeEventController = require("./background/subscribe-pallet-event");
const wasmEventProcesser = require("./background/process-pallet-event");

// Connect to MongoDB
mongoose
  .connect(dbConfig.connectionUrl, dbConfig.connectionOptions)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

let isProcessWasmEventsJobRunning = false;

// Starting to subscribe events from pallet
const subscribePalletEvent = async () => {
  subscribeEventController.subscribeEvents();
};

// Start to subscribe pallet events
subscribePalletEvent();

// Process pallet events per 10 seconds
const processWasmEventsJob = cron.schedule(
  CronExpression.EVERY_10_SECONDS,
  async function () {
    if (isProcessWasmEventsJobRunning) {
      console.log("running... return");
      return;
    }

    isProcessWasmEventsJobRunning = true;
    try {
      await wasmEventProcesser.processWasmEvents();
    } finally {
      isProcessWasmEventsJobRunning = false;
    }
  }
);

process.on("SIGINT", function () {
  subscribeEventController.unsubscribeEvents();

  if (processWasmEventsJob) {
    processWasmEventsJob.stop();
  }

  process.exit();
});
