import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import {
  apiValidateInvitation,
  apiAcceptInvitationAndStartSession,
  apiSessionSubmitLocation,
  apiSessionStopTracking,
} from "../services/familyTrackingService";
import logo from "../assets/pilgrim-logo.png";
import "../styles/FamilyTracking.css";
import {
  FiShield,
  FiMapPin,
  FiCheckCircle,
  FiAlertCircle,
  FiCrosshair,
  FiClock,
  FiInfo,
  FiX
} from "react-icons/fi";

function FamilyMemberTrack() {
  const { token: paramToken } = useParams();
  const [searchParams] = useSearchParams();
  const inviteToken = paramToken || searchParams.get("invite") || "";

  // Invitation and Session State
  const [loading, setLoading] = useState(true);
  const [validInvitation, setValidInvitation] = useState(null);
  const [sessionToken, setSessionToken] = useState(
    sessionStorage.getItem(`pilgrim_session_${inviteToken}`) || ""
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Tracking and GPS State
  const [consentGiven, setConsentGiven] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [currentCoords, setCurrentCoords] = useState(null);
  const [gpsError, setGpsError] = useState("");
  const watchIdRef = useRef(null);
  const lastLocationSendTime = useRef(0);

  // Validate Invitation on Mount
  useEffect(() => {
    const validate = async () => {
      if (!inviteToken) {
        setErrorMsg("Missing invitation token. Please check your tracking link.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMsg("");
        const data = await apiValidateInvitation(inviteToken);
        if (data.valid) {
          setValidInvitation(data);
          if (data.consentGiven) {
            setConsentGiven(true);
          }
        } else {
          setErrorMsg(data.message || "Invalid invitation link.");
        }
      } catch (err) {
        console.error("Invitation validation error:", err);
        setErrorMsg(err.message || "Failed to validate invitation link.");
      } finally {
        setLoading(false);
      }
    };

    validate();
  }, [inviteToken]);

  // Handle Start Location Sharing
  const handleStartSharing = async () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your mobile browser.");
      return;
    }

    if (!consentGiven) {
      setErrorMsg("Please grant explicit consent before starting location sharing.");
      return;
    }

    try {
      setGpsError("");
      setErrorMsg("");

      // Exchange invite token for restricted tracking session token if not already active
      let activeSession = sessionToken;
      if (!activeSession) {
        const sessionRes = await apiAcceptInvitationAndStartSession(inviteToken, true);
        if (sessionRes.sessionToken) {
          activeSession = sessionRes.sessionToken;
          setSessionToken(activeSession);
          sessionStorage.setItem(`pilgrim_session_${inviteToken}`, activeSession);
        }
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 3000,
      };

      const watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude, accuracy, altitude, speed, heading } = position.coords;
          const coordsObj = {
            latitude,
            longitude,
            accuracy,
            altitude,
            speed,
            heading,
            timestamp: new Date(position.timestamp),
          };
          setCurrentCoords(coordsObj);

          // Rate limit updates (send at most once every 3 seconds)
          const now = Date.now();
          if (now - lastLocationSendTime.current >= 3000) {
            lastLocationSendTime.current = now;
            try {
              await apiSessionSubmitLocation(activeSession, {
                latitude,
                longitude,
                accuracy,
                altitude,
                speed,
                heading,
                clientTimestamp: new Date(position.timestamp),
              });
            } catch (err) {
              console.warn("Session location push error:", err.message);
            }
          }
        },
        (error) => {
          console.error("GPS error:", error);
          if (error.code === error.PERMISSION_DENIED) {
            setGpsError("Location permission denied. Please enable GPS location in your smartphone browser settings.");
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            setGpsError("GPS position unavailable. Please ensure high-accuracy location is enabled.");
          } else if (error.code === error.TIMEOUT) {
            setGpsError("Location request timed out. Retrying...");
          } else {
            setGpsError(error.message);
          }
        },
        options
      );

      watchIdRef.current = watchId;
      setIsSharing(true);
      setSuccessMsg("Location sharing is now active. Your family can view your location.");
    } catch (err) {
      setErrorMsg(err.message || "Failed to start location sharing.");
    }
  };

  // Handle Stop Location Sharing
  const handleStopSharing = async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsSharing(false);

    if (sessionToken) {
      try {
        await apiSessionStopTracking(sessionToken);
      } catch (err) {
        console.warn("Stop session error:", err);
      }
    }

    setSuccessMsg("Location sharing has been stopped.");
  };

  // Clean up GPS watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "16px", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto", width: "100%" }}>
        {/* Header Branding */}
        <header style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", paddingTop: "10px" }}>
          <img src={logo} alt="PilgrimIQ" style={{ width: "38px", height: "38px", borderRadius: "8px" }} />
          <div>
            <h2 style={{ margin: 0, fontSize: "18px", color: "#0f172a", fontWeight: "800" }}>PilgrimIQ</h2>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>Pilgrimage Safety & Family Tracking</p>
          </div>
        </header>

        {loading ? (
          <div style={{ background: "#ffffff", padding: "40px 20px", borderRadius: "16px", textAlign: "center", border: "1px solid #e2e8f0" }}>
            <div className="spinner" style={{ margin: "0 auto 16px auto" }}></div>
            <p style={{ color: "#64748b", margin: 0 }}>Validating secure invitation link...</p>
          </div>
        ) : errorMsg && !validInvitation ? (
          <div style={{ background: "#ffffff", padding: "32px 24px", borderRadius: "16px", textAlign: "center", border: "1px solid #fecaca" }}>
            <FiAlertCircle size={48} color="#dc2626" style={{ marginBottom: "12px" }} />
            <h3 style={{ margin: "0 0 8px 0", color: "#991b1b", fontSize: "18px" }}>Invitation Expired or Invalid</h3>
            <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.5", margin: "0 0 20px 0" }}>
              {errorMsg}
            </p>
            <p style={{ fontSize: "13px", color: "#475569" }}>
              Please ask your family group coordinator to send you a fresh invitation link.
            </p>
          </div>
        ) : validInvitation ? (
          <div>
            {/* Member Welcome Card */}
            <div
              style={{
                background: "linear-gradient(135deg, #1e40af 0%, #2563eb 100%)",
                color: "#ffffff",
                padding: "24px 20px",
                borderRadius: "16px",
                boxShadow: "0 6px 20px rgba(37, 99, 235, 0.25)",
                marginBottom: "18px",
              }}
            >
              <div style={{ display: "inline-block", background: "rgba(255,255,255,0.2)", padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", marginBottom: "8px" }}>
                Pilgrimage Safe Tracking
              </div>
              <h1 style={{ margin: "0 0 4px 0", fontSize: "22px", fontWeight: "800" }}>
                Welcome, {validInvitation.memberName}!
              </h1>
              <p style={{ margin: 0, fontSize: "14px", opacity: 0.9 }}>
                Group: <strong>{validInvitation.groupName}</strong>
                {validInvitation.relationship && ` (${validInvitation.relationship})`}
              </p>
            </div>

            {/* Notification messages */}
            {successMsg && (
              <div style={{ background: "#dcfce7", border: "1px solid #86efac", color: "#166534", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>{successMsg}</span>
                <FiX style={{ cursor: "pointer" }} onClick={() => setSuccessMsg("")} />
              </div>
            )}

            {errorMsg && (
              <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>{errorMsg}</span>
                <FiX style={{ cursor: "pointer" }} onClick={() => setErrorMsg("")} />
              </div>
            )}

            {/* Explanation & Privacy Card */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px", marginBottom: "18px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
              <h4 style={{ margin: "0 0 8px 0", fontSize: "15px", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                <FiShield style={{ color: "#2563eb" }} /> How It Works
              </h4>
              <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#475569", lineHeight: "1.5" }}>
                Sharing your location helps your family keep you safe in large pilgrimage crowds. If you move further than <strong>{validInvitation.separationThresholdMeters || 10} meters</strong> away from the group leader, their portable ESP32 device will buzz to alert them.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#16a34a", fontWeight: "700" }}>
                <FiCheckCircle /> No username or password required.
              </div>
            </div>

            {/* Consent & Tracking Controller Card */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px", marginBottom: "18px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "16px" }}>
                <input
                  type="checkbox"
                  id="family-consent-cb"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  style={{ width: "18px", height: "18px", marginTop: "2px", cursor: "pointer" }}
                />
                <label htmlFor="family-consent-cb" style={{ fontSize: "13px", color: "#334155", lineHeight: "1.4", cursor: "pointer" }}>
                  I consent to sharing my smartphone GPS location with my pilgrimage family group. I understand I can stop tracking at any time.
                </label>
              </div>

              {!isSharing ? (
                <button
                  type="button"
                  onClick={handleStartSharing}
                  disabled={!consentGiven}
                  style={{
                    width: "100%",
                    background: consentGiven ? "#10b981" : "#94a3b8",
                    color: "#ffffff",
                    border: "none",
                    padding: "14px",
                    borderRadius: "12px",
                    fontSize: "15px",
                    fontWeight: "800",
                    cursor: consentGiven ? "pointer" : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: consentGiven ? "0 4px 14px rgba(16, 185, 129, 0.3)" : "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  <FiMapPin size={18} /> Start Sharing My Location
                </button>
              ) : (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "10px 14px", borderRadius: "10px", marginBottom: "12px" }}>
                    <span style={{ fontSize: "13px", fontWeight: "800", color: "#065f46", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span>
                      Location Sharing Active
                    </span>
                    <span style={{ fontSize: "11px", color: "#047857" }}>Updating every 3s</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleStopSharing}
                    style={{
                      width: "100%",
                      background: "#ef4444",
                      color: "#ffffff",
                      border: "none",
                      padding: "12px",
                      borderRadius: "12px",
                      fontSize: "14px",
                      fontWeight: "800",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      boxShadow: "0 4px 14px rgba(239, 68, 68, 0.25)",
                    }}
                  >
                    <FiX size={18} /> Stop Sharing Location
                  </button>
                </div>
              )}

              {gpsError && (
                <div style={{ marginTop: "12px", padding: "10px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626", fontSize: "12.5px" }}>
                  ⚠️ {gpsError}
                </div>
              )}

              {currentCoords && (
                <div style={{ marginTop: "14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px", fontSize: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <span style={{ color: "#64748b", display: "block" }}>Latitude:</span>
                    <strong style={{ color: "#0f172a" }}>{currentCoords.latitude.toFixed(6)}°</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", display: "block" }}>Longitude:</span>
                    <strong style={{ color: "#0f172a" }}>{currentCoords.longitude.toFixed(6)}°</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", display: "block" }}>GPS Accuracy:</span>
                    <strong style={{ color: "#0f172a" }}>±{Math.round(currentCoords.accuracy)} meters</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", display: "block" }}>Last Reported:</span>
                    <strong style={{ color: "#0f172a" }}>{new Date().toLocaleTimeString()}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Browser Guidance Note */}
            <div style={{ padding: "12px 16px", background: "#eff6ff", border: "1px solid #dbeafe", borderRadius: "12px", fontSize: "12px", color: "#1e40af", lineHeight: "1.4", display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <FiInfo size={16} style={{ flexShrink: 0, marginTop: "1px" }} />
              <div>
                <strong>Important Pilgrimage Note:</strong> Mobile web browsers pause GPS if the phone is locked or this tab is switched away. Please keep this screen active while walking together in dense pilgrimage crowds.
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default FamilyMemberTrack;
