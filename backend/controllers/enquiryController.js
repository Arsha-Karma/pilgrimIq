const Enquiry = require("../models/Enquiry");
const sendEmail = require("../utils/sendEmail");

// Helper function to count letters only
const countLetters = (str) => {
  return (str.match(/[a-zA-Z]/g) || []).length;
};

// @desc    Submit a new user enquiry
// @route   POST /api/enquiries
// @access  Public / Protected
const createEnquiry = async (req, res, next) => {
  try {
    const { name, email, subject, message, userId } = req.body;

    const trimmedName = name ? String(name).trim() : "";
    const trimmedEmail = email ? String(email).trim().toLowerCase() : "";
    const trimmedSubject = subject ? String(subject).trim() : "";
    const trimmedMessage = message ? String(message).trim() : "";

    if (!trimmedName || !trimmedEmail) {
      res.status(400);
      throw new Error("User Name and Email address are required.");
    }

    if (!trimmedSubject) {
      res.status(400);
      throw new Error("Pilgrimage Center / Subject field is required.");
    }

    if (!trimmedMessage) {
      res.status(400);
      throw new Error("Message field is required.");
    }

    // Validation: Only letters and spaces allowed
    const lettersAndSpacesOnly = /^[a-zA-Z\s]+$/;
    if (!lettersAndSpacesOnly.test(trimmedSubject)) {
      res.status(400);
      throw new Error("Pilgrimage Center / Subject can only contain letters and spaces.");
    }

    if (!lettersAndSpacesOnly.test(trimmedMessage)) {
      res.status(400);
      throw new Error("Your Message can only contain letters and spaces.");
    }

    // Validation: At least 10 letters required
    const subjectLetterCount = countLetters(trimmedSubject);
    if (subjectLetterCount < 10) {
      res.status(400);
      throw new Error(`Pilgrimage Center / Subject must contain at least 10 letters (currently ${subjectLetterCount}).`);
    }

    const messageLetterCount = countLetters(trimmedMessage);
    if (messageLetterCount < 10) {
      res.status(400);
      throw new Error(`Your Message must contain at least 10 letters (currently ${messageLetterCount}).`);
    }

    // Create enquiry record in database
    const enquiry = await Enquiry.create({
      user: req.user ? req.user._id : (userId || null),
      name: trimmedName,
      email: trimmedEmail,
      subject: trimmedSubject,
      message: trimmedMessage,
      status: "New",
    });

    // Prepare email to Admin
    const adminHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background-color: #ffffff;">
        <h2 style="color: #1e3a8a; border-bottom: 2px solid #2563eb; padding-bottom: 8px;">📩 New User Inquiry Received</h2>
        <p style="font-size: 14px; color: #475569;">A new inquiry has been submitted on the <strong>PilgrimIQ</strong> portal.</p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 14px; margin: 16px 0; border-radius: 6px;">
          <p style="margin: 4px 0;"><strong>Sender Name:</strong> ${trimmedName}</p>
          <p style="margin: 4px 0;"><strong>Sender Email:</strong> <a href="mailto:${trimmedEmail}" style="color: #2563eb;">${trimmedEmail}</a></p>
          <p style="margin: 4px 0;"><strong>Pilgrimage Center / Subject:</strong> ${trimmedSubject}</p>
          <p style="margin: 4px 0;"><strong>Submitted On:</strong> ${new Date().toLocaleString()}</p>
        </div>

        <div style="margin-top: 16px;">
          <h4 style="color: #1e293b; margin-bottom: 6px;">Inquiry Message:</h4>
          <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; color: #334155; font-size: 14.5px; line-height: 1.6; white-space: pre-wrap;">${trimmedMessage}</div>
        </div>

        <div style="margin-top: 24px; text-align: center;">
          <a href="http://localhost:3000/admin" style="background-color: #2563eb; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">View in Admin Dashboard</a>
        </div>
      </div>
    `;

    // Attempt email dispatch to admin
    try {
      await sendEmail({
        email: "pilgrimlq03@gmail.com",
        subject: `[PilgrimIQ Inquiry] ${trimmedSubject}`,
        message: `New Inquiry from ${trimmedName} (${trimmedEmail}):\nSubject: ${trimmedSubject}\nMessage: ${trimmedMessage}`,
        html: adminHtml,
      });
    } catch (emailErr) {
      console.error("[INQUIRY EMAIL NOTICE] Admin email notice error:", emailErr.message);
    }

    res.status(201).json({
      success: true,
      message: "Your inquiry has been submitted successfully! The admin team will review it shortly.",
      enquiry,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all enquiries for Admin Dashboard
// @route   GET /api/enquiries
// @access  Public / Admin
const getEnquiries = async (req, res, next) => {
  try {
    const enquiries = await Enquiry.find({}).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: enquiries.length,
      enquiries,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update enquiry status
// @route   PUT /api/enquiries/:id/status
// @access  Public / Admin
const updateEnquiryStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!["New", "Read", "Replied"].includes(status)) {
      res.status(400);
      throw new Error("Invalid status option");
    }

    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      res.status(404);
      throw new Error("Enquiry record not found");
    }

    enquiry.status = status;
    if (status === "Replied" && !enquiry.repliedAt) {
      enquiry.repliedAt = new Date();
    }
    await enquiry.save();

    res.status(200).json({
      success: true,
      message: `Enquiry status updated to ${status}`,
      enquiry,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send email reply directly to user for their enquiry
// @route   POST /api/enquiries/:id/reply
// @access  Public / Admin
const replyToEnquiry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { replyMessage, replySubject } = req.body;

    const trimmedReply = replyMessage ? String(replyMessage).trim() : "";
    if (!trimmedReply) {
      res.status(400);
      throw new Error("Reply message content is required.");
    }

    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      res.status(404);
      throw new Error("Enquiry record not found.");
    }

    const subjectToUse = replySubject || `Re: ${enquiry.subject}`;

    const userHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 26px; background-color: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #1e3a8a; margin: 0;">PilgrimIQ Support Response</h2>
          <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Pilgrimage Safety & Health Command Center</p>
        </div>

        <p style="font-size: 15px; color: #334155;">Hello <strong>${enquiry.name}</strong>,</p>
        <p style="font-size: 14.5px; color: #475569; line-height: 1.6;">Thank you for reaching out to PilgrimIQ. In response to your inquiry regarding <strong>"${enquiry.subject}"</strong>:</p>

        <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 8px;">
          <h4 style="margin: 0 0 8px 0; color: #065f46; font-size: 14px;">Response Message:</h4>
          <div style="color: #1e293b; font-size: 14.5px; line-height: 1.6; white-space: pre-wrap;">${trimmedReply}</div>
        </div>

        <div style="margin-top: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; font-size: 13px; color: #64748b;">
          <strong style="color: #475569;">Your Original Inquiry:</strong><br/>
          <em>"${enquiry.message}"</em>
        </div>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="text-align: center; color: #9ca3af; font-size: 12px;">© 2026 PilgrimIQ Healthcare Command Center. All rights reserved.</p>
      </div>
    `;

    // Send direct email to user's address
    let emailSent = true;
    try {
      await sendEmail({
        email: enquiry.email,
        subject: subjectToUse,
        message: `Hello ${enquiry.name},\n\nResponse to your inquiry:\n${trimmedReply}\n\nOriginal Inquiry: ${enquiry.message}`,
        html: userHtml,
      });
    } catch (emailErr) {
      console.error(`[REPLY EMAIL ERROR] Failed to send email to ${enquiry.email}:`, emailErr.message);
      emailSent = false;
    }

    // Update status to Replied and record reply content & timestamp
    enquiry.status = "Replied";
    enquiry.adminReply = trimmedReply;
    enquiry.repliedAt = new Date();
    await enquiry.save();

    res.status(200).json({
      success: true,
      message: emailSent
        ? `Reply email successfully sent to ${enquiry.email}!`
        : `Enquiry status updated to Replied (Email notice: ${enquiry.email})`,
      emailSent,
      enquiry,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEnquiry,
  getEnquiries,
  updateEnquiryStatus,
  replyToEnquiry,
};
