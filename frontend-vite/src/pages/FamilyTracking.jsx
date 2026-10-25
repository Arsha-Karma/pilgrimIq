import React, { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "../components/Navbar";
import UserSidebar from "../components/UserSidebar";
import FamilyTrackingMap from "../components/FamilyTrackingMap";
import { useAuth } from "../context/AuthContext";
import {
  apiGetMyFamilyGroups,
  apiCreateFamilyGroup,
  apiJoinFamilyGroup,
  apiGetFamilyGroupDetails,
  apiGetFamilyGroupMembers,
  apiUpdateFamilyGroupSettings,
  apiUpdateLocationConsent,
  apiStartTrackingSession,
  apiStopTrackingSession,
  apiSubmitLocation,
  apiGetFamilyGroupAlerts,
  apiResolveSeparationAlert,
  apiRegisterIoTDevice,
  apiGetIoTDeviceStatus,
  apiGetSavedFamilyMembers,
  apiAddFamilyMember,
  apiRegenerateMemberInvite,
  apiRevokeFamilyMember,
} from "../services/familyTrackingService";
import "../styles/FamilyTracking.css";
import {
  FiUsers,
  FiPlus,
  FiLogIn,
  FiShare2,
  FiCopy,
  FiCheck,
  FiMapPin,
  FiCrosshair,
  FiSliders,
  FiAlertTriangle,
  FiAlertCircle,
  FiShield,
  FiNavigation,
  FiCpu,
  FiVolume2,
  FiVolumeX,
  FiInfo,
  FiClock,
  FiX,
  FiTrash2,
  FiUserPlus,
  FiRefreshCw
} from "react-icons/fi";

function FamilyTracking() {
  const { user, token } = useAuth();

  // Primary State
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [deviceStatus, setDeviceStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Location Sharing State (Main User)
  const [consentGranted, setConsentGranted] = useState(false);
  const [isWatchingLocation, setIsWatchingLocation] = useState(false);
  const [currentCoords, setCurrentCoords] = useState(null);
  const [gpsError, setGpsError] = useState("");
  const watchIdRef = useRef(null);
  const lastLocationSendTime = useRef(0);

  // Map & Focus
  const [focusedMemberId, setFocusedMemberId] = useState(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPairModal, setShowPairModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Form Inputs & Validation
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupThreshold, setNewGroupThreshold] = useState(10);
  const [groupCreateError, setGroupCreateError] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [pairDeviceIdInput, setPairDeviceIdInput] = useState("ESP32-TRACKER-01");
  const [registeredDeviceSecret, setRegisteredDeviceSecret] = useState(null);
  const [codeCopied, setCodeCopied] = useState(false);

  // Saved Family Members from Database
  const [savedFamilyMembers, setSavedFamilyMembers] = useState([]);
  const [loadingSavedMembers, setLoadingSavedMembers] = useState(false);
  const [selectedFamilyMemberId, setSelectedFamilyMemberId] = useState("");
  const [addMemberMode, setAddMemberMode] = useState("select"); // 'select' | 'manual'
  const [memberAddError, setMemberAddError] = useState("");
  const [isSubmittingMember, setIsSubmittingMember] = useState(false);

  // Add Member Manual Fallback Inputs
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRelationship, setNewMemberRelationship] = useState("");
  const [activeInviteData, setActiveInviteData] = useState(null);
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);

  // Audio Buzzer Simulator for instant browser verification
  const [audioSimulationEnabled, setAudioSimulationEnabled] = useState(true);
  const audioContextRef = useRef(null);

  // Play browser audio beep to simulate ESP32 buzzer
  const playSimulatedBuzzer = useCallback((pattern = "warning_short") => {
    if (!audioSimulationEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(2400, ctx.currentTime);

      if (pattern === "critical_urgent") {
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0, ctx.currentTime + 0.40);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + 0.50);
        gain.gain.setValueAtTime(0, ctx.currentTime + 0.65);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.70);
      } else {
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0, ctx.currentTime + 0.55);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.6);
      }
    } catch (e) {
      console.warn("Web audio notice:", e.message);
    }
  }, [audioSimulationEnabled]);

  // Load User's Tracking Groups
  const loadGroups = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      const data = await apiGetMyFamilyGroups(token);
      if (data && Array.isArray(data.groups)) {
        setGroups(data.groups);
        if (data.groups.length > 0) {
          const target = selectedGroup
            ? data.groups.find((g) => g.group._id === selectedGroup._id) || data.groups[0]
            : data.groups[0];
          setSelectedGroup(target.group);
        } else {
          setSelectedGroup(null);
        }
      }
    } catch (err) {
      console.error("Failed to load tracking groups:", err);
      setError(err.message || "Failed to load tracking groups.");
    } finally {
      setLoading(false);
    }
  }, [token, selectedGroup]);

  // Poll real-time group details, members, alerts, and IoT device status
  const pollGroupData = useCallback(async () => {
    if (!token || !selectedGroup?._id) return;
    try {
      const [membersData, alertsData, deviceData] = await Promise.all([
        apiGetFamilyGroupMembers(selectedGroup._id, token),
        apiGetFamilyGroupAlerts(selectedGroup._id, token),
        apiGetIoTDeviceStatus(selectedGroup._id, token),
      ]);

      if (membersData && Array.isArray(membersData.members)) {
        setMembers(membersData.members);
      }

      if (alertsData && Array.isArray(alertsData.alerts)) {
        setAlerts(alertsData.alerts);
        const activeUnack = alertsData.alerts.find((a) => a.status === "active");
        if (activeUnack) {
          playSimulatedBuzzer(activeUnack.buzzerPattern);
        }
      }

      if (deviceData) {
        setDeviceStatus(deviceData);
      }
    } catch (err) {
      console.warn("Background polling notice:", err.message);
    }
  }, [token, selectedGroup, playSimulatedBuzzer]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    if (selectedGroup) {
      pollGroupData();
      const interval = setInterval(pollGroupData, 4000);
      return () => clearInterval(interval);
    }
  }, [selectedGroup, pollGroupData]);

  // Main User GPS Sharing Handler
  const handleStartLocationSharing = async () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser.");
      return;
    }

    if (!selectedGroup) {
      setError("Please select or create a family tracking group first.");
      return;
    }

    if (!consentGranted) {
      setError("Please grant location-sharing consent first.");
      return;
    }

    try {
      setGpsError("");
      await apiUpdateLocationConsent({ groupId: selectedGroup._id, consentGiven: true }, token);
      await apiStartTrackingSession(selectedGroup._id, token);

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

          const now = Date.now();
          if (now - lastLocationSendTime.current >= 3000) {
            lastLocationSendTime.current = now;
            try {
              const res = await apiSubmitLocation(
                {
                  groupId: selectedGroup._id,
                  latitude,
                  longitude,
                  accuracy,
                  altitude,
                  speed,
                  heading,
                  clientTimestamp: new Date(position.timestamp),
                },
                token
              );

              if (res.alert) {
                playSimulatedBuzzer(res.alert.buzzerPattern);
              }
              pollGroupData();
            } catch (err) {
              console.warn("Location push error:", err.message);
            }
          }
        },
        (error) => {
          console.error("GPS error:", error);
          if (error.code === error.PERMISSION_DENIED) {
            setGpsError("Location permission denied. Please allow location access in your browser settings.");
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            setGpsError("GPS position unavailable. Please ensure location services are enabled on your device.");
          } else if (error.code === error.TIMEOUT) {
            setGpsError("Location request timed out. Retrying...");
          } else {
            setGpsError(error.message);
          }
        },
        options
      );

      watchIdRef.current = watchId;
      setIsWatchingLocation(true);
      setSuccessMsg("Main user location sharing is now active.");
    } catch (err) {
      setError(err.message || "Failed to start location sharing.");
    }
  };

  const handleStopLocationSharing = async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsWatchingLocation(false);
    if (selectedGroup) {
      try {
        await apiStopTrackingSession(selectedGroup._id, token);
        pollGroupData();
      } catch (err) {
        console.error("Stop tracking err:", err);
      }
    }
    setSuccessMsg("Location sharing stopped.");
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Fetch saved family members from the database
  const loadSavedFamilyMembers = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingSavedMembers(true);
      const data = await apiGetSavedFamilyMembers(token);
      if (data && Array.isArray(data.familyMembers)) {
        setSavedFamilyMembers(data.familyMembers);
      }
    } catch (err) {
      console.warn("Could not fetch saved family members:", err.message);
    } finally {
      setLoadingSavedMembers(false);
    }
  }, [token]);

  // Open Add Member modal and fetch database records
  const handleOpenAddMemberModal = () => {
    setMemberAddError("");
    setNewMemberName("");
    setNewMemberRelationship("");
    setAddMemberMode("select");
    loadSavedFamilyMembers();
    setShowAddMemberModal(true);
  };

  // Automatically select the first available unadded family member
  useEffect(() => {
    if (savedFamilyMembers.length > 0) {
      const alreadyInSelected = savedFamilyMembers.find((fm) => fm._id === selectedFamilyMemberId);
      const isAlreadyAdded = alreadyInSelected && members.some(
        (m) =>
          (m.familyMemberId && String(m.familyMemberId) === String(alreadyInSelected._id)) ||
          (m.name && m.name.toLowerCase() === alreadyInSelected.name.toLowerCase())
      );

      if (!selectedFamilyMemberId || isAlreadyAdded) {
        const firstAvailable = savedFamilyMembers.find((fm) => {
          return !members.some(
            (m) =>
              (m.familyMemberId && String(m.familyMemberId) === String(fm._id)) ||
              (m.name && m.name.toLowerCase() === fm.name.toLowerCase())
          );
        });

        if (firstAvailable) {
          setSelectedFamilyMemberId(firstAvailable._id);
        } else {
          setSelectedFamilyMemberId(savedFamilyMembers[0]._id);
        }
      }
    }
  }, [savedFamilyMembers, members, selectedFamilyMemberId]);

  // Create Group Handler (Connected to Express Backend & MongoDB Atlas)
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    setGroupCreateError("");
    setIsCreatingGroup(true);

    try {
      const data = await apiCreateFamilyGroup(
        {
          name: newGroupName.trim(),
          separationThresholdMeters: Number(newGroupThreshold) || 10,
        },
        token
      );

      if (!data || !data.group || !data.group._id) {
        throw new Error("Backend did not confirm group creation.");
      }

      setShowCreateModal(false);
      setNewGroupName("");
      setSuccessMsg(`Group '${data.group.name}' created and saved to MongoDB Atlas.`);
      await loadGroups();
    } catch (err) {
      console.error("Failed to create group:", err);
      setGroupCreateError(err.message || "Failed to save group to database. Please check your connection and retry.");
    } finally {
      setIsCreatingGroup(false);
    }
  };

  // Join Group Handler (for account-based pilgrims)
  const handleJoinGroup = async (e) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    try {
      const data = await apiJoinFamilyGroup(
        {
          inviteCode: joinCodeInput.trim().toUpperCase(),
        },
        token
      );
      setShowJoinModal(false);
      setJoinCodeInput("");
      setSuccessMsg(`Joined '${data.group.name}' successfully!`);
      await loadGroups();
    } catch (err) {
      setError(err.message || "Failed to join group. Check the invitation code.");
    }
  };

  // Add Family Member (Select existing database record or manual entry)
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedGroup) return;

    setMemberAddError("");
    setIsSubmittingMember(true);

    try {
      let payload = {};

      if (addMemberMode === "select") {
        if (!selectedFamilyMemberId) {
          throw new Error("Please select an existing family member.");
        }

        const selectedMember = savedFamilyMembers.find(
          (fm) => String(fm._id) === String(selectedFamilyMemberId)
        );

        if (!selectedMember) {
          throw new Error("Selected family member record could not be found.");
        }

        // Verify duplicate check on client before sending
        const alreadyInGroup = members.some(
          (m) =>
            (m.familyMemberId && String(m.familyMemberId) === String(selectedFamilyMemberId)) ||
            (m.name && m.name.toLowerCase() === selectedMember.name.toLowerCase())
        );

        if (alreadyInGroup) {
          throw new Error(`'${selectedMember.name}' has already been added to this tracking group.`);
        }

        payload = {
          familyMemberId: selectedFamilyMemberId,
        };
      } else {
        if (!newMemberName.trim()) {
          throw new Error("Please enter family member's name.");
        }
        payload = {
          name: newMemberName.trim(),
          relationship: newMemberRelationship.trim(),
        };
      }

      const data = await apiAddFamilyMember(selectedGroup._id, payload, token);

      if (!data || !data.member || !data.inviteToken) {
        throw new Error("Backend failed to generate tracking invitation.");
      }

      const inviteUrl = `${window.location.origin}/track/${data.inviteToken}`;
      setActiveInviteData({
        memberName: data.member.name,
        relationship: data.member.relationship,
        membershipId: data.member._id,
        inviteToken: data.inviteToken,
        inviteUrl,
      });

      setShowAddMemberModal(false);
      setNewMemberName("");
      setNewMemberRelationship("");
      setShowInviteModal(true); // Pop up the invite link & QR code immediately
      setSuccessMsg(`Added '${data.member.name}'. Share the generated invitation link or QR code!`);
      pollGroupData();
    } catch (err) {
      console.error("Failed to add family member:", err);
      setMemberAddError(err.message || "Failed to add family member to tracking group.");
    } finally {
      setIsSubmittingMember(false);
    }
  };

  // Re-generate Member Invitation Link
  const handleRegenerateInvite = async (membershipId, memberName) => {
    if (!selectedGroup) return;
    try {
      const data = await apiRegenerateMemberInvite(selectedGroup._id, membershipId, token);
      const inviteUrl = `${window.location.origin}/track/${data.inviteToken}`;
      setActiveInviteData({
        memberName,
        membershipId,
        inviteToken: data.inviteToken,
        inviteUrl,
      });
      setShowInviteModal(true);
      setSuccessMsg(`New invitation link generated for ${memberName}.`);
    } catch (err) {
      setError(err.message || "Failed to generate new invitation link.");
    }
  };

  // Revoke Member
  const handleRevokeMember = async (membershipId, memberName) => {
    if (!window.confirm(`Are you sure you want to revoke access and remove ${memberName}?`)) {
      return;
    }
    try {
      await apiRevokeFamilyMember(selectedGroup._id, membershipId, token);
      setSuccessMsg(`Tracking access for ${memberName} revoked.`);
      pollGroupData();
    } catch (err) {
      setError(err.message || "Failed to revoke member.");
    }
  };

  // Update Group Threshold Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!selectedGroup) return;
    try {
      await apiUpdateFamilyGroupSettings(
        selectedGroup._id,
        {
          separationThresholdMeters: Number(newGroupThreshold),
        },
        token
      );
      setShowSettingsModal(false);
      setSuccessMsg("Separation threshold updated.");
      pollGroupData();
    } catch (err) {
      setError(err.message || "Failed to update settings.");
    }
  };

  // Pair ESP32 Device
  const handlePairDevice = async (e) => {
    e.preventDefault();
    if (!selectedGroup) return;
    try {
      const data = await apiRegisterIoTDevice(
        {
          groupId: selectedGroup._id,
          deviceId: pairDeviceIdInput.trim().toUpperCase(),
        },
        token
      );
      setRegisteredDeviceSecret(data.deviceToken);
      setSuccessMsg("ESP32 Device paired! Copy the device token below for firmware configuration.");
      pollGroupData();
    } catch (err) {
      setError(err.message || "Failed to pair device.");
    }
  };

  // Resolve Alert
  const handleResolveAlert = async (alertId) => {
    try {
      await apiResolveSeparationAlert(alertId, "Reunited & verified on dashboard", token);
      pollGroupData();
    } catch (err) {
      setError(err.message || "Failed to resolve alert.");
    }
  };

  // Copy Group Invite Code
  const handleCopyInviteCode = () => {
    if (selectedGroup?.inviteCode) {
      navigator.clipboard.writeText(selectedGroup.inviteCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2500);
    }
  };

  // Copy Member Invite Link
  const handleCopyInviteLink = () => {
    if (activeInviteData?.inviteUrl) {
      navigator.clipboard.writeText(activeInviteData.inviteUrl);
      setInviteLinkCopied(true);
      setTimeout(() => setInviteLinkCopied(false), 2500);
    }
  };

  // College Project Simulation Handler
  const handleSimulateMemberMovement = async (distanceMeters) => {
    if (!selectedGroup) return;
    const baseLat = currentCoords?.latitude || 12.9716;
    const baseLng = currentCoords?.longitude || 77.5946;

    const offsetDegrees = distanceMeters * 0.000009;
    const simLat = baseLat + offsetDegrees;
    const simLng = baseLng;

    // Pick first non-main member for simulation, or submit without membership
    const targetMember = members.find((m) => m.role !== "main");

    try {
      const res = await apiSubmitLocation(
        {
          groupId: selectedGroup._id,
          membershipId: targetMember?.membershipId || null,
          latitude: simLat,
          longitude: simLng,
          accuracy: 5,
          isSimulated: true,
        },
        token
      );

      if (res.alert) {
        playSimulatedBuzzer(res.alert.buzzerPattern);
      }
      pollGroupData();
      setSuccessMsg(`Simulated coordinate moved to ~${distanceMeters}m away.`);
    } catch (err) {
      console.warn("Simulation notice:", err.message);
    }
  };

  // Active separation alerts
  const activeAlerts = alerts.filter(
    (a) => a.status === "active" || a.status === "acknowledged_by_device"
  );
  const mainUserMembership = members.find((m) => m.role === "main");
  const mainUserLocation = mainUserMembership?.lastLocation || currentCoords;

  return (
    <div className="family-tracking-page pilgrim-dashboard-wrapper">
      <Navbar />

      <div className="family-tracking-container">
        <UserSidebar activeTab="family-tracking" />

        <main className="family-tracking-content">
          {/* Header & Action Row */}
          <div className="family-tracking-header">
            <div className="header-top-row">
              <div className="header-title-block">
                <h1>
                  <FiUsers style={{ color: "#2563eb" }} />
                  PilgrimIQ Family Tracking & Separation Alert
                </h1>
                <p>
                  IoT-backed crowd safety: Main user carries the ESP32 buzzer, family members share GPS via secure links without accounts.
                </p>
              </div>

              <div className="header-action-buttons">
                {selectedGroup && (
                  <button
                    type="button"
                    className="btn-primary-action"
                    onClick={() => setShowAddMemberModal(true)}
                  >
                    <FiUserPlus /> Add Family Member
                  </button>
                )}

                <button
                  type="button"
                  className="btn-outline-action"
                  onClick={() => setShowCreateModal(true)}
                >
                  <FiPlus /> New Group
                </button>

                {selectedGroup && (
                  <button
                    type="button"
                    className="btn-outline-action"
                    onClick={() => {
                      setNewGroupThreshold(selectedGroup.separationThresholdMeters || 10);
                      setShowSettingsModal(true);
                    }}
                    title="Configure Separation Threshold"
                  >
                    <FiSliders /> Distance Settings
                  </button>
                )}
              </div>
            </div>

            {/* Success and Error Alerts */}
            {successMsg && (
              <div
                style={{
                  background: "#dcfce7",
                  border: "1px solid #86efac",
                  color: "#166534",
                  padding: "10px 16px",
                  borderRadius: "10px",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "13.5px",
                  fontWeight: "600",
                }}
              >
                <span>{successMsg}</span>
                <FiX style={{ cursor: "pointer" }} onClick={() => setSuccessMsg("")} />
              </div>
            )}

            {error && (
              <div
                style={{
                  background: "#fee2e2",
                  border: "1px solid #fca5a5",
                  color: "#991b1b",
                  padding: "10px 16px",
                  borderRadius: "10px",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "13.5px",
                  fontWeight: "600",
                }}
              >
                <span>{error}</span>
                <FiX style={{ cursor: "pointer" }} onClick={() => setError("")} />
              </div>
            )}
          </div>

          {/* Group Identity & Selection Banner */}
          {selectedGroup ? (
            <div className="group-info-card">
              <div className="group-identity">
                <div className="group-avatar-icon">🏛️</div>
                <div className="group-text-info">
                  <h3>{selectedGroup.name}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                    <span className="group-role-badge role-main">
                      GROUP CREATOR / MAIN USER
                    </span>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      Threshold: <strong>{selectedGroup.separationThresholdMeters || 10} meters</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Invitation Code Pill */}
              <div className="invite-code-pill-container">
                <span className="invite-code-label">Group Code:</span>
                <span className="invite-code-value">{selectedGroup.inviteCode}</span>
                <button
                  type="button"
                  className="btn-copy-code"
                  onClick={handleCopyInviteCode}
                  title="Copy code"
                >
                  {codeCopied ? <FiCheck color="#16a34a" /> : <FiCopy />}
                  {codeCopied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                background: "#ffffff",
                border: "1.5px dashed #cbd5e1",
                borderRadius: "16px",
                padding: "40px 20px",
                textAlign: "center",
                marginBottom: "24px",
              }}
            >
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>👨‍👩‍👧‍👦</div>
              <h3 style={{ margin: "0 0 8px 0", color: "#0f172a" }}>No Family Tracking Group Active</h3>
              <p style={{ color: "#64748b", maxWidth: "480px", margin: "0 auto 20px auto", fontSize: "14px" }}>
                Create a family group to start monitoring loved ones with your ESP32 device. Add family members directly without requiring them to create accounts.
              </p>
              <button
                type="button"
                className="btn-primary-action"
                onClick={() => setShowCreateModal(true)}
              >
                <FiPlus /> Create Group
              </button>
            </div>
          )}

          {/* Quick Metrics Strip */}
          {selectedGroup && (
            <div className="metrics-strip">
              <div className="metric-card">
                <div className="metric-icon-box icon-blue">
                  <FiUsers />
                </div>
                <div className="metric-details">
                  <p>Family Members</p>
                  <h4>{members.length} Pilgrims</h4>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon-box icon-purple">
                  <FiCrosshair />
                </div>
                <div className="metric-details">
                  <p>Separation Range</p>
                  <h4>{selectedGroup.separationThresholdMeters || 10} m</h4>
                </div>
              </div>

              <div className="metric-card">
                <div className={`metric-icon-box ${deviceStatus?.isOnline ? "icon-green" : "icon-red"}`}>
                  <FiCpu />
                </div>
                <div className="metric-details">
                  <p>ESP32 Hardware</p>
                  <h4>{deviceStatus?.isOnline ? "Connected" : "Disconnected"}</h4>
                </div>
              </div>

              <div className="metric-card">
                <div className={`metric-icon-box ${activeAlerts.length > 0 ? "icon-red" : "icon-green"}`}>
                  <FiAlertTriangle />
                </div>
                <div className="metric-details">
                  <p>Active Alerts</p>
                  <h4>{activeAlerts.length} Separations</h4>
                </div>
              </div>
            </div>
          )}

          {/* Active Separation Alert Banner */}
          {activeAlerts.length > 0 && (
            <div
              className={`separation-alert-banner ${
                activeAlerts[0].severity === "critical"
                  ? "alert-banner-critical"
                  : "alert-banner-warning"
              }`}
            >
              <div className="alert-banner-content">
                <div className="alert-banner-icon">
                  <FiAlertTriangle />
                </div>
                <div className="alert-banner-text">
                  <h4>
                    {activeAlerts[0].severity === "critical"
                      ? "CRITICAL SEPARATION DETECTED"
                      : "EARLY SEPARATION WARNING"}
                  </h4>
                  <p>
                    <strong>{activeAlerts[0].memberName || activeAlerts[0].member?.name || "Family Member"}</strong> is{" "}
                    <strong>{activeAlerts[0].distanceMeters} meters away</strong> (threshold:{" "}
                    {activeAlerts[0].thresholdMeters}m). Buzzer trigger dispatched to ESP32 DevKit V1.
                  </p>
                </div>
              </div>

              <div className="alert-banner-actions">
                <button
                  type="button"
                  className="btn-banner-resolve"
                  onClick={() => handleResolveAlert(activeAlerts[0]._id)}
                >
                  Mark Reunited
                </button>

                {activeAlerts[0].memberLocation?.latitude && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${activeAlerts[0].memberLocation.latitude},${activeAlerts[0].memberLocation.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-banner-directions"
                  >
                    <FiNavigation size={13} /> Open Directions
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Main Dashboard Layout Grid */}
          {selectedGroup && (
            <div className="dashboard-grid">
              {/* Left Column: Interactive Map */}
              <div className="map-card-container">
                <div className="map-card-header">
                  <h3>
                    <FiMapPin style={{ color: "#2563eb" }} /> Live Family Tracking Map
                  </h3>

                  <div className="map-legend">
                    <div className="legend-item">
                      <span className="legend-dot dot-main"></span>
                      <span>Main User (You)</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot dot-safe"></span>
                      <span>Safe (&lt;{selectedGroup.separationThresholdMeters || 10}m)</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot dot-separated"></span>
                      <span>Separated</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot dot-stale"></span>
                      <span>Stale / Offline</span>
                    </div>
                  </div>
                </div>

                <FamilyTrackingMap
                  mainUserLocation={mainUserLocation}
                  members={members}
                  separationThreshold={selectedGroup.separationThresholdMeters || 10}
                  focusedMemberId={focusedMemberId}
                />
              </div>

              {/* Right Column: Controls, Members, and Hardware */}
              <div className="controls-column">
                {/* 1. Participating Family Members List with Invitation Links */}
                <div className="control-panel-card">
                  <div className="control-card-header">
                    <h3>
                      <FiUsers style={{ color: "#2563eb" }} /> Family Members ({members.length})
                    </h3>
                    <button
                      type="button"
                      className="btn-primary-action"
                      style={{ padding: "6px 12px", fontSize: "12.5px" }}
                      onClick={handleOpenAddMemberModal}
                    >
                      <FiUserPlus size={14} /> Add Member
                    </button>
                  </div>

                  <div className="members-list-container">
                    {members.map((member) => {
                      const isSeparated = member.isSeparated;
                      const initial = (member.name || "M").charAt(0).toUpperCase();

                      // Compute status label
                      let statusLabel = member.locationStatus || "invited";
                      if (isSeparated) {
                        statusLabel = "separated";
                      } else if (!member.isInvitationAccepted && member.hasInviteLink) {
                        statusLabel = "invited";
                      } else if (member.isInvitationAccepted && !member.isLocationSharing) {
                        statusLabel = "stopped";
                      } else if (member.isLocationSharing && member.locationStatus === "live") {
                        statusLabel = "live";
                      }

                      return (
                        <div
                          key={member.membershipId}
                          className={`member-row-card ${isSeparated ? "separated-row" : ""}`}
                        >
                          <div className="member-left-info">
                            <div className="member-avatar-initial">{initial}</div>
                            <div className="member-name-block">
                              <h4 style={{ display: "flex", alignItems: "center" }}>
                                {member.name}
                                {member.role === "main" && " (Main User)"}
                                {member.relationship && (
                                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "normal", marginLeft: "4px" }}>
                                    • {member.relationship}
                                  </span>
                                )}
                                {!member.isAccountUser && member.role !== "main" && (
                                  <span className="guest-badge">No Account</span>
                                )}
                              </h4>
                              <div className="member-status-line">
                                <span className={`status-pill status-${statusLabel}`}>
                                  {statusLabel}
                                </span>
                                {member.distanceMeters !== null && member.distanceMeters !== undefined && (
                                  <span>{member.distanceMeters}m away</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="member-actions">
                            {/* Member Invite Link / QR button for non-main members */}
                            {member.role !== "main" && (
                              <button
                                type="button"
                                className="btn-icon-action"
                                onClick={() =>
                                  handleRegenerateInvite(member.membershipId, member.name)
                                }
                                title="View / Share Invitation Link & QR Code"
                              >
                                <FiShare2 size={14} />
                              </button>
                            )}

                            {member.lastLocation?.latitude && (
                              <>
                                <button
                                  type="button"
                                  className="btn-icon-action"
                                  onClick={() => setFocusedMemberId(member.membershipId)}
                                  title="Focus on map"
                                >
                                  <FiCrosshair size={14} />
                                </button>

                                <a
                                  href={`https://www.google.com/maps/dir/?api=1&destination=${member.lastLocation.latitude},${member.lastLocation.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn-icon-action"
                                  title="Open directions in Google Maps"
                                >
                                  <FiNavigation size={14} />
                                </a>
                              </>
                            )}

                            {member.role !== "main" && (
                              <button
                                type="button"
                                className="btn-icon-action"
                                onClick={() => handleRevokeMember(member.membershipId, member.name)}
                                title="Revoke member access"
                                style={{ color: "#ef4444" }}
                              >
                                <FiTrash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Main User's Phone GPS Sharing Controller */}
                <div className="control-panel-card">
                  <div className="control-card-header">
                    <h3>
                      <FiCrosshair style={{ color: "#10b981" }} /> Your Phone GPS Sharing (Main User)
                    </h3>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "800",
                        color: isWatchingLocation ? "#16a34a" : "#64748b",
                        background: isWatchingLocation ? "#dcfce7" : "#f1f5f9",
                        padding: "3px 8px",
                        borderRadius: "12px",
                      }}
                    >
                      {isWatchingLocation ? "TRACKING ACTIVE" : "STOPPED"}
                    </span>
                  </div>

                  <div className="gps-sharing-box">
                    <div className="consent-checkbox-row">
                      <input
                        type="checkbox"
                        id="consent-toggle"
                        checked={consentGranted}
                        onChange={(e) => setConsentGranted(e.target.checked)}
                      />
                      <label htmlFor="consent-toggle">
                        I consent to sharing my phone GPS coordinates with my group to calculate distance from my ESP32.
                      </label>
                    </div>

                    <div className="gps-action-row">
                      {!isWatchingLocation ? (
                        <button
                          type="button"
                          className="btn-start-gps"
                          onClick={handleStartLocationSharing}
                          disabled={!consentGranted}
                        >
                          <FiMapPin /> Start Location Sharing
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-stop-gps"
                          onClick={handleStopLocationSharing}
                        >
                          <FiX /> Stop Sharing
                        </button>
                      )}
                    </div>

                    {gpsError && (
                      <p style={{ color: "#dc2626", fontSize: "12px", margin: "6px 0 0 0" }}>
                        ⚠️ {gpsError}
                      </p>
                    )}

                    {currentCoords && (
                      <div className="gps-readout-grid">
                        <div className="gps-readout-item">
                          <span>Latitude:</span>
                          <strong>{currentCoords.latitude.toFixed(6)}°</strong>
                        </div>
                        <div className="gps-readout-item">
                          <span>Longitude:</span>
                          <strong>{currentCoords.longitude.toFixed(6)}°</strong>
                        </div>
                        <div className="gps-readout-item">
                          <span>Accuracy:</span>
                          <strong>±{Math.round(currentCoords.accuracy)} meters</strong>
                        </div>
                        <div className="gps-readout-item">
                          <span>Last Ping:</span>
                          <strong>{new Date().toLocaleTimeString()}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. ESP32 Hardware Status Card */}
                <div className="control-panel-card">
                  <div className="control-card-header">
                    <h3>
                      <FiCpu style={{ color: "#8b5cf6" }} /> ESP32 Device & Buzzer
                    </h3>
                    <button
                      type="button"
                      className="btn-pair-device"
                      onClick={() => setShowPairModal(true)}
                    >
                      Pair Device
                    </button>
                  </div>

                  <div className="esp32-status-box">
                    <div className="esp32-badge-row">
                      <span
                        className={`hardware-pill ${
                          deviceStatus?.isOnline ? "hw-online" : "hw-offline"
                        }`}
                      >
                        {deviceStatus?.isOnline ? "● ESP32 Online & Polling" : "○ ESP32 Disconnected"}
                      </span>

                      <button
                        type="button"
                        onClick={() => setAudioSimulationEnabled(!audioSimulationEnabled)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: audioSimulationEnabled ? "#2563eb" : "#94a3b8",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "12px",
                          fontWeight: "700",
                        }}
                      >
                        {audioSimulationEnabled ? <FiVolume2 size={16} /> : <FiVolumeX size={16} />}
                        {audioSimulationEnabled ? "Web Audio On" : "Web Audio Off"}
                      </button>
                    </div>

                    <div className="esp32-details-list">
                      <div>
                        <span>Device ID:</span>
                        <strong>{selectedGroup.pairedDeviceId || "Not Paired"}</strong>
                      </div>
                      <div>
                        <span>Buzzer GPIO Pin:</span>
                        <strong>GPIO 18 (Active Buzzer)</strong>
                      </div>
                      <div>
                        <span>Last Heartbeat:</span>
                        <strong>
                          {deviceStatus?.device?.lastHeartbeat
                            ? new Date(deviceStatus.device.lastHeartbeat).toLocaleTimeString()
                            : "No heartbeat yet"}
                        </strong>
                      </div>
                    </div>

                    <div className="esp32-actions-row">
                      <button
                        type="button"
                        className="btn-test-buzzer"
                        onClick={() => playSimulatedBuzzer("warning_short")}
                      >
                        <FiVolume2 size={14} /> Test Buzzer Sound
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4. Live Proximity Distance Tester */}
                <div className="demo-mode-card">
                  <div className="demo-mode-header">
                    <h4>📡 Live Proximity Distance Tester</h4>
                  </div>
                  <p
                    style={{
                      margin: "0 0 10px 0",
                      fontSize: "12px",
                      color: "#065f46",
                      lineHeight: "1.4",
                    }}
                  >
                    Test separation triggers and alert firing in real-time:
                  </p>

                  <div className="demo-buttons-row">
                    <button
                      type="button"
                      className="btn-demo-step"
                      onClick={() => handleSimulateMemberMovement(4)}
                    >
                      Safe (~4m)
                    </button>
                    <button
                      type="button"
                      className="btn-demo-step"
                      onClick={() => handleSimulateMemberMovement(16)}
                      style={{ borderColor: "#f59e0b", color: "#b45309" }}
                    >
                      Separate (~16m)
                    </button>
                    <button
                      type="button"
                      className="btn-demo-step"
                      onClick={() => handleSimulateMemberMovement(35)}
                      style={{ borderColor: "#ef4444", color: "#dc2626" }}
                    >
                      Critical (~35m)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Family Member Modal (Connected to MongoDB Atlas) */}
          {showAddMemberModal && (
            <div className="modal-overlay">
              <div className="modal-content-card" style={{ maxWidth: "560px" }}>
                <div className="modal-header">
                  <div>
                    <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <FiUserPlus style={{ color: "#2563eb" }} /> Add Family Member
                    </h3>
                    <p style={{ margin: "4px 0 0 0", fontSize: "12.5px", color: "#64748b" }}>
                      Select from your saved family members in PilgrimIQ or enter a new member.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="modal-close-btn"
                    onClick={() => setShowAddMemberModal(false)}
                  >
                    <FiX />
                  </button>
                </div>

                {memberAddError && (
                  <div className="modal-error-banner">
                    <FiAlertCircle /> {memberAddError}
                  </div>
                )}

                {/* Mode Selector Tabs */}
                <div className="add-member-tabs">
                  <button
                    type="button"
                    className={`add-member-tab-btn ${addMemberMode === "select" ? "active" : ""}`}
                    onClick={() => {
                      setAddMemberMode("select");
                      setMemberAddError("");
                    }}
                  >
                    <FiUsers size={14} /> Saved Family Members ({savedFamilyMembers.length})
                  </button>
                  <button
                    type="button"
                    className={`add-member-tab-btn ${addMemberMode === "manual" ? "active" : ""}`}
                    onClick={() => {
                      setAddMemberMode("manual");
                      setMemberAddError("");
                    }}
                  >
                    <FiPlus size={14} /> Add New Member
                  </button>
                </div>

                <form onSubmit={handleAddMember}>
                  {addMemberMode === "select" ? (
                    <div>
                      {loadingSavedMembers ? (
                        <div style={{ textAlign: "center", padding: "30px 10px", color: "#64748b" }}>
                          <FiRefreshCw className="spinning-icon" style={{ fontSize: "20px", marginBottom: "8px" }} />
                          <p style={{ margin: 0, fontSize: "13px" }}>Loading your saved family members from database...</p>
                        </div>
                      ) : savedFamilyMembers.length === 0 ? (
                        <div className="saved-members-empty-box">
                          <p style={{ margin: "0 0 10px 0", fontWeight: "600", color: "#334155" }}>
                            No saved family members found in your profile.
                          </p>
                          <p style={{ margin: "0 0 14px 0", fontSize: "12px" }}>
                            You can add family members to your PilgrimIQ Profile, or enter member details directly below.
                          </p>
                          <button
                            type="button"
                            className="btn-outline-action"
                            style={{ fontSize: "12px", padding: "6px 14px" }}
                            onClick={() => setAddMemberMode("manual")}
                          >
                            Enter Member Details Manually
                          </button>
                        </div>
                      ) : (
                        <div>
                          <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", color: "#334155", marginBottom: "8px" }}>
                            Choose Existing Family Member from Database:
                          </label>
                          <div className="saved-members-list">
                            {savedFamilyMembers.map((fm) => {
                              const alreadyInGroup = members.some(
                                (m) =>
                                  (m.familyMemberId && String(m.familyMemberId) === String(fm._id)) ||
                                  (m.name && m.name.toLowerCase() === fm.name.toLowerCase())
                              );
                              const isSelected = selectedFamilyMemberId === fm._id;
                              const initial = (fm.name || "M").charAt(0).toUpperCase();

                              return (
                                <div
                                  key={fm._id}
                                  className={`saved-member-card ${isSelected ? "selected" : ""} ${alreadyInGroup ? "disabled" : ""}`}
                                  onClick={() => {
                                    if (!alreadyInGroup) {
                                      setSelectedFamilyMemberId(fm._id);
                                      setMemberAddError("");
                                    }
                                  }}
                                >
                                  <div className="saved-member-card-left">
                                    <div className="saved-member-avatar">{initial}</div>
                                    <div className="saved-member-info">
                                      <h4>
                                        {fm.name}
                                        {fm.relationship && (
                                          <span className="saved-member-relationship-badge">
                                            {fm.relationship}
                                          </span>
                                        )}
                                      </h4>
                                      <p className="saved-member-subtext">
                                        {[
                                          fm.phone ? `Phone: ${fm.phone}` : null,
                                          fm.age ? `Age: ${fm.age}` : null,
                                          fm.gender ? fm.gender : null,
                                        ]
                                          .filter(Boolean)
                                          .join(" • ") || "Saved in PilgrimIQ Profile"}
                                      </p>
                                    </div>
                                  </div>

                                  <div>
                                    {alreadyInGroup ? (
                                      <span className="saved-member-status-tag in-group">
                                        ✓ In Group
                                      </span>
                                    ) : (
                                      <span
                                        className="saved-member-status-tag selectable"
                                        style={{
                                          background: isSelected ? "#2563eb" : "#f1f5f9",
                                          color: isSelected ? "#ffffff" : "#475569",
                                        }}
                                      >
                                        {isSelected ? "Selected" : "Select"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <p style={{ margin: "0 0 16px 0", fontSize: "12px", color: "#059669", background: "#ecfdf5", padding: "8px 12px", borderRadius: "8px", border: "1px solid #a7f3d0" }}>
                            🔒 <strong>Database Reused:</strong> Reuses existing database record without creating duplicate family entries. Family members access tracking directly via invitation link without needing an account.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#64748b" }}>
                        Enter details for a family member not yet saved in your profile.
                      </p>

                      <div className="form-group">
                        <label>Member Name *</label>
                        <input
                          type="text"
                          placeholder="e.g. Ramesh Sharma"
                          value={newMemberName}
                          onChange={(e) => setNewMemberName(e.target.value)}
                          required={addMemberMode === "manual"}
                        />
                      </div>

                      <div className="form-group">
                        <label>Relationship (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Father, Mother, Brother, Sister, Spouse"
                          value={newMemberRelationship}
                          onChange={(e) => setNewMemberRelationship(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                    <button
                      type="button"
                      className="btn-outline-action"
                      style={{ flex: 1 }}
                      onClick={() => setShowAddMemberModal(false)}
                      disabled={isSubmittingMember}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary-action"
                      style={{ flex: 1 }}
                      disabled={
                        isSubmittingMember ||
                        (addMemberMode === "select" && (!selectedFamilyMemberId || savedFamilyMembers.length === 0)) ||
                        (addMemberMode === "manual" && !newMemberName.trim())
                      }
                    >
                      {isSubmittingMember ? "Generating Invitation..." : "Add & Generate Link"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Member Invitation Link & QR Code Modal */}
          {showInviteModal && activeInviteData && (
            <div className="modal-overlay">
              <div className="modal-content-card" style={{ maxWidth: "500px" }}>
                <div className="modal-header">
                  <h3>
                    <FiShare2 style={{ color: "#2563eb", marginRight: "6px" }} />
                    Tracking Invitation Link
                  </h3>
                  <button
                    type="button"
                    className="modal-close-btn"
                    onClick={() => setShowInviteModal(false)}
                  >
                    <FiX />
                  </button>
                </div>

                <div style={{ textAlign: "center" }}>
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "17px", color: "#0f172a" }}>
                    {activeInviteData.memberName}
                    {activeInviteData.relationship && ` (${activeInviteData.relationship})`}
                  </h4>
                  <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#64748b" }}>
                    Have your family member scan this QR code on their smartphone or send them the link. No login or password required!
                  </p>

                  {/* QR Code */}
                  <div className="qr-code-box">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(
                        activeInviteData.inviteUrl
                      )}`}
                      alt={`Scan QR to track ${activeInviteData.memberName}`}
                    />
                    <span style={{ display: "block", marginTop: "8px", fontSize: "11.5px", color: "#64748b" }}>
                      Scan with smartphone camera
                    </span>
                  </div>

                  {/* Copy Link Input */}
                  <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                    <input
                      type="text"
                      readOnly
                      value={activeInviteData.inviteUrl}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        fontSize: "12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        background: "#f8fafc",
                        fontFamily: "monospace",
                      }}
                    />
                    <button
                      type="button"
                      className="btn-primary-action"
                      style={{ padding: "8px 14px", fontSize: "13px" }}
                      onClick={handleCopyInviteLink}
                    >
                      {inviteLinkCopied ? <FiCheck /> : <FiCopy />}
                      {inviteLinkCopied ? "Copied!" : "Copy Link"}
                    </button>
                  </div>

                  <p style={{ margin: 0, fontSize: "12px", color: "#059669", fontWeight: "600" }}>
                    ✓ Protected with SHA-256 token hash & single-use session exchange.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Create Group Modal */}
          {showCreateModal && (
            <div className="modal-overlay">
              <div className="modal-content-card">
                <div className="modal-header">
                  <h3>Create Family Tracking Group</h3>
                  <button
                    type="button"
                    className="modal-close-btn"
                    onClick={() => setShowCreateModal(false)}
                  >
                    <FiX />
                  </button>
                </div>

                <form onSubmit={handleCreateGroup}>
                  {groupCreateError && (
                    <div className="modal-error-banner">
                      <FiAlertCircle /> {groupCreateError}
                    </div>
                  )}

                  <div className="form-group">
                    <label>Group Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Sharma Family Kashi Yatra"
                      value={newGroupName}
                      onChange={(e) => {
                        setNewGroupName(e.target.value);
                        setGroupCreateError("");
                      }}
                      required
                      disabled={isCreatingGroup}
                    />
                  </div>

                  <div className="form-group">
                    <label>Separation Distance Threshold (Meters)</label>
                    <input
                      type="number"
                      min="5"
                      max="1000"
                      value={newGroupThreshold}
                      onChange={(e) => setNewGroupThreshold(e.target.value)}
                      disabled={isCreatingGroup}
                    />
                    <div className="form-help-text">
                      Default is 10 meters for close crowd tracking.
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                    <button
                      type="button"
                      className="btn-outline-action"
                      style={{ flex: 1 }}
                      onClick={() => setShowCreateModal(false)}
                      disabled={isCreatingGroup}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary-action"
                      style={{ flex: 1 }}
                      disabled={isCreatingGroup || !newGroupName.trim()}
                    >
                      {isCreatingGroup ? "Saving to Database..." : "Create Group"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Distance Settings Modal */}
          {showSettingsModal && (
            <div className="modal-overlay">
              <div className="modal-content-card">
                <div className="modal-header">
                  <h3>Tracking & Distance Settings</h3>
                  <button
                    type="button"
                    className="modal-close-btn"
                    onClick={() => setShowSettingsModal(false)}
                  >
                    <FiX />
                  </button>
                </div>

                <form onSubmit={handleSaveSettings}>
                  <div className="form-group">
                    <label>Configurable Separation Distance (Meters)</label>
                    <input
                      type="number"
                      min="5"
                      max="500"
                      value={newGroupThreshold}
                      onChange={(e) => setNewGroupThreshold(e.target.value)}
                    />
                    <div className="form-help-text">
                      An alert triggers and buzzes the ESP32 when any family member moves further than this distance.
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                    <button
                      type="button"
                      className="btn-outline-action"
                      style={{ flex: 1 }}
                      onClick={() => setShowSettingsModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary-action" style={{ flex: 1 }}>
                      Save Settings
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Pair ESP32 Device Modal */}
          {showPairModal && (
            <div className="modal-overlay">
              <div className="modal-content-card">
                <div className="modal-header">
                  <h3>Pair ESP32 DevKit V1 Hardware</h3>
                  <button
                    type="button"
                    className="modal-close-btn"
                    onClick={() => {
                      setShowPairModal(false);
                      setRegisteredDeviceSecret(null);
                    }}
                  >
                    <FiX />
                  </button>
                </div>

                <form onSubmit={handlePairDevice}>
                  <div className="form-group">
                    <label>Device Identifier</label>
                    <input
                      type="text"
                      value={pairDeviceIdInput}
                      onChange={(e) => setPairDeviceIdInput(e.target.value.toUpperCase())}
                      placeholder="ESP32-TRACKER-01"
                      required
                    />
                    <div className="form-help-text">
                      Matches the <code>DEVICE_ID</code> configured in your ESP32 Arduino code.
                    </div>
                  </div>

                  {registeredDeviceSecret && (
                    <div className="device-token-callout">
                      <strong>✅ Device Registered Successfully!</strong>
                      <p style={{ margin: "4px 0 8px 0", fontSize: "12px", color: "#334155" }}>
                        Copy this secret token into your <code>config.h</code> file for the ESP32:
                      </p>
                      <code>{registeredDeviceSecret}</code>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                    <button
                      type="button"
                      className="btn-outline-action"
                      style={{ flex: 1 }}
                      onClick={() => {
                        setShowPairModal(false);
                        setRegisteredDeviceSecret(null);
                      }}
                    >
                      Close
                    </button>
                    <button type="submit" className="btn-primary-action" style={{ flex: 1 }}>
                      Register / Pair
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default FamilyTracking;
