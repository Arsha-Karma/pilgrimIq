const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "pilgrimiq_jwt_secret_key_2026_super_secure"
      );

      // Get user from the token (exclude password)
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        res.status(401);
        throw new Error("Not authorized, user not found");
      }

      next();
    } catch (error) {
      console.error("Auth middleware error:", error.message);
      res.status(401);
      return res.json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    res.status(401);
    return res.json({ message: "Not authorized, no token provided" });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403);
    res.json({ message: "Not authorized as an admin" });
  }
};

module.exports = { protect, admin };
