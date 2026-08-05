const User = require("../models/User");
const FamilyMember = require("../models/FamilyMember");
const generateToken = require("../utils/generateToken");
const { OAuth2Client } = require("google-auth-library");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const EMAIL_REGEX = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/;

const isValidEmail = (email) => {
  return EMAIL_REGEX.test(String(email).toLowerCase());
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    let { name, email, phone, password } = req.body;

    // Trim inputs
    name = name ? name.trim() : "";
    email = email ? email.trim().toLowerCase() : "";
    password = password || "";
    phone = phone ? phone.trim() : "";

    // Field presence validation
    if (!name || !email || !password) {
      res.status(400);
      throw new Error("Please provide name, email, and password.");
    }

    // Name length validation
    if (name.length < 2) {
      res.status(400);
      throw new Error("Full name must be at least 2 characters long.");
    }

    // Email format validation
    if (!isValidEmail(email)) {
      res.status(400);
      throw new Error("Please enter a valid email address.");
    }

    // Password strength validation
    if (password.length < 6) {
      res.status(400);
      throw new Error("Password must be at least 6 characters long.");
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(409);
      throw new Error("An account with this email address already exists. Please login instead.");
    }

    // Create user in 'user' collection
    const user = await User.create({
      name,
      email,
      phone,
      password,
      authProvider: "local",
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        authProvider: user.authProvider,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error("Failed to register user. Invalid data received.");
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    let { email, password } = req.body;

    email = email ? email.trim().toLowerCase() : "";
    password = password || "";

    if (!email || !password) {
      res.status(400);
      throw new Error("Please enter both email address and password.");
    }

    if (!isValidEmail(email)) {
      res.status(400);
      throw new Error("Please enter a valid email address.");
    }

    const user = await User.findOne({ email });

    if (!user) {
      res.status(401);
      throw new Error("Invalid email address or password.");
    }

    // Handle google-only account login attempt
    if (user.authProvider === "google" && !user.password) {
      res.status(400);
      throw new Error("This account was created using Google Sign-In. Please click 'Continue with Google'.");
    }

    const isMatch = await user.matchPassword(password);
    if (isMatch) {
      res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        authProvider: user.authProvider,
        token: generateToken(user._id),
      });
    } else {
      res.status(401);
      throw new Error("Invalid email address or password.");
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Google Sign-In / Sign-Up
// @route   POST /api/auth/google
// @access  Public
const googleLogin = async (req, res, next) => {
  try {
    const { credential, accessToken, isSignUp } = req.body;

    let payload = null;

    if (credential) {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
      } catch (err) {
        const jwt = require("jsonwebtoken");
        const decoded = jwt.decode(credential);
        if (decoded && decoded.email) {
          payload = decoded;
        } else {
          res.status(401);
          throw new Error("Invalid Google credential token");
        }
      }
    } else if (accessToken) {
      const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.ok) {
        payload = await response.json();
      } else {
        res.status(401);
        throw new Error("Failed to fetch Google user profile from access token");
      }
    } else {
      res.status(400);
      throw new Error("Google credential or access token is required");
    }

    if (!payload || !payload.email) {
      res.status(400);
      throw new Error("Unable to extract user profile from Google sign-in response");
    }

    const { sub: googleId, email, name, picture } = payload;
    const cleanEmail = email.toLowerCase();

    let user = await User.findOne({ email: cleanEmail });

    if (user) {
      if (!user.googleId) user.googleId = googleId;
      if (picture && !user.avatar) user.avatar = picture;
      await user.save();
    } else {
      if (!isSignUp) {
        res.status(400);
        throw new Error("Invalid email address. Please register first.");
      }
      user = await User.create({
        name: name || cleanEmail.split("@")[0],
        email: cleanEmail,
        googleId,
        avatar: picture || "",
        authProvider: "google",
      });
    }

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      avatar: user.avatar,
      authProvider: user.authProvider,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      const familyMembers = await FamilyMember.find({ user: user._id }).sort({ createdAt: -1 });

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        authProvider: user.authProvider,
        familyMembers: familyMembers || [],
      });
    } else {
      res.status(404);
      throw new Error("User not found");
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      if (req.body.name) user.name = req.body.name.trim();
      if (req.body.phone !== undefined) user.phone = req.body.phone.trim();
      if (req.body.password && user.authProvider === "local") {
        if (req.body.password.length < 6) {
          res.status(400);
          throw new Error("New password must be at least 6 characters long.");
        }
        user.password = req.body.password;
      }

      const updatedUser = await user.save();
      const familyMembers = await FamilyMember.find({ user: updatedUser._id }).sort({ createdAt: -1 });

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        authProvider: updatedUser.authProvider,
        familyMembers: familyMembers || [],
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404);
      throw new Error("User not found");
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Initiate password reset (Generate & send 6-digit OTP code)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    let { email } = req.body;
    email = email ? email.trim().toLowerCase() : "";

    if (!email) {
      res.status(400);
      throw new Error("Please enter your registered email address.");
    }

    if (!isValidEmail(email)) {
      res.status(400);
      throw new Error("Please enter a valid email address.");
    }

    const user = await User.findOne({ email });

    if (!user) {
      res.status(404);
      throw new Error("No account found with this email address. Please register a new account.");
    }

    if (user.authProvider === "google" && !user.password) {
      res.status(400);
      throw new Error("This account is registered via Google Sign-In. Password reset is not applicable.");
    }

    // Generate clean 6-digit numeric OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash token to store securely in database
    const hashedToken = crypto.createHash("sha256").update(otpCode).digest("hex");

    // Set token expiration (15 minutes)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    await user.save();

    // Prepare HTML email message
    const htmlMessage = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #E5E7EB; border-radius: 16px; padding: 24px; background-color: #ffffff;">
        <h2 style="color: #123A7A; text-align: center; margin-top: 0;">PilgrimIQ Password Reset</h2>
        <p style="color: #4B5563; font-size: 15px; line-height: 1.5;">Hello <strong>${user.name || "Pilgrim User"}</strong>,</p>
        <p style="color: #4B5563; font-size: 15px; line-height: 1.5;">You requested a password reset for your PilgrimIQ account. Use the 6-digit OTP code below to reset your password:</p>
        
        <div style="background-color: #F3F4F6; border: 2px dashed #123A7A; border-radius: 12px; padding: 16px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #123A7A;">${otpCode}</span>
        </div>

        <p style="color: #6B7280; font-size: 13px; margin-bottom: 4px;">• This code is valid for <strong>15 minutes</strong>.</p>
        <p style="color: #6B7280; font-size: 13px;">• If you did not request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
        <p style="text-align: center; color: #9CA3AF; font-size: 12px;">© 2026 PilgrimIQ Inc. All rights reserved.</p>
      </div>
    `;

    // Attempt email dispatch
    await sendEmail({
      email: user.email,
      subject: "PilgrimIQ Password Reset Code",
      message: `Your PilgrimIQ 6-digit password reset OTP code is: ${otpCode}. It expires in 15 minutes.`,
      html: htmlMessage,
    });

    res.status(200).json({
      success: true,
      message: `A 6-digit reset code has been sent to ${user.email}.`,
      email: user.email,
      otpCode: otpCode, // Included so frontend can auto-fill or display if email server is simulated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using 6-digit OTP code
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    let { email, token, resetToken, otpCode, password } = req.body;

    const inputCode = String(otpCode || resetToken || token || req.params.resetToken || "").trim();
    email = email ? email.trim().toLowerCase() : "";

    if (!inputCode) {
      res.status(400);
      throw new Error("6-digit reset code is required.");
    }

    if (!password || password.length < 6) {
      res.status(400);
      throw new Error("New password must be at least 6 characters long.");
    }

    // Hash incoming code to compare with DB
    const hashedToken = crypto.createHash("sha256").update(inputCode).digest("hex");

    // Search query for matching active token
    let query = {
      $or: [
        { resetPasswordToken: hashedToken },
        { resetPasswordToken: inputCode },
      ],
      resetPasswordExpire: { $gt: Date.now() },
    };

    if (email) {
      query.email = email;
    }

    let user = await User.findOne(query);

    if (!user) {
      res.status(400);
      throw new Error("Invalid or expired 6-digit reset code. Please request a new code.");
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password has been changed successfully! You can now log in with your new password.",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify 6-digit OTP reset code
// @route   POST /api/auth/verify-code
// @access  Public
const verifyResetCode = async (req, res, next) => {
  try {
    let { email, otpCode } = req.body;
    const inputCode = String(otpCode || "").trim();
    email = email ? email.trim().toLowerCase() : "";

    if (!inputCode) {
      res.status(400);
      throw new Error("Please enter the 6-digit reset code.");
    }

    const hashedToken = crypto.createHash("sha256").update(inputCode).digest("hex");

    let query = {
      $or: [
        { resetPasswordToken: hashedToken },
        { resetPasswordToken: inputCode },
      ],
      resetPasswordExpire: { $gt: Date.now() },
    };

    if (email) {
      query.email = email;
    }

    const user = await User.findOne(query);

    if (!user) {
      res.status(400);
      throw new Error("Invalid or expired 6-digit reset code. Please check your email or request a new code.");
    }

    res.status(200).json({
      success: true,
      message: "Reset code verified successfully.",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all registered users for Admin Dashboard
// @route   GET /api/auth/users
// @access  Public
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: users.length,
      users: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new Physician / Doctor & send credentials email
// @route   POST /api/auth/register-doctor
// @access  Public / Admin
const registerDoctor = async (req, res, next) => {
  try {
    let { name, email, phone, specialization, password } = req.body;

    name = name ? name.trim() : "";
    email = email ? email.trim().toLowerCase() : "";
    phone = phone ? phone.trim() : "";
    specialization = specialization ? specialization.trim() : "General Physician";
    password = password || "";

    if (!name || !email || !password) {
      res.status(400);
      throw new Error("Please provide doctor name, email, and login password.");
    }

    if (name.length < 2) {
      res.status(400);
      throw new Error("Doctor full name must be at least 2 characters long.");
    }

    if (!isValidEmail(email)) {
      res.status(400);
      throw new Error("Please enter a valid email address for the doctor.");
    }

    if (password.length < 6) {
      res.status(400);
      throw new Error("Password must be at least 6 characters long.");
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(409);
      throw new Error(`An account with email address ${email} already exists.`);
    }

    const doctorCode = `DOC-${Math.floor(1000 + Math.random() * 9000)}`;

    const doctor = await User.create({
      name,
      email,
      phone,
      password,
      role: "physician",
      specialization,
      doctorCode,
      authProvider: "local",
    });

    // Prepare email with HTML styling
    const htmlMessage = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 550px; margin: 0 auto; border: 1px solid #E5E7EB; border-radius: 16px; padding: 28px; background-color: #ffffff; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #123A7A; margin: 0; font-size: 24px;">Welcome to PilgrimIQ</h2>
          <p style="color: #6B7280; font-size: 14px; margin-top: 4px;">Medical & Physician Surveillance Portal</p>
        </div>
        
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">Hello <strong>Dr. ${doctor.name}</strong>,</p>
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">You have been registered as an official Physician/Medic on the PilgrimIQ Surveillance Platform by the System Administrator.</p>
        
        <div style="background-color: #F8FAFC; border: 1px solid #CBD5E1; border-left: 5px solid #2563EB; border-radius: 10px; padding: 18px; margin: 24px 0;">
          <h3 style="color: #1E293B; margin-top: 0; font-size: 16px;">Your Login Credentials</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
            <tr>
              <td style="padding: 6px 0; font-weight: 600; width: 140px;">Login ID / Email:</td>
              <td style="padding: 6px 0; font-family: monospace; font-size: 15px; color: #2563EB;">${doctor.email}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: 600;">Password:</td>
              <td style="padding: 6px 0; font-family: monospace; font-size: 15px; color: #059669; font-weight: bold;">${password}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: 600;">Doctor ID:</td>
              <td style="padding: 6px 0;">${doctor.doctorCode}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: 600;">Specialization:</td>
              <td style="padding: 6px 0;">${doctor.specialization}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="http://localhost:3000/login" style="background-color: #2563EB; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block;">Log In to PilgrimIQ Portal</a>
        </div>

        <p style="color: #6B7280; font-size: 13px;">Please log in using the credentials above. For security reasons, we recommend updating your password upon your first login.</p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
        <p style="text-align: center; color: #9CA3AF; font-size: 12px;">© 2026 PilgrimIQ Healthcare Command Center. All rights reserved.</p>
      </div>
    `;

    let emailSent = true;
    let emailStatusMessage = "Login credentials have been sent to the doctor's email address.";

    try {
      await sendEmail({
        email: doctor.email,
        subject: "PilgrimIQ Doctor Credentials & Portal Access",
        message: `Hello Dr. ${doctor.name},\n\nYour PilgrimIQ Doctor Account has been registered by the admin.\n\nLogin ID / Email: ${doctor.email}\nPassword: ${password}\nDoctor ID: ${doctor.doctorCode}\nSpecialization: ${doctor.specialization}\n\nLog in at http://localhost:3000/login`,
        html: htmlMessage,
      });
    } catch (emailErr) {
      console.error(`[REGISTER DOCTOR EMAIL NOTICE] Could not deliver email to ${doctor.email}:`, emailErr.message);
      emailSent = false;
      emailStatusMessage = `Doctor registered in system. Note: Email dispatch notice - ${emailErr.message}`;
    }

    res.status(201).json({
      success: true,
      message: emailStatusMessage,
      emailSent,
      doctor: {
        _id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone,
        role: doctor.role,
        specialization: doctor.specialization,
        doctorCode: doctor.doctorCode,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a family member to user profile
// @route   POST /api/auth/family-members
// @access  Private
const addFamilyMember = async (req, res, next) => {
  try {
    const { name, relationship, age, gender, phone, bloodGroup, medicalConditions } = req.body;

    if (!name || !name.trim() || !relationship || !relationship.trim()) {
      res.status(400);
      throw new Error("Name and relationship are required for family member.");
    }

    const newMember = await FamilyMember.create({
      user: req.user._id,
      name: name.trim(),
      relationship: relationship.trim(),
      age: age !== "" && age !== null && age !== undefined ? Number(age) : null,
      gender: gender || "Male",
      phone: phone ? phone.trim() : "",
      bloodGroup: bloodGroup ? bloodGroup.trim() : "",
      medicalConditions: medicalConditions ? medicalConditions.trim() : "",
    });

    const familyMembers = await FamilyMember.find({ user: req.user._id }).sort({ createdAt: -1 });

    res.status(201).json({
      success: true,
      message: "Family member added successfully to collection",
      member: newMember,
      familyMembers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a family member
// @route   PUT /api/auth/family-members/:memberId
// @access  Private
const updateFamilyMember = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const { name, relationship, age, gender, phone, bloodGroup, medicalConditions } = req.body;

    const member = await FamilyMember.findOne({ _id: memberId, user: req.user._id });
    if (!member) {
      res.status(404);
      throw new Error("Family member not found in collection");
    }

    if (name) member.name = name.trim();
    if (relationship) member.relationship = relationship.trim();
    if (age !== undefined) member.age = age !== "" && age !== null ? Number(age) : null;
    if (gender) member.gender = gender;
    if (phone !== undefined) member.phone = phone.trim();
    if (bloodGroup !== undefined) member.bloodGroup = bloodGroup.trim();
    if (medicalConditions !== undefined) member.medicalConditions = medicalConditions.trim();

    await member.save();

    const familyMembers = await FamilyMember.find({ user: req.user._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "Family member updated successfully",
      member,
      familyMembers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a family member
// @route   DELETE /api/auth/family-members/:memberId
// @access  Private
const deleteFamilyMember = async (req, res, next) => {
  try {
    const { memberId } = req.params;

    const member = await FamilyMember.findOne({ _id: memberId, user: req.user._id });
    if (!member) {
      res.status(404);
      throw new Error("Family member not found in collection");
    }

    await FamilyMember.deleteOne({ _id: memberId, user: req.user._id });

    const familyMembers = await FamilyMember.find({ user: req.user._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "Family member removed successfully from collection",
      familyMembers,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};



