import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import UserSidebar from "../components/UserSidebar";
import JourneyMap from "../components/JourneyMap";
import { useAuth } from "../context/AuthContext";
import { apiGetPilgrimageCenterById, apiGetProfile } from "../services/api";
import {
  apiCreateJourney,
  apiUpdateJourney,
  apiGetMyJourneys,
  apiGetJourneyById,
  apiGetNearbyServices,
  apiAcceptResponsibility,
} from "../services/journeyService";
import { apiGetWeatherByCenterId } from "../services/weatherService";
import WeatherCard from "../components/WeatherCard";
import "../styles/JourneyPlanner.css";
import PlaceDetailsModal from "../components/PlaceDetailsModal";
import ViewAllServicesModal from "../components/ViewAllServicesModal";
import AccommodationBookingModal from "../components/AccommodationBookingModal";
import {
  apiGetMyAccommodationBookings,
  apiModifyAccommodationBookingDates,
} from "../services/accommodationBookingService";
import {
  FiMapPin,
  FiCalendar,
  FiUsers,
  FiTruck,
  FiHome,
  FiCheckCircle,
  FiArrowLeft,
  FiAlertCircle,
  FiCompass,
  FiShield,
  FiX,
  FiInfo,
  FiNavigation
} from "react-icons/fi";

const INDIAN_STATES_AND_UTS = [
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
  "Puducherry",
];

