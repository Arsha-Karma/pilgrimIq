const jwt = require("jsonwebtoken");

const generateToken = (userData) => {
  const payload = typeof userData === "object" ? { id: userData._id || userData.id, name: userData.name, email: userData.email, role: userData.role } : { id: userData };
  return jwt.sign(payload, process.env.JWT_SECRET || "pilgrimiq_jwt_secret_key_2026_super_secure", {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

module.exports = generateToken;
