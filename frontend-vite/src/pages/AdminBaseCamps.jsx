import React, { useState, useEffect, useCallback } from "react";
import {
  apiGetBaseCamps,
  apiCreateBaseCamp,
  apiUpdateBaseCamp,
  apiDeleteBaseCamp,
} from "../services/api";
import {
  FiPlus,
  FiSearch,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiCheckCircle,
  FiMapPin,
  FiActivity,
  FiX,
  FiAlertTriangle,
  FiClock,
  FiUsers,
  FiShield,
} from "react-icons/fi";
import { FaHospital } from "react-icons/fa";

const INDIAN_STATES = [
  "Kerala",
  "Tamil Nadu",
  "Karnataka",
  "Andhra Pradesh",
  "Telangana",
  "Maharashtra",
  "Goa",
  "Gujarat",
  "Delhi",
  "Uttar Pradesh",
  "Uttarakhand",
  "Himachal Pradesh",
  "West Bengal",
  "Odisha",
  "Other",
];

const DISTRICTS_BY_STATE = {
  Kerala: [
    "Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam",
    "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"
  ],
  "Tamil Nadu": [
    "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul",
    "Erode", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai",
    "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram",
    "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi",
    "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai",
    "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"
  ],
  Karnataka: [
    "Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar",
    "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada",
    "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kodagu", "Kolar",
    "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru", "Udupi",
    "Uttara Kannada", "Vijayanagara", "Yadgir"
  ],
  "Andhra Pradesh": [
    "Anantapur", "Annamayya", "Anakapalli", "Bapatla", "Chittoor", "East Godavari", "Eluru",
    "Guntur", "Kakinada", "Kurnool", "Nandyal", "NTR", "Palnadu", "Prakasam",
    "Sri Potti Sriramulu Nellore", "Sri Sathya Sai", "Srikakulam", "Tirupati", "Visakhapatnam",
    "Vizianagaram", "West Godavari", "YSR Kadapa"
  ],
  Telangana: [
    "Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhupalpally",
    "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam", "Kumuram Bheem Asifabad",
    "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak", "Medchal-Malkajgiri", "Mulugu",
    "Nagarkurnool", "Nalgonda", "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli",
    "Rajanna Sircilla", "Rangareddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad",
    "Wanaparthy", "Warangal", "Hanamkonda", "Yadadri Bhuvanagiri"
  ],
  Maharashtra: [
    "Ahmednagar", "Akola", "Amravati", "Chhatrapati Sambhajinagar", "Beed", "Bhandara", "Buldhana",
    "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur",
    "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", "Nashik",
    "Dharashiv", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara",
    "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"
  ],
  Goa: [
    "North Goa", "South Goa"
  ],
  Gujarat: [
    "Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch", "Bhavnagar", "Botad",
    "Chhota Udaipur", "Dahod", "Dang", "Devbhoomi Dwarka", "Gandhinagar", "Gir Somnath",
    "Jamnagar", "Junagadh", "Kheda", "Kutch", "Mahisagar", "Mehsana", "Morbi", "Narmada",
    "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat",
    "Surendranagar", "Tapi", "Vadodara", "Valsad"
  ],
  Delhi: [
    "Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi",
    "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi"
  ],
  "Uttar Pradesh": [
    "Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya", "Ayodhya", "Azamgarh",
    "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti",
    "Bhadohi", "Bijnor", "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah",
    "Etawah", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar", "Ghaziabad",
    "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur", "Hardoi", "Hathras", "Jalaun",
    "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi",
    "Kheri", "Kushinagar", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura",
    "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh",
    "Prayagraj", "Raebareli", "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar",
    "Shahjahanpur", "Shamli", "Shravasti", "Siddharthnagar", "Sitapur", "Sonbhadra", "Sultanpur",
    "Unnao", "Varanasi"
  ],
  Uttarakhand: [
    "Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital",
    "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi"
  ],
  "Himachal Pradesh": [
    "Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul and Spiti",
    "Mandi", "Shimla", "Sirmaur", "Solan", "Una"
  ],
  "West Bengal": [
    "Alipurduar", "Bankura", "Paschim Bardhaman", "Purba Bardhaman", "Birbhum", "Cooch Behar",
    "Dakshin Dinajpur", "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong",
    "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas", "Paschim Medinipur",
    "Purba Medinipur", "Purulia", "South 24 Parganas", "Uttar Dinajpur"
  ],
  Odisha: [
    "Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Cuttack", "Deogarh",
    "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi",
    "Kandhamal", "Kendrapara", "Kendujhar", "Khordha", "Koraput", "Malkangiri", "Mayurbhanj",
    "Nabarangpur", "Nayagarh", "Nuapada", "Puri", "Rayagada", "Sambalpur", "Subarnapur", "Sundergarh"
  ],
  Other: [
    "Central District", "North District", "South District", "East District", "West District", "Other"
  ]
};

const INITIAL_FORM_STATE = {
  name: "",
  campType: "Pilgrimage Base Camp",
  address: "",
  locality: "",
  district: "",
  state: "Kerala",
  pinCode: "",
  latitude: "",
  longitude: "",
  maximumCapacity: "100",
  currentOccupancy: "0",
  medicalFacility: false,
  medicalFacilityName: "",
  numberOfDoctors: "0",
  numberOfNurses: "0",
  numberOfBeds: "0",
  emergencyMedicalSupport: "Available 24/7",
  contactPerson: "",
  contactNumber: "",
  alternateContact: "",
  email: "",
  status: "Operational",
  openingDate: new Date().toISOString().split("T")[0],
  openingTime: "06:00 AM",
  closingTime: "10:00 PM",
  emergencySupport: true,
  description: "",
  specialInstructions: "",
  googleMapLink: "",
  facilities: {
    doctorAvailable: false,
    pharmacy: false,
    drinkingWater: true,
    toilets: true,
    foodFacility: false,
    restArea: true,
    ambulanceAccess: true,
    parking: false,
    emergencySupport: true,
    security247: true,
    accessibilityFacility: false,
  },
};

