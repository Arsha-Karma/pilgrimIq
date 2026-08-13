const mongoose = require("mongoose");
const PilgrimageCenter = require("../models/PilgrimageCenter");

// Helper to check DB connection state
const isDbConnected = (res) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      message: "Database connection is currently reconnecting to MongoDB Atlas. Please try again in a few seconds.",
    });
    return false;
  }
  return true;
};

// @desc    Get all pilgrimage centers (Public gets active only; Admin can fetch all / filter)
// @route   GET /api/pilgrimage-centers
// @access  Public
const getCenters = async (req, res) => {
  try {
    if (!isDbConnected(res)) return;

    const { search, religion, state, walking, crowdLevel, climate, status } = req.query;

    const query = {};

    // If user is admin and specifies status, filter by status. Otherwise default public users to active centers only
    const isAdmin = req.user && req.user.role === "admin";
    if (isAdmin && status) {
      if (status === "active") query.isActive = true;
      else if (status === "inactive") query.isActive = false;
    } else if (!isAdmin) {
      query.isActive = true;
    }

    if (religion && religion !== "All") {
      query.religion = religion;
    }

    if (state && state !== "All") {
      query["location.state"] = state;
    }

    if (walking && walking !== "All") {
      query["difficulty.walking"] = walking;
    }

    if (crowdLevel && crowdLevel !== "All") {
      query["visitingInformation.crowdLevel"] = crowdLevel;
    }

    if (climate && climate !== "All") {
      query["visitingInformation.climate"] = climate;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: searchRegex },
        { "location.city": searchRegex },
        { "location.state": searchRegex },
        { "location.address": searchRegex },
        { religion: searchRegex },
        { description: searchRegex },
      ];
    }

    const centers = await PilgrimageCenter.find(query).sort({ createdAt: -1 });
    res.json(centers);
  } catch (error) {
    console.error("Error fetching pilgrimage centers:", error);
    res.status(500).json({ message: error.message || "Failed to fetch pilgrimage centers" });
  }
};

// @desc    Get single pilgrimage center details by ID
// @route   GET /api/pilgrimage-centers/:id
// @access  Public
const getCenterById = async (req, res) => {
  try {
    if (!isDbConnected(res)) return;

    const center = await PilgrimageCenter.findById(req.params.id);
    if (!center) {
      return res.status(404).json({ message: "Pilgrimage center not found" });
    }
    res.json(center);
  } catch (error) {
    console.error("Error fetching center details:", error);
    res.status(500).json({ message: error.message || "Failed to fetch center details" });
  }
};

// @desc    Create new pilgrimage center
// @route   POST /api/pilgrimage-centers
// @access  Private/Admin
const createCenter = async (req, res) => {
  try {
    if (!isDbConnected(res)) return;

    const centerData = {
      ...req.body,
      createdBy: req.user._id,
    };

    const newCenter = new PilgrimageCenter(centerData);
    const savedCenter = await newCenter.save();

    res.status(201).json(savedCenter);
  } catch (error) {
    console.error("Error creating pilgrimage center:", error);
    res.status(400).json({ message: error.message || "Failed to create pilgrimage center" });
  }
};

// @desc    Update pilgrimage center
// @route   PUT /api/pilgrimage-centers/:id
// @access  Private/Admin
const updateCenter = async (req, res) => {
  try {
    if (!isDbConnected(res)) return;

    const center = await PilgrimageCenter.findById(req.params.id);
    if (!center) {
      return res.status(404).json({ message: "Pilgrimage center not found" });
    }

    Object.assign(center, req.body);
    const updatedCenter = await center.save();

    res.json(updatedCenter);
  } catch (error) {
    console.error("Error updating pilgrimage center:", error);
    res.status(400).json({ message: error.message || "Failed to update pilgrimage center" });
  }
};

// @desc    Delete pilgrimage center
// @route   DELETE /api/pilgrimage-centers/:id
// @access  Private/Admin
const deleteCenter = async (req, res) => {
  try {
    if (!isDbConnected(res)) return;

    const center = await PilgrimageCenter.findById(req.params.id);
    if (!center) {
      return res.status(404).json({ message: "Pilgrimage center not found" });
    }

    await center.deleteOne();
    res.json({ message: "Pilgrimage center removed successfully" });
  } catch (error) {
    console.error("Error deleting pilgrimage center:", error);
    res.status(500).json({ message: error.message || "Failed to delete pilgrimage center" });
  }
};

// @desc    Activate / Deactivate pilgrimage center
// @route   PATCH /api/pilgrimage-centers/:id/status
// @access  Private/Admin
const updateCenterStatus = async (req, res) => {
  try {
    if (!isDbConnected(res)) return;

    const center = await PilgrimageCenter.findById(req.params.id);
    if (!center) {
      return res.status(404).json({ message: "Pilgrimage center not found" });
    }

    const { isActive } = req.body;
    center.isActive = typeof isActive === "boolean" ? isActive : !center.isActive;

    const updatedCenter = await center.save();
    res.json(updatedCenter);
  } catch (error) {
    console.error("Error updating center status:", error);
    res.status(500).json({ message: error.message || "Failed to update center status" });
  }
};

module.exports = {
  getCenters,
  getCenterById,
  createCenter,
  updateCenter,
  deleteCenter,
  updateCenterStatus,
};
