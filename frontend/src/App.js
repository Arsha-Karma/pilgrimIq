import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import About from "./pages/About";
import Features from "./pages/Features";
import Centers from "./pages/Centers";
import CenterDetails from "./pages/CenterDetails";
import Services from "./pages/Services";
import HowItWorks from "./pages/HowItWorks";
import Contact from "./pages/Contact";
import AdminDashboard from "./pages/AdminDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import Profile from "./pages/Profile";
import JourneyPlanner from "./pages/JourneyPlanner";
import JourneyDetails from "./pages/JourneyDetails";
import MyJourneys from "./pages/MyJourneys";
import MedicalAnalysis from "./pages/MedicalAnalysis";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/family" element={<Profile />} />
        <Route path="/my-family" element={<Profile />} />
        <Route path="/medical-analysis/:reportId" element={<MedicalAnalysis />} />
        <Route path="/journey-planner/:pilgrimageCenterId" element={<JourneyPlanner />} />
        <Route path="/journey/:journeyId" element={<JourneyDetails />} />
        <Route path="/my-journeys" element={<MyJourneys />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/doctor" element={<DoctorDashboard />} />
        <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/reset-password/:resetToken" element={<ResetPassword />} />
        <Route path="/about" element={<About />} />
        <Route path="/features" element={<Features />} />
        <Route path="/centers" element={<Centers />} />
        <Route path="/pilgrimage-centers/:id" element={<CenterDetails />} />
        <Route path="/services" element={<Services />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
