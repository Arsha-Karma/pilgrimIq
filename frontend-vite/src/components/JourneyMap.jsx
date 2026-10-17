import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker asset issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom Category Marker Icons
const createCustomIcon = (emoji, bgColor = "#2563eb") => {
  return L.divIcon({
    className: "custom-map-marker-pin",
    html: `
      <div style="
        background-color: ${bgColor};
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 18px;
        border: 2px solid #ffffff;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      ">
        ${emoji}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -32],
  });
};

const CENTER_ICON = createCustomIcon("📍", "#dc2626");

const CATEGORY_ICONS = {
  accommodation: createCustomIcon("🏨", "#3b82f6"),
  restaurants: createCustomIcon("🍽️", "#f59e0b"),
  parking: createCustomIcon("🅿️", "#64748b"),
  hospitals: createCustomIcon("🏥", "#ef4444"),
  pharmacies: createCustomIcon("💊", "#10b981"),
  restrooms: createCustomIcon("🚻", "#8b5cf6"),
  drinkingWater: createCustomIcon("🚰", "#06b6d4"),
  atms: createCustomIcon("🏧", "#059669"),
};

// Global Monkey-Patch Guard for Leaflet getPosition & _getMapPanePos to prevent unmount race condition crashes
if (L && L.DomUtil && L.DomUtil.getPosition) {
  const originalGetPosition = L.DomUtil.getPosition;
  L.DomUtil.getPosition = function (el) {
    if (!el) return new L.Point(0, 0);
    try {
      return originalGetPosition.call(this, el);
    } catch (e) {
      return new L.Point(0, 0);
    }
  };
}

if (L && L.Map && L.Map.prototype) {
  const originalGetMapPanePos = L.Map.prototype._getMapPanePos;
  L.Map.prototype._getMapPanePos = function () {
    if (!this._mapPane) return new L.Point(0, 0);
    try {
      return originalGetMapPanePos.call(this);
    } catch (e) {
      return new L.Point(0, 0);
    }
  };
}

// Component to dynamically re-center map when center or places change
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] !== undefined && center[1] !== undefined && !isNaN(center[0]) && !isNaN(center[1])) {
      try {
        if (map && typeof map.stop === "function") {
          map.stop();
        }
        map.setView(center, zoom, { animate: false });
      } catch (e) {
        // Prevent Leaflet unmount / animation race condition errors
      }
    }
  }, [center, zoom, map]);
  return null;
}

function JourneyMap({ centerCoords, centerName, places = [], selectedPlaceIds = [], onSelectPlace }) {
  const lat = centerCoords?.latitude || 20.5937;
  const lng = centerCoords?.longitude || 78.9629;
  const position = [lat, lng];

  return (
    <div style={{ width: "100%", height: "420px", borderRadius: "14px", overflow: "hidden", border: "1px solid #cbd5e1", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
      <MapContainer center={position} zoom={13} style={{ width: "100%", height: "100%" }}>
        <ChangeView center={position} zoom={13} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Pilgrimage Center Marker */}
        <Marker position={position} icon={CENTER_ICON}>
          <Popup>
            <div style={{ textAlign: "center", padding: "4px" }}>
              <h4 style={{ margin: "0 0 4px 0", color: "#1e293b" }}>📍 {centerName || "Pilgrimage Center"}</h4>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>Main Destination Center</p>
            </div>
          </Popup>
        </Marker>

        {/* Nearby Services Markers */}
        {places.map((place, idx) => {
          if (!place.latitude || !place.longitude) return null;
          const iconToUse = CATEGORY_ICONS[place.category] || CATEGORY_ICONS.accommodation;
          const isSelected = selectedPlaceIds.includes(place.externalPlaceId || place._id || idx);

          return (
            <Marker key={place.externalPlaceId || idx} position={[place.latitude, place.longitude]} icon={iconToUse}>
              <Popup>
                <div style={{ maxWidth: "230px", padding: "4px" }}>
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>{place.name}</h4>
                  <div style={{ fontSize: "12px", color: "#475569", marginBottom: "6px" }}>
                    {place.rating && <span style={{ color: "#b45309", fontWeight: "bold", marginRight: "6px" }}>⭐ {place.rating}</span>}
                    <span>📍 {place.distanceKm} km away</span>
                  </div>
                  <p style={{ margin: "0 0 8px 0", fontSize: "11.5px", color: "#64748b", lineHeight: "1.3" }}>
                    {place.address}
                  </p>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${place.latitude},${place.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#eff6ff",
                        color: "#2563eb",
                        border: "1px solid #bfdbfe",
                        padding: "5px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "bold",
                        textDecoration: "none",
                      }}
                    >
                      🗺️ Directions
                    </a>
                    {onSelectPlace && (
                      <button
                        type="button"
                        onClick={() => onSelectPlace(place)}
                        style={{
                          flex: 1,
                          background: isSelected ? "#10b981" : "#2563eb",
                          color: "#ffffff",
                          border: "none",
                          padding: "5px 8px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "bold",
                          cursor: "pointer",
                        }}
                      >
                        {isSelected ? "✓ Selected" : "Select"}
                      </button>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default JourneyMap;
