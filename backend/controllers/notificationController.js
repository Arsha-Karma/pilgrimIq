const Notification = require("../models/Notification");

// @desc    Get all in-app notifications for authenticated user
// @route   GET /api/notifications
// @access  Private (Authenticated User)
const getMyNotifications = async (req, res, next) => {
  try {
    const rawNotifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    // Deduplicate notifications by type + personName or title so only 1 notification appears
    const seen = new Set();
    const notifications = [];
    let unreadCount = 0;

    for (const notif of rawNotifications) {
      const key = `${notif.type || ""}_${notif.personName || notif.title || ""}`;
      if (!seen.has(key)) {
        seen.add(key);
        notifications.push(notif);
        if (!notif.read) {
          unreadCount++;
        }
      }
    }

    res.status(200).json({
      success: true,
      unreadCount,
      notifications: notifications.slice(0, 30),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private (Authenticated User)
const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!notification) {
      res.status(404);
      throw new Error("Notification not found.");
    }

    notification.read = true;
    await notification.save();

    res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyNotifications,
  markNotificationRead,
};
