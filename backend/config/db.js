const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI environment variable is not defined in backend/.env");
    }

    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Atlas Connected: ${conn.connection.host} (Database: ${conn.connection.name})`);
  } catch (error) {
    console.error(`MongoDB Atlas Connection Error: ${error.message}`);
    console.error("\n--- How to resolve this issue ---");
    console.error("1. Ensure your IP address is whitelisted in MongoDB Atlas Network Access (or add 0.0.0.0/0 for access anywhere).");
    console.error("2. Verify the username, password, and cluster URI in backend/.env.");
    console.error("-----------------------------------\n");
    process.exit(1);
  }
};

module.exports = connectDB;
