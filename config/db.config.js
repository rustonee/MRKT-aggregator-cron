require("dotenv").config();

const dbConfig = {
  connectionUrl: process.env.MONGODB_URL,
  connectionOptions: {
    maxPoolSize: 10, // Maximum number of connections in the pool
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
  },
};

module.exports = { dbConfig };
