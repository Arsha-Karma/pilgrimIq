const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "pilgrimiq_jwt_secret_key_2026_super_secure", {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

module.exports = generateToken;
