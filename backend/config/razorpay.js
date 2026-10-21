const Razorpay = require("razorpay");

/**
 * Razorpay Test Mode Configuration and Client Factory
 * Credentials are securely loaded exclusively from environment variables:
 * - RAZORPAY_KEY_ID
 * - RAZORPAY_KEY_SECRET
 * - RAZORPAY_WEBHOOK_SECRET
 */

let razorpayInstance = null;

const getRazorpayCredentials = () => {
  const key_id = (process.env.RAZORPAY_KEY_ID || "").trim();
  const key_secret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
  return { key_id, key_secret };
};

const isRazorpayConfigured = () => {
  const { key_id, key_secret } = getRazorpayCredentials();
  return Boolean(
    key_id &&
    key_secret &&
    !key_id.includes("your_razorpay") &&
    !key_secret.includes("your_razorpay")
  );
};

const getRazorpayClient = () => {
  const { key_id, key_secret } = getRazorpayCredentials();

  if (!key_id || !key_secret) {
    const error = new Error(
      "Razorpay Test Mode credentials are not configured. Please ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set in the backend environment."
    );
    error.statusCode = 503;
    error.code = "RAZORPAY_CONFIG_MISSING";
    throw error;
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id,
      key_secret,
    });
  }

  return razorpayInstance;
};

const getPublicKeyId = () => {
  const { key_id } = getRazorpayCredentials();
  return key_id || null;
};

const getWebhookSecret = () => {
  return (
    process.env.RAZORPAY_WEBHOOK_SECRET ||
    process.env.RAZORPAY_KEY_SECRET ||
    ""
  ).trim();
};

module.exports = {
  getRazorpayClient,
  isRazorpayConfigured,
  getPublicKeyId,
  getWebhookSecret,
  getRazorpayCredentials,
};
