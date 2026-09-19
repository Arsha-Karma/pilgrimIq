// PilgrimIQ Settings Service
// Centralized state management & API layer for user settings

const STORAGE_KEY = "pilgrim_user_settings";

export const DEFAULT_SETTINGS = {
  accountSettings: {
    twoFactorEnabled: false,
    phoneVerified: true,
    activeSessions: [
      {
        id: "sess_current",
        device: "Chrome on Windows 11",
        browser: "Chrome 122.0",
        location: "Kerala, India",
        ip: "103.22.45.12",
        lastActive: "Just now",
        isCurrent: true,
      },
      {
        id: "sess_mobile_1",
        device: "PilgrimIQ Mobile App (Android 14)",
        browser: "Mobile App v2.1",
        location: "Kochi, Kerala, India",
        ip: "49.37.112.90",
        lastActive: "2 hours ago",
        isCurrent: false,
      },
      {
        id: "sess_tab_1",
        device: "Safari on iPad Pro",
        browser: "Safari 17.2",
        location: "Thiruvananthapuram, India",
        ip: "157.33.201.11",
        lastActive: "Yesterday at 18:45",
        isCurrent: false,
      },
    ],
    loginHistory: [
      {
        id: "log_1",
        date: "2026-09-09 19:12:05",
        device: "Windows PC / Chrome",
        ip: "103.22.45.12",
        location: "Kerala, India",
        status: "Successful",
      },
      {
        id: "log_2",
        date: "2026-09-08 08:30:11",
        device: "Android Smartphone",
        ip: "49.37.112.90",
        location: "Kochi, India",
        status: "Successful",
      },
      {
        id: "log_3",
        date: "2026-09-05 14:22:40",
        device: "iPad Pro / Safari",
        ip: "157.33.201.11",
        location: "Thiruvananthapuram, India",
        status: "Successful",
      },
    ],
  },
  notificationSettings: {
    weatherAlerts: true,
    severeWeatherAlerts: true,
    journeyProgressAlerts: true,
    medicineReminders: true,
    hydrationReminders: true,
    familyTrackingAlerts: true,
    communityAssistanceAlerts: true,
    emergencyNotifications: true,
    emailNotifications: true,
    browserNotifications: true,
  },
  privacySettings: {
    medicalDataVisibility: "EmergencyOnly", // 'Private', 'EmergencyOnly', 'ApprovedHelpers'
    aiProcessingConsent: true,
    familySharing: true,
    journeyGroupSharing: true,
    communityAssistanceSharing: true,
    locationSharing: true,
  },
  locationSettings: {
    locationServices: true,
    gpsTracking: true,
    journeyTracking: true,
    familyLocationSharing: true,
    stopTrackingAfterJourney: true,
    locationHistoryEnabled: true,
    locationHistory: [
      { id: "loc_1", timestamp: "2026-09-09 14:00", spot: "Pamba Base Camp", lat: 9.3872, lng: 77.0694 },
      { id: "loc_2", timestamp: "2026-09-09 10:30", spot: "Nilakkal Transit Station", lat: 9.3951, lng: 76.9942 },
      { id: "loc_3", timestamp: "2026-09-08 17:15", spot: "Chengannur Railway Station Hub", lat: 9.3175, lng: 76.6139 },
    ],
  },
  familyPrivacySettings: {
    shareWithFamily: true,
    shareWithJourneyGroup: true,
    communityAssistancePermission: true,
    sharedInfoWithCommunity: {
      shareName: true,
      shareLocation: true,
      shareJourneyStatus: true,
      shareEmergencyContact: true,
      shareHealthSafetyInfo: false,
    },
    familyTrackingVisibility: "ActiveJourneysOnly", // 'Always', 'ActiveJourneysOnly', 'EmergencyOnly'
  },
  appearanceSettings: {
    theme: "light", // 'light', 'dark', 'system'
    temperatureUnit: "C", // 'C', 'F'
    distanceUnit: "km", // 'km', 'mi'
    timeFormat: "12h", // '12h', '24h'
  },
};

// Get stored settings or default
export const getStoredSettings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      accountSettings: { ...DEFAULT_SETTINGS.accountSettings, ...(parsed.accountSettings || {}) },
      notificationSettings: { ...DEFAULT_SETTINGS.notificationSettings, ...(parsed.notificationSettings || {}) },
      privacySettings: { ...DEFAULT_SETTINGS.privacySettings, ...(parsed.privacySettings || {}) },
      locationSettings: { ...DEFAULT_SETTINGS.locationSettings, ...(parsed.locationSettings || {}) },
      familyPrivacySettings: {
        ...DEFAULT_SETTINGS.familyPrivacySettings,
        ...(parsed.familyPrivacySettings || {}),
        sharedInfoWithCommunity: {
          ...DEFAULT_SETTINGS.familyPrivacySettings.sharedInfoWithCommunity,
          ...(parsed.familyPrivacySettings?.sharedInfoWithCommunity || {}),
        },
      },
      appearanceSettings: { ...DEFAULT_SETTINGS.appearanceSettings, ...(parsed.appearanceSettings || {}) },
    };
  } catch (err) {
    console.error("Failed to load user settings from localStorage:", err);
    return DEFAULT_SETTINGS;
  }
};

// Save updated settings
export const saveSettingsToStorage = (settings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    // Apply appearance theme if changed
    applyThemePreference(settings.appearanceSettings?.theme || "light");
    return true;
  } catch (err) {
    console.error("Failed to save settings to localStorage:", err);
    return false;
  }
};

// Apply theme to document
export const applyThemePreference = (theme) => {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("pilgrim-dark-theme");
    document.body.classList.add("pilgrim-dark-mode");
  } else if (theme === "light") {
    root.classList.remove("pilgrim-dark-theme");
    document.body.classList.remove("pilgrim-dark-mode");
  } else if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) {
      root.classList.add("pilgrim-dark-theme");
      document.body.classList.add("pilgrim-dark-mode");
    } else {
      root.classList.remove("pilgrim-dark-theme");
      document.body.classList.remove("pilgrim-dark-mode");
    }
  }
};

// Export user account data as downloadable file (JSON format)
export const exportUserAccountData = (user, settings) => {
  const dataToExport = {
    app: "PilgrimIQ",
    exportedAt: new Date().toISOString(),
    userProfile: {
      name: user?.name || "Pilgrim User",
      email: user?.email || "",
      phone: user?.phone || "",
      bloodGroup: user?.bloodGroup || "",
      age: user?.age || null,
      gender: user?.gender || "",
      location: user?.location || "",
      emergencyContact: user?.emergencyContact || {},
      healthInfo: user?.healthInfo || {},
    },
    userSettings: settings,
  };

  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(dataToExport, null, 2)
  )}`;
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", jsonString);
  downloadAnchor.setAttribute("download", `PilgrimIQ_Data_${user?.name ? user.name.replace(/\s+/g, "_") : "User"}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};
