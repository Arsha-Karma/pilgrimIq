const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const PilgrimageCenter = require("../models/PilgrimageCenter");

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/pilgrimlq";

async function removeNonAdminCenters() {
  try {
    console.log("Connecting to MongoDB:", mongoUri);
    await mongoose.connect(mongoUri);

    const result = await PilgrimageCenter.deleteMany({
      $or: [{ createdBy: { $exists: false } }, { createdBy: null }],
    });

    console.log(`✅ Deleted ${result.deletedCount} non-admin / seeded centers.`);

    const remaining = await PilgrimageCenter.find({});
    console.log(`\nRemaining centers in database (${remaining.length}):`);
    remaining.forEach((c) => console.log(`- ${c.name} (ID: ${c._id})`));

    process.exit(0);
  } catch (err) {
    console.error("Error removing non-admin centers:", err);
    process.exit(1);
  }
}

removeNonAdminCenters();
