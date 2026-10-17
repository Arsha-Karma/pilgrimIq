import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom Leaflet Icons
const createCustomPin = (emoji, bgColor = "#2563eb", isPulsing = false) => {
  return L.divIcon({
    className: "custom-map-marker-pin",
    html: `
      <div style="
        background-color: ${bgColor};
        width: 38px;
        height: 38px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 19px;
        border: 2px solid #ffffff;
        box-shadow: 0 4px 12px rgba(0,0,0,0.35);
        ${isPulsing ? "animation: pulse-ring 2s infinite;" : ""}
      ">
        ${emoji}
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -34],
  });
};

const START_ICON = createCustomPin("🏁", "#10b981");
const DEST_ICON = createCustomPin("⛩️", "#dc2626");
const CURRENT_ICON = createCustomPin("🧭", "#3b82f6", true);

function FitBoundsView({ routeCoords, currentCoords }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    try {
      if (routeCoords && routeCoords.length > 0) {
        const bounds = L.latLngBounds(routeCoords);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      } else if (currentCoords && currentCoords[0] && currentCoords[1]) {
        map.setView(currentCoords, 13);
      }
    } catch (e) {
      // Prevent Leaflet unmount animation errors
    }
  }, [map, routeCoords, currentCoords]);
  return null;
}

function JourneyProgressMap({
  currentLocation,
  startLocation,
  destinationLocation,
  routeCoordinates = [],
  destinationName = "Destination",
  startName = "Starting Point",
  height = "460px",
}) {
  const currentPos = currentLocation?.latitude && currentLocation?.longitude
    ? [currentLocation.latitude, currentLocation.longitude]
    : null;

  const startPos = startLocation?.latitude && startLocation?.longitude
    ? [startLocation.latitude, startLocation.longitude]
    : [8.5241, 76.9366];

  const destPos = destinationLocation?.latitude && destinationLocation?.longitude
    ? [destinationLocation.latitude, destinationLocation.longitude]
    : [9.4344, 77.0811];

  const activeCenter = currentPos || startPos;

  return (
    <div style={{ width: "100%", height, borderRadius: "16px", overflow: "hidden", border: "1px solid #334155", boxShadow: "0 6px 20px rgba(0,0,0,0.25)", position: "relative" }}>
      <MapContainer center={activeCenter} zoom={12} style={{ width: "100%", height: "100%" }}>
        <FitBoundsView routeCoords={routeCoordinates} currentCoords={currentPos} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Start Location Marker */}
        <Marker position={startPos} icon={START_ICON}>
          <Popup>
            <div style={{ padding: "4px" }}>
              <h4 style={{ margin: "0 0 2px 0", color: "#0f172a" }}>🏁 {startName}</h4>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>Starting Origin</p>
            </div>
          </Popup>
        </Marker>

        {/* Destination Location Marker */}
        <Marker position={destPos} icon={DEST_ICON}>
          <Popup>
            <div style={{ padding: "4px" }}>
              <h4 style={{ margin: "0 0 2px 0", color: "#0f172a" }}>⛩️ {destinationName}</h4>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>Pilgrimage Destination</p>
            </div>
          </Popup>
        </Marker>

        {/* Current Position Marker */}
        {currentPos && (
          <Marker position={currentPos} icon={CURRENT_ICON}>
            <Popup>
              <div style={{ padding: "4px" }}>
                <h4 style={{ margin: "0 0 2px 0", color: "#0f172a" }}>🧭 Current Location</h4>
                <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                  {currentLocation?.address || `${currentPos[0].toFixed(4)}, ${currentPos[1].toFixed(4)}`}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Full Route Polyline */}
        {routeCoordinates && routeCoordinates.length > 0 && (
          <Polyline
            positions={routeCoordinates}
            pathOptions={{ color: "#3b82f6", weight: 5, opacity: 0.8, lineCap: "round" }}
          />
        )}
      </MapContainer>
    </div>
  );
}

export default JourneyProgressMap;
