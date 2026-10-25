const mongoose = require("mongoose");
require("dotenv").config();
const IoTDevice = require("../models/IoTDevice");

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB Atlas.");

    const updateResult = await IoTDevice.updateMany(
      {},
      { $set: { buzzerPin: 23 } }
    );
    console.log("Updated IoTDevice records:", updateResult);

    const devices = await IoTDevice.find({});
    console.log(`Verified ${devices.length} devices:`);
    devices.forEach((d) => {
      console.log(` - Device ID: ${d.deviceId}, Name: ${d.name}, buzzerPin: ${d.buzzerPin}`);
    });

    await mongoose.disconnect();
    console.log("Migration complete.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