function AdminBaseCamps({ token, showAlert }) {
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCamp, setEditingCamp] = useState(null);
  const [viewingCamp, setViewingCamp] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirm Modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    campId: null,
    campName: "",
  });

  // Form State & Validation
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});

  // Fetch Base Camps
  const fetchCamps = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = {
        search: searchTerm,
        status: statusFilter !== "all" ? statusFilter : "",
      };
      const data = await apiGetBaseCamps(queryParams, token);
      setCamps(data || []);
    } catch (err) {
      console.error("Failed to load base camps:", err);
      if (showAlert) showAlert("error", err.message || "Failed to load base camps.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, token, showAlert]);

  useEffect(() => {
    fetchCamps();
  }, [fetchCamps]);

  // Validation Engine for Form Fields
  const validateField = (name, value, currentForm = formData) => {
    let error = "";
    const strVal = (value || "").toString().trim();

    switch (name) {
      case "name":
        if (!strVal) error = "Base camp name is required.";
        else if (!/^[A-Za-z\s]+$/.test(strVal)) error = "Only letters and spaces are allowed.";
        else if (strVal.length < 3) error = "Name must be at least 3 characters.";
        else if (strVal.length > 100) error = "Name cannot exceed 100 characters.";
        break;

      case "campType":
        if (!strVal) error = "Camp type is required.";
        break;

      case "address":
        if (!strVal) error = "Address is required.";
        else if (!/^[A-Za-z\s]+$/.test(strVal)) error = "Only letters and spaces are allowed.";
        else if (strVal.length < 10) error = "Address must be at least 10 characters.";
        else if (strVal.length > 300) error = "Address cannot exceed 300 characters.";
        break;

      case "locality":
        if (!strVal) error = "Village / Locality is required.";
        else if (!/^[A-Za-z\s]+$/.test(strVal)) error = "Only letters and spaces are allowed.";
        break;

      case "district":
        if (!strVal) error = "District is required.";
        break;

      case "state":
        if (!strVal) error = "State is required.";
        break;

      case "pinCode":
        if (!strVal) error = "PIN code is required.";
        else if (!/^[0-9]{6}$/.test(strVal)) error = "PIN code must contain exactly 6 digits.";
        break;

      case "latitude":
        if (!strVal) error = "Latitude is required.";
        else {
          const lat = parseFloat(strVal);
          if (isNaN(lat) || lat < -90 || lat > 90) error = "Please enter a valid latitude (-90 to 90).";
        }
        break;

      case "longitude":
        if (!strVal) error = "Longitude is required.";
        else {
          const lng = parseFloat(strVal);
          if (isNaN(lng) || lng < -180 || lng > 180) error = "Please enter a valid longitude (-180 to 180).";
        }
        break;

      case "maximumCapacity":
        if (!strVal) error = "Maximum capacity is required.";
        else {
          const cap = parseInt(strVal, 10);
          if (isNaN(cap) || cap !== 100) error = "Maximum capacity must be 100 only.";
        }
        break;

      case "currentOccupancy":
        if (strVal !== "") {
          if (!/^\d{1,3}$/.test(strVal)) {
            error = "Current occupancy must be up to 3 digits (0-999).";
          } else {
            const occ = parseInt(strVal, 10);
            const maxCap = parseInt(currentForm.maximumCapacity, 10) || 100;
            if (isNaN(occ) || occ < 0) error = "Occupancy must be 0 or greater.";
            else if (occ > maxCap) error = "Current occupancy cannot exceed maximum capacity.";
          }
        }
        break;

      case "contactPerson":
        if (!strVal) error = "Contact person name is required.";
        else if (!/^[A-Za-z\s]+$/.test(strVal)) error = "Only letters and spaces are allowed.";
        else if (strVal.length < 3) error = "Name must be at least 3 characters.";
        break;

      case "contactNumber":
        if (!strVal) error = "Contact number is required.";
        else if (/^[0-5]/.test(strVal)) error = "Contact number cannot begin with 0-5. Must start with 6, 7, 8, or 9.";
        else if (!/^[6-9][0-9]{9,11}$/.test(strVal)) error = "Please enter a valid 10-12 digit contact number starting with 6-9.";
        break;

      case "alternateContact":
        if (strVal) {
          if (/^[0-5]/.test(strVal)) error = "Contact number cannot begin with 0-5. Must start with 6, 7, 8, or 9.";
          else if (!/^[6-9][0-9]{9,11}$/.test(strVal)) error = "Please enter a valid 10-12 digit contact number starting with 6-9.";
        }
        break;

      case "email":
        if (strVal && !/\S+@\S+\.\S+/.test(strVal)) {
          error = "Please enter a valid email address.";
        }
        break;

      case "medicalFacilityName":
        if (currentForm.medicalFacility) {
          if (!strVal) error = "Medical facility name is required when Medical Facility is enabled.";
          else if (!/^[A-Za-z\s]+$/.test(strVal)) error = "Only letters and spaces are allowed.";
        }
        break;

      case "description":
        if (strVal && !/^[A-Za-z\s]+$/.test(strVal)) {
          error = "Only letters and spaces are allowed.";
        }
        break;

      case "specialInstructions":
        if (strVal && !/^[A-Za-z\s]+$/.test(strVal)) {
          error = "Only letters and spaces are allowed.";
        }
        break;

      case "openingDate":
        if (!strVal) error = "Opening date is required.";
        break;

      default:
        break;
    }

    return error;
  };

  // Field Handlers for OnFocus, OnChange, OnBlur
  const handleFieldFocus = (name) => {
    setTouchedFields((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name], formData);
    setFieldErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;

    let newFormData = { ...formData, [name]: val };

    if (name === "state") {
      const allowedDistricts = DISTRICTS_BY_STATE[val] || [];
      if (!allowedDistricts.includes(formData.district)) {
        newFormData.district = "";
      }
    }

    setFormData(newFormData);

    // Validate on input change
    const error = validateField(name, val, newFormData);
    setFieldErrors((prev) => {
      const updated = { ...prev, [name]: error };
      if (name === "state" && newFormData.district !== formData.district) {
        updated.district = validateField("district", newFormData.district, newFormData);
      }
      return updated;
    });
  };

  const handleFacilityToggle = (facilityName) => {
    setFormData((prev) => ({
      ...prev,
      facilities: {
        ...prev.facilities,
        [facilityName]: !prev.facilities[facilityName],
      },
    }));
  };

  const handleFieldBlur = (name) => {
    setTouchedFields((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name], formData);
    setFieldErrors((prev) => ({ ...prev, [name]: error }));
  };

  // Validate entire form prior to submission
  const validateForm = () => {
    const errors = {};
    const fieldsToValidate = [
      "name",
      "campType",
      "address",
      "locality",
      "district",
      "state",
      "pinCode",
      "latitude",
      "longitude",
      "maximumCapacity",
      "currentOccupancy",
      "contactPerson",
      "contactNumber",
      "alternateContact",
      "email",
      "openingDate",
      "description",
      "specialInstructions",
    ];

    if (formData.medicalFacility) {
      fieldsToValidate.push("medicalFacilityName");
    }

    let firstInvalidField = null;
    fieldsToValidate.forEach((key) => {
      const err = validateField(key, formData[key], formData);
      if (err) {
        errors[key] = err;
        if (!firstInvalidField) firstInvalidField = key;
      }
    });

    setFieldErrors(errors);
    // Mark all as touched to display errors inline
    const allTouched = {};
    fieldsToValidate.forEach((k) => (allTouched[k] = true));
    setTouchedFields(allTouched);

    return { isValid: Object.keys(errors).length === 0, firstInvalidField };
  };

  // Open Add Modal
  const openAddModal = () => {
    setFormData(INITIAL_FORM_STATE);
    setFieldErrors({});
    setTouchedFields({});
    setEditingCamp(null);
    setShowAddModal(true);
  };

  // Open Edit Modal
  const openEditModal = (camp) => {
    setEditingCamp(camp);
    setFormData({
      name: camp.name || "",
      campType: camp.campType || "Pilgrimage Base Camp",
      address: camp.address || "",
      locality: camp.locality || "",
      district: camp.district || "",
      state: camp.state || "Kerala",
      pinCode: camp.pinCode || "",
      latitude: camp.latitude ? camp.latitude.toString() : "",
      longitude: camp.longitude ? camp.longitude.toString() : "",
      maximumCapacity: camp.maximumCapacity ? camp.maximumCapacity.toString() : "",
      currentOccupancy: camp.currentOccupancy !== undefined ? camp.currentOccupancy.toString() : "0",
      medicalFacility: camp.medicalFacility || false,
      medicalFacilityName: camp.medicalDetails?.medicalFacilityName || "",
      numberOfDoctors: camp.medicalDetails?.numberOfDoctors ? camp.medicalDetails.numberOfDoctors.toString() : "0",
      numberOfNurses: camp.medicalDetails?.numberOfNurses ? camp.medicalDetails.numberOfNurses.toString() : "0",
      numberOfBeds: camp.medicalDetails?.numberOfBeds ? camp.medicalDetails.numberOfBeds.toString() : "0",
      emergencyMedicalSupport: camp.medicalDetails?.emergencyMedicalSupport || "Available 24/7",
      contactPerson: camp.contactPerson || "",
      contactNumber: camp.contactNumber || "",
      alternateContact: camp.alternateContact || "",
      email: camp.email || "",
      status: camp.status || "Operational",
      openingDate: camp.openingDate ? new Date(camp.openingDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      openingTime: camp.openingTime || "06:00 AM",
      closingTime: camp.closingTime || "10:00 PM",
      emergencySupport: camp.emergencySupport !== undefined ? camp.emergencySupport : true,
      description: camp.description || "",
      specialInstructions: camp.specialInstructions || "",
      googleMapLink: camp.googleMapLink || "",
      facilities: {
        doctorAvailable: camp.facilities?.doctorAvailable || false,
        pharmacy: camp.facilities?.pharmacy || false,
        drinkingWater: camp.facilities?.drinkingWater !== undefined ? camp.facilities.drinkingWater : true,
        toilets: camp.facilities?.toilets !== undefined ? camp.facilities.toilets : true,
        foodFacility: camp.facilities?.foodFacility || false,
        restArea: camp.facilities?.restArea !== undefined ? camp.facilities.restArea : true,
        ambulanceAccess: camp.facilities?.ambulanceAccess || false,
        parking: camp.facilities?.parking || false,
        emergencySupport: camp.facilities?.emergencySupport !== undefined ? camp.facilities.emergencySupport : true,
        security247: camp.facilities?.security247 !== undefined ? camp.facilities.security247 : true,
        accessibilityFacility: camp.facilities?.accessibilityFacility || false,
      },
    });
    setFieldErrors({});
    setTouchedFields({});
    setShowAddModal(true);
  };

  // Submit Handler
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    const { isValid, firstInvalidField } = validateForm();

    if (!isValid) {
      // Focus on first invalid field
      const el = document.getElementsByName(firstInvalidField)[0];
      if (el) el.focus();
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name,
        campType: formData.campType,
        address: formData.address,
        locality: formData.locality,
        district: formData.district,
        state: formData.state,
        pinCode: formData.pinCode,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        maximumCapacity: parseInt(formData.maximumCapacity, 10),
        currentOccupancy: parseInt(formData.currentOccupancy, 10) || 0,
        facilities: formData.facilities,
        medicalFacility: formData.medicalFacility,
        medicalDetails: {
          medicalFacilityName: formData.medicalFacilityName,
          numberOfDoctors: parseInt(formData.numberOfDoctors, 10) || 0,
          numberOfNurses: parseInt(formData.numberOfNurses, 10) || 0,
          numberOfBeds: parseInt(formData.numberOfBeds, 10) || 0,
          emergencyMedicalSupport: formData.emergencyMedicalSupport,
        },
        contactPerson: formData.contactPerson,
        contactNumber: formData.contactNumber,
        alternateContact: formData.alternateContact,
        email: formData.email,
        status: formData.status,
        openingDate: formData.openingDate,
        openingTime: formData.openingTime,
        closingTime: formData.closingTime,
        emergencySupport: formData.emergencySupport,
        description: formData.description,
        specialInstructions: formData.specialInstructions,
        googleMapLink: formData.googleMapLink,
      };

      if (editingCamp) {
        await apiUpdateBaseCamp(editingCamp._id, payload, token);
        if (showAlert) showAlert("success", `Base Camp "${formData.name}" updated successfully!`);
      } else {
        await apiCreateBaseCamp(payload, token);
        if (showAlert) showAlert("success", "Base camp registered successfully.");
      }

      setShowAddModal(false);
      fetchCamps();
    } catch (err) {
      if (showAlert) showAlert("error", err.message || "Unable to save base camp. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm Deactivate / Delete Handler
  const handleConfirmDelete = async () => {
    if (!deleteModal.campId) return;
    try {
      setSubmitting(true);
      await apiDeleteBaseCamp(deleteModal.campId, token);
      if (showAlert) showAlert("success", `Base camp "${deleteModal.campName}" deactivated successfully.`);
      setDeleteModal({ isOpen: false, campId: null, campName: "" });
      fetchCamps();
    } catch (err) {
      if (showAlert) showAlert("error", err.message || "Failed to deactivate base camp.");
    } finally {
      setSubmitting(false);
    }
  };

  // Dynamic Dashboard Stats Calculations
  const totalCampsCount = camps.length;
  const operationalCampsCount = camps.filter((c) => c.status === "Operational").length;
  const closedCampsCount = camps.filter(
    (c) => c.status === "Temporarily Closed" || c.status === "Under Maintenance"
  ).length;
  const totalCapacitySum = camps.reduce((acc, c) => acc + (c.maximumCapacity || 0), 0);

  return (
    <div className="admin-base-camps-page">
      {/* Header Banner */}
      <div className="admin-hero" style={{ marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#f8fafc", margin: 0 }}>
            Base Camp Operations
          </h1>
          <p style={{ fontSize: "14px", color: "#94a3b8", margin: "4px 0 0 0" }}>
            Manage pilgrimage base camps, facilities, capacity and operational status
          </p>
        </div>
        <div>
          <button
            className="btn-primary"
            onClick={openAddModal}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#2563eb",
              border: "none",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "14.5px",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
            }}
          >
            <FiPlus size={18} />  Add New Base Camp
          </button>
        </div>
      </div>a

      {/* KPI Dynamic Summary Cards */}
      <div className="kpi-grid" style={{ marginBottom: "24px" }}>
        <div className="kpi-card blue">
          <div className="kpi-header">
            <span>TOTAL BASE CAMPS</span>
            <FiMapPin className="kpi-icon" />
          </div>
          <div className="kpi-value">{totalCampsCount}</div>
          <div className="kpi-trend positive">
            <FiCheckCircle /> Registered base camps
          </div>
        </div>

        <div className="kpi-card green">
          <div className="kpi-header">
            <span>OPERATIONAL</span>
            <FiCheckCircle className="kpi-icon" />
          </div>
          <div className="kpi-value">{operationalCampsCount}</div>
          <div className="kpi-trend positive">
            <FiActivity /> Currently operational camps
          </div>
        </div>

        <div className="kpi-card red">
          <div className="kpi-header">
            <span>TEMPORARILY CLOSED</span>
            <FiAlertTriangle className="kpi-icon" />
          </div>
          <div className="kpi-value">{closedCampsCount}</div>
          <div className="kpi-trend negative">
            <FiClock /> Camps currently unavailable
          </div>
        </div>

        <div className="kpi-card purple">
          <div className="kpi-header">
            <span>TOTAL CAPACITY</span>
            <FiUsers className="kpi-icon" />
          </div>
          <div className="kpi-value">{totalCapacitySum.toLocaleString()}</div>
          <div className="kpi-trend positive">
            <FiShield /> Combined pilgrim capacity
          </div>
        </div>
      </div>

      {/* Registered Base Camps Table Panel */}
      <div className="admin-panel main-panel">
        <div className="panel-header" style={{ flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#f8fafc", margin: 0 }}>
              Registered Base Camps
            </h3>
            <p style={{ fontSize: "13px", color: "#94a3b8", margin: "4px 0 0 0" }}>
              Live directory of base camps, capacity monitoring & emergency facilities
            </p>
          </div>

          <div className="table-controls" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <div className="search-box">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search camp by name, ID, location, or contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="filter-dropdown"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="Operational">Operational</option>
              <option value="Temporarily Closed">Temporarily Closed</option>
              <option value="Under Maintenance">Under Maintenance</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Base Camp Table */}
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>CAMP ID</th>
                <th>BASE CAMP NAME</th>
                <th>LOCATION</th>
                <th>DISTRICT / STATE</th>
                <th>CAPACITY</th>
                <th>MEDICAL FACILITY</th>
                <th>OCCUPANCY</th>
                <th>STATUS</th>
                <th>CONTACT</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {camps.length > 0 ? (
                camps.map((camp) => (
                  <tr key={camp._id}>
                    <td className="font-mono" style={{ color: "#60a5fa", fontWeight: "bold" }}>
                      {camp.baseCampId}
                    </td>
                    <td>
                      <div style={{ fontSize: "14.5px", fontWeight: "700", color: "#f8fafc" }}>
                        {camp.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "#38bdf8", fontWeight: "600" }}>
                        {camp.campType}
                      </div>
                    </td>
                    <td style={{ fontSize: "13px", color: "#cbd5e1" }}>
                      <div>📍 {camp.locality}</div>
                      <div style={{ fontSize: "11px", color: "#94a3b8" }}>{camp.address?.substring(0, 35)}...</div>
                    </td>
                    <td style={{ fontSize: "13px", color: "#cbd5e1" }}>
                      <div>{camp.district}</div>
                      <div style={{ fontSize: "11.5px", color: "#94a3b8" }}>{camp.state}</div>
                    </td>
                    <td>
                      <span
                        style={{
                          background: "rgba(37, 99, 235, 0.15)",
                          color: "#60a5fa",
                          padding: "4px 10px",
                          borderRadius: "8px",
                          fontWeight: "800",
                          fontSize: "13px",
                        }}
                      >
                        {camp.maximumCapacity?.toLocaleString()} pilgrims
                      </span>
                    </td>
                    <td>
                      {camp.medicalFacility ? (
                        <span style={{ color: "#34d399", fontWeight: "700", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <FaHospital /> Available
                        </span>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "13px" }}>Not Available</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: camp.currentOccupancy >= camp.maximumCapacity ? "#f87171" : "#f8fafc" }}>
                        {camp.currentOccupancy} / {camp.maximumCapacity}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`status-pill ${
                          camp.status === "Operational"
                            ? "success"
                            : camp.status === "Under Maintenance" || camp.status === "Temporarily Closed"
                            ? "warning"
                            : "danger"
                        }`}
                      >
                        {camp.status}
                      </span>
                    </td>
                    <td style={{ fontSize: "12.5px", color: "#cbd5e1" }}>
                      <div>📞 {camp.contactNumber}</div>
                      <div style={{ fontSize: "11px", color: "#94a3b8" }}>{camp.contactPerson}</div>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          className="btn-table-action"
                          onClick={() => setViewingCamp(camp)}
                          title="View Base Camp Profile"
                          style={{ background: "rgba(59, 130, 246, 0.2)", color: "#60a5fa", border: "1px solid #3b82f6" }}
                        >
                          <FiEye /> View
                        </button>
                        <button
                          className="btn-table-action"
                          onClick={() => openEditModal(camp)}
                          title="Edit Base Camp Details"
                          style={{ background: "rgba(245, 158, 11, 0.2)", color: "#fbbf24", border: "1px solid #f59e0b" }}
                        >
                          <FiEdit2 /> Edit
                        </button>
                        <button
                          className="btn-table-action"
                          onClick={() =>
                            setDeleteModal({
                              isOpen: true,
                              campId: camp._id,
                              campName: camp.name,
                            })
                          }
                          title="Deactivate Base Camp"
                          style={{ background: "rgba(239, 68, 68, 0.2)", color: "#f87171", border: "1px solid #ef4444" }}
                        >
                          <FiTrash2 /> Deactivate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="text-center" style={{ padding: "50px 20px" }}>
                    <div style={{ textAlign: "center", color: "#cbd5e1" }}>
                      <FiMapPin size={40} style={{ color: "#64748b", marginBottom: "12px" }} />
                      <h4 style={{ fontSize: "18px", color: "#f8fafc", margin: "0 0 6px 0" }}>
                        No Pilgrimage Base Camps Registered
                      </h4>
                      <p style={{ fontSize: "14px", color: "#94a3b8", maxWidth: "450px", margin: "0 auto 18px auto" }}>
                        {loading
                          ? "Loading base camps directory..."
                          : "Add your first base camp to begin managing pilgrimage base camp operations."}
                      </p>
                      <button
                        className="btn-primary"
                        onClick={openAddModal}
                        style={{
                          background: "#2563eb",
                          border: "none",
                          color: "#fff",
                          padding: "10px 22px",
                          borderRadius: "10px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        + Add New Base Camp
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT BASE CAMP MODAL */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "880px", width: "95%" }}>
            <div className="modal-header">
              <h3 style={{ color: "#f8fafc", display: "flex", alignItems: "center", gap: "8px" }}>
                <FiMapPin style={{ color: "#3b82f6" }} />
                {editingCamp ? `Edit Base Camp: ${editingCamp.name}` : "Register New Base Camp"}
              </h3>
              <button className="btn-close-modal" onClick={() => setShowAddModal(false)}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} noValidate>
              <div className="modal-body" style={{ maxHeight: "75vh", overflowY: "auto", paddingRight: "10px" }}>
                
                {/* SECTION A — BASIC INFORMATION */}
                <div style={{ background: "#0f172a", padding: "16px", borderRadius: "12px", marginBottom: "18px", border: "1px solid #1e293b" }}>
                  <h4 style={{ margin: "0 0 14px 0", color: "#38bdf8", fontSize: "15px", fontWeight: "800" }}>
                    SECTION A — BASIC INFORMATION
                  </h4>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div className="form-group">
                      <label style={{ color: "#f8fafc", fontWeight: "700" }}>Base Camp Name *</label>
                      <input
                        type="text"
                        name="name"
                        className={`form-input ${touchedFields.name && fieldErrors.name ? "input-error" : ""}`}
                        placeholder="e.g. Pamba Emergency Base Camp"
                        value={formData.name}
                        onFocus={() => handleFieldFocus("name")}
                        onChange={handleFieldChange}
                        onBlur={() => handleFieldBlur("name")}
                      />
                      {touchedFields.name && fieldErrors.name && (
                        <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                          ⚠️ {fieldErrors.name}
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label style={{ color: "#f8fafc", fontWeight: "700" }}>Camp ID (Auto-Generated)</label>
                      <input
                        type="text"
                        disabled
                        className="form-input"
                        value={editingCamp ? editingCamp.baseCampId : "BC-AC-AUTO"}
                        style={{ background: "#1e293b", color: "#60a5fa", fontWeight: "700" }}
                      />
                      <span style={{ fontSize: "11px", color: "#64748b" }}>Unique system ID automatically generated</span>
                    </div>

                    <div className="form-group" style={{ gridColumn: "span 2" }}>
                      <label style={{ color: "#f8fafc", fontWeight: "700" }}>Camp Type *</label>
                      <select
                        name="campType"
                        className={`filter-dropdown ${touchedFields.campType && fieldErrors.campType ? "input-error" : ""}`}
                        style={{ width: "100%", background: "#0f172a", color: "#ffffff", padding: "10px 14px" }}
                        value={formData.campType}
                        onFocus={() => handleFieldFocus("campType")}
                        onChange={handleFieldChange}
                        onBlur={() => handleFieldBlur("campType")}
                      >
                        <option value="Pilgrimage Base Camp">Pilgrimage Base Camp</option>
                        <option value="Medical Base Camp">Medical Base Camp</option>
                        <option value="Accommodation Base Camp">Accommodation Base Camp</option>
                        <option value="Transit Base Camp">Transit Base Camp</option>
                        <option value="Multi-Purpose Base Camp">Multi-Purpose Base Camp</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION B — LOCATION INFORMATION */}
                <div style={{ background: "#0f172a", padding: "16px", borderRadius: "12px", marginBottom: "18px", border: "1px solid #1e293b" }}>
                  <h4 style={{ margin: "0 0 14px 0", color: "#38bdf8", fontSize: "15px", fontWeight: "800" }}>
                    SECTION B — LOCATION INFORMATION
                  </h4>

                  <div className="form-group" style={{ marginBottom: "16px" }}>
                    <label style={{ color: "#f8fafc", fontWeight: "700" }}>Complete Address *</label>
                    <textarea
                      name="address"
                      className={`form-input ${touchedFields.address && fieldErrors.address ? "input-error" : ""}`}
                      rows="2"
                      placeholder="Enter street address or landmarks..."
                      value={formData.address}
                      onFocus={() => handleFieldFocus("address")}
                      onChange={handleFieldChange}
                      onBlur={() => handleFieldBlur("address")}
                    ></textarea>
                    {touchedFields.address && fieldErrors.address && (
                      <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                        ⚠️ {fieldErrors.address}
                      </span>
                    )}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
                    <div className="form-group">
                      <label style={{ color: "#f8fafc", fontWeight: "700" }}>State *</label>
                      <select
                        name="state"
                        className={`filter-dropdown ${touchedFields.state && fieldErrors.state ? "input-error" : ""}`}
                        style={{ width: "100%", background: "#0f172a", color: "#ffffff", padding: "10px 14px" }}
                        value={formData.state}
                        onFocus={() => handleFieldFocus("state")}
                        onChange={handleFieldChange}
                        onBlur={() => handleFieldBlur("state")}
                      >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                      {touchedFields.state && fieldErrors.state && (
                        <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                          ⚠️ {fieldErrors.state}
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label style={{ color: "#f8fafc", fontWeight: "700" }}>District *</label>
                      <select
                        name="district"
                        className={`filter-dropdown ${touchedFields.district && fieldErrors.district ? "input-error" : ""}`}
                        style={{ width: "100%", background: "#0f172a", color: "#ffffff", padding: "10px 14px" }}
                        value={formData.district}
                        onFocus={() => handleFieldFocus("district")}
                        onChange={handleFieldChange}
                        onBlur={() => handleFieldBlur("district")}
                      >
                        <option value="">Select District</option>
                        {((DISTRICTS_BY_STATE[formData.state] || []).concat(
                          formData.district && !(DISTRICTS_BY_STATE[formData.state] || []).includes(formData.district)
                            ? [formData.district]
                            : []
                        )).map((dist) => (
                          <option key={dist} value={dist}>{dist}</option>
                        ))}
                      </select>
                      {touchedFields.district && fieldErrors.district && (
                        <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                          ⚠️ {fieldErrors.district}
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label style={{ color: "#f8fafc", fontWeight: "700" }}>Village / Locality *</label>
                      <input
                        type="text"
                        name="locality"
                        className={`form-input ${touchedFields.locality && fieldErrors.locality ? "input-error" : ""}`}
                        placeholder="e.g. Pamba River Valley"
                        value={formData.locality}
                        onFocus={() => handleFieldFocus("locality")}
                        onChange={handleFieldChange}
                        onBlur={() => handleFieldBlur("locality")}
                      />
                      {touchedFields.locality && fieldErrors.locality && (
                        <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                          ⚠️ {fieldErrors.locality}
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label style={{ color: "#f8fafc", fontWeight: "700" }}>PIN Code *</label>
                      <input
                        type="text"
                        name="pinCode"
                        maxLength="6"
                        className={`form-input ${touchedFields.pinCode && fieldErrors.pinCode ? "input-error" : ""}`}
                        placeholder="6-digit PIN"
                        value={formData.pinCode}
                        onFocus={() => handleFieldFocus("pinCode")}
                        onChange={handleFieldChange}
                        onBlur={() => handleFieldBlur("pinCode")}
                      />
                      {touchedFields.pinCode && fieldErrors.pinCode && (
                        <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                          ⚠️ {fieldErrors.pinCode}
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label style={{ color: "#f8fafc", fontWeight: "700" }}>Latitude *</label>
                      <input
                        type="number"
                        step="any"
                        name="latitude"
                        className={`form-input ${touchedFields.latitude && fieldErrors.latitude ? "input-error" : ""}`}
                        placeholder="e.g. 9.4124"
                        value={formData.latitude}
                        onFocus={() => handleFieldFocus("latitude")}
                        onChange={handleFieldChange}
                        onBlur={() => handleFieldBlur("latitude")}
                      />
                      {touchedFields.latitude && fieldErrors.latitude && (
                        <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                          ⚠️ {fieldErrors.latitude}
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label style={{ color: "#f8fafc", fontWeight: "700" }}>Longitude *</label>
                      <input
                        type="number"
                        step="any"
                        name="longitude"
                        className={`form-input ${touchedFields.longitude && fieldErrors.longitude ? "input-error" : ""}`}
                        placeholder="e.g. 77.0694"
                        value={formData.longitude}
                        onFocus={() => handleFieldFocus("longitude")}
                        onChange={handleFieldChange}
                        onBlur={() => handleFieldBlur("longitude")}
                      />
                      {touchedFields.longitude && fieldErrors.longitude && (
                        <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                          ⚠️ {fieldErrors.longitude}
                        </span>
                      )}
                    </div>

                    <div className="form-group" style={{ gridColumn: "span 3", marginTop: "10px" }}>
                      <label style={{ color: "#ffffff", fontWeight: "700" }}>Google Maps Direction Link (Optional)</label>
                      <input
                        type="text"
                        name="googleMapLink"
                        className="form-input"
                        placeholder="e.g. https://maps.google.com/?q=9.4124,77.0694 or https://goo.gl/maps/..."
                        value={formData.googleMapLink}
                        onFocus={() => handleFieldFocus("googleMapLink")}
                        onChange={handleFieldChange}
                        onBlur={() => handleFieldBlur("googleMapLink")}
                      />
                      <span style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px", display: "block" }}>
                        Direct Google Maps location URL for pilgrims in Emergency Services tab.
                      </span>
                    </div>
                  </div>
                </div>

                {/* SECTION C — CAMP CAPACITY */}
                <div style={{ background: "#0f172a", padding: "16px", borderRadius: "12px", marginBottom: "18px", border: "1px solid #1e293b" }}>
                  <h4 style={{ margin: "0 0 14px 0", color: "#38bdf8", fontSize: "15px", fontWeight: "800" }}>
                    SECTION C — CAMP CAPACITY & OCCUPANCY
                  </h4>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div className="form-group">
                      <label style={{ color: "#f8fafc", fontWeight: "700" }}>Maximum Capacity *</label>
                      <input
                        type="number"
                        name="maximumCapacity"
                        className={`form-input ${touchedFields.maximumCapacity && fieldErrors.maximumCapacity ? "input-error" : ""}`}
                        placeholder="e.g. 1000"
                        value={formData.maximumCapacity}
                        onFocus={() => handleFieldFocus("maximumCapacity")}
                        onChange={handleFieldChange}
                        onBlur={() => handleFieldBlur("maximumCapacity")}
                      />
                      {touchedFields.maximumCapacity && fieldErrors.maximumCapacity && (
                        <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                          ⚠️ {fieldErrors.maximumCapacity}
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label style={{ color: "#f8fafc", fontWeight: "700" }}>Current Occupancy</label>
                      <input
                        type="number"
                        name="currentOccupancy"
                        className={`form-input ${touchedFields.currentOccupancy && fieldErrors.currentOccupancy ? "input-error" : ""}`}
                        placeholder="Default 0"
                        value={formData.currentOccupancy}
                        onFocus={() => handleFieldFocus("currentOccupancy")}
                        onChange={handleFieldChange}
                        onBlur={() => handleFieldBlur("currentOccupancy")}
                      />
                      {touchedFields.currentOccupancy && fieldErrors.currentOccupancy && (
                        <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                          ⚠️ {fieldErrors.currentOccupancy}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* SECTION D — FACILITIES & MEDICAL DETAILS */}
                <div style={{ background: "#0f172a", padding: "16px", borderRadius: "12px", marginBottom: "18px", border: "1px solid #1e293b" }}>
                  <h4 style={{ margin: "0 0 14px 0", color: "#38bdf8", fontSize: "15px", fontWeight: "800" }}>
                    SECTION D — AVAILABLE FACILITIES
                  </h4>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "#f8fafc", fontSize: "13.5px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        name="medicalFacility"
                        checked={formData.medicalFacility}
                        onChange={handleFieldChange}
                      />
                      🏥 Medical Facility
                    </label>

                    {Object.keys(formData.facilities).map((facKey) => (
                      <label key={facKey} style={{ display: "flex", alignItems: "center", gap: "8px", color: "#cbd5e1", fontSize: "13px", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={formData.facilities[facKey]}
                          onChange={() => handleFacilityToggle(facKey)}
                        />
                        {facKey.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                      </label>
                    ))}
                  </div>

                  {/* Dynamic Medical Details Sub-Section */}
                  {formData.medicalFacility && (
                    <div style={{ background: "#1e293b", padding: "14px", borderRadius: "10px", marginTop: "12px", border: "1px solid #334155" }}>
                      <h5 style={{ margin: "0 0 10px 0", color: "#34d399", fontSize: "13.5px", fontWeight: "700" }}>
                        Medical Unit & Staff Configuration
                      </h5>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div className="form-group" style={{ gridColumn: "span 2" }}>
                          <label style={{ color: "#f8fafc", fontSize: "12px", fontWeight: "700" }}>Medical Facility Name *</label>
                          <input
                            type="text"
                            name="medicalFacilityName"
                            className={`form-input ${touchedFields.medicalFacilityName && fieldErrors.medicalFacilityName ? "input-error" : ""}`}
                            placeholder="e.g. Pamba Base Camp Field Trauma Unit"
                            value={formData.medicalFacilityName}
                            onFocus={() => handleFieldFocus("medicalFacilityName")}
                            onChange={handleFieldChange}
                            onBlur={() => handleFieldBlur("medicalFacilityName")}
                          />
                          {touchedFields.medicalFacilityName && fieldErrors.medicalFacilityName && (
                            <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "2px", display: "block" }}>
                              ⚠️ {fieldErrors.medicalFacilityName}
                            </span>
                          )}
                        </div>

                        <div className="form-group">
                          <label style={{ color: "#f8fafc", fontSize: "12px", fontWeight: "700" }}>Doctors Count</label>
                          <input
                            type="number"
                            name="numberOfDoctors"
                            className="form-input"
                            value={formData.numberOfDoctors}
                            onChange={handleFieldChange}
                          />
                        </div>

                        <div className="form-group">
                          <label style={{ color: "#f8fafc", fontSize: "12px", fontWeight: "700" }}>Nurses Count</label>
                          <input
                            type="number"
                            name="numberOfNurses"
                            className="form-input"
                            value={formData.numberOfNurses}
                            onChange={handleFieldChange}
                          />
                        </div>

                        <div className="form-group">
                          <label style={{ color: "#f8fafc", fontSize: "12px", fontWeight: "700" }}>Trauma Beds Count</label>
                          <input
                            type="number"
                            name="numberOfBeds"
                            className="form-input"
                            value={formData.numberOfBeds}
                            onChange={handleFieldChange}
                          />
                        </div>

                        <div className="form-group">
                          <label style={{ color: "#f8fafc", fontSize: "12px", fontWeight: "700" }}>Emergency Medical Support</label>
                          <select
                            name="emergencyMedicalSupport"
                            className="filter-dropdown"
                            style={{ width: "100%", background: "#0f172a", color: "#ffffff", padding: "8px 10px" }}
                            value={formData.emergencyMedicalSupport}
                            onChange={handleFieldChange}
                          >
                            <option value="Available 24/7">Available 24/7</option>
                            <option value="Available During Operational Hours">Available During Operational Hours</option>
                            <option value="Not Available">Not Available</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* SECTION E — CONTACT & OPERATIONAL INFO */}
                <div style={{ background: "#0f172a", padding: "16px", borderRadius: "12px", marginBottom: "18px", border: "1px solid #1e293b" }}>
                  <h4 style={{ margin: "0 0 14px 0", color: "#38bdf8", fontSize: "15px", fontWeight: "800" }}>
                    SECTION E — CONTACT & OPERATIONAL TIMINGS
                  </h4>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    <div className="form-group">
                      <label style={{ color: "#f8fafc", fontWeight: "700" }}>Camp Contact Person *</label>
                      <input
                        type="text"
                        name="contactPerson"
                        className={`form-input ${touchedFields.contactPerson && fieldErrors.contactPerson ? "input-error" : ""}`}
                        placeholder="e.g. Officer K. Suresh"
                        value={formData.contactPerson}
                        onFocus={() => handleFieldFocus("contactPerson")}
                        onChange={handleFieldChange}
                        onBlur={() => handleFieldBlur("contactPerson")}
                      />
                      {touchedFields.contactPerson && fieldErrors.contactPerson && (
                        <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                          ⚠️ {fieldErrors.contactPerson}
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label style={{ color: "#f8fafc", fontWeight: "700" }}>Primary Contact Number *</label>
                      <input
                        type="text"
                        name="contactNumber"
                        className={`form-input ${touchedFields.contactNumber && fieldErrors.contactNumber ? "input-error" : ""}`}
                        placeholder="10-12 digit mobile/phone"
                        value={formData.contactNumber}
                        onFocus={() => handleFieldFocus("contactNumber")}
                        onChange={handleFieldChange}
                        onBlur={() => handleFieldBlur("contactNumber")}
                      />
                      {touchedFields.contactNumber && fieldErrors.contactNumber && (
                        <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                          ⚠️ {fieldErrors.contactNumber}
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label style={{ color: "#f8fafc", fontWeight: "700" }}>Alternate Contact Number</label>
                      <input
                        type="text"
                        name="alternateContact"
                        className={`form-input ${touchedFields.alternateContact && fieldErrors.alternateContact ? "input-error" : ""}`}
                        placeholder="Optional second number"
                        value={formData.alternateContact}
                        onFocus={() => handleFieldFocus("alternateContact")}
                        onChange={handleFieldChange}
                        onBlur={() => handleFieldBlur("alternateContact")}
                      />
                      {touchedFields.alternateContact && fieldErrors.alternateContact && (
                        <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                          ⚠️ {fieldErrors.alternateContact}
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label style={{ color: "#f8fafc", fontWeight: "700" }}>Email Address</label>
                      <input
                        type="email"
                        name="email"
                        className={`form-input ${touchedFields.email && fieldErrors.email ? "input-error" : ""}`}
                        placeholder="camp.officer@pilgrimiq.gov.in"
                        value={formData.email}
                        onFocus={() => handleFieldFocus("email")}
                        onChange={handleFieldChange}
                        onBlur={() => handleFieldBlur("email")}
                      />
                      {touchedFields.email && fieldErrors.email && (
                        <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                          ⚠️ {fieldErrors.email}
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label style={{ color: "#f8fafc", fontWeight: "700" }}>Operational Status *</label>
                      <select
                        name="status"
                        className="filter-dropdown"
                        style={{ width: "100%", background: "#0f172a", color: "#ffffff", padding: "10px 14px" }}
                        value={formData.status}
                        onChange={handleFieldChange}
                      >
                        <option value="Operational">Operational</option>
                        <option value="Temporarily Closed">Temporarily Closed</option>
                        <option value="Under Maintenance">Under Maintenance</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label style={{ color: "#f8fafc", fontWeight: "700" }}>Opening Date *</label>
                      <input
                        type="date"
                        name="openingDate"
                        className={`form-input ${touchedFields.openingDate && fieldErrors.openingDate ? "input-error" : ""}`}
                        value={formData.openingDate}
                        onChange={handleFieldChange}
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION F — ADDITIONAL DETAILS & DESCRIPTION */}
                <div style={{ background: "#0f172a", padding: "16px", borderRadius: "12px", marginBottom: "18px", border: "1px solid #1e293b" }}>
                  <h4 style={{ margin: "0 0 14px 0", color: "#38bdf8", fontSize: "15px", fontWeight: "800" }}>
                    SECTION F — ADDITIONAL INFORMATION
                  </h4>

                  <div className="form-group" style={{ marginBottom: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <label style={{ color: "#f8fafc", fontWeight: "700" }}>Camp Description</label>
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                        {formData.description.length} / 500 characters
                      </span>
                    </div>
                    <textarea
                      name="description"
                      className="form-input"
                      maxLength="500"
                      rows="3"
                      placeholder="Brief overview of base camp amenities, mountain shelter..."
                      value={formData.description}
                      onChange={handleFieldChange}
                    ></textarea>
                  </div>

                  <div className="form-group">
                    <label style={{ color: "#f8fafc", fontWeight: "700" }}>Special Instructions</label>
                    <textarea
                      name="specialInstructions"
                      className="form-input"
                      rows="2"
                      placeholder="High altitude guidelines, cold weather warnings..."
                      value={formData.specialInstructions}
                      onChange={handleFieldChange}
                    ></textarea>
                  </div>
                </div>

                <div style={{ fontSize: "12px", color: "#94a3b8", textAlign: "right" }}>
                  * Required fields
                </div>

              </div>

              <div className="modal-footer" style={{ borderTop: "1px solid #334155", paddingTop: "14px" }}>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit-doctor"
                  disabled={submitting}
                  style={{ background: "#2563eb", fontWeight: "800" }}
                >
                  {submitting ? "Saving Base Camp..." : editingCamp ? "Update Base Camp" : "Save Base Camp"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW BASE CAMP DETAILS MODAL */}
      {viewingCamp && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "720px", width: "92%" }}>
            <div className="modal-header">
              <h3 style={{ color: "#38bdf8", display: "flex", alignItems: "center", gap: "8px" }}>
                <FiMapPin /> Base Camp Profile & Telemetry Details
              </h3>
              <button className="btn-close-modal" onClick={() => setViewingCamp(null)}>
                <FiX />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: "75vh", overflowY: "auto" }}>
              <div style={{ background: "#0f172a", padding: "16px", borderRadius: "12px", marginBottom: "16px", border: "1px solid #334155" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#f8fafc", margin: 0 }}>
                      {viewingCamp.name}
                    </h3>
                    <span style={{ fontSize: "13px", color: "#60a5fa", fontWeight: "700" }}>
                      ID: {viewingCamp.baseCampId} • {viewingCamp.campType}
                    </span>
                  </div>
                  <span
                    className={`status-pill ${
                      viewingCamp.status === "Operational" ? "success" : "warning"
                    }`}
                  >
                    {viewingCamp.status}
                  </span>
                </div>

                <p style={{ fontSize: "13px", color: "#cbd5e1", marginTop: "10px" }}>
                  📍 {viewingCamp.address}, {viewingCamp.locality}, {viewingCamp.district}, {viewingCamp.state} - {viewingCamp.pinCode}
                </p>
                <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                  Coordinates: Lat {viewingCamp.latitude}, Lng {viewingCamp.longitude}
                </div>
              </div>

              {/* Occupancy & Capacity Gauge */}
              <div style={{ background: "#0f172a", padding: "14px", borderRadius: "12px", marginBottom: "16px", border: "1px solid #334155" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#f8fafc", fontWeight: "700", marginBottom: "6px" }}>
                  <span>Pilgrim Capacity Monitoring</span>
                  <span>{viewingCamp.currentOccupancy} / {viewingCamp.maximumCapacity} Pilgrims</span>
                </div>
                <div style={{ height: "10px", background: "#1e293b", borderRadius: "5px", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(100, ((viewingCamp.currentOccupancy || 0) / (viewingCamp.maximumCapacity || 1)) * 100)}%`,
                      background: viewingCamp.currentOccupancy >= viewingCamp.maximumCapacity ? "#ef4444" : "#3b82f6",
                      borderRadius: "5px",
                    }}
                  ></div>
                </div>
              </div>

              {/* Facilities */}
              <div style={{ marginBottom: "16px" }}>
                <h4 style={{ fontSize: "14px", color: "#f8fafc", marginBottom: "8px" }}>Base Camp Facilities</h4>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {viewingCamp.medicalFacility && (
                    <span style={{ background: "rgba(16, 185, 129, 0.2)", color: "#34d399", padding: "4px 10px", borderRadius: "15px", fontSize: "12px", fontWeight: "700" }}>
                      🏥 Medical Unit ({viewingCamp.medicalDetails?.medicalFacilityName || "Active"})
                    </span>
                  )}
                  {Object.entries(viewingCamp.facilities || {}).map(([key, enabled]) =>
                    enabled ? (
                      <span key={key} style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", padding: "4px 10px", borderRadius: "15px", fontSize: "12px", fontWeight: "600" }}>
                        ✓ {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                      </span>
                    ) : null
                  )}
                </div>
              </div>

              {/* Contact & Hours */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ background: "#0f172a", padding: "12px", borderRadius: "10px", border: "1px solid #1e293b" }}>
                  <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "700" }}>CONTACT PERSON</div>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "#f8fafc", marginTop: "2px" }}>{viewingCamp.contactPerson}</div>
                  <div style={{ fontSize: "12px", color: "#60a5fa" }}>📞 {viewingCamp.contactNumber}</div>
                  {viewingCamp.email && <div style={{ fontSize: "11.5px", color: "#94a3b8" }}>✉️ {viewingCamp.email}</div>}
                </div>

                <div style={{ background: "#0f172a", padding: "12px", borderRadius: "10px", border: "1px solid #1e293b" }}>
                  <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "700" }}>OPERATING HOURS</div>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "#f8fafc", marginTop: "2px" }}>
                    {viewingCamp.openingTime} - {viewingCamp.closingTime}
                  </div>
                  <div style={{ fontSize: "12px", color: "#34d399" }}>
                    Opened: {new Date(viewingCamp.openingDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={() => setViewingCamp(null)}>
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DEACTIVATE MODAL */}
      {deleteModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "480px" }}>
            <div className="modal-header">
              <h3 style={{ color: "#ef4444", display: "flex", alignItems: "center", gap: "8px" }}>
                <FiAlertTriangle /> Confirm Base Camp Deactivation
              </h3>
              <button className="btn-close-modal" onClick={() => setDeleteModal({ isOpen: false, campId: null, campName: "" })}>
                <FiX />
              </button>
            </div>

            <div className="modal-body deactivate-modal-body" style={{ background: "#ffffff", padding: "24px" }}>
              <p style={{ fontSize: "15px", color: "#000000", fontWeight: "700", margin: 0, lineHeight: "1.5" }}>
                Are you sure you want to deactivate base camp <strong style={{ color: "#000000", fontWeight: "800" }}>"{deleteModal.campName}"</strong>?
              </p>
              <p style={{ fontSize: "13.5px", color: "#000000", marginTop: "10px", lineHeight: "1.5", fontWeight: "600" }}>
                Deactivating this base camp will mark its operational status as Inactive without deleting historical pilgrim logs or emergency records.
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setDeleteModal({ isOpen: false, campId: null, campName: "" })}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-submit-doctor"
                onClick={handleConfirmDelete}
                disabled={submitting}
                style={{ background: "#dc2626" }}
              >
                {submitting ? "Deactivating..." : "Deactivate Base Camp"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminBaseCamps;
