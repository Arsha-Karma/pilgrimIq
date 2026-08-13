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

// Component to dynamically re-center map when center or places change
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom);
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
                <div style={{ maxWidth: "220px", padding: "4px" }}>
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", color: "#0f172a" }}>{place.name}</h4>
                  <p style={{ margin: "0 0 6px 0", fontSize: "12px", color: "#475569" }}>
                    📍 {place.distanceKm} km away • {place.address}
                  </p>
                  {onSelectPlace && (
                    <button
                      type="button"
                      onClick={() => onSelectPlace(place)}
                      style={{
                        background: isSelected ? "#10b981" : "#2563eb",
                        color: "#ffffff",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        width: "100%",
                      }}
                    >
                      {isSelected ? "✓ Selected" : "Select Place"}
                    </button>
                  )}
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
