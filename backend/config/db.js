const mongoose = require("mongoose");

const connectDB = async (retryCount = 0) => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI environment variable is not defined in backend/.env");
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      family: 4,
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`MongoDB Atlas Connected: ${conn.connection.host} (Database: ${conn.connection.name})`);
  } catch (error) {
    console.error(`\n[MongoDB Connection Failure] ${error.message}`);
    console.error("--- Troubleshooting Steps ---");
    console.error("1. Ensure your IP address is whitelisted in MongoDB Atlas (Network Access -> Add IP Address / 0.0.0.0/0).");
    console.error("2. Verify credentials in backend/.env (MONGO_URI).");
    console.error("3. Retrying connection in 5 seconds...\n");

    setTimeout(() => connectDB(retryCount + 1), 5000);
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected. Reconnecting...");
});

mongoose.connection.on("error", (err) => {
  console.error(`MongoDB connection error: ${err.message}`);
});

module.exports = connectDB;
