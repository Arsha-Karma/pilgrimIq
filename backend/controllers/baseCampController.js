const BaseCamp = require("../models/BaseCamp");

// Helper to generate next Base Camp ID (e.g. BC-AC-0001)
const generateBaseCampId = async () => {
  const count = await BaseCamp.countDocuments();
  const nextNumber = (count + 1).toString().padStart(4, "0");
  return `BC-AC-${nextNumber}`;
};

// @desc    Get all base camps with optional filtering & search
// @route   GET /api/base-camps
// @access  Public / Private
const getBaseCamps = async (req, res, next) => {
  try {
    const { search, status, district, state } = req.query;
    let query = { isActive: true };

    if (status && status !== "all") {
      query.status = status;
    }
    if (district) {
      query.district = { $regex: district, $options: "i" };
    }
    if (state) {
      query.state = { $regex: state, $options: "i" };
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: searchRegex },
        { baseCampId: searchRegex },
        { locality: searchRegex },
        { district: searchRegex },
        { state: searchRegex },
        { contactNumber: searchRegex },
        { contactPerson: searchRegex },
      ];
    }

    const baseCamps = await BaseCamp.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: baseCamps.length,
      data: baseCamps,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single base camp by ID
// @route   GET /api/base-camps/:id
// @access  Public / Private
const getBaseCampById = async (req, res, next) => {
  try {
    const baseCamp = await BaseCamp.findById(req.params.id);
    if (!baseCamp || !baseCamp.isActive) {
      res.status(404);
      throw new Error("Base Camp not found");
    }
    res.status(200).json({
      success: true,
      data: baseCamp,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new Base Camp
// @route   POST /api/base-camps
// @access  Private (Admin only)
const createBaseCamp = async (req, res, next) => {
  try {
    const {
      name,
      campType = "Pilgrimage Base Camp",
      address,
      locality,
      district,
      state,
      pinCode,
      latitude,
      longitude,
      maximumCapacity,
      currentOccupancy = 0,
      facilities = {},
      medicalFacility = false,
      medicalDetails = {},
      contactPerson,
      contactNumber,
      alternateContact = "",
      email = "",
      status = "Operational",
      openingDate,
      openingTime = "06:00 AM",
      closingTime = "10:00 PM",
      emergencySupport = false,
      description = "",
      specialInstructions = "",
      image = "",
    } = req.body;

    // Backend Validation
    if (!name || !/^[A-Za-z\s]+$/.test(name.trim())) {
      res.status(400);
      throw new Error("Base Camp Name must contain letters and spaces only.");
    }

    if (!address || !/^[A-Za-z\s]+$/.test(address.trim())) {
      res.status(400);
      throw new Error("Address must contain letters and spaces only.");
    }

    if (!locality || !/^[A-Za-z\s]+$/.test(locality.trim())) {
      res.status(400);
      throw new Error("Village / Locality must contain letters and spaces only.");
    }

    if (!district || !/^[A-Za-z\s]+$/.test(district.trim())) {
      res.status(400);
      throw new Error("District must contain letters and spaces only.");
    }

    if (!pinCode || !/^[0-9]{6}$/.test(pinCode.trim())) {
      res.status(400);
      throw new Error("PIN Code must be exactly 6 digits.");
    }

    const latNum = Number(latitude);
    const lngNum = Number(longitude);
    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      res.status(400);
      throw new Error("Latitude must be a valid number between -90 and 90.");
    }
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      res.status(400);
      throw new Error("Longitude must be a valid number between -180 and 180.");
    }

    const maxCap = Number(maximumCapacity);
    const currOcc = Number(currentOccupancy);
    if (isNaN(maxCap) || maxCap !== 100) {
      res.status(400);
      throw new Error("Maximum capacity must be 100 only.");
    }
    if (isNaN(currOcc) || currOcc < 0 || currOcc > 999) {
      res.status(400);
      throw new Error("Current occupancy must be up to 3 digits (0-999).");
    }
    if (currOcc > maxCap) {
      res.status(400);
      throw new Error("Current occupancy cannot exceed maximum capacity.");
    }

    if (!contactPerson || !/^[A-Za-z\s]+$/.test(contactPerson.trim())) {
      res.status(400);
      throw new Error("Camp contact person name must contain letters and spaces only.");
    }

    if (!contactNumber || /^[0-5]/.test(contactNumber.trim()) || !/^[6-9][0-9]{9,11}$/.test(contactNumber.trim())) {
      res.status(400);
      throw new Error("Contact number cannot begin with 0-5. Must start with 6, 7, 8, or 9.");
    }

    if (email && email.trim() && !/\S+@\S+\.\S+/.test(email.trim())) {
      res.status(400);
      throw new Error("Please provide a valid email address.");
    }

    if (medicalFacility && (!medicalDetails.medicalFacilityName || !medicalDetails.medicalFacilityName.trim())) {
      res.status(400);
      throw new Error("Medical facility name is required when Medical Facility is enabled.");
    }

    const generatedId = await generateBaseCampId();

    const baseCamp = await BaseCamp.create({
      baseCampId: generatedId,
      name: name.trim(),
      campType,
      address: address.trim(),
      locality: locality.trim(),
      district: district.trim(),
      state: state.trim(),
      pinCode: pinCode.trim(),
      latitude: latNum,
      longitude: lngNum,
      maximumCapacity: maxCap,
      currentOccupancy: currOcc,
      facilities,
      medicalFacility: Boolean(medicalFacility),
      medicalDetails,
      contactPerson: contactPerson.trim(),
      contactNumber: contactNumber.trim(),
      alternateContact: alternateContact ? alternateContact.trim() : "",
      email: email ? email.trim().toLowerCase() : "",
      status,
      openingDate: openingDate || new Date(),
      openingTime,
      closingTime,
      emergencySupport: Boolean(emergencySupport),
      description: description ? description.trim() : "",
      specialInstructions: specialInstructions ? specialInstructions.trim() : "",
      image: image ? image.trim() : "",
      createdBy: req.user?._id,
    });

    res.status(201).json({
      success: true,
      message: "Base Camp registered successfully.",
      data: baseCamp,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Base Camp
// @route   PUT /api/base-camps/:id
// @access  Private (Admin only)
const updateBaseCamp = async (req, res, next) => {
  try {
    let baseCamp = await BaseCamp.findById(req.params.id);
    if (!baseCamp || !baseCamp.isActive) {
      res.status(404);
      throw new Error("Base Camp not found");
    }

    const {
      name,
      campType,
      address,
      locality,
      district,
      state,
      pinCode,
      latitude,
      longitude,
      maximumCapacity,
      currentOccupancy,
      facilities,
      medicalFacility,
      medicalDetails,
      contactPerson,
      contactNumber,
      alternateContact,
      email,
      status,
      openingDate,
      openingTime,
      closingTime,
      emergencySupport,
      description,
      specialInstructions,
      image,
    } = req.body;

    if (name) baseCamp.name = name.trim();
    if (campType) baseCamp.campType = campType;
    if (address) baseCamp.address = address.trim();
    if (locality) baseCamp.locality = locality.trim();
    if (district) baseCamp.district = district.trim();
    if (state) baseCamp.state = state.trim();
    if (pinCode) baseCamp.pinCode = pinCode.trim();
    if (latitude !== undefined) baseCamp.latitude = Number(latitude);
    if (longitude !== undefined) baseCamp.longitude = Number(longitude);
    if (maximumCapacity !== undefined) baseCamp.maximumCapacity = Number(maximumCapacity);
    if (currentOccupancy !== undefined) baseCamp.currentOccupancy = Number(currentOccupancy);
    if (facilities) baseCamp.facilities = { ...baseCamp.facilities, ...facilities };
    if (medicalFacility !== undefined) baseCamp.medicalFacility = Boolean(medicalFacility);
    if (medicalDetails) baseCamp.medicalDetails = { ...baseCamp.medicalDetails, ...medicalDetails };
    if (contactPerson) baseCamp.contactPerson = contactPerson.trim();
    if (contactNumber) baseCamp.contactNumber = contactNumber.trim();
    if (alternateContact !== undefined) baseCamp.alternateContact = alternateContact.trim();
    if (email !== undefined) baseCamp.email = email.trim().toLowerCase();
    if (status) baseCamp.status = status;
    if (openingDate) baseCamp.openingDate = openingDate;
    if (openingTime) baseCamp.openingTime = openingTime;
    if (closingTime) baseCamp.closingTime = closingTime;
    if (emergencySupport !== undefined) baseCamp.emergencySupport = Boolean(emergencySupport);
    if (description !== undefined) baseCamp.description = description.trim();
    if (specialInstructions !== undefined) baseCamp.specialInstructions = specialInstructions.trim();
    if (image !== undefined) baseCamp.image = image.trim();

    // Re-check capacity vs occupancy constraint
    if (baseCamp.currentOccupancy > baseCamp.maximumCapacity) {
      res.status(400);
      throw new Error("Current occupancy cannot exceed maximum capacity.");
    }

    await baseCamp.save();

    res.status(200).json({
      success: true,
      message: "Base Camp updated successfully.",
      data: baseCamp,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Base Camp Status
// @route   PATCH /api/base-camps/:id/status
// @access  Private (Admin only)
const updateBaseCampStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status || !["Operational", "Temporarily Closed", "Under Maintenance", "Inactive"].includes(status)) {
      res.status(400);
      throw new Error("Invalid status value provided.");
    }

    const baseCamp = await BaseCamp.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!baseCamp) {
      res.status(404);
      throw new Error("Base Camp not found.");
    }

    res.status(200).json({
      success: true,
      message: `Base Camp status updated to ${status}.`,
      data: baseCamp,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deactivate / Soft Delete Base Camp
// @route   DELETE /api/base-camps/:id
// @access  Private (Admin only)
const deleteBaseCamp = async (req, res, next) => {
  try {
    const baseCamp = await BaseCamp.findById(req.params.id);
    if (!baseCamp) {
      res.status(404);
      throw new Error("Base Camp not found");
    }

    // Soft delete (deactivate) to preserve historical data
    baseCamp.isActive = false;
    baseCamp.status = "Inactive";
    await baseCamp.save();

    res.status(200).json({
      success: true,
      message: "Base Camp deactivated successfully.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBaseCamps,
  getBaseCampById,
  createBaseCamp,
  updateBaseCamp,
  updateBaseCampStatus,
  deleteBaseCamp,
};
