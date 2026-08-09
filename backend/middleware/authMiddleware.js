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

      // Try fetching user from database
      try {
        req.user = await User.findById(decoded.id).select("-password");
      } catch (dbError) {
        console.warn("Auth DB lookup warning (using token claims fallback):", dbError.message);
        // Fallback to token payload if DB lookup hits temporary DNS/network error
        req.user = {
          _id: decoded.id,
          name: decoded.name || "User",
          email: decoded.email || "",
          role: decoded.role || "user",
        };
      }

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
