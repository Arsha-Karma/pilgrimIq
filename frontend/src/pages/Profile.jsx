import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  apiGetProfile,
  apiUpdateProfile,
  apiAddFamilyMember,
  apiUpdateFamilyMember,
  apiDeleteFamilyMember,
} from "../services/api";
import "../styles/Profile.css";
import Navbar from "../components/Navbar";
import {
  FiUser,
  FiUsers,
  FiGrid,
  FiPlusSquare,
  FiCompass,
  FiStar,
  FiCalendar,
  FiShield,
  FiWifi,
  FiMessageSquare,
  FiSettings,
  FiLogOut,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiPhone,
  FiFileText,
  FiUpload,
  FiCheck,
  FiMapPin,
  FiPhoneCall,
  FiEye,
  FiCamera,
  FiHeart,
  FiHelpCircle
} from "react-icons/fi";

const RELATIONSHIPS = [
  "Father",
  "Mother",
  "Spouse",
  "Husband",
  "Wife",
  "Son",
  "Daughter",
  "Parent",
  "Sibling",
  "Brother",
  "Sister",
  "Grandparent",
  "Guardian",
  "Relative",
  "Friend",
  "Other"
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", "Unknown"];

const NATIONALITIES = [
  "Indian",
  "Nepalese",
  "Bhutanese",
  "Sri Lankan",
  "American",
  "British",
  "Canadian",
  "Australian",
  "German",
  "French",
  "Emirati",
  "Saudi",
  "Other"
];

const STATES_BY_NATIONALITY = {
  Indian: [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Andaman and Nicobar Islands",
    "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Jammu and Kashmir",
    "Ladakh",
    "Lakshadweep",
    "Puducherry"
  ]
};

const DISTRICTS_BY_STATE = {
  Kerala: [
    "Alappuzha",
    "Ernakulam",
    "Idukki",
    "Kannur",
    "Kasaragod",
    "Kollam",
    "Kottayam",
    "Kozhikode",
    "Malappuram",
    "Palakkad",
    "Pathanamthitta",
    "Thiruvananthapuram",
    "Thrissur",
    "Wayanad"
  ],
  "Tamil Nadu": [
    "Ariyalur",
    "Chengalpattu",
    "Chennai",
    "Coimbatore",
    "Cuddalore",
    "Dharmapuri",
    "Dindigul",
    "Erode",
    "Kanchipuram",
    "Kanyakumari",
    "Karur",
    "Krishnagiri",
    "Madurai",
    "Mayiladuthurai",
    "Nagapattinam",
    "Namakkal",
    "Nilgiris",
    "Perambalur",
    "Pudukkottai",
    "Ramanathapuram",
    "Ranipet",
    "Salem",
    "Sivaganga",
    "Tenkasi",
    "Thanjavur",
    "Theni",
    "Thoothukudi",
    "Tiruchirappalli",
    "Tirunelveli",
    "Tirupathur",
    "Tiruppur",
    "Tiruvallur",
    "Tiruvannamalai",
    "Tiruvarur",
    "Vellore",
    "Viluppuram",
    "Virudhunagar"
  ],
  Karnataka: [
    "Bagalkot",
    "Ballari",
    "Belagavi",
    "Bengaluru Rural",
    "Bengaluru Urban",
    "Bidar",
    "Chamarajanagar",
    "Chikkaballapur",
    "Chikkamagaluru",
    "Chitradurga",
    "Dakshina Kannada",
    "Davanagere",
    "Dharwad",
    "Gadag",
    "Hassan",
    "Haveri",
    "Kalaburagi",
    "Kodagu",
    "Kolar",
    "Koppal",
    "Mandya",
    "Mysuru",
    "Raichur",
    "Ramanagara",
    "Shivamogga",
    "Tumakuru",
    "Udupi",
    "Uttara Kannada",
    "Vijayanagara",
    "Yadgir"
  ],
  "Andhra Pradesh": [
    "Anantapur",
    "Annamayya",
    "Anakapalli",
    "Bapatla",
    "Chittoor",
    "East Godavari",
    "Eluru",
    "Guntur",
    "Kakinada",
    "Kurnool",
    "Nandyal",
    "NTR",
    "Palnadu",
    "Prakasam",
    "Sri Potti Sriramulu Nellore",
    "Sri Sathya Sai",
    "Srikakulam",
    "Tirupati",
    "Visakhapatnam",
    "Vizianagaram",
    "West Godavari",
    "YSR Kadapa"
  ],
  Telangana: [
    "Adilabad",
    "Bhadradri Kothagudem",
    "Hyderabad",
    "Jagtial",
    "Jangaon",
    "Jayashankar Bhupalpally",
    "Jogulamba Gadwal",
    "Kamareddy",
    "Karimnagar",
    "Khammam",
    "Kumuram Bheem Asifabad",
    "Mahabubabad",
    "Mahabubnagar",
    "Mancherial",
    "Medak",
    "Medchal-Malkajgiri",
    "Mulugu",
    "Nagarkurnool",
    "Nalgonda",
    "Narayanpet",
    "Nirmal",
    "Nizamabad",
    "Peddapalli",
    "Rajanna Sircilla",
    "Rangareddy",
    "Sangareddy",
    "Siddipet",
    "Suryapet",
    "Vikarabad",
    "Wanaparthy",
    "Warangal",
    "Hanamkonda",
    "Yadadri Bhuvanagiri"
  ],
  Maharashtra: [
    "Ahmednagar",
    "Akola",
    "Amravati",
    "Aurangabad (Chhatrapati Sambhajinagar)",
    "Beed",
    "Bhandara",
    "Buldhana",
    "Chandrapur",
    "Dhule",
    "Gadchiroli",
    "Gondia",
    "Hingoli",
    "Jalgaon",
    "Jalna",
    "Kolhapur",
    "Latur",
    "Mumbai City",
    "Mumbai Suburban",
    "Nagpur",
    "Nanded",
    "Nandurbar",
    "Nashik",
    "Osmanabad (Dharashiv)",
    "Palghar",
    "Parbhani",
    "Pune",
    "Raigad",
    "Ratnagiri",
    "Sangli",
    "Satara",
    "Sindhudurg",
    "Solapur",
    "Thane",
    "Wardha",
    "Washim",
    "Yavatmal"
  ],
  Delhi: [
    "Central Delhi",
    "East Delhi",
    "New Delhi",
    "North Delhi",
    "North East Delhi",
    "North West Delhi",
    "Shahdara",
    "South Delhi",
    "South East Delhi",
    "South West Delhi",
    "West Delhi"
  ],
  Gujarat: [
    "Ahmedabad",
    "Amreli",
    "Anand",
    "Aravalli",
    "Banaskantha",
    "Bharuch",
    "Bhavnagar",
    "Botad",
    "Chhota Udaipur",
    "Dahod",
    "Dang",
    "Devbhoomi Dwarka",
    "Gandhinagar",
    "Gir Somnath",
    "Jamnagar",
    "Junagadh",
    "Kheda",
    "Kutch",
    "Mahisagar",
    "Mehsana",
    "Morbi",
    "Narmada",
    "Navsari",
    "Panchmahal",
    "Patan",
    "Porbandar",
    "Rajkot",
    "Sabarkantha",
    "Surat",
    "Surendranagar",
    "Tapi",
    "Vadodara",
    "Valsad"
  ],
  "Uttar Pradesh": [
    "Agra",
    "Aligarh",
    "Ambedkar Nagar",
    "Amethi",
    "Amroha",
    "Auraiya",
    "Ayodhya",
    "Azamgarh",
    "Baghpat",
    "Bahraich",
    "Ballia",
    "Balrampur",
    "Banda",
    "Barabanki",
    "Bareilly",
    "Basti",
    "Bhadohi",
    "Bijnor",
    "Budaun",
    "Bulandshahr",
    "Chandauli",
    "Chitrakoot",
    "Deoria",
    "Etah",
    "Etawah",
    "Farrukhabad",
    "Fatehpur",
    "Firozabad",
    "Gautam Buddha Nagar",
    "Ghaziabad",
    "Ghazipur",
    "Gonda",
    "Gorakhpur",
    "Hamirpur",
    "Hapur",
    "Hardoi",
    "Hathras",
    "Jalaun",
    "Jaunpur",
    "Jhansi",
    "Kannauj",
    "Kanpur Dehat",
    "Kanpur Nagar",
    "Kasganj",
    "Kaushambi",
    "Kheri",
    "Kushinagar",
    "Lalitpur",
    "Lucknow",
    "Maharajganj",
    "Mahoba",
    "Mainpuri",
    "Mathura",
    "Mau",
    "Meerut",
    "Mirzapur",
    "Moradabad",
    "Muzaffarnagar",
    "Pilibhit",
    "Pratapgarh",
    "Prayagraj",
    "Raebareli",
    "Rampur",
    "Saharanpur",
    "Sambhal",
    "Sant Kabir Nagar",
    "Shahjahanpur",
    "Shamli",
    "Shravasti",
    "Siddharthnagar",
    "Sitapur",
    "Sonbhadra",
    "Sultanpur",
    "Unnao",
    "Varanasi"
  ],
  "West Bengal": [
    "Alipurduar",
    "Bankura",
    "Paschim Bardhaman",
    "Purba Bardhaman",
    "Birbhum",
    "Cooch Behar",
    "Dakshin Dinajpur",
    "Darjeeling",
    "Hooghly",
    "Howrah",
    "Jalpaiguri",
    "Jhargram",
    "Kalimpong",
    "Kolkata",
    "Malda",
    "Murshidabad",
    "Nadia",
    "North 24 Parganas",
    "Paschim Medinipur",
    "Purba Medinipur",
    "Purulia",
    "South 24 Parganas",
    "Uttar Dinajpur"
  ],
  Punjab: [
    "Amritsar",
    "Barnala",
    "Bathinda",
    "Faridkot",
    "Fatehgarh Sahib",
    "Fazilka",
    "Ferozepur",
    "Gurdaspur",
    "Hoshiarpur",
    "Jalandhar",
    "Kapurthala",
    "Ludhiana",
    "Malerkotla",
    "Mansa",
    "Moga",
    "Muktsar",
    "Pathankot",
    "Patiala",
    "Rupnagar",
    "Sahibzada Ajit Singh Nagar (Mohali)",
    "Sangrur",
    "Shahid Bhagat Singh Nagar",
    "Tarn Taran"
  ],
  Rajasthan: [
    "Ajmer",
    "Alwar",
    "Banswara",
    "Baran",
    "Barmer",
    "Bharatpur",
    "Bhilwara",
    "Bikaner",
    "Bundi",
    "Chittorgarh",
    "Churu",
    "Dausa",
    "Dholpur",
    "Dungarpur",
    "Hanumangarh",
    "Jaipur",
    "Jaisalmer",
    "Jalore",
    "Jhalawar",
    "Jhunjhunu",
    "Jodhpur",
    "Karauli",
    "Kota",
    "Nagaur",
    "Pali",
    "Pratapgarh",
    "Rajsamand",
    "Sawai Madhopur",
    "Sikar",
    "Sirohi",
    "Sri Ganganagar",
    "Tonk",
    "Udaipur"
  ]
};

const calculateBmiString = (h, w) => {
  if (!h || !w || Number(h) <= 0 || Number(w) <= 0) return "";
  const heightM = Number(h) / 100;
  const bmiVal = (Number(w) / (heightM * heightM)).toFixed(1);
  let cat = "Normal";
  const num = Number(bmiVal);
  if (num < 18.5) cat = "Underweight";
  else if (num >= 25 && num < 30) cat = "Overweight";
  else if (num >= 30) cat = "Obese";
  return `${bmiVal} (${cat})`;
};

const calculateMemberPsi = (member) => {
  if (!member) return { psiScore: 85, psiRiskLevel: "Low Risk" };
  let score = 100;
  const age = Number(member.age || 0);

  if (age > 65) score -= 25;
  else if (age > 50) score -= 15;
  else if (age > 40) score -= 5;

  const cond = (
    (member.chronicConditions || "") +
    " " +
    (Array.isArray(member.existingConditions)
      ? member.existingConditions.join(" ")
      : member.existingConditions || "")
  ).toLowerCase();

  if (/cardiac|heart|attack|stroke/i.test(cond)) score -= 25;
  if (/asthma|copd|respiratory|breathing/i.test(cond)) score -= 20;
  if (/diabetes|hypertension|bp|sugar/i.test(cond)) score -= 15;

  if (member.usesAssistance && member.usesAssistance !== "No" && member.usesAssistance !== "None") score -= 15;
  if (member.smokingStatus === "Smoker") score -= 10;
  if (member.stairClimbing === "Unable") score -= 15;
  else if (member.stairClimbing === "With Difficulty") score -= 10;

  score = Math.max(20, Math.min(100, score));

  let level = "Low Risk";
  if (score < 55) level = "High Risk";
  else if (score < 75) level = "Moderate Risk";

  return { psiScore: score, psiRiskLevel: level };
};

function Profile() {
  const { user: authUser, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Tab State: 'profile' or 'family'
  const queryParams = new URLSearchParams(location.search);
  const isFamilyRoute = location.pathname.includes("family") || queryParams.get("tab") === "family";
  const [activeTab, setActiveTab] = useState(isFamilyRoute ? "family" : "profile");

  // Profile Data & Family Members (Instant initial state from authUser to eliminate page load lag)
  const [profileData, setProfileData] = useState(authUser || null);
  const [familyMembers, setFamilyMembers] = useState(authUser?.familyMembers || []);
  const [selectedMemberId, setSelectedMemberId] = useState(authUser?.familyMembers?.[0]?._id || null);

  // Navigation & Menu States
  const [sidebarOpen] = useState(true);
  const [familyHealthTab, setFamilyHealthTab] = useState("info");

  // Alert State
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  // Modals States
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showEditEmergencyModal, setShowEditEmergencyModal] = useState(false);
  const [showEditHealthModal, setShowEditHealthModal] = useState(false);
  const [showEditPreferencesModal, setShowEditPreferencesModal] = useState(false);
  const [showCompleteProfileModal, setShowCompleteProfileModal] = useState(false);
  const [profileWizardStep, setProfileWizardStep] = useState(1);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberFormTab, setMemberFormTab] = useState("personal");
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [showUploadReportModal, setShowUploadReportModal] = useState(false);
  const [showPsiModal, setShowPsiModal] = useState(false);

  // Focus and Validation States
  const [focusedField, setFocusedField] = useState("");
  const [focusedMemberField, setFocusedMemberField] = useState("");
  const [profileErrors, setProfileErrors] = useState({});
  const [emergencyErrors, setEmergencyErrors] = useState({});
  const [memberErrors, setMemberErrors] = useState({});
  const [wizardErrors, setWizardErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [touchedMemberFields, setTouchedMemberFields] = useState({});

  // Full User Profile Completion Form State (All 7 Sections)
  const [fullProfileForm, setFullProfileForm] = useState({
    dob: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
    bloodGroup: "",
    nationality: "",
    state: "",
    district: "",
    address: "",
    preferredLanguage: "",

    contactName: "",
    relationship: "",
    phone: "",
    alternatePhone: "",

    existingConditions: [],
    otherCondition: "",
    previousSurgeries: "",
    currentMedications: "",
    drugAllergies: "",
    foodAllergies: "",
    mobilityLimitations: "",
    visionProblems: "",
    hearingProblems: "",
    smokingStatus: "",
    alcoholStatus: "",
    pregnancyStatus: "",

    restingBP: "",
    bloodSugar: "",
    heartRate: "",
    spo2: "",
    hemoglobin: "",

    activityLevel: "",
    continuousWalking: "",
    stairClimbing: "",
    usesAssistance: "",

    consentAccurate: false,
    consentAiRisk: false,
    consentTerms: false,
  });

  // Profile Edit Form State
  const [profileForm, setProfileForm] = useState({
    name: authUser?.name || "",
    phone: authUser?.phone || "",
    location: authUser?.location || "",
    age: authUser?.age ? String(authUser.age) : "",
    gender: authUser?.gender || "",
    bloodGroup: authUser?.bloodGroup || "",
    height: authUser?.height ? String(authUser.height) : "",
    weight: authUser?.weight ? String(authUser.weight) : "",
    avatar: authUser?.avatar || "",
  });

  // Emergency Contact Form State
  const [emergencyForm, setEmergencyForm] = useState({
    contactName: authUser?.emergencyContact?.contactName || "",
    relationship: authUser?.emergencyContact?.relationship || "",
    phone: authUser?.emergencyContact?.phone || "",
    alternatePhone: authUser?.emergencyContact?.alternatePhone || "",
  });

  // Health Information Form State
  const [healthForm, setHealthForm] = useState({
    chronicDiseases: authUser?.healthInfo?.chronicDiseases || "",
    allergies: authUser?.healthInfo?.allergies || "",
    currentMedicines: authUser?.healthInfo?.currentMedicines || "",
    bloodGroup: authUser?.healthInfo?.bloodGroup || authUser?.bloodGroup || "",
    fitnessLevel: authUser?.healthInfo?.fitnessLevel || "",
  });

  // Pilgrimage Preferences Form State
  const [preferencesForm, setPreferencesForm] = useState({
    preferredReligion: authUser?.pilgrimagePreferences?.preferredReligion || "",
    preferredLanguage: authUser?.pilgrimagePreferences?.preferredLanguage || "",
    preferredClimate: authUser?.pilgrimagePreferences?.preferredClimate || "",
    travelFrequency: authUser?.pilgrimagePreferences?.travelFrequency || "",
  });

  // Initial blank state for Family Member Form (100% manual entry, NO pre-filled user data)
  const initialMemberFormState = {
    name: "",
    relationship: "",
    dob: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
    bloodGroup: "",
    nationality: "",
    state: "",
    district: "",
    address: "",
    phone: "",
    profilePhoto: "",

    chronicConditions: "",
    existingConditions: [],
    currentMedicines: "",
    drugAllergies: "",
    foodAllergies: "",
    allergies: "",
    previousSurgeries: "",
    mobilityLimitations: "",
    smokingStatus: "",
    alcoholStatus: "",

    bloodPressure: "",
    bloodSugar: "",
    heartRate: "",
    spo2: "",
    hemoglobin: "",

    activityLevel: "",
    walkingCapacity: "",
    stairClimbing: "",
    usesAssistance: "",
  };

  // Add / Edit Family Member Form State
  const [memberForm, setMemberForm] = useState(initialMemberFormState);

  // Upload Report Form State
  const [reportFile, setReportFile] = useState(null);
  const [reportForm, setReportForm] = useState({
    fileName: "",
    fileType: "pdf",
    reportSummary: {
      hemoglobin: "",
      vitaminD: "",
      bloodSugar: "",
      bmi: "",
      bloodPressure: "",
      overallStatus: "",
    },
  });

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    // Sync authUser state immediately if profileData is not populated yet
    if (authUser && !profileData) {
      setProfileData(authUser);
      if (authUser.familyMembers) {
        setFamilyMembers(authUser.familyMembers);
        if (authUser.familyMembers.length > 0 && !selectedMemberId) {
          setSelectedMemberId(authUser.familyMembers[0]._id);
        }
      }
    }

    const fetchProfile = async () => {
      try {
        const data = await apiGetProfile(token);
        if (data) {
          setProfileData(data);

          const members = data.familyMembers || [];
          setFamilyMembers(members);
          if (members.length > 0 && !selectedMemberId) {
            setSelectedMemberId(members[0]._id);
          }

          const isCompleted = data.profileCompleted === true;

          // Initialize user profile form
          setProfileForm({
            name: data.name || authUser?.name || "",
            phone: data.phone || authUser?.phone || "",
            location: isCompleted ? (data.location || "") : "",
            age: isCompleted && data.age !== null && data.age !== undefined ? String(data.age) : "",
            gender: isCompleted ? (data.gender || "") : "",
            bloodGroup: isCompleted ? (data.bloodGroup || "") : "",
            height: isCompleted && data.height !== null && data.height !== undefined ? String(data.height) : "",
            weight: isCompleted && data.weight !== null && data.weight !== undefined ? String(data.weight) : "",
            avatar: data.avatar || "",
          });

          // Initialize Full Profile Completion Form
          setFullProfileForm({
            dob: isCompleted ? (data.dob || "") : "",
            age: isCompleted && data.age !== null && data.age !== undefined ? String(data.age) : "",
            gender: isCompleted ? (data.gender || "") : "",
            height: isCompleted && data.height !== null && data.height !== undefined ? String(data.height) : "",
            weight: isCompleted && data.weight !== null && data.weight !== undefined ? String(data.weight) : "",
            bloodGroup: isCompleted ? (data.bloodGroup || "") : "",
            nationality: isCompleted ? (data.nationality || "") : "",
            state: isCompleted ? (data.state || "") : "",
            district: isCompleted ? (data.district || "") : "",
            address: isCompleted ? (data.address || "") : "",
            preferredLanguage: isCompleted ? (data.preferredLanguage || "") : "",

            contactName: isCompleted ? (data.emergencyContact?.contactName || "") : "",
            relationship: isCompleted ? (data.emergencyContact?.relationship || "") : "",
            phone: isCompleted ? (data.emergencyContact?.phone || "") : "",
            alternatePhone: isCompleted ? (data.emergencyContact?.alternatePhone || "") : "",

            existingConditions: isCompleted ? (data.medicalInfo?.existingConditions || []) : [],
            otherCondition: isCompleted ? (data.medicalInfo?.otherCondition || "") : "",
            previousSurgeries: isCompleted ? (data.medicalInfo?.previousSurgeries || "") : "",
            currentMedications: isCompleted ? (data.medicalInfo?.currentMedications || "") : "",
            drugAllergies: isCompleted ? (data.medicalInfo?.drugAllergies || "") : "",
            foodAllergies: isCompleted ? (data.medicalInfo?.foodAllergies || "") : "",
            mobilityLimitations: isCompleted ? (data.medicalInfo?.mobilityLimitations || "") : "",
            visionProblems: isCompleted ? (data.medicalInfo?.visionProblems || "") : "",
            hearingProblems: isCompleted ? (data.medicalInfo?.hearingProblems || "") : "",
            smokingStatus: isCompleted ? (data.medicalInfo?.smokingStatus || "") : "",
            alcoholStatus: isCompleted ? (data.medicalInfo?.alcoholStatus || "") : "",
            pregnancyStatus: isCompleted ? (data.medicalInfo?.pregnancyStatus || "") : "",

            restingBP: isCompleted ? (data.healthMeasurements?.restingBP || "") : "",
            bloodSugar: isCompleted ? (data.healthMeasurements?.bloodSugar || "") : "",
            heartRate: isCompleted ? (data.healthMeasurements?.heartRate || "") : "",
            spo2: isCompleted ? (data.healthMeasurements?.spo2 || "") : "",
            hemoglobin: isCompleted ? (data.healthMeasurements?.hemoglobin || "") : "",

            activityLevel: isCompleted ? (data.fitnessInfo?.activityLevel || "") : "",
            continuousWalking: isCompleted ? (data.fitnessInfo?.continuousWalking || "") : "",
            stairClimbing: isCompleted ? (data.fitnessInfo?.stairClimbing || "") : "",
            usesAssistance: isCompleted ? (data.fitnessInfo?.usesAssistance || "") : "",

            consentAccurate: isCompleted ? (data.consent?.accurate || false) : false,
            consentAiRisk: isCompleted ? (data.consent?.aiRisk || false) : false,
            consentTerms: isCompleted ? (data.consent?.terms || false) : false,
          });

          // Initialize emergency form
          setEmergencyForm({
            contactName: isCompleted && data.emergencyContact ? (data.emergencyContact.contactName || "") : "",
            relationship: isCompleted && data.emergencyContact ? (data.emergencyContact.relationship || "") : "",
            phone: isCompleted && data.emergencyContact ? (data.emergencyContact.phone || "") : "",
            alternatePhone: isCompleted && data.emergencyContact ? (data.emergencyContact.alternatePhone || "") : "",
          });

          // Initialize health form
          setHealthForm({
            chronicDiseases: data.healthInfo?.chronicDiseases || "",
            allergies: data.healthInfo?.allergies || "",
            currentMedicines: data.healthInfo?.currentMedicines || "",
            bloodGroup: data.healthInfo?.bloodGroup || data.bloodGroup || "",
            fitnessLevel: data.healthInfo?.fitnessLevel || "",
          });

          // Initialize pilgrimage preferences form
          setPreferencesForm({
            preferredReligion: data.pilgrimagePreferences?.preferredReligion || "",
            preferredLanguage: data.pilgrimagePreferences?.preferredLanguage || "",
            preferredClimate: data.pilgrimagePreferences?.preferredClimate || "",
            travelFrequency: data.pilgrimagePreferences?.travelFrequency || "",
          });
        }
      } catch (err) {
        console.error("Profile background sync error:", err);
      }
    };

    fetchProfile();
  }, [token, navigate, authUser]);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert({ type: "", message: "" });
    }, 4000);
  };

  // Selected Family Member Object
  const activeMember =
    familyMembers.find((m) => m._id === selectedMemberId) || familyMembers[0] || null;

  // Signup-style Name & Phone Validation Helper Functions
  const validateNameString = (val, fieldLabel = "Name") => {
    const trimmed = val ? String(val).trim() : "";
    if (!trimmed) {
      return `${fieldLabel} is required`;
    }
    if (/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(trimmed)) {
      return "Numbers and special symbols are not allowed in name";
    }
    if (trimmed.length < 2) {
      return `${fieldLabel} must be at least 2 letters`;
    }
    return "";
  };

  const validatePhoneString = (val, isRequired = true, fieldLabel = "Phone Number") => {
    const trimmed = val ? String(val).trim() : "";
    if (!trimmed) {
      return isRequired ? `${fieldLabel} is required` : "";
    }
    if (/[^\d]/.test(trimmed)) {
      return "Phone number must contain digits only";
    }
    if (/^[0-5]/.test(trimmed)) {
      return "Phone number cannot start with 0, 1, 2, 3, 4, or 5";
    }
    if (trimmed.length !== 10) {
      return "Phone number must be exactly 10 digits";
    }
    if (/^(\d)\1{9}$/.test(trimmed)) {
      return "Invalid phone number format (e.g., 1000000000 is not allowed)";
    }
    return "";
  };

  // Real-time Validation Rules
  const validateProfileForm = (formData) => {
    const errs = {};
    const nameErr = validateNameString(formData.name, "Full Name");
    if (nameErr) errs.name = nameErr;

    const phoneErr = validatePhoneString(formData.phone, false, "Phone Number");
    if (phoneErr) errs.phone = phoneErr;

    if (formData.age && (isNaN(formData.age) || Number(formData.age) < 1 || Number(formData.age) > 120)) {
      errs.age = "Age must be a valid number between 1 and 120";
    }

    if (formData.height && (isNaN(formData.height) || Number(formData.height) < 30 || Number(formData.height) > 250)) {
      errs.height = "Height must be between 30 cm and 250 cm";
    }

    if (formData.weight && (isNaN(formData.weight) || Number(formData.weight) < 2 || Number(formData.weight) > 300)) {
      errs.weight = "Weight must be between 2 kg and 300 kg";
    }

    return errs;
  };

  const validateEmergencyForm = (formData) => {
    const errs = {};
    const nameErr = validateNameString(formData.contactName, "Emergency contact name");
    if (nameErr) errs.contactName = nameErr;

    if (!formData.relationship.trim()) {
      errs.relationship = "Relationship is required";
    }

    const phoneErr = validatePhoneString(formData.phone, true, "Emergency phone number");
    if (phoneErr) errs.phone = phoneErr;

    if (formData.alternatePhone) {
      const altErr = validatePhoneString(formData.alternatePhone, false, "Alternate phone number");
      if (altErr) errs.alternatePhone = altErr;
    }

    return errs;
  };

  const validateMemberField = (name, value, currentForm = memberForm) => {
    let error = "";
    const strVal = value !== undefined && value !== null ? String(value).trim() : "";

    switch (name) {
      case "name":
        error = validateNameString(strVal, "Family member name");
        break;

      case "relationship":
        if (!strVal) {
          error = "Relationship is required";
        }
        break;

      case "dob":
        if (strVal) {
          const birth = new Date(strVal);
          const today = new Date();
          if (birth > today) {
            error = "Date of birth cannot be in the future";
          }
        }
        break;

      case "age":
        if (strVal && (isNaN(strVal) || Number(strVal) < 0 || Number(strVal) > 120)) {
          error = "Age must be a valid number between 0 and 120";
        }
        break;

      case "height":
        if (strVal) {
          if (/[^\d.]/.test(strVal) || isNaN(strVal)) {
            error = "Numbers only allowed in height (no letters or symbols)";
          } else if (Number(strVal) < 30 || Number(strVal) > 250) {
            error = "Height must be between 30 cm and 250 cm";
          }
        }
        break;

      case "weight":
        if (strVal) {
          if (/[^\d.]/.test(strVal) || isNaN(strVal)) {
            error = "Numbers only allowed in weight (no letters or symbols)";
          } else if (Number(strVal) < 2 || Number(strVal) > 300) {
            error = "Weight must be between 2 kg and 300 kg";
          }
        }
        break;

      case "nationality":
        if (!strVal) {
          error = "Nationality is required";
        }
        break;

      case "state":
        if (!strVal) {
          error = "State is required";
        }
        break;

      case "district":
        if (!strVal) {
          error = "District is required";
        }
        break;

      case "address":
        if (!strVal) {
          error = "Address is required";
        } else if (strVal.length < 5) {
          error = "Address must be at least 5 characters";
        }
        break;

      case "phone":
        error = validatePhoneString(strVal, false, "Phone Number");
        break;

      case "bloodPressure":
        if (strVal && !/^\d{2,3}\/\d{2,3}$/.test(strVal)) {
          error = "Enter blood pressure in format 120/80 mmHg";
        }
        break;

      case "bloodSugar":
        if (strVal && (isNaN(strVal) || Number(strVal) < 30 || Number(strVal) > 600)) {
          error = "Blood sugar must be between 30 and 600 mg/dL";
        }
        break;

      case "heartRate":
        if (strVal && (isNaN(strVal) || Number(strVal) < 30 || Number(strVal) > 220)) {
          error = "Heart rate must be between 30 and 220 bpm";
        }
        break;

      case "spo2":
        if (strVal && (isNaN(strVal) || Number(strVal) < 50 || Number(strVal) > 100)) {
          error = "SpO₂ must be between 50% and 100%";
        }
        break;

      case "hemoglobin":
        if (strVal && (isNaN(strVal) || Number(strVal) < 3 || Number(strVal) > 25)) {
          error = "Hemoglobin must be between 3 and 25 g/dL";
        }
        break;

      case "chronicConditions":
      case "currentMedicines":
      case "drugAllergies":
      case "foodAllergies":
      case "previousSurgeries":
      case "mobilityLimitations":
        if (strVal && /[<>{}[\]$%^*=\\]/.test(strVal)) {
          error = "Special characters < > { } [ ] $ % ^ * are not allowed";
        } else if (strVal && strVal.length > 200) {
          error = "Text cannot exceed 200 characters";
        }
        break;

      default:
        break;
    }

    return error;
  };

  const handleMemberFieldFocus = (name, value) => {
    setFocusedMemberField(name);
    setTouchedMemberFields((prev) => ({ ...prev, [name]: true }));
    const error = validateMemberField(name, value);
    setMemberErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleMemberFieldBlur = (name, value) => {
    setFocusedMemberField("");
    setTouchedMemberFields((prev) => ({ ...prev, [name]: true }));
    const error = validateMemberField(name, value);
    setMemberErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleMemberFieldChange = (name, value) => {
    setMemberForm((prev) => {
      const updated = { ...prev, [name]: value };
      const error = validateMemberField(name, value, updated);
      setMemberErrors((prevErrs) => ({ ...prevErrs, [name]: error }));
      return updated;
    });
    setTouchedMemberFields((prev) => ({ ...prev, [name]: true }));
  };

  const memberAvailableStates = memberForm.nationality && STATES_BY_NATIONALITY[memberForm.nationality]
    ? STATES_BY_NATIONALITY[memberForm.nationality]
    : (memberForm.nationality ? ["Other State / Region"] : []);

  const memberAvailableDistricts = memberForm.state && DISTRICTS_BY_STATE[memberForm.state]
    ? DISTRICTS_BY_STATE[memberForm.state]
    : (memberForm.state ? ["Central District", "North District", "South District", "East District", "West District", "Other District"] : []);

  const handleMemberNationalitySelect = (val) => {
    setMemberForm((prev) => {
      const updated = { ...prev, nationality: val, state: "", district: "" };
      const errNat = validateMemberField("nationality", val, updated);
      const errSt = validateMemberField("state", "", updated);
      const errDist = validateMemberField("district", "", updated);
      setMemberErrors((prevErrs) => ({
        ...prevErrs,
        nationality: errNat,
        state: errSt,
        district: errDist,
      }));
      return updated;
    });
    setTouchedMemberFields((prev) => ({ ...prev, nationality: true }));
  };

  const handleMemberStateSelect = (val) => {
    setMemberForm((prev) => {
      const updated = { ...prev, state: val, district: "" };
      const errSt = validateMemberField("state", val, updated);
      const errDist = validateMemberField("district", "", updated);
      setMemberErrors((prevErrs) => ({
        ...prevErrs,
        state: errSt,
        district: errDist,
      }));
      return updated;
    });
    setTouchedMemberFields((prev) => ({ ...prev, state: true }));
  };

  const handleMemberDobChange = (val) => {
    let computedAge = memberForm.age;
    if (val) {
      const birth = new Date(val);
      const today = new Date();
      let ageNum = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        ageNum--;
      }
      if (ageNum >= 0) computedAge = String(ageNum);
    }
    setMemberForm((prev) => {
      const updated = { ...prev, dob: val, age: computedAge };
      const errDob = validateMemberField("dob", val, updated);
      const errAge = validateMemberField("age", computedAge, updated);
      setMemberErrors((prevErrs) => ({ ...prevErrs, dob: errDob, age: errAge }));
      return updated;
    });
    setTouchedMemberFields((prev) => ({ ...prev, dob: true, age: true }));
  };

  const validateMemberForm = (formData) => {
    const errs = {};
    const fieldsToValidate = [
      "name",
      "relationship",
      "dob",
      "age",
      "height",
      "weight",
      "nationality",
      "state",
      "district",
      "address",
      "phone",
      "chronicConditions",
      "currentMedicines",
      "drugAllergies",
      "foodAllergies",
      "previousSurgeries",
      "mobilityLimitations",
      "bloodPressure",
      "bloodSugar",
      "heartRate",
      "spo2",
      "hemoglobin"
    ];

    fieldsToValidate.forEach((f) => {
      const err = validateMemberField(f, formData[f], formData);
      if (err) errs[f] = err;
      setTouchedMemberFields((prev) => ({ ...prev, [f]: true }));
    });

    return errs;
  };

  // Profile Save Handler
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const errs = validateProfileForm(profileForm);
    setProfileErrors(errs);
    if (Object.keys(errs).length > 0) {
      showAlert("error", "Please fix the validation errors before saving.");
      return;
    }

    try {
      setSubmitting(true);
      const updated = await apiUpdateProfile(profileForm, token);
      setProfileData(updated);
      setShowEditProfileModal(false);
      showAlert("success", "User profile details updated successfully!");
    } catch (err) {
      showAlert("error", err.message || "Failed to update profile.");
    } finally {
      setSubmitting(false);
    }
  };

  // Emergency Contact Save Handler
  const handleSaveEmergencyContact = async (e) => {
    e.preventDefault();
    const errs = validateEmergencyForm(emergencyForm);
    setEmergencyErrors(errs);
    if (Object.keys(errs).length > 0) {
      showAlert("error", "Please fill in required emergency contact fields.");
      return;
    }

    try {
      setSubmitting(true);
      const updated = await apiUpdateProfile({ emergencyContact: emergencyForm }, token);
      setProfileData(updated);
      setShowEditEmergencyModal(false);
      showAlert("success", "Emergency contact updated successfully!");
    } catch (err) {
      showAlert("error", err.message || "Failed to update emergency contact.");
    } finally {
      setSubmitting(false);
    }
  };

  // Health Information Save Handler
  const handleSaveHealthInfo = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const updated = await apiUpdateProfile(
        {
          bloodGroup: healthForm.bloodGroup,
          healthInfo: healthForm,
        },
        token
      );
      setProfileData(updated);
      setShowEditHealthModal(false);
      showAlert("success", "Health information updated successfully!");
    } catch (err) {
      showAlert("error", err.message || "Failed to update health information.");
    } finally {
      setSubmitting(false);
    }
  };

  // Pilgrimage Preferences Save Handler
  const handleSavePreferences = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const updated = await apiUpdateProfile(
        {
          pilgrimagePreferences: preferencesForm,
        },
        token
      );
      setProfileData(updated);
      setShowEditPreferencesModal(false);
      showAlert("success", "Pilgrimage preferences updated successfully!");
    } catch (err) {
      showAlert("error", err.message || "Failed to update preferences.");
    } finally {
      setSubmitting(false);
    }
  };

  // Real-time Validation Rules for Complete Profile Wizard
  const validateWizardField = (name, value, currentForm = fullProfileForm) => {
    let error = "";
    const strVal = value !== undefined && value !== null ? String(value).trim() : "";

    switch (name) {
      case "dob":
        if (!strVal) {
          error = "Date of Birth is required";
        } else {
          const birth = new Date(strVal);
          const today = new Date();
          if (birth > today) {
            error = "Date of Birth cannot be a future date";
          }
        }
        break;

      case "age":
        if (!strVal) {
          error = "Age is required";
        } else if (isNaN(strVal) || Number(strVal) < 1 || Number(strVal) > 120) {
          error = "Valid age between 1 and 120 is required";
        }
        break;

      case "gender":
        if (!strVal) {
          error = "Please select a gender";
        }
        break;

      case "height":
        if (!strVal) {
          error = "Height (cm) is required";
        } else if (isNaN(strVal) || Number(strVal) < 30 || Number(strVal) > 250) {
          error = "Height must be between 30 cm and 250 cm";
        }
        break;

      case "weight":
        if (!strVal) {
          error = "Weight (kg) is required";
        } else if (isNaN(strVal) || Number(strVal) < 2 || Number(strVal) > 300) {
          error = "Weight must be between 2 kg and 300 kg";
        }
        break;

      case "bloodGroup":
        if (!strVal) {
          error = "Please select a blood group";
        }
        break;

      case "nationality":
        if (!strVal) {
          error = "Nationality is required";
        } else if (strVal.length < 2) {
          error = "Nationality must be at least 2 characters";
        }
        break;

      case "state":
        if (!strVal) {
          error = "State is required";
        } else if (strVal.length < 2) {
          error = "State must be at least 2 characters";
        }
        break;

      case "district":
        if (!strVal) {
          error = "District is required";
        } else if (strVal.length < 2) {
          error = "District must be at least 2 characters";
        }
        break;

      case "preferredLanguage":
        if (!strVal) {
          error = "Please select a preferred language";
        }
        break;

      case "address":
        if (!strVal) {
          error = "Address is required";
        } else if (strVal.length < 5) {
          error = "Address must be at least 5 characters";
        }
        break;

      case "contactName":
        error = validateNameString(strVal, "Emergency contact name");
        break;

      case "relationship":
        if (!strVal) {
          error = "Relationship is required";
        }
        break;

      case "phone":
        error = validatePhoneString(strVal, true, "Emergency phone number");
        break;

      case "alternatePhone":
        error = validatePhoneString(strVal, false, "Alternate phone number");
        break;

      case "restingBP":
        if (strVal && !/^\d{2,3}\/\d{2,3}$/.test(strVal)) {
          error = "Enter resting BP in format 120/80 mmHg";
        }
        break;

      case "bloodSugar":
        if (strVal && (isNaN(strVal) || Number(strVal) < 30 || Number(strVal) > 600)) {
          error = "Blood sugar must be between 30 and 600 mg/dL";
        }
        break;

      case "heartRate":
        if (strVal && (isNaN(strVal) || Number(strVal) < 30 || Number(strVal) > 220)) {
          error = "Heart rate must be between 30 and 220 bpm";
        }
        break;

      case "spo2":
        if (strVal && (isNaN(strVal) || Number(strVal) < 50 || Number(strVal) > 100)) {
          error = "SpO₂ must be between 50% and 100%";
        }
        break;

      case "hemoglobin":
        if (strVal && (isNaN(strVal) || Number(strVal) < 3 || Number(strVal) > 25)) {
          error = "Hemoglobin must be between 3 and 25 g/dL";
        }
        break;

      default:
        break;
    }

    return error;
  };

  const handleWizardFieldFocus = (name, value) => {
    setFocusedField(name);
    setTouchedFields((prev) => ({ ...prev, [name]: true }));
    const error = validateWizardField(name, value);
    setWizardErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleWizardFieldBlur = (name, value) => {
    setFocusedField("");
    setTouchedFields((prev) => ({ ...prev, [name]: true }));
    const error = validateWizardField(name, value);
    setWizardErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleWizardFieldChange = (name, value) => {
    setFullProfileForm((prev) => {
      const updated = { ...prev, [name]: value };
      const error = validateWizardField(name, value, updated);
      setWizardErrors((prevErrs) => ({ ...prevErrs, [name]: error }));
      return updated;
    });
    setTouchedFields((prev) => ({ ...prev, [name]: true }));
  };

  const availableStates = fullProfileForm.nationality && STATES_BY_NATIONALITY[fullProfileForm.nationality]
    ? STATES_BY_NATIONALITY[fullProfileForm.nationality]
    : (fullProfileForm.nationality ? ["Other State / Region"] : []);

  const availableDistricts = fullProfileForm.state && DISTRICTS_BY_STATE[fullProfileForm.state]
    ? DISTRICTS_BY_STATE[fullProfileForm.state]
    : (fullProfileForm.state ? ["Central District", "North District", "South District", "East District", "West District", "Other District"] : []);

  const handleNationalitySelect = (val) => {
    setFullProfileForm((prev) => {
      const updated = { ...prev, nationality: val, state: "", district: "" };
      const errNat = validateWizardField("nationality", val, updated);
      const errSt = validateWizardField("state", "", updated);
      const errDist = validateWizardField("district", "", updated);
      setWizardErrors((prevErrs) => ({
        ...prevErrs,
        nationality: errNat,
        state: errSt,
        district: errDist,
      }));
      return updated;
    });
    setTouchedFields((prev) => ({ ...prev, nationality: true }));
  };

  const handleStateSelect = (val) => {
    setFullProfileForm((prev) => {
      const updated = { ...prev, state: val, district: "" };
      const errSt = validateWizardField("state", val, updated);
      const errDist = validateWizardField("district", "", updated);
      setWizardErrors((prevErrs) => ({
        ...prevErrs,
        state: errSt,
        district: errDist,
      }));
      return updated;
    });
    setTouchedFields((prev) => ({ ...prev, state: true }));
  };

  const validateWizardStep = (step) => {
    let fieldsToValidate = [];
    if (step === 1) {
      fieldsToValidate = ["dob", "age", "gender", "height", "weight", "bloodGroup", "nationality", "state", "district", "address"];
    } else if (step === 2) {
      fieldsToValidate = ["contactName", "relationship", "phone"];
    }

    let newErrors = { ...wizardErrors };
    let hasErr = false;
    fieldsToValidate.forEach((f) => {
      const err = validateWizardField(f, fullProfileForm[f]);
      newErrors[f] = err;
      setTouchedFields((prev) => ({ ...prev, [f]: true }));
      if (err) hasErr = true;
    });
    setWizardErrors(newErrors);
    return !hasErr;
  };

  // Full Profile Form DOB Change Handler (Auto-calculate Age)
  const handleDobChange = (val) => {
    let computedAge = fullProfileForm.age;
    if (val) {
      const birth = new Date(val);
      const today = new Date();
      let ageNum = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        ageNum--;
      }
      if (ageNum >= 0) computedAge = String(ageNum);
    }
    setFullProfileForm((prev) => {
      const updated = { ...prev, dob: val, age: computedAge };
      const errDob = validateWizardField("dob", val, updated);
      const errAge = validateWizardField("age", computedAge, updated);
      setWizardErrors((prevErrs) => ({ ...prevErrs, dob: errDob, age: errAge }));
      return updated;
    });
    setTouchedFields((prev) => ({ ...prev, dob: true, age: true }));
  };

  // Condition Checkbox Toggle Handler
  const handleExistingConditionToggle = (condition) => {
    setFullProfileForm((prev) => {
      const exists = prev.existingConditions.includes(condition);
      const updated = exists
        ? prev.existingConditions.filter((c) => c !== condition)
        : [...prev.existingConditions, condition];
      return { ...prev, existingConditions: updated };
    });
  };

  // Full Profile Submit Handler (Saves to MongoDB)
  const handleSaveFullProfile = async (e) => {
    if (e) e.preventDefault();
    if (!fullProfileForm.consentAccurate || !fullProfileForm.consentTerms) {
      showAlert("error", "Please confirm accuracy and agree to Privacy Policy & Terms before submitting.");
      return;
    }

    let calculatedBmi = "";
    if (fullProfileForm.height && fullProfileForm.weight && Number(fullProfileForm.height) > 0) {
      const heightM = Number(fullProfileForm.height) / 100;
      const bmiVal = (Number(fullProfileForm.weight) / (heightM * heightM)).toFixed(1);
      let cat = "Normal";
      const num = Number(bmiVal);
      if (num < 18.5) cat = "Underweight";
      else if (num >= 25 && num < 30) cat = "Overweight";
      else if (num >= 30) cat = "Obese";
      calculatedBmi = `${bmiVal} (${cat})`;
    }

    try {
      setSubmitting(true);
      const payload = {
        dob: fullProfileForm.dob,
        age: fullProfileForm.age ? Number(fullProfileForm.age) : null,
        gender: fullProfileForm.gender,
        height: fullProfileForm.height ? Number(fullProfileForm.height) : null,
        weight: fullProfileForm.weight ? Number(fullProfileForm.weight) : null,
        bloodGroup: fullProfileForm.bloodGroup,
        nationality: fullProfileForm.nationality,
        state: fullProfileForm.state,
        district: fullProfileForm.district,
        address: fullProfileForm.address,
        location: fullProfileForm.address || fullProfileForm.state || profileForm.location,
        preferredLanguage: fullProfileForm.preferredLanguage,

        emergencyContact: {
          contactName: fullProfileForm.contactName,
          relationship: fullProfileForm.relationship,
          phone: fullProfileForm.phone,
          alternatePhone: fullProfileForm.alternatePhone,
        },

        healthInfo: {
          chronicDiseases: [
            ...fullProfileForm.existingConditions,
            fullProfileForm.otherCondition ? `Other: ${fullProfileForm.otherCondition}` : "",
          ]
            .filter(Boolean)
            .join(", "),
          allergies: [fullProfileForm.drugAllergies, fullProfileForm.foodAllergies]
            .filter(Boolean)
            .join("; "),
          currentMedicines: fullProfileForm.currentMedications,
          bloodGroup: fullProfileForm.bloodGroup,
          bmi: calculatedBmi,
          fitnessLevel: fullProfileForm.activityLevel,
        },

        medicalInfo: {
          existingConditions: fullProfileForm.existingConditions,
          otherCondition: fullProfileForm.otherCondition,
          previousSurgeries: fullProfileForm.previousSurgeries,
          currentMedications: fullProfileForm.currentMedications,
          drugAllergies: fullProfileForm.drugAllergies,
          foodAllergies: fullProfileForm.foodAllergies,
          mobilityLimitations: fullProfileForm.mobilityLimitations,
          visionProblems: fullProfileForm.visionProblems,
          hearingProblems: fullProfileForm.hearingProblems,
          smokingStatus: fullProfileForm.smokingStatus,
          alcoholStatus: fullProfileForm.alcoholStatus,
          pregnancyStatus: fullProfileForm.pregnancyStatus,
        },

        healthMeasurements: {
          restingBP: fullProfileForm.restingBP,
          bloodSugar: fullProfileForm.bloodSugar,
          heartRate: fullProfileForm.heartRate,
          spo2: fullProfileForm.spo2,
          hemoglobin: fullProfileForm.hemoglobin,
        },

        fitnessInfo: {
          activityLevel: fullProfileForm.activityLevel,
          continuousWalking: fullProfileForm.continuousWalking,
          stairClimbing: fullProfileForm.stairClimbing,
          usesAssistance: fullProfileForm.usesAssistance,
        },

        consent: {
          accurate: fullProfileForm.consentAccurate,
          aiRisk: fullProfileForm.consentAiRisk,
          terms: fullProfileForm.consentTerms,
        },
        profileCompleted: true,
      };

      const updated = await apiUpdateProfile(payload, token);
      setProfileData(updated);
      setShowCompleteProfileModal(false);
      showAlert("success", "Your PilgrimIQ profile has been saved successfully!");
    } catch (err) {
      showAlert("error", err.message || "Failed to save profile.");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Add Family Member Modal (100% BLANK form, NO auto-filled or inherited data)
  const openAddMemberModal = () => {
    setEditingMemberId(null);
    setMemberForm(initialMemberFormState);
    setMemberFormTab("personal");
    setMemberErrors({});
    setTouchedMemberFields({});
    setFocusedMemberField("");
    setShowMemberModal(true);
  };

  // Open Edit Family Member Modal
  const openEditMemberModal = (member) => {
    setEditingMemberId(member._id);
    setMemberForm({
      name: member.name || "",
      relationship: member.relationship || "",
      dob: member.dob || "",
      age: member.age !== null && member.age !== undefined ? String(member.age) : "",
      gender: member.gender || "",
      height: member.height !== null && member.height !== undefined ? String(member.height) : "",
      weight: member.weight !== null && member.weight !== undefined ? String(member.weight) : "",
      bloodGroup: member.bloodGroup || "",
      nationality: member.nationality || "",
      state: member.state || "",
      district: member.district || "",
      address: member.address || "",
      phone: member.phone || "",
      profilePhoto: member.profilePhoto || "",

      chronicConditions: member.chronicConditions || "",
      existingConditions: Array.isArray(member.existingConditions) ? member.existingConditions : [],
      currentMedicines: member.currentMedicines || "",
      drugAllergies: member.drugAllergies || "",
      foodAllergies: member.foodAllergies || "",
      allergies: member.allergies || "",
      previousSurgeries: member.previousSurgeries || "",
      mobilityLimitations: member.mobilityLimitations || "",
      smokingStatus: member.smokingStatus || "",
      alcoholStatus: member.alcoholStatus || "",

      bloodPressure: member.bloodPressure || "",
      bloodSugar: member.bloodSugar || "",
      heartRate: member.heartRate || "",
      spo2: member.spo2 || "",
      hemoglobin: member.hemoglobin || "",

      activityLevel: member.activityLevel || "",
      walkingCapacity: member.walkingCapacity || "",
      stairClimbing: member.stairClimbing || "",
      usesAssistance: member.usesAssistance || "",
    });
    setMemberFormTab("personal");
    setMemberErrors({});
    setTouchedMemberFields({});
    setFocusedMemberField("");
    setShowMemberModal(true);
  };

  // Handle Add/Edit Family Member Submit
  const handleMemberFormSubmit = async (e) => {
    if (e) e.preventDefault();
    const errs = validateMemberForm(memberForm);
    setMemberErrors(errs);
    if (Object.keys(errs).length > 0) {
      showAlert("error", "Please fix form validation errors before saving.");
      return;
    }

    try {
      setSubmitting(true);
      let res;
      if (editingMemberId) {
        res = await apiUpdateFamilyMember(editingMemberId, memberForm, token);
        showAlert("success", "Family member details updated successfully!");
      } else {
        res = await apiAddFamilyMember(memberForm, token);
        showAlert("success", "New family member added and saved to database!");
      }

      if (res && res.familyMembers) {
        setFamilyMembers(res.familyMembers);
        if (res.member) {
          setSelectedMemberId(res.member._id);
        } else if (res.familyMembers.length > 0) {
          setSelectedMemberId(res.familyMembers[res.familyMembers.length - 1]._id);
        }
      }
      setShowMemberModal(false);
      setActiveTab("family");
    } catch (err) {
      showAlert("error", err.message || "Failed to save family member.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Family Member
  const handleDeleteMember = async (memberId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName}?`)) {
      return;
    }

    try {
      const res = await apiDeleteFamilyMember(memberId, token);
      showAlert("success", `${memberName} removed.`);
      if (res && res.familyMembers) {
        setFamilyMembers(res.familyMembers);
        if (res.familyMembers.length > 0) {
          setSelectedMemberId(res.familyMembers[0]._id);
        } else {
          setSelectedMemberId(null);
        }
      }
    } catch (err) {
      showAlert("error", err.message || "Failed to delete family member.");
    }
  };

  // Upload Medical Report
  const handleAddReportSubmit = async (e) => {
    e.preventDefault();
    if (!activeMember) return;
    if (!reportFile && !reportForm.fileName.trim()) {
      showAlert("error", "Please choose a medical report file to upload.");
      return;
    }

    const finalFileName = reportForm.fileName.trim() || (reportFile ? reportFile.name : "Medical_Report");

    let fileUrl = "";
    if (reportFile) {
      try {
        fileUrl = await compressImage(reportFile, 1000, 1000, 0.85);
      } catch (err) {
        fileUrl = "";
      }
    }

    const newReport = {
      fileName: finalFileName,
      fileType: reportForm.fileType,
      uploadDate: new Date().toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      uploadedBy: profileData?.name || authUser?.name || "User",
      url: fileUrl,
      isVerifiedByDoctor: false,
    };

    const updatedReports = [...(activeMember.reports || []), newReport];

    try {
      setSubmitting(true);
      const res = await apiUpdateFamilyMember(
        activeMember._id,
        { reports: updatedReports, reportSummary: reportForm.reportSummary },
        token
      );
      if (res && res.familyMembers) {
        setFamilyMembers(res.familyMembers);
      }
      setShowUploadReportModal(false);
      setReportFile(null);
      setReportForm({ fileName: "", fileType: "pdf", reportSummary: {} });
      showAlert("success", "Medical report uploaded successfully!");
    } catch (err) {
      showAlert("error", err.message || "Failed to upload report.");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to compress image to lightweight base64 data URL
  const compressImage = (file, maxWidth = 450, maxHeight = 450, quality = 0.85) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed to read image file"));
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => reject(new Error("Failed to process image"));
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(compressedDataUrl);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // Profile Image Upload Helper
  const handleProfileImageUpload = async (file, isMember = false) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showAlert("error", "File size must be under 10MB.");
      return;
    }

    try {
      setSubmitting(true);
      const dataUrl = await compressImage(file, 450, 450, 0.85);

      if (isMember) {
        setMemberForm((prev) => ({ ...prev, profilePhoto: dataUrl }));
        showAlert("success", "Member profile photo updated!");
      } else {
        setProfileForm((prev) => ({ ...prev, avatar: dataUrl }));
        const updated = await apiUpdateProfile({ avatar: dataUrl }, token);
        if (updated) {
          setProfileData(updated);
          showAlert("success", "Profile picture updated and saved successfully!");
        }
      }
    } catch (e) {
      console.error("Profile picture upload error:", e);
      showAlert("error", e.message || "Failed to save profile picture.");
    } finally {
      setSubmitting(false);
    }
  };



  const userInitial = profileData?.name
    ? profileData.name.charAt(0).toUpperCase()
    : authUser?.name
      ? authUser.name.charAt(0).toUpperCase()
      : profileData?.email
        ? profileData.email.charAt(0).toUpperCase()
        : "A";

  return (
    <div className="pilgrim-dashboard-wrapper">
      <Navbar />

      {/* DASHBOARD CONTAINER */}
      <div className="pilgrim-dashboard-container">
        {/* SIDEBAR NAVIGATION */}
        <aside className={`pilgrim-sidebar ${sidebarOpen ? "open" : "collapsed"}`}>
          <nav className="sidebar-nav">
            <button
              className={`sidebar-link ${activeTab === "dashboard" ? "active" : ""}`}
              onClick={() => navigate("/")}
            >
              <FiGrid className="nav-icon" />
              <span>Dashboard</span>
            </button>

            <button
              className={`sidebar-link ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              <FiUser className="nav-icon" />
              <span>My Profile</span>
            </button>

            <button
              className={`sidebar-link ${activeTab === "family" ? "active" : ""}`}
              onClick={() => setActiveTab("family")}
            >
              <FiUsers className="nav-icon" />
              <span>My Family</span>
            </button>

            <button className="sidebar-link" onClick={() => showAlert("info", "Health Records feature")}>
              <FiPlusSquare className="nav-icon" />
              <span>Health Records</span>
            </button>

            <button className="sidebar-link" onClick={() => showAlert("info", "Journey Planner feature")}>
              <FiCompass className="nav-icon" />
              <span>Journey Planner</span>
            </button>

            <button className="sidebar-link" onClick={() => showAlert("info", "Recommendations feature")}>
              <FiStar className="nav-icon" />
              <span>Recommendations</span>
            </button>

            <button className="sidebar-link" onClick={() => showAlert("info", "Bookings feature")}>
              <FiCalendar className="nav-icon" />
              <span>Bookings</span>
            </button>

            <button className="sidebar-link" onClick={() => showAlert("info", "Journey Assistance feature")}>
              <FiShield className="nav-icon" />
              <span>Journey Assistance</span>
            </button>

            <button className="sidebar-link" onClick={() => showAlert("info", "Family Tracking active")}>
              <FiWifi className="nav-icon" />
              <span>Family Tracking</span>
            </button>

            <button className="sidebar-link" onClick={() => showAlert("info", "Community Help forum")}>
              <FiUsers className="nav-icon" />
              <span>Community Help</span>
            </button>

            <button className="sidebar-link" onClick={() => showAlert("info", "Feedback section")}>
              <FiMessageSquare className="nav-icon" />
              <span>My Feedback</span>
            </button>

            <button className="sidebar-link" onClick={() => showAlert("info", "Settings section")}>
              <FiSettings className="nav-icon" />
              <span>Settings</span>
            </button>

            <button
              className="sidebar-link logout-btn"
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              <FiLogOut className="nav-icon" />
              <span>Logout</span>
            </button>
          </nav>

          <div className="sidebar-help-card">
            <div className="help-icon-circle">
              <FiHelpCircle size={22} />
            </div>
            <h4>Need Help?</h4>
            <p>Our support team is available 24x7</p>
            <Link to="/contact" className="btn-contact-support">
              <FiPhoneCall size={14} /> Contact Support
            </Link>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="pilgrim-main-content">
          {alert.message && (
            <div className={`dashboard-alert ${alert.type}`}>
              {alert.type === "success" ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
              <span>{alert.message}</span>
            </div>
          )}

          {/* ========================================= */}
          {/* VIEW 1: USER PROFILE */}
          {/* ========================================= */}
          {activeTab === "profile" && (
            <div className="view-container profile-view">
              <div className="page-header">
                <div className="header-titles">
                  <h1>User Profile</h1>
                  <p className="breadcrumb-text">Dashboard / My Profile</p>
                </div>
                <button
                  className="btn-primary-blue"
                  onClick={() => {
                    setProfileWizardStep(1);
                    setShowCompleteProfileModal(true);
                  }}
                >
                  <FiEdit2 size={16} /> Edit Profile
                </button>
              </div>

              {/* PROFILE COMPLETION PROGRESS BANNER */}
              <div className="profile-completion-banner">
                <div className="banner-top-row">
                  <div className="banner-title-group">
                    <FiShield size={24} />
                    <h3>User Profile Completion Module</h3>
                    <span className="banner-badge">
                      {profileData?.completionPercentage || 0}% Complete
                    </span>
                  </div>
                  <button
                    className="banner-btn-complete"
                    onClick={() => {
                      setProfileWizardStep(1);
                      setShowCompleteProfileModal(true);
                    }}
                  >
                    <FiEdit2 size={16} /> Complete Your Profile
                  </button>
                </div>
                <div className="completion-progress-track">
                  <div
                    className="completion-progress-fill"
                    style={{
                      width: `${profileData?.completionPercentage || 0}%`,
                      backgroundColor:
                        (profileData?.completionPercentage || 0) >= 80
                          ? "#22c55e"
                          : (profileData?.completionPercentage || 0) >= 50
                            ? "#eab308"
                            : "#ef4444",
                    }}
                  />
                </div>
              </div>

              {/* USER HERO CARD */}
              <div className="user-profile-hero-card">
                <div className="profile-identity-col">
                  <div className="avatar-wrapper">
                    <div className="profile-avatar-large">
                      {profileData?.avatar ? (
                        <img src={profileData.avatar} alt="User Avatar" />
                      ) : (
                        userInitial
                      )}
                    </div>
                    <label className="avatar-edit-badge" title="Upload Profile Picture">
                      <FiCamera size={14} />
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleProfileImageUpload(e.target.files[0], false);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <div className="identity-details">
                    <div className="name-verified-row">
                      <h2>{profileData?.name || authUser?.name || "User Name"}</h2>
                      <span className="badge-verified">
                        <FiCheck size={12} /> Registered User
                      </span>
                    </div>
                    <div className="contact-info-list">
                      <span className="contact-item">
                        <FiFileText /> {profileData?.email || authUser?.email || "-"}
                      </span>
                      <span className="contact-item">
                        <FiPhone /> {profileData?.phone || authUser?.phone || "-"}
                      </span>
                      <span className="contact-item">
                        <FiMapPin /> {profileData?.location || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="profile-metrics-col">
                  <div className="metric-box">
                    <span className="metric-label">Age</span>
                    <span className="metric-value">
                      {profileData?.age !== null && profileData?.age !== undefined ? `${profileData.age} Yrs` : "-"}
                    </span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-label">Blood Group</span>
                    <span className="metric-value blood">
                      {profileData?.bloodGroup || "-"}
                    </span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-label">Height</span>
                    <span className="metric-value">
                      {profileData?.height ? `${profileData.height} cm` : "-"}
                    </span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-label">Weight</span>
                    <span className="metric-value">
                      {profileData?.weight ? `${profileData.weight} kg` : "-"}
                    </span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-label">Gender</span>
                    <span className="metric-value">
                      {profileData?.gender || "-"}
                    </span>
                  </div>
                </div>

                <div className="psi-card-widget">
                  <h3>Pilgrim Safety Index (PSI)</h3>
                  <div className="psi-dial-container" onClick={() => setShowPsiModal(true)}>
                    <svg viewBox="0 0 100 100" className="psi-svg">
                      <circle cx="50" cy="50" r="40" className="psi-bg-ring" />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        className="psi-fill-ring"
                        style={{
                          strokeDasharray: "251.2",
                          strokeDashoffset: `${251.2 - (251.2 * (profileData?.psiScore || 100)) / 100}`,
                        }}
                      />
                    </svg>
                    <div className="psi-dial-text">
                      <span className="psi-score">{profileData?.psiScore || 100}</span>
                      <span className="psi-max">/100</span>
                    </div>
                  </div>
                  <div className="psi-risk-tag">{profileData?.psiRiskLevel || "Low Risk"}</div>
                  <button className="psi-view-link" onClick={() => setShowPsiModal(true)}>
                    View Details &rarr;
                  </button>
                </div>
              </div>

              {/* 2X2 GRID SECTIONS */}
              <div className="dashboard-grid-2x2">
                {/* HEALTH INFO CARD */}
                <div className="info-section-card">
                  <div className="card-header-styled">
                    <div className="card-title-group">
                      <div className="card-icon-circle blue">
                        <FiHeart />
                      </div>
                      <h3>Health Information</h3>
                    </div>
                    <button className="btn-soft-blue" onClick={() => setShowEditHealthModal(true)}>
                      <FiEdit2 size={13} /> Edit Health Info
                    </button>
                  </div>
                  <div className="card-body-grid">
                    <div className="grid-item">
                      <span className="item-label">Chronic Diseases</span>
                      <span className="item-value">
                        {profileData?.healthInfo?.chronicDiseases || "-"}
                      </span>
                    </div>
                    <div className="grid-item">
                      <span className="item-label">Allergies</span>
                      <span className="item-value">
                        {profileData?.healthInfo?.allergies || "-"}
                      </span>
                    </div>
                    <div className="grid-item">
                      <span className="item-label">Current Medicines</span>
                      <span className="item-value">
                        {profileData?.healthInfo?.currentMedicines || "-"}
                      </span>
                    </div>
                    <div className="grid-item">
                      <span className="item-label">Blood Group</span>
                      <span className="item-value highlight">
                        {profileData?.healthInfo?.bloodGroup || profileData?.bloodGroup || "-"}
                      </span>
                    </div>
                    <div className="grid-item">
                      <span className="item-label">BMI</span>
                      <span className="item-value">
                        {profileData?.healthInfo?.bmi || "-"}
                      </span>
                    </div>
                    <div className="grid-item">
                      <span className="item-label">Fitness Level</span>
                      <span className="item-value">
                        {profileData?.healthInfo?.fitnessLevel || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* EMERGENCY CONTACT CARD */}
                <div className="info-section-card">
                  <div className="card-header-styled">
                    <div className="card-title-group">
                      <div className="card-icon-circle red">
                        <FiPhoneCall />
                      </div>
                      <h3 style={{ color: "#dc2626" }}>Emergency Contact</h3>
                    </div>
                  </div>
                  <div className="card-body-emergency">
                    <div className="emergency-details-wrapper">
                      <div className="grid-item">
                        <span className="item-label">Contact Name</span>
                        <span className="item-value bold">
                          {profileData?.emergencyContact?.contactName || "-"}
                        </span>
                      </div>
                      <div className="grid-item">
                        <span className="item-label">Relationship</span>
                        <span className="item-value">
                          {profileData?.emergencyContact?.relationship || "-"}
                        </span>
                      </div>
                      <div className="grid-item">
                        <span className="item-label">Phone Number</span>
                        <span className="item-value phone-highlight">
                          {profileData?.emergencyContact?.phone || "-"}
                        </span>
                      </div>
                      <div className="grid-item">
                        <span className="item-label">Alternate Number</span>
                        <span className="item-value">
                          {profileData?.emergencyContact?.alternatePhone || "-"}
                        </span>
                      </div>
                    </div>
                    <div className="emergency-card-right">
                      <button className="btn-soft-red" onClick={() => setShowEditEmergencyModal(true)}>
                        <FiEdit2 size={13} /> Edit Contact
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================= */}
          {/* VIEW 2: MY FAMILY */}
          {/* ========================================= */}
          {activeTab === "family" && (
            <div className="view-container family-view">
              <div className="page-header">
                <div className="header-titles">
                  <h1>My Family</h1>
                  <p className="breadcrumb-text">Dashboard / My Family</p>
                </div>
              </div>

              {/* FAMILY MEMBERS SECTION */}
              <div className="family-members-section">
                <div className="section-title-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3>
                    <FiUsers style={{ marginRight: 8, color: "#2563eb" }} /> Family Members ({familyMembers.length})
                  </h3>
                  <button className="btn-primary-blue" onClick={openAddMemberModal}>
                    <FiPlus size={16} /> Add Family Member
                  </button>
                </div>

                {familyMembers.length === 0 ? (
                  <div className="family-empty-state" style={{ textAlign: "center", padding: "40px 20px", background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                    <div className="family-empty-icon" style={{ fontSize: "48px", marginBottom: 12 }}>👨‍👩‍👧‍👦</div>
                    <h3 style={{ color: "#0f172a", fontSize: "18px", marginBottom: "6px" }}>No Family Members Added Yet</h3>
                    <p style={{ color: "#64748b", margin: 0, fontSize: "14px" }}>
                      Click "Add Family Member" above to manually register your family member's details.
                    </p>
                  </div>
                ) : (
                  <div className="family-cards-carousel">
                    {familyMembers.map((member) => {
                      const isSelected = activeMember && activeMember._id === member._id;
                      const memberPsi = calculateMemberPsi(member);
                      return (
                        <div
                          key={member._id}
                          className={`family-member-card ${isSelected ? "selected" : ""}`}
                          onClick={() => setSelectedMemberId(member._id)}
                        >
                          <button
                            className="member-menu-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditMemberModal(member);
                            }}
                            title="Edit Member"
                          >
                            <FiEdit2 size={15} />
                          </button>

                          <div className="member-card-avatar">
                            {member.profilePhoto ? (
                              <img src={member.profilePhoto} alt={member.name} />
                            ) : (
                              member.name ? member.name.charAt(0).toUpperCase() : "M"
                            )}
                          </div>

                          <h4 className="member-card-name">{member.name}</h4>
                          <span className="relationship-badge">{member.relationship}</span>

                          <div className="member-meta">
                            <span>Age: {member.age ? `${member.age} Yrs` : "N/A"}</span>
                            <span>{member.gender || "Male"}</span>
                          </div>

                          <div style={{ margin: "6px 0", fontSize: "11.5px" }}>
                            <span
                              style={{
                                padding: "3px 8px",
                                borderRadius: "12px",
                                fontWeight: "700",
                                background: memberPsi.psiScore > 75 ? "#dcfce7" : memberPsi.psiScore > 55 ? "#fef9c3" : "#fee2e2",
                                color: memberPsi.psiScore > 75 ? "#166534" : memberPsi.psiScore > 55 ? "#854d0e" : "#991b1b",
                              }}
                            >
                              PSI: {memberPsi.psiScore} ({memberPsi.psiRiskLevel})
                            </span>
                          </div>

                          <div className="member-card-buttons" style={{ display: "flex", gap: "4px", marginTop: "8px" }}>
                            <button
                              className="btn-card-action view"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMemberId(member._id);
                                setFamilyHealthTab("info");
                              }}
                              style={{ flex: 1 }}
                            >
                              <FiEye size={13} /> Details
                            </button>
                            <button
                              className="btn-card-action edit"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditMemberModal(member);
                              }}
                              style={{ flex: 1 }}
                            >
                              <FiEdit2 size={13} /> Edit
                            </button>
                            <button
                              className="btn-card-action delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMember(member._id, member.name);
                              }}
                              style={{ color: "#ef4444" }}
                              title="Delete Member"
                            >
                              <FiTrash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    <div className="family-member-card add-card" onClick={openAddMemberModal}>
                      <div className="add-icon-circle"><FiPlus size={24} /></div>
                      <h4>Add Member</h4>

                    </div>
                  </div>
                )}
              </div>

              {/* ACTIVE MEMBER HEALTH DETAILS INSPECTOR */}
              {activeMember && (
                <div className="health-details-card" style={{ marginTop: 24, background: "#ffffff", padding: 24, borderRadius: 16, border: "1px solid #e2e8f0" }}>
                  <div className="health-details-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #e2e8f0" }}>
                    <div className="active-member-identity" style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div className="small-avatar" style={{ width: 46, height: 46, borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: 18 }}>
                        {activeMember.profilePhoto ? (
                          <img src={activeMember.profilePhoto} alt={activeMember.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                        ) : (
                          activeMember.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h3 style={{ fontSize: 18, color: "#0f172a", margin: 0, fontWeight: 700 }}>
                          {activeMember.name}{" "}
                          <span style={{ fontSize: 13, color: "#2563eb", fontWeight: 600, background: "#eff6ff", padding: "2px 8px", borderRadius: 10 }}>
                            {activeMember.relationship}
                          </span>
                        </h3>
                        <span style={{ fontSize: 12, color: "#64748b" }}>
                          Age: {activeMember.age ? `${activeMember.age} Yrs` : "N/A"} | Gender: {activeMember.gender || "N/A"} | Blood Group: {activeMember.bloodGroup || "N/A"}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                      <button className="btn-primary-blue" onClick={() => openEditMemberModal(activeMember)}>
                        <FiEdit2 size={14} /> Edit Member
                      </button>
                      <button className="btn-soft-red" onClick={() => handleDeleteMember(activeMember._id, activeMember.name)} style={{ background: "#fee2e2", color: "#991b1b", border: "none", padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                        <FiTrash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>

                  {/* NAV TABS */}
                  <div className="member-details-nav" style={{ display: "flex", gap: 10, marginBottom: 20, borderBottom: "1px solid #e2e8f0", paddingBottom: 10, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className={`member-subtab ${familyHealthTab === "info" ? "active" : ""}`}
                      onClick={() => setFamilyHealthTab("info")}
                      style={{ border: "none", background: familyHealthTab === "info" ? "#2563eb" : "#f1f5f9", color: familyHealthTab === "info" ? "#ffffff" : "#475569", padding: "8px 16px", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}
                    >
                      Personal Information
                    </button>
                    <button
                      type="button"
                      className={`member-subtab ${familyHealthTab === "medical" ? "active" : ""}`}
                      onClick={() => setFamilyHealthTab("medical")}
                      style={{ border: "none", background: familyHealthTab === "medical" ? "#2563eb" : "#f1f5f9", color: familyHealthTab === "medical" ? "#ffffff" : "#475569", padding: "8px 16px", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}
                    >
                      Medical & Fitness
                    </button>
                    <button
                      type="button"
                      className={`member-subtab ${familyHealthTab === "measurements" ? "active" : ""}`}
                      onClick={() => setFamilyHealthTab("measurements")}
                      style={{ border: "none", background: familyHealthTab === "measurements" ? "#2563eb" : "#f1f5f9", color: familyHealthTab === "measurements" ? "#ffffff" : "#475569", padding: "8px 16px", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}
                    >
                      Health Measurements
                    </button>
                    <button
                      type="button"
                      className={`member-subtab ${familyHealthTab === "reports" ? "active" : ""}`}
                      onClick={() => setFamilyHealthTab("reports")}
                      style={{ border: "none", background: familyHealthTab === "reports" ? "#2563eb" : "#f1f5f9", color: familyHealthTab === "reports" ? "#ffffff" : "#475569", padding: "8px 16px", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}
                    >
                      Medical Reports ({(activeMember.reports || []).length})
                    </button>
                  </div>

                  {/* SUBTAB 1: PERSONAL INFORMATION */}
                  {familyHealthTab === "info" && (
                    <div className="member-panel-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                      <div className="info-box" style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                        <h4 style={{ color: "#0f172a", marginBottom: 12, fontSize: 15, fontWeight: 700 }}>Personal Information</h4>
                        <div style={{ display: "grid", gap: 8, fontSize: 13, color: "#334155" }}>
                          <div><strong>Full Name:</strong> {activeMember.name}</div>
                          <div><strong>Relationship:</strong> {activeMember.relationship}</div>
                          <div><strong>Date of Birth:</strong> {activeMember.dob || "Not entered"}</div>
                          <div><strong>Age:</strong> {activeMember.age ? `${activeMember.age} Yrs` : "Not entered"}</div>
                          <div><strong>Gender:</strong> {activeMember.gender || "Not entered"}</div>
                          <div><strong>Height:</strong> {activeMember.height ? `${activeMember.height} cm` : "Not entered"}</div>
                          <div><strong>Weight:</strong> {activeMember.weight ? `${activeMember.weight} kg` : "Not entered"}</div>
                          <div><strong>Blood Group:</strong> {activeMember.bloodGroup || "Not entered"}</div>
                          <div><strong>Nationality:</strong> {activeMember.nationality || "Not entered"}</div>
                          <div><strong>State / District:</strong> {activeMember.state ? `${activeMember.state}, ${activeMember.district || ""}` : "Not entered"}</div>
                          <div><strong>Address:</strong> {activeMember.address || "Not entered"}</div>
                          <div><strong>Phone Number:</strong> {activeMember.phone || "Not entered"}</div>
                        </div>
                      </div>

                      <div className="info-box" style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                        <h4 style={{ color: "#0f172a", marginBottom: 12, fontSize: 15, fontWeight: 700 }}>Independent PSI Risk Evaluation</h4>
                        {(() => {
                          const psi = calculateMemberPsi(activeMember);
                          return (
                            <div style={{ background: "#ffffff", padding: 14, borderRadius: 10, border: "1px solid #cbd5e1" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{psi.psiScore} / 100</span>
                                <span style={{ padding: "4px 10px", borderRadius: 12, fontWeight: 700, fontSize: 12, background: psi.psiScore > 75 ? "#dcfce7" : psi.psiScore > 55 ? "#fef9c3" : "#fee2e2", color: psi.psiScore > 75 ? "#166534" : psi.psiScore > 55 ? "#854d0e" : "#991b1b" }}>
                                  {psi.psiRiskLevel}
                                </span>
                              </div>
                              <p style={{ fontSize: 12, color: "#64748b", marginTop: 8, margin: "8px 0 0" }}>
                                Calculated independently using {activeMember.name}'s own age, medical conditions, and fitness parameters.
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* SUBTAB 2: MEDICAL & FITNESS */}
                  {familyHealthTab === "medical" && (
                    <div className="member-panel-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                      <div className="info-box" style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                        <h4 style={{ color: "#0f172a", marginBottom: 12, fontSize: 15, fontWeight: 700 }}>Medical Information</h4>
                        <div style={{ display: "grid", gap: 8, fontSize: 13, color: "#334155" }}>
                          <div><strong>Existing Medical Conditions:</strong> {activeMember.chronicConditions || (Array.isArray(activeMember.existingConditions) ? activeMember.existingConditions.join(", ") : "") || "None"}</div>
                          <div><strong>Current Medications:</strong> {activeMember.currentMedicines || "None"}</div>
                          <div><strong>Drug Allergies:</strong> {activeMember.drugAllergies || "None"}</div>
                          <div><strong>Food Allergies:</strong> {activeMember.foodAllergies || "None"}</div>
                          <div><strong>Other Allergies:</strong> {activeMember.allergies || "None"}</div>
                          <div><strong>Previous Surgeries:</strong> {activeMember.previousSurgeries || "None"}</div>
                          <div><strong>Mobility Limitations:</strong> {activeMember.mobilityLimitations || "None"}</div>
                          <div><strong>Smoking Status:</strong> {activeMember.smokingStatus || "Non-Smoker"}</div>
                          <div><strong>Alcohol Consumption:</strong> {activeMember.alcoholStatus || "Non-Drinker"}</div>
                        </div>
                      </div>

                      <div className="info-box" style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                        <h4 style={{ color: "#0f172a", marginBottom: 12, fontSize: 15, fontWeight: 700 }}>Fitness Information</h4>
                        <div style={{ display: "grid", gap: 8, fontSize: 13, color: "#334155" }}>
                          <div><strong>Physical Activity Level:</strong> {activeMember.activityLevel || "Not entered"}</div>
                          <div><strong>Walking Capacity:</strong> {activeMember.walkingCapacity || "Not entered"}</div>
                          <div><strong>Stair Climbing Ability:</strong> {activeMember.stairClimbing || "Not entered"}</div>
                          <div><strong>Uses Walking Stick / Wheelchair:</strong> {activeMember.usesAssistance || "No"}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUBTAB 3: HEALTH MEASUREMENTS */}
                  {familyHealthTab === "measurements" && (
                    <div className="info-box" style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                      <h4 style={{ color: "#0f172a", marginBottom: 12, fontSize: 15, fontWeight: 700 }}>Health Measurements (Vitals & Labs)</h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                        <div style={{ background: "#ffffff", padding: 14, borderRadius: 10, border: "1px solid #e2e8f0" }}>
                          <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", display: "block", fontWeight: 700 }}>Blood Pressure</span>
                          <span style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{activeMember.bloodPressure || "Not entered"}</span>
                        </div>
                        <div style={{ background: "#ffffff", padding: 14, borderRadius: 10, border: "1px solid #e2e8f0" }}>
                          <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", display: "block", fontWeight: 700 }}>Blood Sugar</span>
                          <span style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{activeMember.bloodSugar || "Not entered"}</span>
                        </div>
                        <div style={{ background: "#ffffff", padding: 14, borderRadius: 10, border: "1px solid #e2e8f0" }}>
                          <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", display: "block", fontWeight: 700 }}>Heart Rate</span>
                          <span style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{activeMember.heartRate || "Not entered"}</span>
                        </div>
                        <div style={{ background: "#ffffff", padding: 14, borderRadius: 10, border: "1px solid #e2e8f0" }}>
                          <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", display: "block", fontWeight: 700 }}>Oxygen Saturation (SpO2)</span>
                          <span style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{activeMember.spo2 || "Not entered"}</span>
                        </div>
                        <div style={{ background: "#ffffff", padding: 14, borderRadius: 10, border: "1px solid #e2e8f0" }}>
                          <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", display: "block", fontWeight: 700 }}>Hemoglobin Level</span>
                          <span style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{activeMember.hemoglobin || "Not entered"}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUBTAB 4: MEDICAL REPORTS */}
                  {familyHealthTab === "reports" && (
                    <div className="health-reports-right">
                      <div className="reports-section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                        <h4 style={{ color: "#0f172a", fontSize: 15, fontWeight: 700 }}>Uploaded Medical Reports</h4>
                        <button className="btn-primary-blue" onClick={() => setShowUploadReportModal(true)}>
                          <FiUpload size={14} /> Upload Report
                        </button>
                      </div>

                      <div className="reports-list">
                        {(activeMember.reports || []).length === 0 ? (
                          <p style={{ fontSize: "13px", color: "#64748b", padding: 14, background: "#f8fafc", borderRadius: 8 }}>
                            No medical reports uploaded for {activeMember.name} yet.
                          </p>
                        ) : (
                          activeMember.reports.map((rep, idx) => (
                            <div key={idx} className="report-item-card" style={{ display: "flex", justifyContent: "space-between", padding: 12, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", marginBottom: 8 }}>
                              <div className="report-file-info">
                                <span className="file-name" style={{ fontWeight: 600, color: "#0f172a", display: "block" }}>{rep.fileName}</span>
                                <span className="upload-meta" style={{ fontSize: 11, color: "#64748b" }}>Uploaded: {rep.uploadDate}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* EDIT USER PROFILE MODAL */}
      {showEditProfileModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3><FiUser /> Edit User Profile</h3>
              <button className="close-modal-btn" onClick={() => setShowEditProfileModal(false)}><FiX size={20} /></button>
            </div>
            <form onSubmit={handleSaveProfile}>
              <div className="modal-body">
                <div className="form-group" style={{ textAlign: "center", marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Profile Photo</label>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px" }}>
                    <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: "700", overflow: "hidden", border: "2px solid #3b82f6" }}>
                      {profileForm.avatar ? (
                        <img src={profileForm.avatar} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        userInitial
                      )}
                    </div>
                    <label className="btn-primary-blue" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px", fontSize: "13px" }}>
                      <FiCamera size={14} /> Change Photo
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleProfileImageUpload(e.target.files[0], false);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onFocus={() => setFocusedField("profile_name")}
                    onBlur={() => setFocusedField("")}
                    onChange={(e) => {
                      setProfileForm({ ...profileForm, name: e.target.value });
                      setProfileErrors(validateProfileForm({ ...profileForm, name: e.target.value }));
                    }}
                    className={profileErrors.name ? "invalid" : ""}
                  />
                  {(focusedField === "profile_name" || profileErrors.name) && profileErrors.name && (
                    <span className="field-error-msg">⚠️ {profileErrors.name}</span>
                  )}
                </div>

                <div className="form-row two-col">
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onFocus={() => setFocusedField("profile_phone")}
                      onBlur={() => setFocusedField("")}
                      onChange={(e) => {
                        setProfileForm({ ...profileForm, phone: e.target.value });
                        setProfileErrors(validateProfileForm({ ...profileForm, phone: e.target.value }));
                      }}
                      className={profileErrors.phone ? "invalid" : ""}
                    />
                    {(focusedField === "profile_phone" || profileErrors.phone) && profileErrors.phone && (
                      <span className="field-error-msg">⚠️ {profileErrors.phone}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Bangalore, India"
                      value={profileForm.location}
                      onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row three-col">
                  <div className="form-group">
                    <label>Age</label>
                    <input
                      type="number"
                      value={profileForm.age}
                      onFocus={() => setFocusedField("profile_age")}
                      onBlur={() => setFocusedField("")}
                      onChange={(e) => {
                        setProfileForm({ ...profileForm, age: e.target.value });
                        setProfileErrors(validateProfileForm({ ...profileForm, age: e.target.value }));
                      }}
                      className={profileErrors.age ? "invalid" : ""}
                    />
                    {(focusedField === "profile_age" || profileErrors.age) && profileErrors.age && (
                      <span className="field-error-msg">⚠️ {profileErrors.age}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Gender</label>
                    <select
                      value={profileForm.gender}
                      onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Blood Group</label>
                    <select
                      value={profileForm.bloodGroup}
                      onChange={(e) => setProfileForm({ ...profileForm, bloodGroup: e.target.value })}
                    >
                      <option value="">Select Blood Group</option>
                      {BLOOD_GROUPS.map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row two-col">
                  <div className="form-group">
                    <label>Height (cm)</label>
                    <input
                      type="number"
                      value={profileForm.height}
                      onFocus={() => setFocusedField("profile_height")}
                      onBlur={() => setFocusedField("")}
                      onChange={(e) => {
                        setProfileForm({ ...profileForm, height: e.target.value });
                        setProfileErrors(validateProfileForm({ ...profileForm, height: e.target.value }));
                      }}
                      className={profileErrors.height ? "invalid" : ""}
                    />
                    {(focusedField === "profile_height" || profileErrors.height) && profileErrors.height && (
                      <span className="field-error-msg">⚠️ {profileErrors.height}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Weight (kg)</label>
                    <input
                      type="number"
                      value={profileForm.weight}
                      onFocus={() => setFocusedField("profile_weight")}
                      onBlur={() => setFocusedField("")}
                      onChange={(e) => {
                        setProfileForm({ ...profileForm, weight: e.target.value });
                        setProfileErrors(validateProfileForm({ ...profileForm, weight: e.target.value }));
                      }}
                      className={profileErrors.weight ? "invalid" : ""}
                    />
                    {(focusedField === "profile_weight" || profileErrors.weight) && profileErrors.weight && (
                      <span className="field-error-msg">⚠️ {profileErrors.weight}</span>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Upload Profile Picture</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="file-input-control"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleProfileImageUpload(e.target.files[0], false);
                      }
                    }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowEditProfileModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={submitting}>
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT EMERGENCY CONTACT MODAL */}
      {showEditEmergencyModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header red-header">
              <h3><FiPhoneCall /> Edit Emergency Contact</h3>
              <button className="close-modal-btn" onClick={() => setShowEditEmergencyModal(false)}><FiX size={20} /></button>
            </div>
            <form onSubmit={handleSaveEmergencyContact}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Contact Name *</label>
                  <input
                    type="text"
                    value={emergencyForm.contactName}
                    onFocus={() => setFocusedField("em_name")}
                    onBlur={() => setFocusedField("")}
                    onChange={(e) => {
                      setEmergencyForm({ ...emergencyForm, contactName: e.target.value });
                      setEmergencyErrors(validateEmergencyForm({ ...emergencyForm, contactName: e.target.value }));
                    }}
                    className={emergencyErrors.contactName ? "invalid" : ""}
                  />
                  {(focusedField === "em_name" || emergencyErrors.contactName) && emergencyErrors.contactName && (
                    <span className="field-error-msg">⚠️ {emergencyErrors.contactName}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Relationship *</label>
                  <select
                    value={emergencyForm.relationship}
                    onFocus={() => setFocusedField("em_rel")}
                    onBlur={() => setFocusedField("")}
                    onChange={(e) => {
                      setEmergencyForm({ ...emergencyForm, relationship: e.target.value });
                      setEmergencyErrors(validateEmergencyForm({ ...emergencyForm, relationship: e.target.value }));
                    }}
                    className={emergencyErrors.relationship ? "invalid" : ""}
                  >
                    <option value="">Select Relationship</option>
                    {RELATIONSHIPS.map((rel) => (
                      <option key={rel} value={rel}>{rel}</option>
                    ))}
                  </select>
                  {(focusedField === "em_rel" || emergencyErrors.relationship) && emergencyErrors.relationship && (
                    <span className="field-error-msg">⚠️ {emergencyErrors.relationship}</span>
                  )}
                </div>

                <div className="form-row two-col">
                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input
                      type="text"
                      value={emergencyForm.phone}
                      onFocus={() => setFocusedField("em_phone")}
                      onBlur={() => setFocusedField("")}
                      onChange={(e) => {
                        setEmergencyForm({ ...emergencyForm, phone: e.target.value });
                        setEmergencyErrors(validateEmergencyForm({ ...emergencyForm, phone: e.target.value }));
                      }}
                      className={emergencyErrors.phone ? "invalid" : ""}
                    />
                    {(focusedField === "em_phone" || emergencyErrors.phone) && emergencyErrors.phone && (
                      <span className="field-error-msg">⚠️ {emergencyErrors.phone}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Alternate Number</label>
                    <input
                      type="text"
                      value={emergencyForm.alternatePhone}
                      onChange={(e) => setEmergencyForm({ ...emergencyForm, alternatePhone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowEditEmergencyModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save red" disabled={submitting}>
                  {submitting ? "Saving..." : "Update Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT HEALTH INFORMATION MODAL */}
      {showEditHealthModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header blue-header">
              <h3><FiHeart /> Edit Health Information</h3>
              <button className="close-modal-btn" onClick={() => setShowEditHealthModal(false)}><FiX size={20} /></button>
            </div>
            <form onSubmit={handleSaveHealthInfo}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Blood Group</label>
                  <select
                    value={healthForm.bloodGroup}
                    onChange={(e) => setHealthForm({ ...healthForm, bloodGroup: e.target.value })}
                  >
                    <option value="">Select Blood Group</option>
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Chronic Diseases</label>
                  <input
                    type="text"
                    placeholder="e.g. Diabetes, Hypertension (or None)"
                    value={healthForm.chronicDiseases}
                    onChange={(e) => setHealthForm({ ...healthForm, chronicDiseases: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Allergies</label>
                  <input
                    type="text"
                    placeholder="e.g. Dust, Pollen, Peanuts (or None)"
                    value={healthForm.allergies}
                    onChange={(e) => setHealthForm({ ...healthForm, allergies: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Current Medicines</label>
                  <input
                    type="text"
                    placeholder="e.g. Amlodipine, Metformin (or None)"
                    value={healthForm.currentMedicines}
                    onChange={(e) => setHealthForm({ ...healthForm, currentMedicines: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Fitness Level</label>
                  <select
                    value={healthForm.fitnessLevel}
                    onChange={(e) => setHealthForm({ ...healthForm, fitnessLevel: e.target.value })}
                  >
                    <option value="">Select Fitness Level</option>
                    <option value="Low">Low</option>
                    <option value="Moderate">Moderate</option>
                    <option value="High">High</option>
                    <option value="Athlete">Athlete</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowEditHealthModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={submitting}>
                  {submitting ? "Saving..." : "Save Health Info"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PILGRIMAGE PREFERENCES MODAL */}
      {showEditPreferencesModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header purple-header">
              <h3><FiCompass /> Edit Pilgrimage Preferences</h3>
              <button className="close-modal-btn" onClick={() => setShowEditPreferencesModal(false)}><FiX size={20} /></button>
            </div>
            <form onSubmit={handleSavePreferences}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Preferred Religion</label>
                  <select
                    value={preferencesForm.preferredReligion}
                    onChange={(e) => setPreferencesForm({ ...preferencesForm, preferredReligion: e.target.value })}
                  >
                    <option value="">Select Religion</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Christian">Christian</option>
                    <option value="Islam">Islam</option>
                    <option value="Sikh">Sikh</option>
                    <option value="Buddhist">Buddhist</option>
                    <option value="Jain">Jain</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Preferred Language</label>
                  <select
                    value={preferencesForm.preferredLanguage}
                    onChange={(e) => setPreferencesForm({ ...preferencesForm, preferredLanguage: e.target.value })}
                  >
                    <option value="">Select Language</option>
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Malayalam">Malayalam</option>
                    <option value="Tamil">Tamil</option>
                    <option value="Telugu">Telugu</option>
                    <option value="Kannada">Kannada</option>
                    <option value="Bengali">Bengali</option>
                    <option value="Marathi">Marathi</option>
                    <option value="Gujarati">Gujarati</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Preferred Climate</label>
                  <select
                    value={preferencesForm.preferredClimate}
                    onChange={(e) => setPreferencesForm({ ...preferencesForm, preferredClimate: e.target.value })}
                  >
                    <option value="">Select Climate</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Warm">Warm</option>
                    <option value="Cold">Cold</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Travel Frequency</label>
                  <select
                    value={preferencesForm.travelFrequency}
                    onChange={(e) => setPreferencesForm({ ...preferencesForm, travelFrequency: e.target.value })}
                  >
                    <option value="">Select Frequency</option>
                    <option value="First Time">First Time</option>
                    <option value="Occasional">Occasional</option>
                    <option value="Frequent">Frequent</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowEditPreferencesModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={submitting}>
                  {submitting ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD REPORT MODAL */}
      {showUploadReportModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3><FiUpload /> Upload Medical Report</h3>
              <button className="close-modal-btn" onClick={() => setShowUploadReportModal(false)}><FiX size={20} /></button>
            </div>
            <form onSubmit={handleAddReportSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Choose File (PDF, PNG, JPG, JPEG) <span className="req">*</span></label>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    required
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        const allowedExts = ["pdf", "png", "jpg", "jpeg", "webp"];
                        const ext = file.name.split(".").pop().toLowerCase();
                        if (!allowedExts.includes(ext)) {
                          showAlert("error", "Invalid file format. Only PDF, PNG, JPG, JPEG, and WEBP files are allowed.");
                          e.target.value = "";
                          return;
                        }
                        setReportFile(file);
                        setReportForm((prev) => ({
                          ...prev,
                          fileName: prev.fileName || file.name.replace(/\.[^/.]+$/, ""),
                          fileType: ext === "pdf" ? "pdf" : "jpg"
                        }));
                      }
                    }}
                    style={{ padding: "8px", border: "1px solid #cbd5e1", borderRadius: "8px", width: "100%", background: "#f8fafc" }}
                  />
                  {reportFile && (
                    <span style={{ fontSize: "12.5px", color: "#166534", fontWeight: "700", marginTop: "6px", display: "block" }}>
                      📄 Selected: {reportFile.name} ({(reportFile.size / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label>Report File Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Blood_Test_Report"
                    value={reportForm.fileName}
                    onChange={(e) => setReportForm({ ...reportForm, fileName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>File Format</label>
                  <select
                    value={reportForm.fileType}
                    onChange={(e) => setReportForm({ ...reportForm, fileType: e.target.value })}
                  >
                    <option value="pdf">PDF Document (.pdf)</option>
                    <option value="jpg">Image (.jpg / .png / .jpeg)</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowUploadReportModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={submitting}>
                  {submitting ? "Uploading..." : "Upload Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PSI MODAL */}
      {showPsiModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3><FiShield /> Pilgrim Safety Index (PSI)</h3>
              <button className="close-modal-btn" onClick={() => setShowPsiModal(false)}><FiX size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="psi-breakdown-card">
                <div className="score-header">
                  <span className="big-score">{profileData?.psiScore || 100} / 100</span>
                  <span className="risk-level-badge">{profileData?.psiRiskLevel || "Low Risk"}</span>
                </div>
                <p className="psi-desc">
                  The Pilgrim Safety Index is computed in real-time based on your profile and health metrics.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-save" onClick={() => setShowPsiModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT FAMILY MEMBER MODAL (4 SECTIONS - 100% MANUAL ENTRY) */}
      {showMemberModal && (
        <div className="modal-backdrop">
          <div className="modal-box large-modal">
            <div className="modal-header purple-header">
              <h3>
                <FiUsers /> {editingMemberId ? "Edit Family Member Profile" : "Add Family Member"}
              </h3>
              <button className="close-modal-btn" onClick={() => setShowMemberModal(false)}>
                <FiX size={20} />
              </button>
            </div>

            <div className="stepper-tabs-header">
              <button
                type="button"
                className={`stepper-tab-btn ${memberFormTab === "personal" ? "active" : ""}`}
                onClick={() => setMemberFormTab("personal")}
              >
                1. Personal Info
              </button>
              <button
                type="button"
                className={`stepper-tab-btn ${memberFormTab === "medical" ? "active" : ""}`}
                onClick={() => setMemberFormTab("medical")}
              >
                2. Medical Info
              </button>
              <button
                type="button"
                className={`stepper-tab-btn ${memberFormTab === "measurements" ? "active" : ""}`}
                onClick={() => setMemberFormTab("measurements")}
              >
                3. Health Measurements
              </button>
              <button
                type="button"
                className={`stepper-tab-btn ${memberFormTab === "fitness" ? "active" : ""}`}
                onClick={() => setMemberFormTab("fitness")}
              >
                4. Fitness Info
              </button>
            </div>

            <form onSubmit={handleMemberFormSubmit}>
              <div className="modal-body">
                {/* TAB 1: PERSONAL INFORMATION */}
                {memberFormTab === "personal" && (
                  <div className="wizard-step-panel">
                    <h4 className="wizard-section-title">Personal Information</h4>
                    <br></br>

                    <div className="form-group" style={{ textAlign: "center", marginBottom: "20px" }}>
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Family Member Profile Photo</label>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px" }}>
                        <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#8b5cf6", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: "700", overflow: "hidden", border: "2px solid #a855f7" }}>
                          {memberForm.profilePhoto ? (
                            <img src={memberForm.profilePhoto} alt="Member Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            memberForm.name ? memberForm.name.charAt(0).toUpperCase() : "M"
                          )}
                        </div>
                        <label className="btn-primary-blue" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px", fontSize: "13px", background: "#8b5cf6" }}>
                          <FiCamera size={14} /> Upload Photo
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp"
                            style={{ display: "none" }}
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
                                const ext = file.name.split(".").pop().toLowerCase();
                                const validExts = ["png", "jpg", "jpeg", "webp"];

                                if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
                                  showAlert("error", "Invalid photo format. Only PNG, JPG, JPEG, and WEBP image files are allowed.");
                                  return;
                                }

                                handleProfileImageUpload(file, true);
                              }
                            }}
                          />
                        </label>
                      </div>
                      <span style={{ fontSize: "11.5px", color: "#64748b", marginTop: "6px", display: "block" }}>
                        Allowed Formats: PNG, JPG, JPEG, WEBP (Max 10MB)
                      </span>
                    </div>

                    <div className="form-row two-col">
                      <div className="form-group">
                        <label>Full Name <span className="req">*</span></label>
                        <input
                          type="text"
                          placeholder="e.g. Rahul Sharma"
                          value={memberForm.name}
                          onFocus={() => handleMemberFieldFocus("name", memberForm.name)}
                          onBlur={() => handleMemberFieldBlur("name", memberForm.name)}
                          onChange={(e) => handleMemberFieldChange("name", e.target.value)}
                          className={memberErrors.name && (touchedMemberFields.name || focusedMemberField === "name") ? "invalid" : ""}
                        />
                        {memberErrors.name && (touchedMemberFields.name || focusedMemberField === "name") && (
                          <span className="field-error-msg">⚠️ {memberErrors.name}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Relationship to Main User <span className="req">*</span></label>
                        <select
                          value={memberForm.relationship}
                          onFocus={() => handleMemberFieldFocus("relationship", memberForm.relationship)}
                          onBlur={() => handleMemberFieldBlur("relationship", memberForm.relationship)}
                          onChange={(e) => handleMemberFieldChange("relationship", e.target.value)}
                          className={memberErrors.relationship && (touchedMemberFields.relationship || focusedMemberField === "relationship") ? "invalid" : ""}
                        >
                          <option value="">Select Relationship</option>
                          {RELATIONSHIPS.map((rel) => (
                            <option key={rel} value={rel}>{rel}</option>
                          ))}
                        </select>
                        {memberErrors.relationship && (touchedMemberFields.relationship || focusedMemberField === "relationship") && (
                          <span className="field-error-msg">⚠️ {memberErrors.relationship}</span>
                        )}
                      </div>
                    </div>

                    <div className="form-row three-col">
                      <div className="form-group">
                        <label>Date of Birth</label>
                        <input
                          type="date"
                          value={memberForm.dob}
                          onFocus={() => handleMemberFieldFocus("dob", memberForm.dob)}
                          onBlur={() => handleMemberFieldBlur("dob", memberForm.dob)}
                          onChange={(e) => handleMemberDobChange(e.target.value)}
                          className={memberErrors.dob && (touchedMemberFields.dob || focusedMemberField === "dob") ? "invalid" : ""}
                        />
                        {memberErrors.dob && (touchedMemberFields.dob || focusedMemberField === "dob") && (
                          <span className="field-error-msg">⚠️ {memberErrors.dob}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Age (Years) {memberForm.dob && "(Auto-calculated)"}</label>
                        <input
                          type="number"
                          placeholder="e.g. 28"
                          value={memberForm.age}
                          onFocus={() => handleMemberFieldFocus("age", memberForm.age)}
                          onBlur={() => handleMemberFieldBlur("age", memberForm.age)}
                          onChange={(e) => handleMemberFieldChange("age", e.target.value)}
                          className={memberErrors.age && (touchedMemberFields.age || focusedMemberField === "age") ? "invalid" : ""}
                        />
                        {memberErrors.age && (touchedMemberFields.age || focusedMemberField === "age") && (
                          <span className="field-error-msg">⚠️ {memberErrors.age}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Gender</label>
                        <select
                          value={memberForm.gender}
                          onChange={(e) => setMemberForm({ ...memberForm, gender: e.target.value })}
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row three-col">
                      <div className="form-group">
                        <label>Height (cm)</label>
                        <input
                          type="number"
                          placeholder="e.g. 168"
                          value={memberForm.height}
                          onFocus={() => handleMemberFieldFocus("height", memberForm.height)}
                          onBlur={() => handleMemberFieldBlur("height", memberForm.height)}
                          onChange={(e) => handleMemberFieldChange("height", e.target.value)}
                          className={memberErrors.height && (touchedMemberFields.height || focusedMemberField === "height") ? "invalid" : ""}
                        />
                        {memberErrors.height && (touchedMemberFields.height || focusedMemberField === "height") && (
                          <span className="field-error-msg">⚠️ {memberErrors.height}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Weight (kg)</label>
                        <input
                          type="number"
                          placeholder="e.g. 65"
                          value={memberForm.weight}
                          onFocus={() => handleMemberFieldFocus("weight", memberForm.weight)}
                          onBlur={() => handleMemberFieldBlur("weight", memberForm.weight)}
                          onChange={(e) => handleMemberFieldChange("weight", e.target.value)}
                          className={memberErrors.weight && (touchedMemberFields.weight || focusedMemberField === "weight") ? "invalid" : ""}
                        />
                        {memberErrors.weight && (touchedMemberFields.weight || focusedMemberField === "weight") && (
                          <span className="field-error-msg">⚠️ {memberErrors.weight}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Blood Group</label>
                        <select
                          value={memberForm.bloodGroup}
                          onChange={(e) => setMemberForm({ ...memberForm, bloodGroup: e.target.value })}
                        >
                          <option value="">Select Blood Group</option>
                          {BLOOD_GROUPS.map((bg) => (
                            <option key={bg} value={bg}>{bg}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-row three-col">
                      <div className="form-group">
                        <label>Nationality <span className="req">*</span></label>
                        <select
                          value={memberForm.nationality}
                          onFocus={() => handleMemberFieldFocus("nationality", memberForm.nationality)}
                          onBlur={() => handleMemberFieldBlur("nationality", memberForm.nationality)}
                          onChange={(e) => handleMemberNationalitySelect(e.target.value)}
                          className={memberErrors.nationality && (touchedMemberFields.nationality || focusedMemberField === "nationality") ? "invalid" : ""}
                        >
                          <option value="">Select Nationality</option>
                          {NATIONALITIES.map((nat) => (
                            <option key={nat} value={nat}>{nat}</option>
                          ))}
                        </select>
                        {memberErrors.nationality && (touchedMemberFields.nationality || focusedMemberField === "nationality") && (
                          <span className="field-error-msg">⚠️ {memberErrors.nationality}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>State <span className="req">*</span></label>
                        <select
                          value={memberForm.state}
                          disabled={!memberForm.nationality}
                          onFocus={() => handleMemberFieldFocus("state", memberForm.state)}
                          onBlur={() => handleMemberFieldBlur("state", memberForm.state)}
                          onChange={(e) => handleMemberStateSelect(e.target.value)}
                          className={memberErrors.state && (touchedMemberFields.state || focusedMemberField === "state") ? "invalid" : ""}
                        >
                          <option value="">
                            {!memberForm.nationality
                              ? "Select Nationality First"
                              : "Select State"}
                          </option>
                          {memberAvailableStates.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                        {memberErrors.state && (touchedMemberFields.state || focusedMemberField === "state") && (
                          <span className="field-error-msg">⚠️ {memberErrors.state}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>District <span className="req">*</span></label>
                        <select
                          value={memberForm.district}
                          disabled={!memberForm.state}
                          onFocus={() => handleMemberFieldFocus("district", memberForm.district)}
                          onBlur={() => handleMemberFieldBlur("district", memberForm.district)}
                          onChange={(e) => handleMemberFieldChange("district", e.target.value)}
                          className={memberErrors.district && (touchedMemberFields.district || focusedMemberField === "district") ? "invalid" : ""}
                        >
                          <option value="">
                            {!memberForm.state
                              ? "Select State First"
                              : "Select District"}
                          </option>
                          {memberAvailableDistricts.map((dist) => (
                            <option key={dist} value={dist}>{dist}</option>
                          ))}
                        </select>
                        {memberErrors.district && (touchedMemberFields.district || focusedMemberField === "district") && (
                          <span className="field-error-msg">⚠️ {memberErrors.district}</span>
                        )}
                      </div>
                    </div>

                    <div className="form-row two-col">
                      <div className="form-group">
                        <label>Address <span className="req">*</span></label>
                        <input
                          type="text"
                          placeholder="House / Street Name, City, Pincode"
                          value={memberForm.address}
                          onFocus={() => handleMemberFieldFocus("address", memberForm.address)}
                          onBlur={() => handleMemberFieldBlur("address", memberForm.address)}
                          onChange={(e) => handleMemberFieldChange("address", e.target.value)}
                          className={memberErrors.address && (touchedMemberFields.address || focusedMemberField === "address") ? "invalid" : ""}
                        />
                        {memberErrors.address && (touchedMemberFields.address || focusedMemberField === "address") && (
                          <span className="field-error-msg">⚠️ {memberErrors.address}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Phone Number</label>
                        <input
                          type="text"
                          placeholder="10-digit phone"
                          value={memberForm.phone}
                          onFocus={() => handleMemberFieldFocus("phone", memberForm.phone)}
                          onBlur={() => handleMemberFieldBlur("phone", memberForm.phone)}
                          onChange={(e) => handleMemberFieldChange("phone", e.target.value)}
                          className={memberErrors.phone && (touchedMemberFields.phone || focusedMemberField === "phone") ? "invalid" : ""}
                        />
                        {memberErrors.phone && (touchedMemberFields.phone || focusedMemberField === "phone") && (
                          <span className="field-error-msg">⚠️ {memberErrors.phone}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: MEDICAL INFORMATION */}
                {memberFormTab === "medical" && (
                  <div className="wizard-step-panel">
                    <h4 className="wizard-section-title">Medical Information</h4>
                    <br></br>
                    <div className="form-group">
                      <label>Existing Medical Conditions</label>
                      <input
                        type="text"
                        placeholder="e.g. Diabetes, Asthma, Hypertension, None"
                        value={memberForm.chronicConditions}
                        onFocus={() => handleMemberFieldFocus("chronicConditions", memberForm.chronicConditions)}
                        onBlur={() => handleMemberFieldBlur("chronicConditions", memberForm.chronicConditions)}
                        onChange={(e) => handleMemberFieldChange("chronicConditions", e.target.value)}
                        className={memberErrors.chronicConditions && (touchedMemberFields.chronicConditions || focusedMemberField === "chronicConditions") ? "invalid" : ""}
                      />
                      {memberErrors.chronicConditions && (touchedMemberFields.chronicConditions || focusedMemberField === "chronicConditions") && (
                        <span className="field-error-msg">⚠️ {memberErrors.chronicConditions}</span>
                      )}
                    </div>

                    <div className="form-row two-col">
                      <div className="form-group">
                        <label>Current Medications</label>
                        <input
                          type="text"
                          placeholder="e.g. Metformin 500mg, Inhaler, None"
                          value={memberForm.currentMedicines}
                          onFocus={() => handleMemberFieldFocus("currentMedicines", memberForm.currentMedicines)}
                          onBlur={() => handleMemberFieldBlur("currentMedicines", memberForm.currentMedicines)}
                          onChange={(e) => handleMemberFieldChange("currentMedicines", e.target.value)}
                          className={memberErrors.currentMedicines && (touchedMemberFields.currentMedicines || focusedMemberField === "currentMedicines") ? "invalid" : ""}
                        />
                        {memberErrors.currentMedicines && (touchedMemberFields.currentMedicines || focusedMemberField === "currentMedicines") && (
                          <span className="field-error-msg">⚠️ {memberErrors.currentMedicines}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Drug Allergies</label>
                        <input
                          type="text"
                          placeholder="e.g. Penicillin, Sulfa, None"
                          value={memberForm.drugAllergies}
                          onFocus={() => handleMemberFieldFocus("drugAllergies", memberForm.drugAllergies)}
                          onBlur={() => handleMemberFieldBlur("drugAllergies", memberForm.drugAllergies)}
                          onChange={(e) => handleMemberFieldChange("drugAllergies", e.target.value)}
                          className={memberErrors.drugAllergies && (touchedMemberFields.drugAllergies || focusedMemberField === "drugAllergies") ? "invalid" : ""}
                        />
                        {memberErrors.drugAllergies && (touchedMemberFields.drugAllergies || focusedMemberField === "drugAllergies") && (
                          <span className="field-error-msg">⚠️ {memberErrors.drugAllergies}</span>
                        )}
                      </div>
                    </div>

                    <div className="form-row two-col">
                      <div className="form-group">
                        <label>Food Allergies</label>
                        <input
                          type="text"
                          placeholder="e.g. Peanuts, Gluten, None"
                          value={memberForm.foodAllergies}
                          onFocus={() => handleMemberFieldFocus("foodAllergies", memberForm.foodAllergies)}
                          onBlur={() => handleMemberFieldBlur("foodAllergies", memberForm.foodAllergies)}
                          onChange={(e) => handleMemberFieldChange("foodAllergies", e.target.value)}
                          className={memberErrors.foodAllergies && (touchedMemberFields.foodAllergies || focusedMemberField === "foodAllergies") ? "invalid" : ""}
                        />
                        {memberErrors.foodAllergies && (touchedMemberFields.foodAllergies || focusedMemberField === "foodAllergies") && (
                          <span className="field-error-msg">⚠️ {memberErrors.foodAllergies}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Previous Surgeries</label>
                        <input
                          type="text"
                          placeholder="e.g. Appendectomy 2020, None"
                          value={memberForm.previousSurgeries}
                          onFocus={() => handleMemberFieldFocus("previousSurgeries", memberForm.previousSurgeries)}
                          onBlur={() => handleMemberFieldBlur("previousSurgeries", memberForm.previousSurgeries)}
                          onChange={(e) => handleMemberFieldChange("previousSurgeries", e.target.value)}
                          className={memberErrors.previousSurgeries && (touchedMemberFields.previousSurgeries || focusedMemberField === "previousSurgeries") ? "invalid" : ""}
                        />
                        {memberErrors.previousSurgeries && (touchedMemberFields.previousSurgeries || focusedMemberField === "previousSurgeries") && (
                          <span className="field-error-msg">⚠️ {memberErrors.previousSurgeries}</span>
                        )}
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Mobility Limitations</label>
                      <input
                        type="text"
                        placeholder="e.g. Knee Pain, Cannot Walk Long Distances, None"
                        value={memberForm.mobilityLimitations}
                        onFocus={() => handleMemberFieldFocus("mobilityLimitations", memberForm.mobilityLimitations)}
                        onBlur={() => handleMemberFieldBlur("mobilityLimitations", memberForm.mobilityLimitations)}
                        onChange={(e) => handleMemberFieldChange("mobilityLimitations", e.target.value)}
                        className={memberErrors.mobilityLimitations && (touchedMemberFields.mobilityLimitations || focusedMemberField === "mobilityLimitations") ? "invalid" : ""}
                      />
                      {memberErrors.mobilityLimitations && (touchedMemberFields.mobilityLimitations || focusedMemberField === "mobilityLimitations") && (
                        <span className="field-error-msg">⚠️ {memberErrors.mobilityLimitations}</span>
                      )}
                    </div>

                    <div className="form-row two-col">
                      <div className="form-group">
                        <label>Smoking Status</label>
                        <select
                          value={memberForm.smokingStatus}
                          onChange={(e) => setMemberForm({ ...memberForm, smokingStatus: e.target.value })}
                        >
                          <option value="">Select Smoking Status</option>
                          <option value="Non-Smoker">Non-Smoker</option>
                          <option value="Smoker">Smoker</option>
                          <option value="Former Smoker">Former Smoker</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Alcohol Consumption</label>
                        <select
                          value={memberForm.alcoholStatus}
                          onChange={(e) => setMemberForm({ ...memberForm, alcoholStatus: e.target.value })}
                        >
                          <option value="">Select Alcohol Consumption</option>
                          <option value="Non-Drinker">Non-Drinker</option>
                          <option value="Occasional">Occasional</option>
                          <option value="Regular">Regular</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: HEALTH MEASUREMENTS */}
                {memberFormTab === "measurements" && (
                  <div className="wizard-step-panel">
                    <h4 className="wizard-section-title">Health Measurements (Optional)</h4>
                    <br></br>
                    <div className="form-row two-col">
                      <div className="form-group">
                        <label>Blood Pressure (mmHg)</label>
                        <input
                          type="text"
                          placeholder="e.g. 120/80"
                          value={memberForm.bloodPressure}
                          onFocus={() => handleMemberFieldFocus("bloodPressure", memberForm.bloodPressure)}
                          onBlur={() => handleMemberFieldBlur("bloodPressure", memberForm.bloodPressure)}
                          onChange={(e) => handleMemberFieldChange("bloodPressure", e.target.value)}
                          className={memberErrors.bloodPressure && (touchedMemberFields.bloodPressure || focusedMemberField === "bloodPressure") ? "invalid" : ""}
                        />
                        {memberErrors.bloodPressure && (touchedMemberFields.bloodPressure || focusedMemberField === "bloodPressure") && (
                          <span className="field-error-msg">⚠️ {memberErrors.bloodPressure}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Blood Sugar (mg/dL)</label>
                        <input
                          type="text"
                          placeholder="e.g. 95"
                          value={memberForm.bloodSugar}
                          onFocus={() => handleMemberFieldFocus("bloodSugar", memberForm.bloodSugar)}
                          onBlur={() => handleMemberFieldBlur("bloodSugar", memberForm.bloodSugar)}
                          onChange={(e) => handleMemberFieldChange("bloodSugar", e.target.value)}
                          className={memberErrors.bloodSugar && (touchedMemberFields.bloodSugar || focusedMemberField === "bloodSugar") ? "invalid" : ""}
                        />
                        {memberErrors.bloodSugar && (touchedMemberFields.bloodSugar || focusedMemberField === "bloodSugar") && (
                          <span className="field-error-msg">⚠️ {memberErrors.bloodSugar}</span>
                        )}
                      </div>
                    </div>

                    <div className="form-row three-col">
                      <div className="form-group">
                        <label>Heart Rate (bpm)</label>
                        <input
                          type="text"
                          placeholder="e.g. 72"
                          value={memberForm.heartRate}
                          onFocus={() => handleMemberFieldFocus("heartRate", memberForm.heartRate)}
                          onBlur={() => handleMemberFieldBlur("heartRate", memberForm.heartRate)}
                          onChange={(e) => handleMemberFieldChange("heartRate", e.target.value)}
                          className={memberErrors.heartRate && (touchedMemberFields.heartRate || focusedMemberField === "heartRate") ? "invalid" : ""}
                        />
                        {memberErrors.heartRate && (touchedMemberFields.heartRate || focusedMemberField === "heartRate") && (
                          <span className="field-error-msg">⚠️ {memberErrors.heartRate}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Oxygen Saturation (SpO2 %)</label>
                        <input
                          type="text"
                          placeholder="e.g. 98%"
                          value={memberForm.spo2}
                          onFocus={() => handleMemberFieldFocus("spo2", memberForm.spo2)}
                          onBlur={() => handleMemberFieldBlur("spo2", memberForm.spo2)}
                          onChange={(e) => handleMemberFieldChange("spo2", e.target.value)}
                          className={memberErrors.spo2 && (touchedMemberFields.spo2 || focusedMemberField === "spo2") ? "invalid" : ""}
                        />
                        {memberErrors.spo2 && (touchedMemberFields.spo2 || focusedMemberField === "spo2") && (
                          <span className="field-error-msg">⚠️ {memberErrors.spo2}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Hemoglobin Level (g/dL)</label>
                        <input
                          type="text"
                          placeholder="e.g. 13.5"
                          value={memberForm.hemoglobin}
                          onFocus={() => handleMemberFieldFocus("hemoglobin", memberForm.hemoglobin)}
                          onBlur={() => handleMemberFieldBlur("hemoglobin", memberForm.hemoglobin)}
                          onChange={(e) => handleMemberFieldChange("hemoglobin", e.target.value)}
                          className={memberErrors.hemoglobin && (touchedMemberFields.hemoglobin || focusedMemberField === "hemoglobin") ? "invalid" : ""}
                        />
                        {memberErrors.hemoglobin && (touchedMemberFields.hemoglobin || focusedMemberField === "hemoglobin") && (
                          <span className="field-error-msg">⚠️ {memberErrors.hemoglobin}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: FITNESS INFORMATION */}
                {memberFormTab === "fitness" && (
                  <div className="wizard-step-panel">
                    <h4 className="wizard-section-title">Fitness Information</h4>
                    <br></br>
                    <div className="form-row two-col">
                      <div className="form-group">
                        <label>Physical Activity Level</label>
                        <select
                          value={memberForm.activityLevel}
                          onChange={(e) => setMemberForm({ ...memberForm, activityLevel: e.target.value })}
                        >
                          <option value="">Select Activity Level</option>
                          <option value="Sedentary">Sedentary (Little/No exercise)</option>
                          <option value="Lightly Active">Lightly Active (Light walk)</option>
                          <option value="Moderately Active">Moderately Active (Regular exercise)</option>
                          <option value="Very Active">Very Active (High endurance)</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Walking Capacity</label>
                        <select
                          value={memberForm.walkingCapacity}
                          onChange={(e) => setMemberForm({ ...memberForm, walkingCapacity: e.target.value })}
                        >
                          <option value="">Select Walking Capacity</option>
                          <option value="< 500m">&lt; 500 meters</option>
                          <option value="1km">Up to 1 km</option>
                          <option value="2km">Up to 2 km</option>
                          <option value="5km+">5+ km continuous walk</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row two-col">
                      <div className="form-group">
                        <label>Stair Climbing Ability</label>
                        <select
                          value={memberForm.stairClimbing}
                          onChange={(e) => setMemberForm({ ...memberForm, stairClimbing: e.target.value })}
                        >
                          <option value="">Select Ability</option>
                          <option value="Normal">Normal (Can climb 2+ floors easily)</option>
                          <option value="With Difficulty">With Difficulty (Needs breaks)</option>
                          <option value="Unable">Unable / Needs assistance</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Uses Walking Stick / Wheelchair</label>
                        <select
                          value={memberForm.usesAssistance}
                          onChange={(e) => setMemberForm({ ...memberForm, usesAssistance: e.target.value })}
                        >
                          <option value="">Select Assistance Required</option>
                          <option value="No">No (Unassisted)</option>
                          <option value="Walking Stick">Walking Stick</option>
                          <option value="Wheelchair">Wheelchair</option>
                          <option value="Walker">Walker</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <div className="footer-left-actions">
                  {memberFormTab !== "personal" && (
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => {
                        const tabs = ["personal", "medical", "measurements", "fitness"];
                        const idx = tabs.indexOf(memberFormTab);
                        if (idx > 0) setMemberFormTab(tabs[idx - 1]);
                      }}
                    >
                      &larr; Back
                    </button>
                  )}
                </div>

                <div className="footer-right-actions" style={{ display: "flex", gap: 10 }}>
                  {memberFormTab !== "fitness" ? (
                    <button
                      type="button"
                      className="btn-save"
                      onClick={() => {
                        const tabs = ["personal", "medical", "measurements", "fitness"];
                        const idx = tabs.indexOf(memberFormTab);
                        if (idx < tabs.length - 1) setMemberFormTab(tabs[idx + 1]);
                      }}
                    >
                      Next Step &rarr;
                    </button>
                  ) : (
                    <button type="submit" className="btn-save" disabled={submitting}>
                      {submitting ? "Saving..." : (editingMemberId ? "Update Member" : "Save Family Member")}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL USER PROFILE COMPLETION MODULE MODAL (7 SECTIONS) */}
      {showCompleteProfileModal && (
        <div className="modal-backdrop">
          <div className="modal-box large-modal">
            <div className="modal-header blue-header">
              <h3><FiShield /> Complete Your PilgrimIQ Profile</h3>
              <button className="close-modal-btn" onClick={() => setShowCompleteProfileModal(false)}><FiX size={20} /></button>
            </div>

            <div className="stepper-tabs-header">
              <button
                type="button"
                className={`stepper-tab-btn ${profileWizardStep === 1 ? "active" : ""}`}
                onClick={() => setProfileWizardStep(1)}
              >
                1. Personal Info
              </button>
              <button
                type="button"
                className={`stepper-tab-btn ${profileWizardStep === 2 ? "active" : ""}`}
                onClick={() => setProfileWizardStep(2)}
              >
                2. Emergency Contact
              </button>
              <button
                type="button"
                className={`stepper-tab-btn ${profileWizardStep === 3 ? "active" : ""}`}
                onClick={() => setProfileWizardStep(3)}
              >
                3. Medical Info
              </button>
              <button
                type="button"
                className={`stepper-tab-btn ${profileWizardStep === 4 ? "active" : ""}`}
                onClick={() => setProfileWizardStep(4)}
              >
                4. Health Measurements
              </button>
              <button
                type="button"
                className={`stepper-tab-btn ${profileWizardStep === 5 ? "active" : ""}`}
                onClick={() => setProfileWizardStep(5)}
              >
                5. Fitness Info
              </button>
              <button
                type="button"
                className={`stepper-tab-btn ${profileWizardStep === 6 ? "active" : ""}`}
                onClick={() => setProfileWizardStep(6)}
              >
                6. Medical Reports
              </button>
              <button
                type="button"
                className={`stepper-tab-btn ${profileWizardStep === 7 ? "active" : ""}`}
                onClick={() => setProfileWizardStep(7)}
              >
                7. Consent & Submit
              </button>
            </div>

            <form onSubmit={handleSaveFullProfile}>
              <div className="modal-body wizard-body">
                {/* SECTION 1: PERSONAL INFORMATION */}
                {profileWizardStep === 1 && (
                  <div className="wizard-step-panel">
                    <div className="form-row two-col">
                      <div className="form-group">
                        <label>Date of Birth *</label>
                        <input
                          type="date"
                          value={fullProfileForm.dob}
                          onFocus={() => handleWizardFieldFocus("dob", fullProfileForm.dob)}
                          onBlur={() => handleWizardFieldBlur("dob", fullProfileForm.dob)}
                          onChange={(e) => handleDobChange(e.target.value)}
                          className={wizardErrors.dob && (touchedFields.dob || focusedField === "dob") ? "invalid" : ""}
                        />
                        {wizardErrors.dob && (touchedFields.dob || focusedField === "dob") && (
                          <span className="field-error-msg">⚠️ {wizardErrors.dob}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Age (Years) * {fullProfileForm.dob && "(Auto-calculated)"}</label>
                        <input
                          type="number"
                          placeholder="e.g. 30"
                          value={fullProfileForm.age}
                          onFocus={() => handleWizardFieldFocus("age", fullProfileForm.age)}
                          onBlur={() => handleWizardFieldBlur("age", fullProfileForm.age)}
                          onChange={(e) => handleWizardFieldChange("age", e.target.value)}
                          className={wizardErrors.age && (touchedFields.age || focusedField === "age") ? "invalid" : ""}
                        />
                        {wizardErrors.age && (touchedFields.age || focusedField === "age") && (
                          <span className="field-error-msg">⚠️ {wizardErrors.age}</span>
                        )}
                      </div>
                    </div>

                    <div className="form-row three-col">
                      <div className="form-group">
                        <label>Gender *</label>
                        <select
                          value={fullProfileForm.gender}
                          onFocus={() => handleWizardFieldFocus("gender", fullProfileForm.gender)}
                          onBlur={() => handleWizardFieldBlur("gender", fullProfileForm.gender)}
                          onChange={(e) => handleWizardFieldChange("gender", e.target.value)}
                          className={wizardErrors.gender && (touchedFields.gender || focusedField === "gender") ? "invalid" : ""}
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                        {wizardErrors.gender && (touchedFields.gender || focusedField === "gender") && (
                          <span className="field-error-msg">⚠️ {wizardErrors.gender}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Height (cm) *</label>
                        <input
                          type="number"
                          placeholder="e.g. 175"
                          value={fullProfileForm.height}
                          onFocus={() => handleWizardFieldFocus("height", fullProfileForm.height)}
                          onBlur={() => handleWizardFieldBlur("height", fullProfileForm.height)}
                          onChange={(e) => handleWizardFieldChange("height", e.target.value)}
                          className={wizardErrors.height && (touchedFields.height || focusedField === "height") ? "invalid" : ""}
                        />
                        {wizardErrors.height && (touchedFields.height || focusedField === "height") && (
                          <span className="field-error-msg">⚠️ {wizardErrors.height}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Weight (kg) *</label>
                        <input
                          type="number"
                          placeholder="e.g. 70"
                          value={fullProfileForm.weight}
                          onFocus={() => handleWizardFieldFocus("weight", fullProfileForm.weight)}
                          onBlur={() => handleWizardFieldBlur("weight", fullProfileForm.weight)}
                          onChange={(e) => handleWizardFieldChange("weight", e.target.value)}
                          className={wizardErrors.weight && (touchedFields.weight || focusedField === "weight") ? "invalid" : ""}
                        />
                        {wizardErrors.weight && (touchedFields.weight || focusedField === "weight") && (
                          <span className="field-error-msg">⚠️ {wizardErrors.weight}</span>
                        )}
                      </div>
                    </div>

                    {fullProfileForm.height && fullProfileForm.weight && (
                      <div className="bmi-display-box" style={{ background: "#f0fdf4", padding: "10px", borderRadius: "8px", color: "#166534", fontSize: "14px", fontWeight: "600", marginBottom: "16px" }}>
                        📊 Calculated BMI: {calculateBmiString(fullProfileForm.height, fullProfileForm.weight)}
                      </div>
                    )}

                    <div className="form-row two-col">
                      <div className="form-group">
                        <label>Blood Group *</label>
                        <select
                          value={fullProfileForm.bloodGroup}
                          onFocus={() => handleWizardFieldFocus("bloodGroup", fullProfileForm.bloodGroup)}
                          onBlur={() => handleWizardFieldBlur("bloodGroup", fullProfileForm.bloodGroup)}
                          onChange={(e) => handleWizardFieldChange("bloodGroup", e.target.value)}
                          className={wizardErrors.bloodGroup && (touchedFields.bloodGroup || focusedField === "bloodGroup") ? "invalid" : ""}
                        >
                          <option value="">Select Blood Group</option>
                          {BLOOD_GROUPS.map((bg) => (
                            <option key={bg} value={bg}>{bg}</option>
                          ))}
                        </select>
                        {wizardErrors.bloodGroup && (touchedFields.bloodGroup || focusedField === "bloodGroup") && (
                          <span className="field-error-msg">⚠️ {wizardErrors.bloodGroup}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Nationality *</label>
                        <select
                          value={fullProfileForm.nationality}
                          onFocus={() => handleWizardFieldFocus("nationality", fullProfileForm.nationality)}
                          onBlur={() => handleWizardFieldBlur("nationality", fullProfileForm.nationality)}
                          onChange={(e) => handleNationalitySelect(e.target.value)}
                          className={wizardErrors.nationality && (touchedFields.nationality || focusedField === "nationality") ? "invalid" : ""}
                        >
                          <option value="">Select Nationality</option>
                          {NATIONALITIES.map((nat) => (
                            <option key={nat} value={nat}>{nat}</option>
                          ))}
                        </select>
                        {wizardErrors.nationality && (touchedFields.nationality || focusedField === "nationality") && (
                          <span className="field-error-msg">⚠️ {wizardErrors.nationality}</span>
                        )}
                      </div>
                    </div>

                    <div className="form-row two-col">
                      <div className="form-group">
                        <label>State *</label>
                        <select
                          value={fullProfileForm.state}
                          disabled={!fullProfileForm.nationality}
                          onFocus={() => handleWizardFieldFocus("state", fullProfileForm.state)}
                          onBlur={() => handleWizardFieldBlur("state", fullProfileForm.state)}
                          onChange={(e) => handleStateSelect(e.target.value)}
                          className={wizardErrors.state && (touchedFields.state || focusedField === "state") ? "invalid" : ""}
                        >
                          <option value="">
                            {!fullProfileForm.nationality
                              ? "Select Nationality First"
                              : "Select State"}
                          </option>
                          {availableStates.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                        {wizardErrors.state && (touchedFields.state || focusedField === "state") && (
                          <span className="field-error-msg">⚠️ {wizardErrors.state}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>District *</label>
                        <select
                          value={fullProfileForm.district}
                          disabled={!fullProfileForm.state}
                          onFocus={() => handleWizardFieldFocus("district", fullProfileForm.district)}
                          onBlur={() => handleWizardFieldBlur("district", fullProfileForm.district)}
                          onChange={(e) => handleWizardFieldChange("district", e.target.value)}
                          className={wizardErrors.district && (touchedFields.district || focusedField === "district") ? "invalid" : ""}
                        >
                          <option value="">
                            {!fullProfileForm.state
                              ? "Select State First"
                              : "Select District"}
                          </option>
                          {availableDistricts.map((dist) => (
                            <option key={dist} value={dist}>{dist}</option>
                          ))}
                        </select>
                        {wizardErrors.district && (touchedFields.district || focusedField === "district") && (
                          <span className="field-error-msg">⚠️ {wizardErrors.district}</span>
                        )}
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Address *</label>
                      <textarea
                        rows="2"
                        placeholder="House / Street Name, City, Pincode"
                        value={fullProfileForm.address}
                        onFocus={() => handleWizardFieldFocus("address", fullProfileForm.address)}
                        onBlur={() => handleWizardFieldBlur("address", fullProfileForm.address)}
                        onChange={(e) => handleWizardFieldChange("address", e.target.value)}
                        className={wizardErrors.address && (touchedFields.address || focusedField === "address") ? "invalid" : ""}
                      />
                      {wizardErrors.address && (touchedFields.address || focusedField === "address") && (
                        <span className="field-error-msg">⚠️ {wizardErrors.address}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* SECTION 2: EMERGENCY CONTACT INFORMATION */}
                {profileWizardStep === 2 && (
                  <div className="wizard-step-panel">
                    <h4>Emergency Contact Details</h4>
                    <p style={{ color: "#64748b", fontSize: "13px", marginBottom: "16px" }}>
                      Emergency contact details are critical for instant assistance during pilgrimage journeys.
                    </p>

                    <div className="form-group">
                      <label>Emergency Contact Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Ramesh Kumar"
                        value={fullProfileForm.contactName}
                        onFocus={() => handleWizardFieldFocus("contactName", fullProfileForm.contactName)}
                        onBlur={() => handleWizardFieldBlur("contactName", fullProfileForm.contactName)}
                        onChange={(e) => handleWizardFieldChange("contactName", e.target.value)}
                        className={wizardErrors.contactName && (touchedFields.contactName || focusedField === "contactName") ? "invalid" : ""}
                      />
                      {wizardErrors.contactName && (touchedFields.contactName || focusedField === "contactName") && (
                        <span className="field-error-msg">⚠️ {wizardErrors.contactName}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Relationship *</label>
                      <select
                        value={fullProfileForm.relationship}
                        onFocus={() => handleWizardFieldFocus("relationship", fullProfileForm.relationship)}
                        onBlur={() => handleWizardFieldBlur("relationship", fullProfileForm.relationship)}
                        onChange={(e) => handleWizardFieldChange("relationship", e.target.value)}
                        className={wizardErrors.relationship && (touchedFields.relationship || focusedField === "relationship") ? "invalid" : ""}
                      >
                        <option value="">Select Relationship</option>
                        {RELATIONSHIPS.map((rel) => (
                          <option key={rel} value={rel}>{rel}</option>
                        ))}
                      </select>
                      {wizardErrors.relationship && (touchedFields.relationship || focusedField === "relationship") && (
                        <span className="field-error-msg">⚠️ {wizardErrors.relationship}</span>
                      )}
                    </div>

                    <div className="form-row two-col">
                      <div className="form-group">
                        <label>Emergency Contact Phone *</label>
                        <input
                          type="text"
                          placeholder="10-digit phone number"
                          value={fullProfileForm.phone}
                          onFocus={() => handleWizardFieldFocus("phone", fullProfileForm.phone)}
                          onBlur={() => handleWizardFieldBlur("phone", fullProfileForm.phone)}
                          onChange={(e) => handleWizardFieldChange("phone", e.target.value)}
                          className={wizardErrors.phone && (touchedFields.phone || focusedField === "phone") ? "invalid" : ""}
                        />
                        {wizardErrors.phone && (touchedFields.phone || focusedField === "phone") && (
                          <span className="field-error-msg">⚠️ {wizardErrors.phone}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Alternate Contact Number (Optional)</label>
                        <input
                          type="text"
                          placeholder="Alternate phone number"
                          value={fullProfileForm.alternatePhone}
                          onFocus={() => handleWizardFieldFocus("alternatePhone", fullProfileForm.alternatePhone)}
                          onBlur={() => handleWizardFieldBlur("alternatePhone", fullProfileForm.alternatePhone)}
                          onChange={(e) => handleWizardFieldChange("alternatePhone", e.target.value)}
                          className={wizardErrors.alternatePhone && (touchedFields.alternatePhone || focusedField === "alternatePhone") ? "invalid" : ""}
                        />
                        {wizardErrors.alternatePhone && (touchedFields.alternatePhone || focusedField === "alternatePhone") && (
                          <span className="field-error-msg">⚠️ {wizardErrors.alternatePhone}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION 3: MEDICAL INFORMATION */}
                {profileWizardStep === 3 && (
                  <div className="wizard-step-panel">
                    <h4>Existing Medical Conditions</h4>
                    <p style={{ color: "#64748b", fontSize: "13px", marginBottom: "12px" }}>Select all that apply:</p>

                    <div className="checkbox-grid">
                      {["Diabetes", "Hypertension", "Heart Disease", "Asthma", "Kidney Disease", "Arthritis"].map((cond) => (
                        <label key={cond} className="checkbox-label-item">
                          <input
                            type="checkbox"
                            checked={fullProfileForm.existingConditions.includes(cond)}
                            onChange={() => handleExistingConditionToggle(cond)}
                          />
                          <span>{cond}</span>
                        </label>
                      ))}
                    </div>

                    <div className="form-group" style={{ marginTop: "14px" }}>
                      <label>Other Medical Condition (Specify if any)</label>
                      <input
                        type="text"
                        placeholder="Specify other condition"
                        value={fullProfileForm.otherCondition}
                        onChange={(e) => setFullProfileForm({ ...fullProfileForm, otherCondition: e.target.value })}
                      />
                    </div>

                    <div className="form-row two-col">
                      <div className="form-group">
                        <label>Previous Major Surgeries</label>
                        <input
                          type="text"
                          placeholder="e.g. Cardiac Bypass 2021 (or None)"
                          value={fullProfileForm.previousSurgeries}
                          onChange={(e) => setFullProfileForm({ ...fullProfileForm, previousSurgeries: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label>Current Medications</label>
                        <input
                          type="text"
                          placeholder="e.g. Amlodipine 5mg, Metformin 500mg"
                          value={fullProfileForm.currentMedications}
                          onChange={(e) => setFullProfileForm({ ...fullProfileForm, currentMedications: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-row two-col">
                      <div className="form-group">
                        <label>Drug Allergies</label>
                        <input
                          type="text"
                          placeholder="e.g. Penicillin, Aspirin (or None)"
                          value={fullProfileForm.drugAllergies}
                          onChange={(e) => setFullProfileForm({ ...fullProfileForm, drugAllergies: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label>Food Allergies</label>
                        <input
                          type="text"
                          placeholder="e.g. Peanuts, Lactose (or None)"
                          value={fullProfileForm.foodAllergies}
                          onChange={(e) => setFullProfileForm({ ...fullProfileForm, foodAllergies: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-row three-col">
                      <div className="form-group">
                        <label>Mobility Limitations</label>
                        <input
                          type="text"
                          placeholder="e.g. Knee pain (or None)"
                          value={fullProfileForm.mobilityLimitations}
                          onChange={(e) => setFullProfileForm({ ...fullProfileForm, mobilityLimitations: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label>Vision Problems (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Spectacles, Cataract"
                          value={fullProfileForm.visionProblems}
                          onChange={(e) => setFullProfileForm({ ...fullProfileForm, visionProblems: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label>Hearing Problems (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Hearing aid"
                          value={fullProfileForm.hearingProblems}
                          onChange={(e) => setFullProfileForm({ ...fullProfileForm, hearingProblems: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-row three-col">
                      <div className="form-group">
                        <label>Smoking Status</label>
                        <select
                          value={fullProfileForm.smokingStatus}
                          onChange={(e) => setFullProfileForm({ ...fullProfileForm, smokingStatus: e.target.value })}
                        >
                          <option value="">Select Option</option>
                          <option value="Non-Smoker">Non-Smoker</option>
                          <option value="Former Smoker">Former Smoker</option>
                          <option value="Current Smoker">Current Smoker</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Alcohol Consumption</label>
                        <select
                          value={fullProfileForm.alcoholStatus}
                          onChange={(e) => setFullProfileForm({ ...fullProfileForm, alcoholStatus: e.target.value })}
                        >
                          <option value="">Select Option</option>
                          <option value="Non-Drinker">Non-Drinker</option>
                          <option value="Occasional">Occasional</option>
                          <option value="Regular">Regular</option>
                        </select>
                      </div>

                      {fullProfileForm.gender === "Female" && (
                        <div className="form-group">
                          <label>Pregnancy Status</label>
                          <select
                            value={fullProfileForm.pregnancyStatus}
                            onChange={(e) => setFullProfileForm({ ...fullProfileForm, pregnancyStatus: e.target.value })}
                          >
                            <option value="">Select Option</option>
                            <option value="N/A">Not Applicable</option>
                            <option value="First Trimester">First Trimester</option>
                            <option value="Second Trimester">Second Trimester</option>
                            <option value="Third Trimester">Third Trimester</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SECTION 4: HEALTH MEASUREMENTS */}
                {profileWizardStep === 4 && (
                  <div className="wizard-step-panel">
                    <h4>Health Measurements (Optional)</h4>
                    <p style={{ color: "#64748b", fontSize: "13px", marginBottom: "16px" }}>
                      Provide your latest health readings for precise AI Pilgrim Safety Index (PSI) calculation.
                    </p>

                    <div className="form-row two-col">
                      <div className="form-group">
                        <label>Resting Blood Pressure</label>
                        <input
                          type="text"
                          placeholder="e.g. 120/80 mmHg"
                          value={fullProfileForm.restingBP}
                          onFocus={() => handleWizardFieldFocus("restingBP", fullProfileForm.restingBP)}
                          onBlur={() => handleWizardFieldBlur("restingBP", fullProfileForm.restingBP)}
                          onChange={(e) => handleWizardFieldChange("restingBP", e.target.value)}
                          className={wizardErrors.restingBP && (touchedFields.restingBP || focusedField === "restingBP") ? "invalid" : ""}
                        />
                        {wizardErrors.restingBP && (touchedFields.restingBP || focusedField === "restingBP") && (
                          <span className="field-error-msg">⚠️ {wizardErrors.restingBP}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Blood Sugar Level</label>
                        <input
                          type="text"
                          placeholder="e.g. 110 mg/dL"
                          value={fullProfileForm.bloodSugar}
                          onFocus={() => handleWizardFieldFocus("bloodSugar", fullProfileForm.bloodSugar)}
                          onBlur={() => handleWizardFieldBlur("bloodSugar", fullProfileForm.bloodSugar)}
                          onChange={(e) => handleWizardFieldChange("bloodSugar", e.target.value)}
                          className={wizardErrors.bloodSugar && (touchedFields.bloodSugar || focusedField === "bloodSugar") ? "invalid" : ""}
                        />
                        {wizardErrors.bloodSugar && (touchedFields.bloodSugar || focusedField === "bloodSugar") && (
                          <span className="field-error-msg">⚠️ {wizardErrors.bloodSugar}</span>
                        )}
                      </div>
                    </div>

                    <div className="form-row three-col">
                      <div className="form-group">
                        <label>Heart Rate</label>
                        <input
                          type="text"
                          placeholder="e.g. 72 bpm"
                          value={fullProfileForm.heartRate}
                          onFocus={() => handleWizardFieldFocus("heartRate", fullProfileForm.heartRate)}
                          onBlur={() => handleWizardFieldBlur("heartRate", fullProfileForm.heartRate)}
                          onChange={(e) => handleWizardFieldChange("heartRate", e.target.value)}
                          className={wizardErrors.heartRate && (touchedFields.heartRate || focusedField === "heartRate") ? "invalid" : ""}
                        />
                        {wizardErrors.heartRate && (touchedFields.heartRate || focusedField === "heartRate") && (
                          <span className="field-error-msg">⚠️ {wizardErrors.heartRate}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Oxygen Saturation (SpO₂)</label>
                        <input
                          type="text"
                          placeholder="e.g. 98%"
                          value={fullProfileForm.spo2}
                          onFocus={() => handleWizardFieldFocus("spo2", fullProfileForm.spo2)}
                          onBlur={() => handleWizardFieldBlur("spo2", fullProfileForm.spo2)}
                          onChange={(e) => handleWizardFieldChange("spo2", e.target.value)}
                          className={wizardErrors.spo2 && (touchedFields.spo2 || focusedField === "spo2") ? "invalid" : ""}
                        />
                        {wizardErrors.spo2 && (touchedFields.spo2 || focusedField === "spo2") && (
                          <span className="field-error-msg">⚠️ {wizardErrors.spo2}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Hemoglobin Level</label>
                        <input
                          type="text"
                          placeholder="e.g. 13.5 g/dL"
                          value={fullProfileForm.hemoglobin}
                          onFocus={() => handleWizardFieldFocus("hemoglobin", fullProfileForm.hemoglobin)}
                          onBlur={() => handleWizardFieldBlur("hemoglobin", fullProfileForm.hemoglobin)}
                          onChange={(e) => handleWizardFieldChange("hemoglobin", e.target.value)}
                          className={wizardErrors.hemoglobin && (touchedFields.hemoglobin || focusedField === "hemoglobin") ? "invalid" : ""}
                        />
                        {wizardErrors.hemoglobin && (touchedFields.hemoglobin || focusedField === "hemoglobin") && (
                          <span className="field-error-msg">⚠️ {wizardErrors.hemoglobin}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION 5: FITNESS INFORMATION */}
                {profileWizardStep === 5 && (
                  <div className="wizard-step-panel">
                    <h4>Fitness & Physical Endurance</h4>
                    <p style={{ color: "#64748b", fontSize: "13px", marginBottom: "16px" }}>
                      Helps recommend suitable walking routes, darshan wait times, and terrain alerts.
                    </p>

                    <div className="form-row two-col">
                      <div className="form-group">
                        <label>Physical Activity Level</label>
                        <select
                          value={fullProfileForm.activityLevel}
                          onChange={(e) => setFullProfileForm({ ...fullProfileForm, activityLevel: e.target.value })}
                        >
                          <option value="">Select Level</option>
                          <option value="Sedentary">Sedentary (Little/no exercise)</option>
                          <option value="Lightly Active">Lightly Active (Light walking)</option>
                          <option value="Moderately Active">Moderately Active (Regular exercise)</option>
                          <option value="Very Active">Very Active (High endurance)</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Can Walk Continuously</label>
                        <select
                          value={fullProfileForm.continuousWalking}
                          onChange={(e) => setFullProfileForm({ ...fullProfileForm, continuousWalking: e.target.value })}
                        >
                          <option value="">Select Distance</option>
                          <option value="Less than 1 km">Less than 1 km</option>
                          <option value="1–3 km">1–3 km</option>
                          <option value="3–5 km">3–5 km</option>
                          <option value="More than 5 km">More than 5 km</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row two-col">
                      <div className="form-group">
                        <label>Can Climb Stairs</label>
                        <select
                          value={fullProfileForm.stairClimbing}
                          onChange={(e) => setFullProfileForm({ ...fullProfileForm, stairClimbing: e.target.value })}
                        >
                          <option value="">Select Ability</option>
                          <option value="Easily">Easily</option>
                          <option value="With Difficulty">With Difficulty</option>
                          <option value="Unable">Unable</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Uses Walking Stick / Wheelchair</label>
                        <select
                          value={fullProfileForm.usesAssistance}
                          onChange={(e) => setFullProfileForm({ ...fullProfileForm, usesAssistance: e.target.value })}
                        >
                          <option value="">Select Option</option>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION 6: MEDICAL REPORT UPLOAD */}
                {profileWizardStep === 6 && (
                  <div className="wizard-step-panel">
                    <h4>Medical Report Upload (Optional)</h4>
                    <p style={{ color: "#64748b", fontSize: "13px", marginBottom: "16px" }}>
                      Upload your recent medical documents for AI analysis & OCR processing.
                    </p>

                    <div className="form-group">
                      <label>Report File (PDF or Image)</label>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        className="file-input-control"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            showAlert("info", `Report file selected: ${e.target.files[0].name}`);
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* SECTION 7: CONSENT & SUBMISSION */}
                {profileWizardStep === 7 && (
                  <div className="wizard-step-panel">
                    <h4>Consent & Final Submission</h4>
                    <p style={{ color: "#64748b", fontSize: "13px", marginBottom: "16px" }}>
                      Please review and confirm to complete your PilgrimIQ profile setup.
                    </p>

                    <div className="checkbox-grid" style={{ gridTemplateColumns: "1fr", gap: "12px" }}>
                      <label className="checkbox-label-item">
                        <input
                          type="checkbox"
                          checked={fullProfileForm.consentAccurate}
                          onChange={(e) => setFullProfileForm({ ...fullProfileForm, consentAccurate: e.target.checked })}
                        />
                        <span>I confirm that the information provided is accurate and truthful.</span>
                      </label>

                      <label className="checkbox-label-item">
                        <input
                          type="checkbox"
                          checked={fullProfileForm.consentAiRisk}
                          onChange={(e) => setFullProfileForm({ ...fullProfileForm, consentAiRisk: e.target.checked })}
                        />
                        <span>I consent to AI-based health risk assessment & Pilgrim Safety Index (PSI) analysis.</span>
                      </label>

                      <label className="checkbox-label-item">
                        <input
                          type="checkbox"
                          checked={fullProfileForm.consentTerms}
                          onChange={(e) => setFullProfileForm({ ...fullProfileForm, consentTerms: e.target.checked })}
                        />
                        <span>I agree to the Privacy Policy and Terms & Conditions.</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                {profileWizardStep > 1 && (
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setProfileWizardStep(profileWizardStep - 1)}
                  >
                    Back
                  </button>
                )}

                {profileWizardStep < 7 ? (
                  <button
                    type="button"
                    className="btn-save"
                    onClick={() => {
                      if (validateWizardStep(profileWizardStep)) {
                        setProfileWizardStep(profileWizardStep + 1);
                      } else {
                        showAlert("error", "Please fill in required fields correctly before proceeding.");
                      }
                    }}
                  >
                    Next Step &rarr;
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="btn-save"
                    disabled={submitting || !fullProfileForm.consentAccurate || !fullProfileForm.consentTerms}
                  >
                    {submitting ? "Saving to MongoDB..." : "Submit & Complete Profile"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
