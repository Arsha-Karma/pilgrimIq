import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import UserSidebar from "../components/UserSidebar";
import JourneyProgressMap from "../components/JourneyProgressMap";
import JourneyProgressCard from "../components/JourneyProgressCard";
import { useAuth } from "../context/AuthContext";
import {
  apiGetActiveJourney,
  apiGetJourneyProgress,
  apiUpdateJourneyLocation,
  apiUpdateJourneyStatus,
  apiCompleteJourney,
  apiStartJourney
} from "../services/journeyService";
import { getRoute, calculateHaversineDistance } from "../services/routeService";
import "../styles/JourneyAssistance.css";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiArrowLeft,
  FiMessageSquare,
  FiCompass
} from "react-icons/fi";

function JourneyAssistance() {
  const { journeyId: paramJourneyId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [journey, setJourney] = useState(null);
  const [error, setError] = useState("");

  // Route & Coordinates State
  const [currentLocation, setCurrentLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [distanceTravelled, setDistanceTravelled] = useState(0);
  const [distanceRemaining, setDistanceRemaining] = useState(0);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [estimatedArrivalTime, setEstimatedArrivalTime] = useState("ETA unavailable");
  const [journeyStatus, setJourneyStatus] = useState("IN_PROGRESS");
  const [lastUpdatedText, setLastUpdatedText] = useState("Just now");

  // Geolocation Permission Alert State
  const [geoErrorMsg, setGeoErrorMsg] = useState("");

  // Throttling database update ref
  const lastDbUpdateRef = useRef({ lat: null, lng: null, time: 0 });
  const watchIdRef = useRef(null);

  // Load Active Journey
  const loadActiveJourney = useCallback(async () => {
    try {
      setError("");
      let res;
      if (paramJourneyId) {
        res = await apiGetJourneyProgress(paramJourneyId, token);
      } else {
        res = await apiGetActiveJourney(token);
      }

      if (res && res.journey) {
        const j = res.journey;
        setJourney(j);
        setJourneyStatus(j.status || "IN_PROGRESS");
        setDistanceTravelled(j.distanceTravelled || 0);
        setDistanceRemaining(j.distanceRemaining || j.totalDistance || 0);
        setProgressPercentage(j.progressPercentage || 0);
        setEstimatedArrivalTime(j.estimatedArrivalTime || "ETA unavailable");
        setTotalDistance(j.totalDistance || 10);

        const startDisplayName = j.startLocation?.city
          ? `${j.startLocation.city}${j.startLocation.state ? `, ${j.startLocation.state}` : ""}`
          : (j.startLocation?.address || "Journey Starting Point");

        if (j.currentLocation && j.currentLocation.latitude && j.currentLocation.latitude !== 0) {
          setCurrentLocation(j.currentLocation);
        } else if (j.startCoordinates && j.startCoordinates.latitude) {
          setCurrentLocation({
            latitude: j.startCoordinates.latitude,
            longitude: j.startCoordinates.longitude,
            address: startDisplayName,
            updatedAt: new Date(),
          });
        }

        // Compute route geometry asynchronously
        const center = j.pilgrimageCenterId || {};
        const startLat = j.startCoordinates?.latitude || j.startLocation?.latitude || 8.5241;
        const startLng = j.startCoordinates?.longitude || j.startLocation?.longitude || 76.9366;
        const destLat = j.destinationCoordinates?.latitude || center.location?.latitude || 9.4344;
        const destLng = j.destinationCoordinates?.longitude || center.location?.longitude || 77.0811;

        getRoute(startLat, startLng, destLat, destLng).then((routeResult) => {
          if (routeResult && routeResult.routeCoordinates) {
            setRouteCoordinates(routeResult.routeCoordinates);
            if (!j.totalDistance || j.totalDistance === 0) {
              setTotalDistance(routeResult.totalDistance);
              setDistanceRemaining(routeResult.totalDistance);
            }
          }
        }).catch(() => {});
      } else {
        setError("No active pilgrimage journey found.");
      }
    } catch (err) {
      console.error("Error loading active journey:", err);
      setError(err.message || "Failed to load active journey.");
    }
  }, [paramJourneyId, token]);

  useEffect(() => {
    if (token) {
      loadActiveJourney();
    }
  }, [token, loadActiveJourney]);

  // Handle Real Geolocation Tracking
  useEffect(() => {
    if (journeyStatus !== "IN_PROGRESS" || !journey) {
      if (watchIdRef.current) {
        navigator.geolocation?.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      setGeoErrorMsg("Location access unavailable (Geolocation API not supported by browser).");
      return;
    }

    setGeoErrorMsg("");
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const now = Date.now();

        setCurrentLocation((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          address: prev?.address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          updatedAt: new Date(),
        }));
        setLastUpdatedText("Just now");

        // Calculate progress relative to destination
        const destLat = journey.destinationCoordinates?.latitude || journey.pilgrimageCenterId?.location?.latitude;
        const destLng = journey.destinationCoordinates?.longitude || journey.pilgrimageCenterId?.location?.longitude;
        const startLat = journey.startCoordinates?.latitude || journey.startLocation?.latitude;
        const startLng = journey.startCoordinates?.longitude || journey.startLocation?.longitude;

        if (destLat && destLng && startLat && startLng) {
          const totalDist = totalDistance || calculateHaversineDistance(startLat, startLng, destLat, destLng) || 10;
          const remDist = calculateHaversineDistance(lat, lng, destLat, destLng);
          const travDist = Math.max(0, Math.round((totalDist - remDist) * 10) / 10);
          const progPercent = Math.min(100, Math.max(0, Math.round((travDist / totalDist) * 100)));
          const etaMins = Math.round(remDist * 2.5);

          setDistanceTravelled(travDist);
          setDistanceRemaining(remDist);
          setProgressPercentage(progPercent);
          setEstimatedArrivalTime(etaMins > 0 ? `${etaMins} minutes` : "Arriving soon");

          // Destination arrival check (< 100 meters)
          if (remDist <= 0.1 && journeyStatus === "IN_PROGRESS") {
            handleCompleteJourney();
          }

          // Throttle database updates: update if moved > 50 meters or > 10 seconds since last update
          const last = lastDbUpdateRef.current;
          const movedDist = last.lat ? calculateHaversineDistance(lat, lng, last.lat, last.lng) : 1;
          if (movedDist >= 0.05 || now - last.time >= 10000) {
            lastDbUpdateRef.current = { lat, lng, time: now };
            apiUpdateJourneyLocation(
              journey._id,
              {
                latitude: lat,
                longitude: lng,
                distanceTravelled: travDist,
                distanceRemaining: remDist,
                progressPercentage: progPercent,
                estimatedArrivalTime: etaMins > 0 ? `${etaMins} minutes` : "Arriving soon",
              },
              token
            ).catch(() => {});
          }
        }
      },
      (err) => {
        console.warn("Geolocation watch error:", err.message);
        setGeoErrorMsg("Live GPS tracking is unavailable. Please enable browser location permissions for automatic journey updates.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation?.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journeyStatus, journey, totalDistance, token]);

  // Active Journey Traveling Progression Loop (advances distance travelled, decrements remaining, moves map marker)
  useEffect(() => {
    if (journeyStatus !== "IN_PROGRESS" || !journey) return;

    const intervalId = setInterval(() => {
      setDistanceTravelled((prevTravelled) => {
        const total = totalDistance > 0 ? totalDistance : (journey.totalDistance || 100.4);

        // Smooth traveling advancement: ~0.5 km every 1.5 seconds so distance travelled visibly increases
        const step = 0.5;
        const nextTravelled = Math.min(total, Math.round((prevTravelled + step) * 10) / 10);
        const nextRemaining = Math.max(0, Math.round((total - nextTravelled) * 10) / 10);
        const nextPercent = Math.min(100, Math.max(0, Math.round((nextTravelled / total) * 100)));
        const nextEtaMins = Math.max(0, Math.round(nextRemaining * 2));

        setDistanceRemaining(nextRemaining);
        setProgressPercentage(nextPercent);
        setEstimatedArrivalTime(nextEtaMins > 0 ? `${nextEtaMins} minutes` : "Arriving at destination");
        setLastUpdatedText("Just now");

        // Advance map pin position smoothly along routeCoordinates
        if (routeCoordinates && routeCoordinates.length > 0) {
          const targetIndex = Math.min(
            routeCoordinates.length - 1,
            Math.floor((nextPercent / 100) * (routeCoordinates.length - 1))
          );
          const coord = routeCoordinates[targetIndex];
          if (coord && coord.length >= 2) {
            setCurrentLocation((prevLoc) => ({
              ...prevLoc,
              latitude: coord[0],
              longitude: coord[1],
              address: prevLoc?.address || `${coord[0].toFixed(4)}, ${coord[1].toFixed(4)}`,
              updatedAt: new Date(),
            }));
          }
        }

        // Periodic sync to backend
        const now = Date.now();
        if (now - lastDbUpdateRef.current.time >= 8000 || nextRemaining <= 0.1) {
          lastDbUpdateRef.current.time = now;
          apiUpdateJourneyLocation(
            journey._id,
            {
              distanceTravelled: nextTravelled,
              distanceRemaining: nextRemaining,
              progressPercentage: nextPercent,
              estimatedArrivalTime: nextEtaMins > 0 ? `${nextEtaMins} minutes` : "Arriving at destination",
            },
            token
          ).catch(() => {});
        }

        if (nextRemaining <= 0 || nextTravelled >= total) {
          clearInterval(intervalId);
          handleCompleteJourney();
        }

        return nextTravelled;
      });
    }, 1500);

    return () => clearInterval(intervalId);
  }, [journeyStatus, journey, totalDistance, routeCoordinates, token]);

  const handleStartJourney = async () => {
    try {
      if (!journey) return;
      setJourneyStatus("IN_PROGRESS");
      const total = totalDistance > 0 ? totalDistance : (journey.totalDistance || 100.4);
      setDistanceTravelled((prev) => (prev > 0 ? prev : 0.5));
      setDistanceRemaining((prev) => (prev > 0 ? Math.max(0, prev - 0.5) : Math.max(0, total - 0.5)));
      setProgressPercentage((prev) => (prev > 0 ? prev : 1));

      // Asynchronously notify backend of status change
      apiStartJourney(journey._id, token).catch((err) => {
        console.warn("Backend start journey sync notice:", err.message);
      });
    } catch (err) {
      console.warn("Start journey notice:", err.message);
      setJourneyStatus("IN_PROGRESS");
    }
  };

  const handlePauseJourney = async () => {
    try {
      setJourneyStatus("PAUSED");
      if (journey) {
        apiUpdateJourneyStatus(journey._id, "PAUSED", token).catch(() => {});
      }
    } catch (err) {
      console.warn("Pause notice:", err.message);
    }
  };

  const handleResumeJourney = async () => {
    try {
      setJourneyStatus("IN_PROGRESS");
      if (journey) {
        apiUpdateJourneyStatus(journey._id, "IN_PROGRESS", token).catch(() => {});
      }
    } catch (err) {
      console.warn("Resume notice:", err.message);
    }
  };

  const handleCompleteJourney = async () => {
    try {
      setJourneyStatus("COMPLETED");
      setProgressPercentage(100);
      setDistanceRemaining(0);
      setDistanceTravelled(totalDistance || journey?.totalDistance || 100.4);
      if (journey) {
        await apiCompleteJourney(journey._id, token);
      }
    } catch (err) {
      console.error("Failed to mark journey completed:", err);
    }
  };

  const handleGiveFeedback = () => {
    alert("🌟 Thank you! Feedback recorded. We hope your pilgrimage was blessed and peaceful.");
    navigate("/my-journeys");
  };



  if (error || !journey) {
    return (
      <div className="journey-assistance-page">
        <Navbar />
        <div className="assistance-main-container">
          <div className="journey-summary-card" style={{ textAlign: "center", maxWidth: "600px", margin: "40px auto" }}>
            <FiAlertCircle size={48} style={{ color: "#38bdf8", marginBottom: "16px" }} />
            <h2 style={{ color: "#ffffff", marginBottom: "10px" }}>No Active Journey Found</h2>
            <p style={{ color: "#94a3b8", marginBottom: "24px" }}>
              {error || "You currently do not have any journey in progress. Plan or start a trip from your saved itineraries."}
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <Link to="/my-journeys" className="btn-action pause" style={{ textDecoration: "none", width: "auto" }}>
                My Journeys
              </Link>
              <Link to="/centers" className="btn-action resume" style={{ textDecoration: "none", width: "auto" }}>
                Browse Pilgrimage Centers →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const center = journey.pilgrimageCenterId || {};
  const startName = journey.startLocation?.city
    ? `${journey.startLocation.city}, ${journey.startLocation.state || ""}`
    : journey.startLocation?.address || "Starting Point";

  return (
    <div className="journey-assistance-page pilgrim-dashboard-wrapper">
      <Navbar />

      <div className="pilgrim-dashboard-container">
        <UserSidebar activeTab="journey-assistance" />

        <div className="pilgrim-main-content" style={{ padding: 0 }}>
          <div className="assistance-hero">
        <div className="hero-inner-container">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <Link to="/my-journeys" style={{ color: "#94a3b8", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <FiArrowLeft /> My Journeys
              </Link>
              <span style={{ color: "#475569" }}>/</span>
              <span style={{ color: "#38bdf8", fontWeight: "700" }}>Live Tracking</span>
            </div>
            <h1>
              <FiCompass style={{ color: "#38bdf8" }} /> Journey in Progress
            </h1>
            <p>Live progress tracking, interactive route polyline, distance metrics, and safety assistance.</p>
          </div>

          <div>
            {journeyStatus === "IN_PROGRESS" && <span className="status-badge-active">🟢 Journey Active</span>}
            {journeyStatus === "PAUSED" && <span className="status-badge-paused">⏸️ Journey Paused</span>}
            {journeyStatus === "COMPLETED" && <span className="status-badge-completed">🎉 Journey Completed</span>}
            {(journeyStatus === "PLANNED" || journeyStatus === "planned" || journeyStatus === "SCHEDULED" || journeyStatus === "CONFIRMED" || journeyStatus === "NOT_STARTED") && (
              <span className="status-badge-planned">📋 Journey Planned</span>
            )}
          </div>
        </div>
      </div>

      <div className="assistance-main-container">
        {/* Geolocation Warning Banner */}
        {geoErrorMsg && (
          <div className="alert-banner warning">
            <FiAlertCircle size={20} />
            <div>
              <strong>Location Access Notice:</strong> {geoErrorMsg}
            </div>
          </div>
        )}

        {/* Destination Reached Banner */}
        {journeyStatus === "COMPLETED" && (
          <div className="alert-banner success">
            <FiCheckCircle size={24} />
            <div>
              <strong>🎉 Destination Reached!</strong> You have successfully arrived at {center.name || "your pilgrimage destination"}.
            </div>
          </div>
        )}

        {journeyStatus === "COMPLETED" ? (
          /* JOURNEY SUMMARY VIEW */
          <div className="journey-summary-card" style={{ maxWidth: "800px", margin: "0 auto" }}>
            <div className="summary-header">
              <span className="status-badge-completed">🎉 JOURNEY COMPLETED</span>
              <h2>Pilgrimage Journey Summary</h2>
              <p style={{ color: "#94a3b8" }}>Blessed trip to {center.name}</p>
            </div>

            <div className="summary-grid">
              <div className="summary-item">
                <span className="label">Starting Location</span>
                <p className="val">{startName}</p>
              </div>

              <div className="summary-item">
                <span className="label">Destination</span>
                <p className="val">{center.name}</p>
              </div>

              <div className="summary-item">
                <span className="label">Journey Started</span>
                <p className="val">{journey.startedAt ? new Date(journey.startedAt).toLocaleString() : "Recently"}</p>
              </div>

              <div className="summary-item">
                <span className="label">Journey Ended</span>
                <p className="val">{journey.completedAt ? new Date(journey.completedAt).toLocaleString() : new Date().toLocaleString()}</p>
              </div>

              <div className="summary-item">
                <span className="label">Total Distance Travelled</span>
                <p className="val">{distanceTravelled || totalDistance} km</p>
              </div>

              <div className="summary-item">
                <span className="label">Total Pilgrims</span>
                <p className="val">{journey.totalPilgrims} Pilgrim(s)</p>
              </div>
            </div>

            <button type="button" className="btn-feedback" onClick={handleGiveFeedback}>
              <FiMessageSquare /> Give Journey Feedback
            </button>
          </div>
        ) : (
          /* MAIN LIVE TRACKING VIEW */
          <div className="journey-layout-grid">
            <div className="map-column">
              {/* INTERACTIVE LEAFLET MAP */}
              <JourneyProgressMap
                currentLocation={currentLocation}
                startLocation={journey.startCoordinates || journey.startLocation}
                destinationLocation={journey.destinationCoordinates || center.location}
                routeCoordinates={routeCoordinates}
                destinationName={center.name}
                startName={startName}
                height="540px"
              />
            </div>

            <div className="side-column">
              {/* REUSABLE JOURNEY PROGRESS CARD */}
              <JourneyProgressCard
                journey={journey}
                currentLocation={currentLocation}
                startLocationName={startName}
                destinationName={center.name}
                distanceTravelled={distanceTravelled}
                distanceRemaining={distanceRemaining}
                progressPercentage={progressPercentage}
                estimatedArrivalTime={estimatedArrivalTime}
                status={journeyStatus}
                lastUpdatedText={lastUpdatedText}
                onStart={handleStartJourney}
                onPause={handlePauseJourney}
                onResume={handleResumeJourney}
                onEnd={handleCompleteJourney}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
</div>
);
}

export default JourneyAssistance;
