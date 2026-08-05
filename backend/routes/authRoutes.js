const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  googleLogin,
  getUserProfile,
  updateUserProfile,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  getAllUsers,
  registerDoctor,
  addFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// Public routes
router.get("/users", getAllUsers);
router.post("/register", registerUser);
router.post("/register-doctor", registerDoctor);
router.post("/login", loginUser);
router.post("/google", googleLogin);
router.post("/forgot-password", forgotPassword);
router.post("/verify-code", verifyResetCode);
router.post("/reset-password", resetPassword);
router.post("/reset-password/:resetToken", resetPassword);

// Protected routes
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);

// Family member management routes
router.post("/family-members", protect, addFamilyMember);
router.put("/family-members/:memberId", protect, updateFamilyMember);
router.delete("/family-members/:memberId", protect, deleteFamilyMember);

module.exports = router;