function JourneyPlanner() {
  const { pilgrimageCenterId } = useParams();
  const navigate = useNavigate();
  const { token, user: authUser } = useAuth();

  // Step 1: Center & User Data state
  const [center, setCenter] = useState(null);
  const [loadingCenter, setLoadingCenter] = useState(true);
  const [centerError, setCenterError] = useState("");

  // Weather State
  const [weatherData, setWeatherData] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState("");

  const [userProfile, setUserProfile] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loadingFamily, setLoadingFamily] = useState(true);

  // Responsibility Confirmation Modal State
  const [showResponsibilityModal, setShowResponsibilityModal] = useState(false);
  const [responsibilityTarget, setResponsibilityTarget] = useState(null); // { type: 'user'|'family_member', name, relationship, familyMemberId, isRejected, doctorReason }
  const [submittingResponsibility, setSubmittingResponsibility] = useState(false);

  // Form State
  const [journeyDate, setJourneyDate] = useState("");
  const [returnDate, setReturnDate] = useState("");

  const [selectedFamilyMemberIds, setSelectedFamilyMemberIds] = useState([]);
  const [travelingAlone, setTravelingAlone] = useState(false);

  const [locationType, setLocationType] = useState("manual"); // 'current' or 'manual'
  const [startLocation, setStartLocation] = useState({
    address: "",
    city: "",
    state: "",
    country: "India",
    latitude: null,
    longitude: null,
  });

  const [transportMode, setTransportMode] = useState("Car");
  const [walkingLevel, setWalkingLevel] = useState("Moderate");
  const [budgetType, setBudgetType] = useState("Moderate");
  const [customBudgetAmount, setCustomBudgetAmount] = useState("");

  const [accommodationRequired, setAccommodationRequired] = useState(true);
  const [foodRequired, setFoodRequired] = useState(true);
  const [foodPreference, setFoodPreference] = useState("No preference");
  const [searchRadius, setSearchRadius] = useState(5);

  // Validation Touch & Error states
  const [fieldTouch, setFieldTouch] = useState({
    journeyDate: false,
    returnDate: false,
    city: false,
    state: false,
    address: false,
    transportMode: false,
    walkingLevel: false,
    budgetType: false,
    customBudgetAmount: false,
    foodPreference: false,
  });

  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState("");

  // Nearby Services & Selection
  const [activeCategory, setActiveCategory] = useState("accommodation");
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [selectedDetailPlace, setSelectedDetailPlace] = useState(null);
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);
  const [bookingTargetPlace, setBookingTargetPlace] = useState(null);
  const [selectedServices, setSelectedServices] = useState({
    accommodation: [],
    restaurants: [],
    parking: [],
    hospitals: [],
    pharmacies: [],
    restrooms: [],
    drinkingWater: [],
    atms: [],
  });

  // Flow State: 'form' -> 'summary'
  const [currentStep, setCurrentStep] = useState("form");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Reschedule & Duplicate Conflict States
  const [searchParams] = useSearchParams();
  const queryRescheduleId = searchParams.get("rescheduleJourneyId");
  const [rescheduleJourneyId, setRescheduleJourneyId] = useState(queryRescheduleId || null);
  const [isRescheduleMode, setIsRescheduleMode] = useState(Boolean(queryRescheduleId));
  const [userJourneys, setUserJourneys] = useState([]);
  const [existingCenterJourney, setExistingCenterJourney] = useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  // Accommodation Bookings to track confirmed reservations
  const [userAccommodationBookings, setUserAccommodationBookings] = useState([]);
  const [showAccommodationModal, setShowAccommodationModal] = useState(false);
  const [accommodationActionLoading, setAccommodationActionLoading] = useState(false);
  const [accommodationActionSuccess, setAccommodationActionSuccess] = useState("");
  const [accommodationActionError, setAccommodationActionError] = useState("");
  const [accommodationChoice, setAccommodationChoice] = useState(""); // 'retained' | 'modified' | 'alternative'

  // Fetch user confirmed bookings
  useEffect(() => {
    const fetchUserAccommodationBookings = async () => {
      if (!token) return;
      try {
        const res = await apiGetMyAccommodationBookings(token);
        if (res && Array.isArray(res.bookings)) {
          setUserAccommodationBookings(res.bookings);
        }
      } catch (err) {
        console.warn("Could not load user accommodation bookings:", err);
      }
    };
    fetchUserAccommodationBookings();
  }, [token]);

  // Check if an accommodation booking exists for this journey
  const getLinkedAccommodationBooking = useCallback(() => {
    if (!userAccommodationBookings || userAccommodationBookings.length === 0) return null;
    return userAccommodationBookings.find((b) => {
      if (b.bookingStatus === "CANCELLED") return false;
      if (rescheduleJourneyId && b.journeyId) {
        const bJid = b.journeyId._id ? b.journeyId._id.toString() : b.journeyId.toString();
        if (bJid === rescheduleJourneyId.toString()) return true;
      }
      return false;
    });
  }, [userAccommodationBookings, rescheduleJourneyId]);

  // Compare existing accommodation reservation dates with proposed journey dates
  const hasAccommodationDatesMismatch = useCallback(() => {
    const booking = getLinkedAccommodationBooking();
    if (!booking || !journeyDate || !returnDate) return false;
    const bIn = typeof booking.checkInDate === "string"
      ? booking.checkInDate.split("T")[0]
      : new Date(booking.checkInDate).toISOString().split("T")[0];
    const bOut = typeof booking.checkOutDate === "string"
      ? booking.checkOutDate.split("T")[0]
      : new Date(booking.checkOutDate).toISOString().split("T")[0];
    return bIn !== journeyDate || bOut !== returnDate;
  }, [getLinkedAccommodationBooking, journeyDate, returnDate]);

  const handleRetainAccommodation = () => {
    setAccommodationChoice("retained");
    setShowAccommodationModal(false);
    setAccommodationActionSuccess("Kept existing accommodation booking dates unchanged.");
    setAccommodationActionError("");
  };

  const handleModifyAccommodationDates = async () => {
    const booking = getLinkedAccommodationBooking();
    if (!booking) return;

    if (
      !window.confirm(
        `Are you sure you want to update your accommodation booking at "${booking.accommodationName}" to check in on ${journeyDate} and check out on ${returnDate}?`
      )
    ) {
      return;
    }

    try {
      setAccommodationActionLoading(true);
      setAccommodationActionError("");
      const res = await apiModifyAccommodationBookingDates(
        booking._id,
        { checkInDate: journeyDate, checkOutDate: returnDate },
        token
      );
      if (res && res.success) {
        setAccommodationChoice("modified");
        setShowAccommodationModal(false);
        setAccommodationActionSuccess(
          `Accommodation reservation at ${booking.accommodationName} updated to ${journeyDate} – ${returnDate}!`
        );
        // Refresh accommodation bookings list
        const fresh = await apiGetMyAccommodationBookings(token);
        if (fresh && Array.isArray(fresh.bookings)) {
          setUserAccommodationBookings(fresh.bookings);
        }
      } else {
        throw new Error(res.message || "Failed to update accommodation reservation dates.");
      }
    } catch (err) {
      setAccommodationActionError(err.message || "Failed to update accommodation reservation.");
    } finally {
      setAccommodationActionLoading(false);
    }
  };

  const handleFindAlternativeAccommodation = () => {
    setAccommodationChoice("alternative");
    setShowAccommodationModal(false);
    setAccommodationRequired(true);
    setActiveCategory("accommodation");
    const section = document.getElementById("nearby-services-section");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Handler to enter reschedule mode and prefill journey details
  const handleStartReschedule = useCallback((targetJourney) => {
    if (!targetJourney) return;
    setIsRescheduleMode(true);
    setRescheduleJourneyId(targetJourney._id);
    setShowDuplicateModal(false);

    if (targetJourney.journeyDate) {
      const dStr = typeof targetJourney.journeyDate === "string"
        ? targetJourney.journeyDate.split("T")[0]
        : new Date(targetJourney.journeyDate).toISOString().split("T")[0];
      setJourneyDate(dStr);
    }
    if (targetJourney.returnDate) {
      const rStr = typeof targetJourney.returnDate === "string"
        ? targetJourney.returnDate.split("T")[0]
        : new Date(targetJourney.returnDate).toISOString().split("T")[0];
      setReturnDate(rStr);
    }
    if (targetJourney.transportMode) {
      setTransportMode(targetJourney.transportMode);
    }
    if (targetJourney.walkingLevel) {
      setWalkingLevel(targetJourney.walkingLevel);
    }
    if (targetJourney.budget) {
      setBudgetType(targetJourney.budget.type || "Moderate");
      if (targetJourney.budget.amount) {
        setCustomBudgetAmount(targetJourney.budget.amount.toString());
      }
    }
    if (targetJourney.startLocation) {
      setStartLocation({
        address: targetJourney.startLocation.address || "",
        city: targetJourney.startLocation.city || "",
        state: targetJourney.startLocation.state || "",
        country: targetJourney.startLocation.country || "India",
        latitude: targetJourney.startLocation.latitude || null,
        longitude: targetJourney.startLocation.longitude || null,
      });
      if (targetJourney.startLocation.type) {
        setLocationType(targetJourney.startLocation.type);
      }
    }
    if (targetJourney.travelingAlone !== undefined) {
      setTravelingAlone(targetJourney.travelingAlone);
    }
    if (Array.isArray(targetJourney.travelingFamilyMembers)) {
      setSelectedFamilyMemberIds(
        targetJourney.travelingFamilyMembers.map((m) => (typeof m === "object" ? m._id : m))
      );
    }
    if (targetJourney.accommodationRequired !== undefined) {
      setAccommodationRequired(targetJourney.accommodationRequired);
    }
    if (targetJourney.foodRequired !== undefined) {
      setFoodRequired(targetJourney.foodRequired);
    }
    if (targetJourney.foodPreference) {
      setFoodPreference(targetJourney.foodPreference);
    }
    if (targetJourney.searchRadius) {
      setSearchRadius(targetJourney.searchRadius);
    }
    if (targetJourney.selectedServices) {
      setSelectedServices(targetJourney.selectedServices);
    }
  }, []);

  const handleKeepExistingJourney = () => {
    setShowDuplicateModal(false);
    if (existingCenterJourney?._id) {
      navigate(`/journey/${existingCenterJourney._id}`);
    } else {
      navigate("/my-journeys");
    }
  };

  // Fetch user journeys to check for conflicts and duplicate centre
  useEffect(() => {
    const fetchUserJourneys = async () => {
      if (!token) return;
      try {
        const res = await apiGetMyJourneys(token);
        if (res && Array.isArray(res.journeys)) {
          setUserJourneys(res.journeys);

          // If query param specifies rescheduleJourneyId, load target
          if (queryRescheduleId) {
            const target = res.journeys.find((j) => j._id === queryRescheduleId);
            if (target) {
              handleStartReschedule(target);
            } else {
              try {
                const singleRes = await apiGetJourneyById(queryRescheduleId, token);
                if (singleRes && singleRes.journey) {
                  handleStartReschedule(singleRes.journey);
                }
              } catch (singleErr) {
                console.warn("Could not load journey by queryRescheduleId:", singleErr);
              }
            }
          } else {
            // Check for active journey to the same centre
            const activeCenterJourney = res.journeys.find((j) => {
              const inactive = ["cancelled", "CANCELLED", "completed", "COMPLETED", "expired", "EXPIRED"];
              if (inactive.includes(j.status)) return false;
              const cId = j.pilgrimageCenterId?._id || j.pilgrimageCenterId;
              return cId && cId.toString() === pilgrimageCenterId?.toString();
            });

            if (activeCenterJourney) {
              setExistingCenterJourney(activeCenterJourney);
              setShowDuplicateModal(true);
            }
          }
        }
      } catch (err) {
        console.warn("Could not load user journeys for duplicate check:", err);
      }
    };

    fetchUserJourneys();
  }, [token, pilgrimageCenterId, queryRescheduleId, handleStartReschedule]);

  const isAccommodationBooked = useCallback((place) => {
    if (!place || !userAccommodationBookings || userAccommodationBookings.length === 0) return false;
    return userAccommodationBookings.some((b) => {
      if (b.bookingStatus === "CANCELLED") return false;
      const matchId = b.placeId && place.externalPlaceId && b.placeId === place.externalPlaceId;
      const bName = (b.accommodationName || "").toLowerCase().trim();
      const pName = (place.name || "").toLowerCase().trim();
      const matchName = bName && pName && (bName === pName || bName.includes(pName) || pName.includes(bName));
      return matchId || matchName;
    });
  }, [userAccommodationBookings]);

  // Check if planning journey details (dates and travel mode) are filled
  const isJourneyPlannerSectionFilled = Boolean(
    journeyDate &&
    returnDate &&
    transportMode
  );

  const isCurrentCategoryDisabled =
    (activeCategory === "accommodation" && !accommodationRequired) ||
    (activeCategory === "restaurants" && !foodRequired);

  // Load Pilgrimage Center
  useEffect(() => {
    const fetchCenter = async () => {
      try {
        setLoadingCenter(true);
        const data = await apiGetPilgrimageCenterById(pilgrimageCenterId);
        setCenter(data);
      } catch (err) {
        console.error("Error loading center:", err);
        setCenterError(err.message || "Failed to load pilgrimage center details.");
      } finally {
        setLoadingCenter(false);
      }
    };

    if (pilgrimageCenterId) {
      fetchCenter();
    }
  }, [pilgrimageCenterId]);

  // Load Weather Information for Pilgrimage Center
  const fetchWeather = async (forceRefresh = false) => {
    if (!pilgrimageCenterId) return;
    try {
      setLoadingWeather(true);
      setWeatherError("");
      const data = await apiGetWeatherByCenterId(pilgrimageCenterId, journeyDate || null, token, forceRefresh);
      setWeatherData(data);
    } catch (err) {
      console.error("Error loading weather details:", err);
      setWeatherError(err.message || "Weather information is temporarily unavailable.");
    } finally {
      setLoadingWeather(false);
    }
  };

  useEffect(() => {
    if (pilgrimageCenterId) {
      fetchWeather();
    }
  }, [pilgrimageCenterId, journeyDate, token]);

  // Load User Profile & Family Members
  useEffect(() => {
    const fetchUserFamily = async () => {
      if (!token) return;
      try {
        setLoadingFamily(true);
        const profile = await apiGetProfile(token);
        if (profile) {
          setUserProfile(profile);
          if (Array.isArray(profile.familyMembers)) {
            setFamilyMembers(profile.familyMembers);
          }
        }
      } catch (err) {
        console.error("Failed to load user profile & family members:", err);
      } finally {
        setLoadingFamily(false);
      }
    };
    fetchUserFamily();
  }, [token]);

  const refreshProfileData = async () => {
    if (!token) return;
    try {
      const profile = await apiGetProfile(token);
      if (profile) {
        setUserProfile(profile);
        if (Array.isArray(profile.familyMembers)) {
          setFamilyMembers(profile.familyMembers);
        }
      }
    } catch (err) {
      console.error("Failed to refresh profile:", err);
    }
  };

  const handleOpenResponsibilityModal = (target) => {
    setResponsibilityTarget(target);
    setShowResponsibilityModal(true);
  };

  const handleConfirmAcceptResponsibility = async () => {
    if (!responsibilityTarget) return;
    try {
      setSubmittingResponsibility(true);
      const payload = responsibilityTarget.type === "family_member"
        ? { personType: "family_member", familyMemberId: responsibilityTarget.familyMemberId }
        : { personType: "user" };

      await apiAcceptResponsibility(payload, token);
      setShowResponsibilityModal(false);
      await refreshProfileData();
    } catch (err) {
      setSubmitError(err.message || "Failed to accept travel responsibility.");
    } finally {
      setSubmittingResponsibility(false);
    }
  };

  // Fetch Nearby Services when center coordinates, active category, search radius, or food preference changes
  useEffect(() => {
    const fetchServices = async () => {
      if (!center || !center.location || !center.location.latitude) return;
      try {
        setLoadingNearby(true);
        const data = await apiGetNearbyServices(
          center.location.latitude,
          center.location.longitude,
          searchRadius,
          activeCategory,
          foodPreference,
          token
        );
        if (data && Array.isArray(data.places)) {
          setNearbyPlaces(data.places);
        } else {
          setNearbyPlaces([]);
        }
      } catch (err) {
        console.error("Failed to fetch nearby services:", err);
        setNearbyPlaces([]);
      } finally {
        setLoadingNearby(false);
      }
    };

    fetchServices();
  }, [center, searchRadius, activeCategory, foodPreference, token]);

  // Handle Geolocation with IP fallback for guaranteed success
  const handleCurrentLocationSelect = () => {
    setLocationType("current");

    const fallbackToIp = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/").then((r) => r.json()).catch(() => null);
        if (res && res.latitude && res.longitude) {
          const locName = [res.city, res.region, res.country_name].filter(Boolean).join(", ") || "Current Location";
          setStartLocation({
            address: locName,
            city: res.city || "Current City",
            state: res.region || "Kerala",
            country: res.country_name || "India",
            latitude: res.latitude,
            longitude: res.longitude,
          });
          return;
        }

        const res2 = await fetch("http://ip-api.com/json").then((r) => r.json()).catch(() => null);
        if (res2 && res2.lat && res2.lon) {
          const locName = [res2.city, res2.regionName, res2.country].filter(Boolean).join(", ") || "Current Location";
          setStartLocation({
            address: locName,
            city: res2.city || "Current City",
            state: res2.regionName || "Kerala",
            country: res2.country || "India",
            latitude: res2.lat,
            longitude: res2.lon,
          });
          return;
        }

        // Default location fallback (Kerala)
        setStartLocation({
          address: "Current Geolocation (Kerala)",
          city: "Thiruvananthapuram",
          state: "Kerala",
          country: "India",
          latitude: 8.5241,
          longitude: 76.9366,
        });
      } catch (e) {
        console.warn("IP Geolocation fallback error:", e);
        setStartLocation({
          address: "Current Geolocation (Kerala)",
          city: "Thiruvananthapuram",
          state: "Kerala",
          country: "India",
          latitude: 8.5241,
          longitude: 76.9366,
        });
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          try {
            const geoRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            ).then((r) => r.json()).catch(() => null);

            const displayAddr = geoRes && geoRes.display_name ? geoRes.display_name : "Current Geolocation";
            const addrObj = geoRes && geoRes.address ? geoRes.address : {};
            const city = addrObj.city || addrObj.town || addrObj.village || addrObj.suburb || "Current City";
            const state = addrObj.state || "Kerala";
            const country = addrObj.country || "India";

            setStartLocation({
              address: displayAddr,
              city,
              state,
              country,
              latitude: lat,
              longitude: lng,
            });
          } catch (e) {
            setStartLocation({
              address: "Current Geolocation",
              city: "Current City",
              state: "Kerala",
              country: "India",
              latitude: lat,
              longitude: lng,
            });
          }
        },
        (err) => {
          console.warn("Browser Geolocation failed/denied, falling back to IP location:", err.message);
          fallbackToIp();
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
      );
    } else {
      fallbackToIp();
    }
  };

  // Field Focus & Blur Handlers
  const handleFieldFocus = (fieldName) => {
    setFocusedField(fieldName);
    setFieldTouch((prev) => ({ ...prev, [fieldName]: true }));
  };

  const handleFieldBlur = (fieldName) => {
    setFocusedField("");
    setFieldTouch((prev) => ({ ...prev, [fieldName]: true }));
  };

  // Helper to render EXACTLY 1 SINGLE error message per field (shown on focus / touch when rule is violated)
  const renderSingleFieldMessage = (fieldName) => {
    const isTouched = fieldTouch[fieldName];
    const isFocused = focusedField === fieldName;
    const errorMsg = errors[fieldName];

    if ((isFocused || isTouched) && errorMsg) {
      return <span className="error-text">⚠️ {errorMsg}</span>;
    }

    return null;
  };

  // Date Sanitizer - enforces max 4-digit year YYYY
  const sanitizeDateInput = (val) => {
    if (!val) return "";
    const parts = val.split("-");
    if (parts[0] && parts[0].length > 4) {
      parts[0] = parts[0].slice(0, 4);
      return parts.join("-");
    }
    return val;
  };

  // Validation Logic
  const validate = useCallback(() => {
    const errs = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!journeyDate) {
      errs.journeyDate = "Journey start date is required.";
    } else {
      const yearStr = journeyDate.split("-")[0];
      const yearNum = parseInt(yearStr, 10);
      if (yearStr.length !== 4 || isNaN(yearNum) || yearNum > 2100) {
        errs.journeyDate = "Year must be a valid 4-digit year (e.g., 2026).";
      } else if (new Date(journeyDate) < today) {
        errs.journeyDate = "Journey date cannot be in the past.";
      }
    }

    if (!returnDate) {
      errs.returnDate = "Expected return date is required.";
    } else {
      const yearStr = returnDate.split("-")[0];
      const yearNum = parseInt(yearStr, 10);
      if (yearStr.length !== 4 || isNaN(yearNum) || yearNum > 2100) {
        errs.returnDate = "Year must be a valid 4-digit year (e.g., 2026).";
      } else if (new Date(returnDate) < new Date(journeyDate)) {
        errs.returnDate = "Return date must be the same as or later than the journey start date.";
      }
    }

    // Overlapping Journey Date Validation (Rule 1: Same date, different centres or any other active journey)
    if (journeyDate && !errs.journeyDate && userJourneys && userJourneys.length > 0) {
      const selectedStart = new Date(journeyDate);
      selectedStart.setHours(0, 0, 0, 0);
      const selectedEnd = returnDate ? new Date(returnDate) : new Date(journeyDate);
      selectedEnd.setHours(23, 59, 59, 999);

      const hasConflict = userJourneys.some((j) => {
        // Exclude the journey currently being rescheduled
        if (rescheduleJourneyId && (j._id === rescheduleJourneyId || j._id?.toString() === rescheduleJourneyId.toString())) {
          return false;
        }
        const inactive = ["cancelled", "CANCELLED", "completed", "COMPLETED", "expired", "EXPIRED"];
        if (inactive.includes(j.status)) {
          return false;
        }

        const jStart = new Date(j.journeyDate);
        jStart.setHours(0, 0, 0, 0);
        const jEnd = j.returnDate ? new Date(j.returnDate) : new Date(j.journeyDate);
        jEnd.setHours(23, 59, 59, 999);

        return selectedStart <= jEnd && jStart <= selectedEnd;
      });

      if (hasConflict) {
        errs.journeyDate = "You already have a journey scheduled for this date. Please choose another date or reschedule your existing journey.";
      }
    }

    if (locationType === "manual") {
      if (!startLocation.city || !startLocation.city.trim()) {
        errs.city = "City / Origin is required.";
      } else if (!/^[a-zA-Z\s]+$/.test(startLocation.city.trim())) {
        errs.city = "Only letters are allowed.";
      }

      if (!startLocation.state || !startLocation.state.trim()) {
        errs.state = "State selection is required.";
      }

      if (!startLocation.address || !startLocation.address.trim()) {
        errs.address = "Full address or landmark is required.";
      } else if (startLocation.address.trim().length < 5) {
        errs.address = "Address / Landmark must be at least 5 characters long.";
      } else if (/^[0-9\s\-,.]+$/.test(startLocation.address.trim())) {
        errs.address = "Address cannot consist of numbers only.";
      }
    }

    if (!transportMode) {
      errs.transportMode = "Mode of transport selection is required.";
    }

    if (!walkingLevel) {
      errs.walkingLevel = "Expected walking level selection is required.";
    }

    if (!budgetType) {
      errs.budgetType = "Travel budget selection is required.";
    }

    if (budgetType === "Custom") {
      const amt = parseFloat(customBudgetAmount);
      if (!customBudgetAmount || isNaN(amt) || amt <= 0) {
        errs.customBudgetAmount = "Custom budget amount is required.";
      }
    }

    if (foodRequired && !foodPreference) {
      errs.foodPreference = "Dietary preference selection is required.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [
    journeyDate,
    returnDate,
    userJourneys,
    rescheduleJourneyId,
    locationType,
    startLocation.city,
    startLocation.state,
    startLocation.address,
    transportMode,
    walkingLevel,
    budgetType,
    customBudgetAmount,
    foodRequired,
    foodPreference,
  ]);

  useEffect(() => {
    validate();
  }, [validate]);

  // Family Member Checkbox Handler
  const handleToggleFamilyMember = (memberId) => {
    setTravelingAlone(false);
    setSelectedFamilyMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleToggleTravelingAlone = () => {
    setTravelingAlone((prev) => {
      if (!prev) {
        setSelectedFamilyMemberIds([]);
      }
      return !prev;
    });
  };

  // Toggle selected place card
  const handleToggleSelectPlace = (place) => {
    const category = place.category || activeCategory;
    setSelectedServices((prev) => {
      const list = prev[category] || [];
      const exists = list.some((item) => item.externalPlaceId === place.externalPlaceId);
      const updatedList = exists
        ? list.filter((item) => item.externalPlaceId !== place.externalPlaceId)
        : [...list, place];

      return {
        ...prev,
        [category]: updatedList,
      };
    });
  };

  // Calculate Total Pilgrims
  const totalPilgrimsCount = travelingAlone ? 1 : 1 + selectedFamilyMemberIds.length;

  // Proceed to Summary View
  const handleReviewSummary = (e) => {
    e.preventDefault();
    setFieldTouch({
      journeyDate: true,
      returnDate: true,
      city: true,
      state: true,
      address: true,
      transportMode: true,
      walkingLevel: true,
      budgetType: true,
      customBudgetAmount: true,
      foodPreference: true,
    });

    if (validate()) {
      setCurrentStep("summary");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      alert("Please fix the validation errors before proceeding.");
    }
  };

  // Submit & Start Journey (handles both new booking and reschedule)
  const handleConfirmSaveJourney = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      setSubmitError("");

      const payload = {
        pilgrimageCenterId,
        journeyDate,
        returnDate,
        travelingFamilyMembers: travelingAlone ? [] : selectedFamilyMemberIds,
        travelingAlone,
        startLocation: {
          type: locationType,
          address: startLocation.address,
          city: startLocation.city,
          state: startLocation.state,
          country: startLocation.country,
          latitude: startLocation.latitude,
          longitude: startLocation.longitude,
        },
        transportMode,
        walkingLevel,
        budget: {
          type: budgetType,
          amount: budgetType === "Custom" ? parseFloat(customBudgetAmount) : 0,
        },
        accommodationRequired,
        foodRequired,
        foodPreference,
        searchRadius,
        selectedServices,
      };

      if (isRescheduleMode && rescheduleJourneyId) {
        const linkedBooking = getLinkedAccommodationBooking();
        if (linkedBooking && hasAccommodationDatesMismatch() && !accommodationChoice) {
          setShowAccommodationModal(true);
          setSubmitting(false);
          return;
        }

        // Update existing record
        const result = await apiUpdateJourney(rescheduleJourneyId, payload, token);
        if (result && result.journey) {
          navigate(`/travel-assessment/${result.journey._id}`);
        } else {
          throw new Error("Failed to reschedule journey record.");
        }
      } else {
        // Create new journey plan
        const result = await apiCreateJourney(payload, token);
        if (result && result.journey) {
          navigate(`/travel-assessment/${result.journey._id}`);
        } else {
          throw new Error("Failed to create journey record");
        }
      }
    } catch (err) {
      console.error("Save journey error:", err);
      if (err.conflictType === "DUPLICATE_CENTRE" || (err.message && err.message.includes("already scheduled for"))) {
        if (err.existingJourney) {
          setExistingCenterJourney(err.existingJourney);
        }
        setShowDuplicateModal(true);
      } else if (err.conflictType === "DATE_CONFLICT" || (err.message && err.message.includes("already have a journey scheduled for this date"))) {
        setErrors((prev) => ({
          ...prev,
          journeyDate: "You already have a journey scheduled for this date. Please choose another date or reschedule your existing journey.",
        }));
      }
      setSubmitError(err.message || "Failed to save journey.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingCenter) {
    return (
      <div className="journey-planner-page">
        <Navbar />
        <div className="planner-loading-card">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (centerError || !center) {
    return (
      <div className="journey-planner-page">
        <Navbar />
        <div className="planner-error-card">
          <FiAlertCircle size={44} className="err-icon" />
          <h3>Pilgrimage Center Not Found</h3>
          <p>{centerError || "The specified pilgrimage center does not exist."}</p>
          <Link to="/centers" className="btn-primary-blue">
            Back to Pilgrimage Centers
          </Link>
        </div>
      </div>
    );
  }

  const selectedFamilyObjects = familyMembers.filter((m) =>
    selectedFamilyMemberIds.includes(m._id)
  );

  return (
    <div className="journey-planner-page pilgrim-dashboard-wrapper">
      <Navbar />

      <div className="pilgrim-dashboard-container">
        <UserSidebar activeTab="journey-planner" />

        <div className="pilgrim-main-content" style={{ padding: 0 }}>
          <div className="planner-hero-banner">
            <div className="banner-content">
              <div className="breadcrumb-nav">
                <Link to="/centers">
                  <FiArrowLeft /> Pilgrimage Centers
                </Link>{" "}
                / <span>Journey Planner</span>
              </div>
              <h1>
                Journey Planning & Trip Setup
              </h1>
              <p>Configure your pilgrimage dates, traveling pilgrims, route preferences, and nearby support services.</p>
            </div>
          </div>

          <div className="planner-container">
            {/* DUPLICATE JOURNEY SCHEDULING MODAL (Rule 2) */}
            {showDuplicateModal && existingCenterJourney && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "rgba(15, 23, 42, 0.75)",
                  backdropFilter: "blur(4px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 9999,
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: "16px",
                    maxWidth: "520px",
                    width: "100%",
                    padding: "30px",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                    border: "1px solid #e2e8f0",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      background: "#eff6ff",
                      color: "#2563eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 16px",
                      fontSize: "28px",
                    }}
                  >
                    <FiCalendar />
                  </div>

                  <h3 style={{ fontSize: "21px", fontWeight: "800", color: "#0f172a", marginBottom: "10px" }}>
                    Journey Already Scheduled
                  </h3>

                  <p style={{ fontSize: "15px", color: "#475569", lineHeight: "1.6", marginBottom: "20px" }}>
                    A journey to this pilgrimage centre is already scheduled for{" "}
                    <strong style={{ color: "#0f172a" }}>
                      {new Date(existingCenterJourney.journeyDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </strong>
                    . Would you like to reschedule it?
                  </p>

                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      padding: "16px 20px",
                      marginBottom: "24px",
                      textAlign: "left",
                      fontSize: "14px",
                      color: "#334155",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <div>
                      <strong>Centre:</strong> {center?.name || existingCenterJourney.pilgrimageCenterId?.name || "Pilgrimage Centre"}
                    </div>
                    <div>
                      <strong>Scheduled Date:</strong>{" "}
                      {new Date(existingCenterJourney.journeyDate).toLocaleDateString()}
                      {existingCenterJourney.returnDate
                        ? ` – ${new Date(existingCenterJourney.returnDate).toLocaleDateString()}`
                        : ""}
                    </div>
                    <div>
                      <strong>Pilgrims:</strong> {existingCenterJourney.totalPilgrims} Person(s)
                    </div>
                    <div>
                      <strong>Transport:</strong> {existingCenterJourney.transportMode}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                    <button
                      type="button"
                      onClick={handleKeepExistingJourney}
                      style={{
                        flex: 1,
                        padding: "12px 18px",
                        borderRadius: "10px",
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        color: "#475569",
                        fontWeight: "700",
                        fontSize: "14px",
                        cursor: "pointer",
                      }}
                    >
                      Keep Existing Journey
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStartReschedule(existingCenterJourney)}
                      style={{
                        flex: 1,
                        padding: "12px 18px",
                        borderRadius: "10px",
                        border: "none",
                        background: "#2563eb",
                        color: "#ffffff",
                        fontWeight: "700",
                        fontSize: "14px",
                        cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                      }}
                    >
                      Reschedule Journey
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ACCOMMODATION RESCHEDULING OPTIONS MODAL (Section 11) */}
            {showAccommodationModal && (() => {
              const linked = getLinkedAccommodationBooking();
              if (!linked) return null;
              const bInStr = linked.checkInDate
                ? new Date(linked.checkInDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "";
              const bOutStr = linked.checkOutDate
                ? new Date(linked.checkOutDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "";
              const newStartStr = journeyDate
                ? new Date(journeyDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "";
              const newReturnStr = returnDate
                ? new Date(returnDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "";

              return (
                <div
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(15, 23, 42, 0.75)",
                    backdropFilter: "blur(4px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 9999,
                    padding: "20px",
                  }}
                >
                  <div
                    style={{
                      background: "#ffffff",
                      borderRadius: "16px",
                      maxWidth: "540px",
                      width: "100%",
                      padding: "28px",
                      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                      border: "1px solid #e2e8f0",
                      textAlign: "left",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "50%",
                          background: "#fef3c7",
                          color: "#d97706",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "24px",
                          flexShrink: 0,
                        }}
                      >
                        <FiHome />
                      </div>
                      <div>
                        <h3 style={{ fontSize: "19px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                          Existing Accommodation Booking
                        </h3>
                        <span style={{ fontSize: "13px", color: "#64748b" }}>
                          Reservation dates differ from new journey dates
                        </span>
                      </div>
                    </div>

                    <p style={{ fontSize: "14px", color: "#334155", lineHeight: "1.6", marginBottom: "16px" }}>
                      You have an existing booking at <strong>{linked.accommodationName}</strong> reserved for{" "}
                      <strong style={{ color: "#0f172a" }}>{bInStr} – {bOutStr}</strong>. Your new journey is scheduled for{" "}
                      <strong style={{ color: "#2563eb" }}>{newStartStr} – {newReturnStr}</strong>.
                      <br /><br />
                      PilgrimIQ does not automatically alter your reservation. Please choose how you would like to handle this booking:
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                      <button
                        type="button"
                        onClick={async () => {
                          handleRetainAccommodation();
                          await handleConfirmSaveJourney();
                        }}
                        style={{
                          padding: "14px 16px",
                          borderRadius: "10px",
                          border: "1px solid #cbd5e1",
                          background: "#f8fafc",
                          color: "#1e293b",
                          fontWeight: "700",
                          fontSize: "14px",
                          textAlign: "left",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        <span style={{ color: "#0f172a" }}>1. Retain Current Booking</span>
                        <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "normal" }}>
                          Keep existing reservation dates ({bInStr} – {bOutStr}) and proceed with journey rescheduling.
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          await handleModifyAccommodationDates();
                          await handleConfirmSaveJourney();
                        }}
                        disabled={accommodationActionLoading}
                        style={{
                          padding: "14px 16px",
                          borderRadius: "10px",
                          border: "1px solid #3b82f6",
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          fontWeight: "700",
                          fontSize: "14px",
                          textAlign: "left",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        <span style={{ color: "#1d4ed8" }}>
                          {accommodationActionLoading ? "Updating Accommodation Dates..." : "2. Request Booking Modification"}
                        </span>
                        <span style={{ fontSize: "12px", color: "#3b82f6", fontWeight: "normal" }}>
                          Update accommodation dates to match your new journey dates ({newStartStr} – {newReturnStr}) upon your confirmation.
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={handleFindAlternativeAccommodation}
                        style={{
                          padding: "14px 16px",
                          borderRadius: "10px",
                          border: "1px solid #cbd5e1",
                          background: "#ffffff",
                          color: "#334155",
                          fontWeight: "700",
                          fontSize: "14px",
                          textAlign: "left",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        <span style={{ color: "#0f172a" }}>3. Find Alternative Accommodation</span>
                        <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "normal" }}>
                          Browse and choose alternative accommodations available for your new journey dates.
                        </span>
                      </button>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        onClick={() => setShowAccommodationModal(false)}
                        style={{
                          padding: "8px 16px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          background: "#ffffff",
                          color: "#64748b",
                          fontSize: "13px",
                          fontWeight: "600",
                          cursor: "pointer",
                        }}
                      >
                        Close & Review
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* RESCHEDULE MODE ACTIVE BANNER */}
            {isRescheduleMode && (
              <div
                style={{
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: "12px",
                  padding: "14px 20px",
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  color: "#1e40af",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <FiInfo size={22} color="#2563eb" />
                  <div>
                    <strong style={{ display: "block", fontSize: "14.5px" }}>Reschedule Journey Mode Active</strong>
                    <span style={{ fontSize: "13px", color: "#3b82f6" }}>
                      Modifying your scheduled journey for {center?.name}. Update your dates and details below.
                    </span>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "800",
                    background: "#dbeafe",
                    padding: "4px 12px",
                    borderRadius: "6px",
                    color: "#1d4ed8",
                    letterSpacing: "0.5px",
                  }}
                >
                  RESCHEDULING
                </span>
              </div>
            )}

            {/* PILGRIMAGE CENTER HEADER CARD */}
            <div className="center-summary-header-card">
              <div className="center-thumb-box">
                <img
                  src={
                    center.image ||
                    "https://images.unsplash.com/photo-1548625149-fc4a29cf7092?q=80&w=800&auto=format&fit=crop"
                  }
                  alt={center.name}
                />
                <span className="religion-pill">{center.religion}</span>
              </div>

              <div className="center-info-box">
                <h2>{center.name}</h2>
                <p className="location-line">
                  <FiMapPin className="pin" /> {center.location?.city}, {center.location?.state},{" "}
                  {center.location?.country}
                </p>

                <div className="center-meta-tags">
                  <span className="meta-tag">☀️ Season: {center.visitingInformation?.bestSeason || "All Year"}</span>
                  <span className="meta-tag">🌡️ Climate: {center.visitingInformation?.climate || "Moderate"}</span>
                  <span className="meta-tag">🚶 Trek: {center.difficulty?.walking || "Moderate"}</span>
                  <span className="meta-tag">🧗 Climb: {center.difficulty?.climbing || "Moderate"}</span>
                  <span className="meta-tag">🕒 Hours: {center.timings?.openingTime} - {center.timings?.closingTime}</span>
                </div>

                <p className="center-desc">{center.description}</p>
              </div>
            </div>

            {/* WEATHER INTEGRATION MODULE */}
            <WeatherCard
              weatherData={weatherData}
              loading={loadingWeather}
              error={weatherError}
              centerName={center?.name}
              onRetry={() => fetchWeather(true)}
              selectedJourneyDate={journeyDate}
            />

            {/* STEP CONTROLS / TAB HEADERS */}
            <div className="planner-step-tabs">
              <button
                type="button"
                className={`step-tab-btn ${currentStep === "form" ? "active" : ""}`}
                onClick={() => setCurrentStep("form")}
              >
                1. Journey Configuration & Services
              </button>
              <button
                type="button"
                className={`step-tab-btn ${currentStep === "summary" ? "active" : ""}`}
                onClick={(e) => handleReviewSummary(e)}
              >
                2. Journey Summary & Confirmation
              </button>
            </div>

            {currentStep === "form" ? (
              <form onSubmit={handleReviewSummary} className="planner-main-form" noValidate>
                {/* SECTION 1: JOURNEY DATES */}
                <div className="form-section-card">
                  <div className="section-title">
                    <FiCalendar className="sec-icon" />
                    <div>
                      <h3>1. Journey Dates</h3>
                      <p>Select your departure and expected return dates</p>
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>
                        Journey Start Date *
                      </label>
                      <input
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        max="2099-12-31"
                        value={journeyDate}
                        onFocus={() => handleFieldFocus("journeyDate")}
                        onChange={(e) => setJourneyDate(sanitizeDateInput(e.target.value))}
                        onBlur={() => handleFieldBlur("journeyDate")}
                        className={`form-control ${fieldTouch.journeyDate && errors.journeyDate ? "input-error" : ""}`}
                        required
                      />
                      {renderSingleFieldMessage("journeyDate")}
                    </div>

                    <div className="form-group">
                      <label>
                        Expected Return Date *
                      </label>
                      <input
                        type="date"
                        min={journeyDate || new Date().toISOString().split("T")[0]}
                        max="2099-12-31"
                        value={returnDate}
                        onFocus={() => handleFieldFocus("returnDate")}
                        onChange={(e) => setReturnDate(sanitizeDateInput(e.target.value))}
                        onBlur={() => handleFieldBlur("returnDate")}
                        className={`form-control ${fieldTouch.returnDate && errors.returnDate ? "input-error" : ""}`}
                        required
                      />
                      {renderSingleFieldMessage("returnDate")}
                    </div>

                    {/* SECTION 11: ACCOMMODATION RESCHEDULING DATE COMPARISON NOTICE */}
                    {isRescheduleMode && (() => {
                      const linked = getLinkedAccommodationBooking();
                      if (!linked) return null;
                      const isMismatch = hasAccommodationDatesMismatch();
                      const bInStr = linked.checkInDate
                        ? new Date(linked.checkInDate).toLocaleDateString()
                        : "";
                      const bOutStr = linked.checkOutDate
                        ? new Date(linked.checkOutDate).toLocaleDateString()
                        : "";

                      return (
                        <div
                          style={{
                            gridColumn: "1 / -1",
                            marginTop: "16px",
                            padding: "16px 20px",
                            borderRadius: "12px",
                            border: isMismatch ? "1px solid #f59e0b" : "1px solid #86efac",
                            background: isMismatch ? "#fffbeb" : "#f0fdf4",
                            color: isMismatch ? "#92400e" : "#166534",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                            <FiHome size={22} style={{ marginTop: "2px", flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                              <strong style={{ fontSize: "14.5px", display: "block", marginBottom: "4px" }}>
                                {isMismatch ? "Accommodation Booking Notice: Dates Differ" : "Accommodation Booking Confirmed"}
                              </strong>
                              <p style={{ margin: "0 0 10px 0", fontSize: "13.5px", lineHeight: "1.5" }}>
                                {isMismatch ? (
                                  <>
                                    You have an existing accommodation booking at <strong>{linked.accommodationName}</strong> reserved for <strong>{bInStr} – {bOutStr}</strong>. Your proposed journey dates are <strong>{journeyDate ? new Date(journeyDate).toLocaleDateString() : ""} – {returnDate ? new Date(returnDate).toLocaleDateString() : ""}</strong>.
                                  </>
                                ) : (
                                  <>
                                    Your accommodation booking at <strong>{linked.accommodationName}</strong> matches your journey dates ({bInStr} – {bOutStr}).
                                  </>
                                )}
                              </p>

                              {isMismatch && (
                                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "8px" }}>
                                  <button
                                    type="button"
                                    onClick={handleRetainAccommodation}
                                    style={{
                                      padding: "8px 14px",
                                      borderRadius: "8px",
                                      border: "1px solid #d97706",
                                      background: accommodationChoice === "retained" ? "#d97706" : "#ffffff",
                                      color: accommodationChoice === "retained" ? "#ffffff" : "#92400e",
                                      fontWeight: "700",
                                      fontSize: "12.5px",
                                      cursor: "pointer",
                                    }}
                                  >
                                    {accommodationChoice === "retained" ? "✓ Keeping Current Booking" : "1. Retain Current Booking"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={handleModifyAccommodationDates}
                                    disabled={accommodationActionLoading}
                                    style={{
                                      padding: "8px 14px",
                                      borderRadius: "8px",
                                      border: "none",
                                      background: accommodationChoice === "modified" ? "#059669" : "#2563eb",
                                      color: "#ffffff",
                                      fontWeight: "700",
                                      fontSize: "12.5px",
                                      cursor: "pointer",
                                    }}
                                  >
                                    {accommodationActionLoading
                                      ? "Updating Accommodation..."
                                      : accommodationChoice === "modified"
                                      ? "✓ Dates Updated"
                                      : "2. Request Booking Modification"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={handleFindAlternativeAccommodation}
                                    style={{
                                      padding: "8px 14px",
                                      borderRadius: "8px",
                                      border: "1px solid #cbd5e1",
                                      background: "#ffffff",
                                      color: "#475569",
                                      fontWeight: "700",
                                      fontSize: "12.5px",
                                      cursor: "pointer",
                                    }}
                                  >
                                    3. Find Alternative Accommodation
                                  </button>
                                </div>
                              )}

                              {accommodationActionSuccess && (
                                <div style={{ marginTop: "10px", fontSize: "13px", color: "#166534", fontWeight: "600" }}>
                                  ✓ {accommodationActionSuccess}
                                </div>
                              )}
                              {accommodationActionError && (
                                <div style={{ marginTop: "10px", fontSize: "13px", color: "#dc2626", fontWeight: "600" }}>
                                  ✕ {accommodationActionError}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* SECTION 2: TRAVELLING FAMILY MEMBERS */}
                <div className="form-section-card">
                  <div className="section-title">
                    <FiUsers className="sec-icon" />
                    <div>
                      <h3>2. Select Travelling Family Members</h3>
                      <p>Choose family members accompanying you from your profile</p>
                    </div>
                    <div className="pilgrim-count-badge">
                      Total Pilgrims: <strong>{totalPilgrimsCount}</strong>
                    </div>
                  </div>

                  <div className="family-selector-wrapper">
                    <div className="alone-option-box">
                      <label className="checkbox-custom-label">
                        <input
                          type="checkbox"
                          checked={travelingAlone}
                          onChange={handleToggleTravelingAlone}
                        />
                        <span className="label-title">👤 Traveling Alone (No family members)</span>
                      </label>
                    </div>

                    {!travelingAlone && (
                      <div className="family-members-grid">
                        {loadingFamily ? (
                          <p className="loading-sub">Fetching your registered family members...</p>
                        ) : familyMembers.length > 0 ? (
                          familyMembers.map((member) => {
                            const isChecked = selectedFamilyMemberIds.includes(member._id);
                            return (
                              <div
                                key={member._id}
                                className={`family-member-card ${isChecked ? "selected" : ""}`}
                                onClick={() => handleToggleFamilyMember(member._id)}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => { }}
                                  style={{ marginRight: "10px" }}
                                />
                                <div className="member-avatar">
                                  {member.name ? member.name.charAt(0).toUpperCase() : "F"}
                                </div>
                                <div className="member-info">
                                  <h4>{member.name}</h4>
                                  <p>
                                    {member.relationship} {member.age ? `• ${member.age} Yrs` : ""}
                                  </p>
                                  {member.chronicConditions && (
                                    <span className="health-tag-warning">
                                      🩺 {member.chronicConditions}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="no-family-alert">
                            <p>No family members added in your profile yet.</p>
                            <Link to="/profile" className="btn-small-link">
                              + Add Family Members in Profile
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* SECTION 2.5: MEDICAL RISK ASSESSMENT & DOCTOR AUTHORIZATION */}
                <div className="form-section-card" style={{ background: "#0f172a", border: "1px solid #1e293b", color: "#f8fafc" }}>
                  <div className="section-title">
                    <FiShield className="sec-icon" style={{ color: "#3b82f6" }} />
                    <div>
                      <h3 style={{ color: "#f8fafc" }}>Medical Risk Assessment & Travel Authorization</h3>
                      <p style={{ color: "#94a3b8" }}>Individual clinical risk index, PSI score, and doctor clearance status for each traveler</p>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginTop: "16px" }}>
                    {/* MAIN USER CARD */}
                    {(() => {
                      const mainUserRisk = userProfile?.psiRiskLevel || "Low Risk";
                      const isHigh = mainUserRisk === "High Risk" || userProfile?.doctorApprovalStatus === "pending" || userProfile?.doctorApprovalStatus === "rejected";
                      const isMod = mainUserRisk === "Moderate Risk";
                      const docStatus = userProfile?.doctorApprovalStatus || "none";
                      const respAcc = userProfile?.responsibilityAccepted;

                      let statusText = "Safe to Continue";
                      let statusBg = "rgba(16,185,129,0.15)";
                      let statusColor = "#34d399";

                      if (isHigh) {
                        if (docStatus === "approved") {
                          statusText = "✓ Doctor Approved";
                          statusBg = "rgba(16,185,129,0.2)";
                          statusColor = "#34d399";
                        } else if (docStatus === "rejected") {
                          statusText = "✕ Doctor Rejected";
                          statusBg = "rgba(239,68,68,0.2)";
                          statusColor = "#f87171";
                        } else {
                          statusText = "Doctor Approval Required";
                          statusBg = "rgba(239,68,68,0.2)";
                          statusColor = "#f87171";
                        }
                      } else if (isMod) {
                        statusText = "Safety Advice";
                        statusBg = "rgba(245,158,11,0.2)";
                        statusColor = "#fbbf24";
                      }

                      return (
                        <div style={{ background: "#1e293b", padding: "16px", borderRadius: "12px", border: isHigh ? "1px solid #ef4444" : "1px solid #334155" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <span style={{ fontSize: "14px", fontWeight: "700", color: "#f8fafc" }}>
                              👤 {userProfile?.name || authUser?.name || "Main User"} (Self)
                            </span>
                            <span style={{ fontSize: "11px", background: statusBg, color: statusColor, padding: "3px 8px", borderRadius: "6px", fontWeight: "700" }}>
                              {statusText}
                            </span>
                          </div>

                          <div style={{ fontSize: "13px", color: "#cbd5e1", marginBottom: "6px" }}>
                            Medical Risk: <strong style={{ color: isHigh ? "#f87171" : isMod ? "#fbbf24" : "#34d399" }}>{isHigh ? "HIGH / CRITICAL" : isMod ? "MODERATE" : "LOW"}</strong>
                            {" • "}PSI: <strong>{userProfile?.psiScore || 95}/100</strong>
                          </div>

                          {docStatus === "rejected" && userProfile?.doctorReason && (
                            <div style={{ background: "#450a0a", border: "1px solid #dc2626", padding: "8px 10px", borderRadius: "6px", color: "#fca5a5", fontSize: "12px", marginTop: "8px" }}>
                              <strong>Doctor Reason:</strong> {userProfile.doctorReason}
                            </div>
                          )}

                          {/* Main User ONLY gets Journey Buttons */}
                          <div style={{ marginTop: "12px" }}>
                            {!isHigh || docStatus === "approved" || respAcc ? (
                              <div style={{ fontSize: "12px", color: "#34d399", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
                                <FiCheckCircle /> Cleared to Continue Journey
                              </div>
                            ) : docStatus === "pending" ? (
                              <button type="button" disabled style={{ width: "100%", padding: "8px", borderRadius: "8px", background: "#64748b", color: "#fff", border: "none", cursor: "not-allowed", opacity: 0.7, fontSize: "12.5px" }}>
                                Doctor Approval Required (Pending Review)
                              </button>
                            ) : docStatus === "rejected" || docStatus === "not_approved" ? (
                              <button
                                type="button"
                                onClick={() => handleOpenResponsibilityModal({
                                  type: "user",
                                  name: userProfile?.name || "Main User",
                                  relationship: "Self",
                                  isRejected: true,
                                  doctorReason: userProfile?.doctorReason || "",
                                })}
                                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", background: "#dc2626", color: "#fff", border: "none", fontWeight: "800", cursor: "pointer", fontSize: "13px" }}
                              >
                                ⚠️ Travel on Your Own Responsibility →
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })()}

                    {/* FAMILY MEMBER CARDS */}
                    {!travelingAlone && selectedFamilyObjects.map((fm) => {
                      const isHighFm = fm.aiRiskLevel === "HIGH_RISK" || fm.doctorApprovalStatus === "pending" || fm.doctorApprovalStatus === "rejected" || fm.doctorApprovalStatus === "not_approved";
                      const isModFm = fm.aiRiskLevel === "MODERATE_RISK";
                      const docStatusFm = fm.doctorApprovalStatus || "none";

                      let statusTextFm = "Safe";
                      let statusBgFm = "rgba(16,185,129,0.15)";
                      let statusColorFm = "#34d399";

                      if (isHighFm) {
                        if (docStatusFm === "approved") {
                          statusTextFm = "✓ Doctor Approved";
                          statusBgFm = "rgba(16,185,129,0.2)";
                          statusColorFm = "#34d399";
                        } else if (docStatusFm === "rejected" || docStatusFm === "not_approved") {
                          statusTextFm = "✕ Doctor Rejected";
                          statusBgFm = "rgba(239,68,68,0.2)";
                          statusColorFm = "#f87171";
                        } else {
                          statusTextFm = "Doctor Approval Required";
                          statusBgFm = "rgba(239,68,68,0.2)";
                          statusColorFm = "#f87171";
                        }
                      } else if (isModFm) {
                        statusTextFm = "Safety Advice";
                        statusBgFm = "rgba(245,158,11,0.2)";
                        statusColorFm = "#fbbf24";
                      }

                      return (
                        <div key={fm._id} style={{ background: "#1e293b", padding: "16px", borderRadius: "12px", border: isHighFm ? "1px solid #ef4444" : "1px solid #334155" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <span style={{ fontSize: "14px", fontWeight: "700", color: "#f8fafc" }}>
                              👥 {fm.name} ({fm.relationship})
                            </span>
                            <span style={{ fontSize: "11px", background: statusBgFm, color: statusColorFm, padding: "3px 8px", borderRadius: "6px", fontWeight: "700" }}>
                              {statusTextFm}
                            </span>
                          </div>

                          <div style={{ fontSize: "13px", color: "#cbd5e1", marginBottom: "6px" }}>
                            Medical Risk: <strong style={{ color: isHighFm ? "#f87171" : isModFm ? "#fbbf24" : "#34d399" }}>{isHighFm ? "HIGH / CRITICAL" : isModFm ? "MODERATE" : "LOW"}</strong>
                            {" • "}PSI: <strong>{fm.psiScore || 90}/100</strong>
                          </div>

                          {(docStatusFm === "rejected" || docStatusFm === "not_approved") && fm.doctorReason && (
                            <div style={{ background: "#450a0a", border: "1px solid #dc2626", padding: "8px 10px", borderRadius: "6px", color: "#fca5a5", fontSize: "12px", marginTop: "8px" }}>
                              <strong>Doctor Reason:</strong> {fm.doctorReason}
                            </div>
                          )}

                          {/* Responsibility button enabled ONLY when doctor rejects */}
                          {isHighFm && !fm.responsibilityAccepted && docStatusFm !== "approved" && (
                            <div style={{ marginTop: "10px" }}>
                              {docStatusFm === "rejected" || docStatusFm === "not_approved" ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenResponsibilityModal({
                                    type: "family_member",
                                    familyMemberId: fm._id,
                                    name: fm.name,
                                    relationship: fm.relationship,
                                    isRejected: true,
                                    doctorReason: fm.doctorReason || "",
                                  })}
                                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", background: "#dc2626", color: "#fff", border: "none", fontWeight: "800", cursor: "pointer", fontSize: "12.5px" }}
                                >
                                  ⚠️ Travel on Your Own Responsibility ({fm.name}) →
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled
                                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", background: "#64748b", color: "#fff", border: "none", opacity: 0.65, cursor: "not-allowed", fontSize: "12px", fontWeight: "600" }}
                                >
                                  Doctor Approval Required (Pending Review)
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* SECTION 3: STARTING LOCATION */}
                <div className="form-section-card">
                  <div className="section-title">
                    <FiMapPin className="sec-icon" />
                    <div>
                      <h3>3. Starting Location</h3>
                      <p>Specify where your journey originates</p>
                    </div>
                  </div>

                  <div className="radio-options-row">
                    <label className="radio-btn-label">
                      <input
                        type="radio"
                        name="locationType"
                        value="manual"
                        checked={locationType === "manual"}
                        onChange={() => setLocationType("manual")}
                      />
                      <span>Enter Location Manually</span>
                    </label>

                    <label className="radio-btn-label">
                      <input
                        type="radio"
                        name="locationType"
                        value="current"
                        checked={locationType === "current"}
                        onChange={handleCurrentLocationSelect}
                      />
                      <span>📍 Use Current Geolocation</span>
                    </label>
                  </div>

                  {locationType === "manual" && (
                    <div className="form-grid-4" style={{ marginTop: "16px" }}>
                      {/* 1. COUNTRY */}
                      <div className="form-group">
                        <label>Country *</label>
                        <input
                          type="text"
                          value={startLocation.country}
                          onChange={(e) => setStartLocation({ ...startLocation, country: e.target.value })}
                          className="form-control"
                          readOnly
                        />
                      </div>

                      {/* 2. STATE */}
                      <div className="form-group">
                        <label>State *</label>
                        <select
                          value={startLocation.state}
                          onChange={(e) => setStartLocation({ ...startLocation, state: e.target.value })}
                          onFocus={() => handleFieldFocus("state")}
                          onBlur={() => handleFieldBlur("state")}
                          className={`form-control ${fieldTouch.state && errors.state ? "input-error" : ""}`}
                          required
                        >
                          <option value="">-- Select State / UT --</option>
                          {INDIAN_STATES_AND_UTS.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                        {renderSingleFieldMessage("state")}
                      </div>

                      {/* 3. CITY / ORIGIN */}
                      <div className="form-group">
                        <label>City / Origin *</label>
                        <input
                          type="text"
                          placeholder="e.g. Kochi / Delhi"
                          value={startLocation.city}
                          onChange={(e) => setStartLocation({ ...startLocation, city: e.target.value })}
                          onFocus={() => handleFieldFocus("city")}
                          onBlur={() => handleFieldBlur("city")}
                          className={`form-control ${fieldTouch.city && errors.city ? "input-error" : ""}`}
                          required
                        />
                        {renderSingleFieldMessage("city")}
                      </div>

                      {/* 4. FULL ADDRESS / LANDMARK */}
                      <div className="form-group">
                        <label>Full Address / Landmark *</label>
                        <input
                          type="text"
                          placeholder="e.g. MG Road, Near Central Station"
                          value={startLocation.address}
                          onChange={(e) => setStartLocation({ ...startLocation, address: e.target.value })}
                          onFocus={() => handleFieldFocus("address")}
                          onBlur={() => handleFieldBlur("address")}
                          className={`form-control ${fieldTouch.address && errors.address ? "input-error" : ""}`}
                          required
                        />
                        {renderSingleFieldMessage("address")}
                      </div>
                    </div>
                  )}

                  {locationType === "current" && (
                    <div style={{ marginTop: "16px", padding: "14px 18px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", color: "#166534", fontSize: "14px" }}>
                      <strong style={{ display: "block", marginBottom: "4px", color: "#15803d", fontSize: "14.5px" }}>
                        📍 Current Geolocation Detected
                      </strong>
                      <p style={{ margin: 0, color: "#166534", fontWeight: "500" }}>
                        {startLocation.address || "Current Location"}
                        {startLocation.city && startLocation.city !== "Current City" ? ` (${startLocation.city}, ${startLocation.state})` : ""}
                      </p>
                    </div>
                  )}
                </div>

                {/* SECTION 4: MODE OF TRANSPORT & PREFERENCES */}
                <div className="form-section-card">
                  <div className="section-title">
                    <FiTruck className="sec-icon" />
                    <div>
                      <h3>4. Transport & Travel Preferences</h3>
                      <p>Transportation mode, walking endurance, and budget options</p>
                    </div>
                  </div>

                  <div className="form-grid-3">
                    <div className="form-group">
                      <label>Mode of Transport *</label>
                      <select
                        value={transportMode}
                        onFocus={() => handleFieldFocus("transportMode")}
                        onChange={(e) => setTransportMode(e.target.value)}
                        onBlur={() => handleFieldBlur("transportMode")}
                        className={`form-control ${fieldTouch.transportMode && errors.transportMode ? "input-error" : ""}`}
                        required
                      >
                        <option value="">-- Select Transport Mode --</option>
                        <option value="Car">Car</option>
                        <option value="Bus">Bus</option>
                        <option value="Train">Train</option>
                        <option value="Flight">Flight</option>
                        <option value="Taxi/Cab">Taxi / Cab</option>
                        <option value="Walking">Walking / On Foot</option>
                        <option value="Other">Other</option>
                      </select>
                      {renderSingleFieldMessage("transportMode")}
                    </div>

                    <div className="form-group">
                      <label>Expected Walking Level *</label>
                      <select
                        value={walkingLevel}
                        onFocus={() => handleFieldFocus("walkingLevel")}
                        onChange={(e) => setWalkingLevel(e.target.value)}
                        onBlur={() => handleFieldBlur("walkingLevel")}
                        className={`form-control ${fieldTouch.walkingLevel && errors.walkingLevel ? "input-error" : ""}`}
                        required
                      >
                        <option value="">-- Select Walking Level --</option>
                        <option value="Low">Low (Easy Walking)</option>
                        <option value="Moderate">Moderate (Average Trek)</option>
                        <option value="High">High (Demanding Trek)</option>
                      </select>
                      {renderSingleFieldMessage("walkingLevel")}
                    </div>

                    <div className="form-group">
                      <label>Travel Budget *</label>
                      <select
                        value={budgetType}
                        onFocus={() => handleFieldFocus("budgetType")}
                        onChange={(e) => setBudgetType(e.target.value)}
                        onBlur={() => handleFieldBlur("budgetType")}
                        className={`form-control ${fieldTouch.budgetType && errors.budgetType ? "input-error" : ""}`}
                        required
                      >
                        <option value="">-- Select Travel Budget --</option>
                        <option value="Low">Low / Economy</option>
                        <option value="Moderate">Moderate / Standard</option>
                        <option value="High">High / Premium</option>
                        <option value="Custom">Custom Amount</option>
                      </select>
                      {renderSingleFieldMessage("budgetType")}
                    </div>
                  </div>

                  {budgetType === "Custom" && (
                    <div className="form-group" style={{ maxWidth: "300px", marginTop: "12px" }}>
                      <label>Budget Amount (₹) *</label>
                      <input
                        type="number"
                        placeholder="e.g. 15000"
                        value={customBudgetAmount}
                        onFocus={() => handleFieldFocus("customBudgetAmount")}
                        onChange={(e) => setCustomBudgetAmount(e.target.value)}
                        onBlur={() => handleFieldBlur("customBudgetAmount")}
                        className={`form-control ${fieldTouch.customBudgetAmount && errors.customBudgetAmount ? "input-error" : ""}`}
                        required
                      />
                      {renderSingleFieldMessage("customBudgetAmount")}
                    </div>
                  )}
                </div>

                {/* SECTION 5: ACCOMMODATION & FOOD REQUIREMENTS */}
                <div className="form-section-card">
                  <div className="section-title">
                    <FiHome className="sec-icon" />
                    <div>
                      <h3>5. Accommodation & Food Options</h3>
                      <p>Configure search filters for nearby hotels and restaurants</p>
                    </div>
                  </div>

                  {!isJourneyPlannerSectionFilled && (
                    <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px", color: "#92400e", fontSize: "13px" }}>
                      <FiAlertCircle size={18} style={{ color: "#d97706", flexShrink: 0 }} />
                      <span>
                        Please complete your journey travel dates (Section 1) and travel mode (Section 3) above. These details are needed before choosing and booking accommodation.
                      </span>
                    </div>
                  )}

                  <div className="form-grid-3">
                    <div className="form-group">
                      <label>Need Nearby Accommodation? *</label>
                      <div className="toggle-btn-group">
                        <button
                          type="button"
                          className={`btn-toggle ${accommodationRequired ? "active" : ""}`}
                          onClick={() => setAccommodationRequired(true)}
                        >
                          YES
                        </button>
                        <button
                          type="button"
                          className={`btn-toggle ${!accommodationRequired ? "active" : ""}`}
                          onClick={() => setAccommodationRequired(false)}
                        >
                          NO
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Need Nearby Food Recommendations? *</label>
                      <div className="toggle-btn-group">
                        <button
                          type="button"
                          className={`btn-toggle ${foodRequired ? "active" : ""}`}
                          onClick={() => setFoodRequired(true)}
                        >
                          YES
                        </button>
                        <button
                          type="button"
                          className={`btn-toggle ${!foodRequired ? "active" : ""}`}
                          onClick={() => setFoodRequired(false)}
                        >
                          NO
                        </button>
                      </div>
                    </div>

                    {foodRequired && (
                      <div className="form-group">
                        <label>Dietary Preference *</label>
                        <select
                          value={foodPreference}
                          onChange={(e) => setFoodPreference(e.target.value)}
                          onFocus={() => handleFieldFocus("foodPreference")}
                          onBlur={() => handleFieldBlur("foodPreference")}
                          className={`form-control ${fieldTouch.foodPreference && errors.foodPreference ? "input-error" : ""}`}
                          required
                        >
                          <option value="">-- Select Dietary Preference --</option>
                          <option value="Vegetarian">Pure Vegetarian</option>
                          <option value="Non-Vegetarian">Non-Vegetarian</option>
                          <option value="Vegan">Vegan</option>
                          <option value="No preference">No preference</option>
                        </select>
                        {renderSingleFieldMessage("foodPreference")}
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginTop: "16px", maxWidth: "400px" }}>
                    <label>Service Search Radius around Pilgrimage Center *</label>
                    <div className="radius-selector-buttons">
                      {[5, 10, 15, 20].map((r) => (
                        <button
                          key={r}
                          type="button"
                          className={`btn-radius ${searchRadius === r ? "active" : ""}`}
                          onClick={() => setSearchRadius(r)}
                        >
                          {r} km
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* SECTION 6: NEARBY SERVICES & LEAFLET MAP */}
                <div className="form-section-card">
                  <div className="section-title">
                    <FiCompass className="sec-icon" />
                    <div>
                      <h3>6. Nearby Support Services & Interactive Map</h3>
                      <p>Real coordinates search calculated by distance from {center.name}</p>
                    </div>
                  </div>

                  {!isJourneyPlannerSectionFilled && (
                    <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "12px", padding: "12px 16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px", color: "#1e40af", fontSize: "13px" }}>
                      <FiInfo size={18} style={{ color: "#2563eb", flexShrink: 0 }} />
                      <span>
                        <strong>Journey Setup Required:</strong> Please complete your travel dates (Section 1) and travel mode (Section 3) above. Only after completing the journey planner section will accommodation selecting and booking be enabled.
                      </span>
                    </div>
                  )}

                  {/* Category Filter Pills */}
                  <div className="nearby-category-pills">
                    {[
                      { id: "accommodation", label: `🏨 Accommodation${!accommodationRequired ? " (No)" : ""}` },
                      { id: "restaurants", label: `🍽️ Restaurants/Food${!foodRequired ? " (No)" : ""}` },
                      { id: "parking", label: "🅿️ Parking" },
                      { id: "hospitals", label: "🏥 Hospitals" },
                      { id: "pharmacies", label: "💊 Pharmacies" },
                      { id: "restrooms", label: "🚻 Restrooms" },
                      { id: "drinkingWater", label: "🚰 Water Kiosks" },
                      { id: "atms", label: "🏧 ATMs" },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        className={`cat-pill-btn ${activeCategory === cat.id ? "active" : ""}`}
                        onClick={() => setActiveCategory(cat.id)}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Leaflet Interactive Map */}
                  <div className="map-wrapper-box" style={{ marginBottom: "20px" }}>
                    <JourneyMap
                      centerCoords={center.location}
                      centerName={center.name}
                      places={isCurrentCategoryDisabled ? [] : nearbyPlaces}
                      selectedPlaceIds={(selectedServices[activeCategory] || []).map((s) => s.externalPlaceId)}
                      onSelectPlace={isCurrentCategoryDisabled ? () => {} : handleToggleSelectPlace}
                    />
                  </div>

                  {/* Places List Cards */}
                  <div className="nearby-places-list">
                    {activeCategory === "accommodation" && !accommodationRequired ? (
                      <div style={{ padding: "36px 20px", background: "#f8fafc", borderRadius: "14px", textAlign: "center", border: "1px dashed #cbd5e1" }}>
                        <div style={{ fontSize: "32px", marginBottom: "8px" }}>🏨</div>
                        <h4 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
                          Nearby Accommodation Not Needed
                        </h4>
                        <p style={{ margin: "0 0 16px 0", fontSize: "13.5px", color: "#64748b" }}>
                          You selected <strong>NO</strong> for "Need Nearby Accommodation?" in Section 5. Accommodation places and booking options are hidden.
                        </p>
                        <button
                          type="button"
                          onClick={() => setAccommodationRequired(true)}
                          style={{ background: "#2563eb", color: "#ffffff", border: "none", padding: "8px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}
                        >
                          Enable Nearby Accommodation (Select YES)
                        </button>
                      </div>
                    ) : activeCategory === "restaurants" && !foodRequired ? (
                      <div style={{ padding: "36px 20px", background: "#f8fafc", borderRadius: "14px", textAlign: "center", border: "1px dashed #cbd5e1" }}>
                        <div style={{ fontSize: "32px", marginBottom: "8px" }}>🍽️</div>
                        <h4 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
                          Food Recommendations Not Needed
                        </h4>
                        <p style={{ margin: "0 0 16px 0", fontSize: "13.5px", color: "#64748b" }}>
                          You selected <strong>NO</strong> for "Need Nearby Food Recommendations?" in Section 5. Restaurant places are hidden.
                        </p>
                        <button
                          type="button"
                          onClick={() => setFoodRequired(true)}
                          style={{ background: "#2563eb", color: "#ffffff", border: "none", padding: "8px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}
                        >
                          Enable Food Recommendations (Select YES)
                        </button>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
                          <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
                            Found {nearbyPlaces.length} {activeCategory} service(s) within {searchRadius} km
                          </h4>
                          {nearbyPlaces.length > 0 && (
                            <button
                              type="button"
                              className="btn-view-all-services"
                              onClick={() => setIsViewAllOpen(true)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "7px 14px",
                                borderRadius: "8px",
                                background: "#eff6ff",
                                color: "#2563eb",
                                border: "1px solid #bfdbfe",
                                fontSize: "13px",
                                fontWeight: "700",
                                cursor: "pointer",
                              }}
                            >
                              <FiInfo size={14} /> View All {activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} ({nearbyPlaces.length})
                            </button>
                          )}
                        </div>

                        {loadingNearby ? (
                          <div style={{ padding: "28px", background: "#f8fafc", borderRadius: "12px", textAlign: "center", border: "1px dashed #cbd5e1" }}>
                            <p style={{ margin: 0, fontSize: "14px", color: "#2563eb", fontWeight: "600" }}>Searching nearby services...</p>
                          </div>
                        ) : nearbyPlaces.length > 0 ? (
                          <div className="places-cards-grid">
                            {nearbyPlaces.slice(0, 6).map((place, idx) => {
                              const selectedList = selectedServices[activeCategory] || [];
                              const placeId = place.externalPlaceId || idx;
                              const isSelected = selectedList.some(
                                (item) => item.externalPlaceId === place.externalPlaceId
                              );

                              const originLat = startLocation.latitude || center.location?.latitude;
                              const originLng = startLocation.longitude || center.location?.longitude;
                              const directionsUrl = originLat && originLng
                                ? `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${place.latitude},${place.longitude}`
                                : `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;

                              const isBooked = activeCategory === "accommodation" && isAccommodationBooked(place);

                              return (
                                <div key={placeId} className={`place-card ${isSelected || isBooked ? "selected" : ""}`}>
                                  <div className="place-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                      <span style={{ fontSize: "11px", fontWeight: "700", color: "#2563eb", background: "#eff6ff", padding: "2px 8px", borderRadius: "6px", textTransform: "uppercase" }}>
                                        {place.placeType || place.category}
                                      </span>
                                      {isBooked && (
                                        <span style={{ fontSize: "11px", fontWeight: "700", color: "#065f46", background: "#d1fae5", border: "1px solid #a7f3d0", padding: "2px 8px", borderRadius: "6px" }}>
                                          ✓ Booked
                                        </span>
                                      )}
                                    </div>
                                    <span className="distance-badge" style={{ fontSize: "11.5px", fontWeight: "700", color: "#047857", background: "#dcfce7", padding: "2px 8px", borderRadius: "6px" }}>
                                      📍 {place.distanceKm} km
                                    </span>
                                  </div>

                                  <h5 style={{ margin: "0 0 6px 0", fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>{place.name}</h5>

                                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", marginBottom: "8px" }}>
                                    <span style={{ color: "#b45309", fontWeight: "700" }}>
                                      {place.rating ? `⭐ ${place.rating} / 5` : "Rating N/A"}
                                    </span>
                                    {place.isOpen !== null && place.isOpen !== undefined && (
                                      <span style={{ fontSize: "11px", fontWeight: "700", color: place.isOpen ? "#047857" : "#b91c1c", background: place.isOpen ? "#ecfdf5" : "#fef2f2", padding: "2px 6px", borderRadius: "4px" }}>
                                        {place.isOpen ? "Open Now" : "Closed"}
                                      </span>
                                    )}
                                  </div>

                                  <p className="place-address" style={{ margin: "0 0 10px 0", fontSize: "12.5px", color: "#64748b", lineHeight: "1.35" }}>{place.address}</p>

                                  {place.dietaryInfo && place.dietaryInfo.isVegetarian && (
                                    <div style={{ marginBottom: "10px" }}>
                                      <span style={{ fontSize: "11px", fontWeight: "700", color: "#15803d", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "3px 8px", borderRadius: "6px" }}>
                                        🌱 {place.dietaryInfo.label}
                                      </span>
                                    </div>
                                  )}

                                  <div className="place-card-actions" style={{ display: "flex", gap: "6px", marginTop: "auto" }}>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedDetailPlace(place)}
                                      style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "4px", padding: "6px 8px", borderRadius: "6px", background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                                    >
                                      <FiInfo size={13} /> Details
                                    </button>

                                    <a
                                      href={directionsUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "4px", padding: "6px 8px", borderRadius: "6px", background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", fontSize: "12px", fontWeight: "700", textDecoration: "none" }}
                                    >
                                      <FiNavigation size={13} /> Directions
                                    </a>

                                    {isBooked ? (
                                      <button
                                        type="button"
                                        className="btn-select-place booked"
                                        disabled
                                        style={{ flex: 1, padding: "6px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "default", border: "none", background: "#059669", color: "#ffffff", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                                      >
                                        ✓ Already Booked
                                      </button>
                                    ) : activeCategory === "accommodation" ? (
                                      <button
                                        type="button"
                                        className="btn-select-place"
                                        disabled={!isJourneyPlannerSectionFilled}
                                        onClick={() => setBookingTargetPlace(place)}
                                        style={{
                                          flex: 1,
                                          padding: "6px 8px",
                                          borderRadius: "6px",
                                          fontSize: "12px",
                                          fontWeight: "700",
                                          cursor: isJourneyPlannerSectionFilled ? "pointer" : "not-allowed",
                                          border: "none",
                                          background: isJourneyPlannerSectionFilled ? "#2563eb" : "#94a3b8",
                                          color: "#ffffff",
                                          display: "inline-flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          gap: "4px",
                                          opacity: isJourneyPlannerSectionFilled ? 1 : 0.7
                                        }}
                                        title={!isJourneyPlannerSectionFilled ? "Please fill travel dates (Section 1) and travel mode (Section 3) above to enable accommodation booking" : "Book accommodation stay"}
                                      >
                                        <FiHome size={13} /> Book Stay
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        className={`btn-select-place ${isSelected ? "selected" : ""}`}
                                        onClick={() => handleToggleSelectPlace(place)}
                                        style={{ flex: 1, padding: "6px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer", border: "none", background: isSelected ? "#10b981" : "#2563eb", color: "#ffffff" }}
                                      >
                                        {isSelected ? "✓ Selected" : "+ Select"}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div style={{ padding: "28px", background: "#f8fafc", borderRadius: "12px", textAlign: "center", border: "1px dashed #cbd5e1" }}>
                            <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
                              No services found within {searchRadius} km.
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* SUBMIT / REVIEW BUTTON */}
                <div className="planner-action-bar">
                  <button type="submit" className="btn-review-summary">
                    Review Journey Summary →
                  </button>
                </div>
              </form>
            ) : (
              /* SUMMARY STEP */
              <div className="journey-summary-view-card">
                <div className="summary-header">
                  <FiCheckCircle className="sum-check-icon" />
                  <div>
                    <h2>Journey Plan Summary</h2>
                    <p>Review all details before confirming your pilgrimage journey.</p>
                  </div>
                </div>

                <div className="summary-sections-grid">
                  <div className="sum-box">
                    <h4>⛩️ Destination Pilgrimage Center</h4>
                    <p className="val-title">{center.name}</p>
                    <p className="val-sub">📍 {center.location?.city}, {center.location?.state}, {center.location?.country}</p>
                  </div>

                  <div className="sum-box">
                    <h4>📅 Travel Dates</h4>
                    <p className="val-title">{journeyDate} → {returnDate}</p>
                    <p className="val-sub">Start: {journeyDate} | Return: {returnDate}</p>
                  </div>

                  <div className="sum-box">
                    <h4>👨‍👩‍👧‍👦 Total Pilgrims</h4>
                    <p className="val-title">{totalPilgrimsCount} Pilgrim(s)</p>
                    <p className="val-sub">
                      {travelingAlone ? "Traveling Alone" : `1 Main User + ${selectedFamilyObjects.length} Family Member(s)`}
                    </p>
                    {selectedFamilyObjects.length > 0 && (
                      <div className="family-tags-row">
                        {selectedFamilyObjects.map((f) => (
                          <span key={f._id} className="fam-tag">{f.name} ({f.relationship})</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="sum-box">
                    <h4>🚗 Transport & Travel Mode</h4>
                    <p className="val-title">{transportMode}</p>
                    <p className="val-sub">Walking Level: {walkingLevel}</p>
                  </div>

                  <div className="sum-box">
                    <h4>💰 Travel Budget</h4>
                    <p className="val-title">
                      {budgetType} {budgetType === "Custom" ? `(₹${customBudgetAmount})` : ""}
                    </p>
                  </div>

                  <div className="sum-box">
                    <h4>🏡 Accommodation & Food</h4>
                    <p className="val-sub">Accommodation Required: {accommodationRequired ? "YES" : "NO"}</p>
                    <p className="val-sub">Food Recommendations: {foodRequired ? `YES (${foodPreference})` : "NO"}</p>
                    <p className="val-sub">Search Radius: {searchRadius} km</p>
                  </div>
                </div>

                {/* SELECTED NEARBY SERVICES SUMMARY */}
                <div className="summary-selected-services-box">
                  <h4>📍 Selected Support Services</h4>
                  {Object.keys(selectedServices).some((cat) => selectedServices[cat].length > 0) ? (
                    <div className="selected-services-grid">
                      {Object.keys(selectedServices).map((cat) => {
                        const list = selectedServices[cat];
                        if (list.length === 0) return null;
                        return (
                          <div key={cat} className="sel-cat-block">
                            <h5>{cat.toUpperCase()} ({list.length})</h5>
                            {list.map((item) => (
                              <div key={item.externalPlaceId} className="sel-item-row">
                                <span>• {item.name}</span>
                                <span className="dist">({item.distanceKm} km)</span>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="no-services-msg">No specific nearby services pre-selected (all default map markers remain available during journey).</p>
                  )}
                </div>

                {submitError && (
                  <div className="submit-error-alert">
                    ⚠️ {submitError}
                  </div>
                )}

                <div className="summary-action-buttons">
                  <button
                    type="button"
                    className="btn-back-edit"
                    onClick={() => setCurrentStep("form")}
                    disabled={submitting}
                  >
                    ← Back & Edit Details
                  </button>

                  <button
                    type="button"
                    className="btn-confirm-save"
                    onClick={handleConfirmSaveJourney}
                    disabled={submitting}
                  >
                    {submitting
                      ? isRescheduleMode
                        ? "Rescheduling Journey..."
                        : "Confirming Journey..."
                      : isRescheduleMode
                      ? "Confirm & Reschedule Journey"
                      : "Confirm Journey"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Responsibility Confirmation Modal */}
          {showResponsibilityModal && responsibilityTarget && (
            <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
              <div className="modal-card" style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "16px", padding: "24px", maxWidth: "520px", width: "90%", color: "#f8fafc" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ margin: 0, color: responsibilityTarget.isRejected ? "#ef4444" : "#3b82f6" }}>
                    {responsibilityTarget.isRejected ? "⚠️ Travel Responsibility Warning" : "Travel Responsibility Confirmation"}
                  </h3>
                  <button onClick={() => setShowResponsibilityModal(false)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "18px" }}>
                    <FiX />
                  </button>
                </div>

                <div style={{ marginBottom: "20px", fontSize: "14px", lineHeight: "1.6", color: "#cbd5e1" }}>
                  {responsibilityTarget.isRejected ? (
                    <div style={{ background: "#450a0a", border: "1px solid #dc2626", padding: "14px", borderRadius: "10px", color: "#fca5a5" }}>
                      "The doctor has rejected travel for <strong>{responsibilityTarget.name} ({responsibilityTarget.relationship})</strong> because of the identified medical risk ({responsibilityTarget.doctorReason || "Clinical risk assessment"}). Continuing the journey despite the doctor's rejection is entirely at your own responsibility. Professional medical advice should be followed."
                    </div>
                  ) : (
                    <div style={{ background: "#064e3b", border: "1px solid #059669", padding: "14px", borderRadius: "10px", color: "#a7f3d0" }}>
                      "The doctor has approved the travel. By continuing, you acknowledge the medical risk and agree to travel under your own responsibility."
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => setShowResponsibilityModal(false)}
                    style={{ padding: "10px 18px", borderRadius: "8px", background: "#334155", color: "#fff", border: "none", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAcceptResponsibility}
                    disabled={submittingResponsibility}
                    style={{
                      padding: "10px 18px",
                      borderRadius: "8px",
                      background: responsibilityTarget.isRejected ? "#dc2626" : "#2563eb",
                      color: "#fff",
                      border: "none",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    {submittingResponsibility
                      ? "Recording Acceptance..."
                      : responsibilityTarget.isRejected
                        ? "I Understand – Travel in My Own Responsibility"
                        : "Confirm & Continue Journey"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Place Details Modal */}
          {selectedDetailPlace && (
            <PlaceDetailsModal
              isOpen={!!selectedDetailPlace}
              onClose={() => setSelectedDetailPlace(null)}
              place={selectedDetailPlace}
              originCoords={startLocation.latitude ? startLocation : center?.location}
              onSelectPlace={handleToggleSelectPlace}
              isSelected={(selectedServices[activeCategory] || []).some((s) => s.externalPlaceId === selectedDetailPlace.externalPlaceId)}
              onBookStay={(place) => setBookingTargetPlace(place)}
              isBooked={activeCategory === "accommodation" && isAccommodationBooked(selectedDetailPlace)}
              canBookStay={isJourneyPlannerSectionFilled}
            />
          )}

          {/* Accommodation Booking Modal */}
          {bookingTargetPlace && (
            <AccommodationBookingModal
              isOpen={!!bookingTargetPlace}
              onClose={() => setBookingTargetPlace(null)}
              place={bookingTargetPlace}
              initialJourneyId={null}
              initialCheckInDate={journeyDate}
              initialCheckOutDate={returnDate}
              onBookingConfirmed={(confirmed) => {
                // If user confirms booking, ensure it's selected in accommodation list if not already
                if (confirmed) {
                  setUserAccommodationBookings((prev) => [confirmed, ...(prev || [])]);
                  const placeObj = {
                    externalPlaceId: confirmed.placeId,
                    name: confirmed.accommodationName,
                    address: confirmed.accommodationAddress,
                    category: "accommodation",
                    placeType: "Hotel / Lodge",
                    price: confirmed.pricing?.totalAmount,
                    bookingRef: confirmed.bookingReference,
                  };
                  handleToggleSelectPlace(placeObj);
                }
              }}
            />
          )}

          {/* View All Services Modal */}
          {isViewAllOpen && (
            <ViewAllServicesModal
              isOpen={isViewAllOpen}
              onClose={() => setIsViewAllOpen(false)}
              category={activeCategory}
              radiusKm={searchRadius}
              places={nearbyPlaces}
              originCoords={startLocation.latitude ? startLocation : center?.location}
              selectedPlaceIds={(selectedServices[activeCategory] || []).map((s) => s.externalPlaceId)}
              onSelectPlace={handleToggleSelectPlace}
              onViewDetails={(place) => setSelectedDetailPlace(place)}
              isAccommodationBooked={isAccommodationBooked}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default JourneyPlanner;
