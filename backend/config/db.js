const mongoose = require("mongoose");

// Disable Mongoose query buffering so API routes return immediate HTTP 503 responses during temporary Atlas reconnects
mongoose.set("bufferCommands", false);

const connectDB = async (retryCount = 0) => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI environment variable is not defined in backend/.env");
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      family: 4, // Use IPv4 to avoid IPv6 connection timeouts on MongoDB Atlas
    });

    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host} (Database: ${conn.connection.name})`);
  } catch (error) {
    console.error(`\n[MongoDB Connection Failure] ${error.message}`);
    console.error("--- Troubleshooting Steps ---");
    console.error("1. Ensure your IP address is whitelisted in MongoDB Atlas (Network Access -> Add IP Address -> Allow Access From Anywhere 0.0.0.0/0).");
    console.error("2. Verify credentials in backend/.env (MONGO_URI).");
    console.error("3. Retrying connection in 5 seconds...\n");

    setTimeout(() => connectDB(retryCount + 1), 5000);
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB disconnected. Reconnecting...");
});

mongoose.connection.on("reconnected", () => {
  console.log("✅ MongoDB reconnected successfully!");
});

mongoose.connection.on("error", (err) => {
  console.error(`MongoDB connection error: ${err.message}`);
});

module.exports = connectDB;
