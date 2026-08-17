const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const pilgrimageCenterRoutes = require("./routes/pilgrimageCenterRoutes");
const enquiryRoutes = require("./routes/enquiryRoutes");
const journeyRoutes = require("./routes/journeyRoutes");
const nearbyServiceRoutes = require("./routes/nearbyServiceRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Root route
app.get("/", (req, res) => {
  res.send("PilgrimIQ Backend API is running. Access the frontend app at http://localhost:3000");
});

const medicalReportRoutes = require("./routes/medicalReportRoutes");
const physicianReviewRoutes = require("./routes/physicianReviewRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const weatherRoutes = require("./routes/weatherRoutes");

// Health Check route
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "PilgrimIQ Backend API is running smoothly!" });
});

const baseCampRoutes = require("./routes/baseCampRoutes");

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/base-camps", baseCampRoutes);
app.use("/api/pilgrimage-centers", pilgrimageCenterRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/journeys", journeyRoutes);
app.use("/api/nearby-services", nearbyServiceRoutes);
app.use("/api/medical-reports", medicalReportRoutes);
app.use("/api/physician/medical-reviews", physicianReviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/weather", weatherRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
});
