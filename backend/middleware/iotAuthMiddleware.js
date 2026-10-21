const IoTDevice = require("../models/IoTDevice");

/**
 * Middleware to authenticate ESP32 IoT hardware devices
 * Looks for 'x-device-id' and 'x-device-token' headers
 */
const protectIoT = async (req, res, next) => {
  const deviceId = req.headers["x-device-id"] || req.query.deviceId;
  let deviceToken = req.headers["x-device-token"] || req.query.deviceToken;

  if (!deviceToken && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    deviceToken = req.headers.authorization.split(" ")[1];
  }

  if (!deviceId || !deviceToken) {
    return res.status(401).json({
      message: "Not authorized as IoT device. Missing x-device-id or x-device-token headers.",
    });
  }

  try {
    const device = await IoTDevice.findOne({ deviceId: deviceId.toUpperCase() });

    if (!device) {
      return res.status(401).json({
        message: "Device not found or not registered in PilgrimIQ.",
      });
    }

    const isValid = device.verifyToken(deviceToken);
    if (!isValid) {
      return res.status(401).json({
        message: "Invalid device token for this IoT device ID.",
      });
    }

    req.device = device;
    next();
  } catch (error) {
    console.error("IoT authentication error:", error.message);
    return res.status(500).json({
      message: "Internal server error authenticating IoT device.",
    });
  }
};

module.exports = { protectIoT };
