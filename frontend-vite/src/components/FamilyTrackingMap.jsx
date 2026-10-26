import React, { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FiNavigation, FiCrosshair, FiClock, FiActivity } from "react-icons/fi";

// Ensure default leaflet marker icons load properly
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Helper component for animated or forced panning/recentering
function ChangeMapView({ center, zoom, bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.isValid && bounds.isValid()) {
      try {
        if (map && typeof map.stop === "function") {
          map.stop();
        }
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 18, animate: true });
        return;
      } catch (err) {
        // Prevent race condition on unmount
      }
    }
    if (center && !isNaN(center[0]) && !isNaN(center[1])) {
      try {
        if (map && typeof map.stop === "function") {
          map.stop();
        }
        map.setView(center, zoom || map.getZoom(), { animate: true });
      } catch (err) {
        // Prevent race condition on unmount
      }
    }
  }, [center, zoom, bounds, map]);
  return null;
}

// Custom DivIcons for Main User and Family Members
const createMainUserIcon = () => {
  return L.divIcon({
    className: "leaflet-main-user-marker",
    html: `
      <div style="
        position: relative;
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          position: absolute;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(37, 99, 235, 0.25);
          animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        "></div>
        <div style="
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
          border: 3px solid #ffffff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: 14px;
        ">
          ME
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
};

const createMemberIcon = (initial, status, isSeparated) => {
  let bgColor = "#10b981"; // green (normal)
  let pulse = false;

  if (isSeparated) {
    bgColor = "#ef4444"; // red (separated)
    pulse = true;
  } else if (status === "reunited") {
    bgColor = "#0d9488"; // teal (reunited)
    pulse = false;
  } else if (status === "warning") {
    bgColor = "#f59e0b"; // amber
  } else if (status === "stale" || status === "unavailable" || status === "stopped") {
    bgColor = "#64748b"; // gray
  }

  return L.divIcon({
    className: `leaflet-member-marker ${pulse ? "separated-pulse" : ""}`,
    html: `
      <div style="
        position: relative;
        width: 38px;
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        ${
          pulse
            ? `<div style="
            position: absolute;
            width: 38px;
            height: 38px;
            border-radius: 50%;
            background: rgba(239, 68, 68, 0.4);
            animation: pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
          "></div>`
            : ""
        }
        <div style="
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: ${bgColor};
          border: 2.5px solid #ffffff;
          box-shadow: 0 4px 10px rgba(0,0,0,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-weight: 800;
          font-size: 13px;
        ">
          ${initial}
        </div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -19],
  });
};

function FamilyTrackingMap({
  mainUserLocation,
  members = [],
  separationThreshold = 50,
  focusedMemberId = null,
  onFocusMember,
  onOpenDirections,
}) {
  // Determine map center
  const defaultCenter = [12.9716, 77.5946]; // Default fallback
  const center = useMemo(() => {
    if (focusedMemberId) {
      const targetMember = members.find(
        (m) => m.membershipId === focusedMemberId || m.user?._id === focusedMemberId || m._id === focusedMemberId
      );
      if (targetMember?.lastLocation?.latitude && targetMember?.lastLocation?.longitude) {
        return [targetMember.lastLocation.latitude, targetMember.lastLocation.longitude];
      }
    }
    if (mainUserLocation?.latitude && mainUserLocation?.longitude) {
      return [mainUserLocation.latitude, mainUserLocation.longitude];
    }
    const memberWithLoc = members.find((m) => m.lastLocation?.latitude && m.lastLocation?.longitude);
    if (memberWithLoc) {
      return [memberWithLoc.lastLocation.latitude, memberWithLoc.lastLocation.longitude];
    }
    return defaultCenter;
  }, [mainUserLocation, members, focusedMemberId]);

  // Determine bounds when focused on a member to display both main user and family member
  const bounds = useMemo(() => {
    if (focusedMemberId) {
      const targetMember = members.find(
        (m) => m.membershipId === focusedMemberId || m.user?._id === focusedMemberId || m._id === focusedMemberId
      );
      if (
        targetMember?.lastLocation?.latitude &&
        targetMember?.lastLocation?.longitude &&
        mainUserLocation?.latitude &&
        mainUserLocation?.longitude
      ) {
        return L.latLngBounds([
          [mainUserLocation.latitude, mainUserLocation.longitude],
          [targetMember.lastLocation.latitude, targetMember.lastLocation.longitude],
        ]);
      }
    }
    return null;
  }, [focusedMemberId, members, mainUserLocation]);

  const mainPosition = mainUserLocation?.latitude && mainUserLocation?.longitude
    ? [mainUserLocation.latitude, mainUserLocation.longitude]
    : null;

  return (
    <div className="family-tracking-map-wrapper">
      <MapContainer
        center={center}
        zoom={mainPosition ? 18 : 15}
        scrollWheelZoom={true}
        className="leaflet-tracking-container"
      >
        <ChangeMapView center={center} zoom={mainPosition ? 18 : 15} bounds={bounds} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Separation Radius Circle around Main User */}
        {mainPosition && (
          <Circle
            center={mainPosition}
            radius={Number(separationThreshold) || 50}
            pathOptions={{
              color: "#2563eb",
              fillColor: "#3b82f6",
              fillOpacity: 0.12,
              weight: 2,
              dashArray: "6, 6",
            }}
          />
        )}

        {/* Main User Marker */}
        {mainPosition && (
          <Marker position={mainPosition} icon={createMainUserIcon()}>
            <Popup>
              <div className="map-popup-card">
                <div className="popup-badge main-badge">Main User (ESP32 Carrier)</div>
                <h4 className="popup-title">Your Current Position</h4>
                <div className="popup-stats">
                  <div>
                    <FiActivity size={12} />
                    <span>Threshold: {separationThreshold}m radius</span>
                  </div>
                  {mainUserLocation.accuracy && (
                    <div>
                      <FiCrosshair size={12} />
                      <span>Accuracy: ±{Math.round(mainUserLocation.accuracy)}m</span>
                    </div>
                  )}
                  {mainUserLocation.timestamp && (
                    <div>
                      <FiClock size={12} />
                      <span>{new Date(mainUserLocation.timestamp).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Family Member Markers */}
        {members.map((member) => {
          if (!member.lastLocation?.latitude || !member.lastLocation?.longitude) {
            return null;
          }

          const memberPos = [member.lastLocation.latitude, member.lastLocation.longitude];
          const displayName = member.name || member.displayName || member.user?.name || "Family Member";
          const initial = displayName.charAt(0).toUpperCase();
          const isSeparated = member.isSeparated;
          const status = member.locationStatus || "live";
          const icon = createMemberIcon(initial, status, isSeparated);

          let badgeClass = "safe-badge";
          let badgeText = status.toUpperCase();
          if (isSeparated) {
            badgeClass = "separated-badge";
            badgeText = "SEPARATED (ALERT)";
          } else if (status === "reunited") {
            badgeClass = "reunited-badge";
            badgeText = "REUNITED";
          } else if (status === "stale") {
            badgeClass = "stale-badge";
            badgeText = "STALE LOCATION";
          }

          const originParam = mainPosition
            ? `&origin=${mainPosition[0]},${mainPosition[1]}`
            : "";
          const directionsUrl = `https://www.google.com/maps/dir/?api=1${originParam}&destination=${member.lastLocation.latitude},${member.lastLocation.longitude}&travelmode=driving`;

          return (
            <Marker key={member.membershipId || member._id || member.user?._id} position={memberPos} icon={icon}>
              <Popup>
                <div className="map-popup-card">
                  <div className={`popup-badge ${badgeClass}`}>
                    {badgeText}
                  </div>
                  <h4 className="popup-title">{displayName}</h4>
                  
                  <div className="popup-stats">
                    {member.distanceMeters !== null && member.distanceMeters !== undefined && (
                      <div className={isSeparated ? "text-danger" : ""}>
                        <FiCrosshair size={12} />
                        <strong>Distance: {member.distanceMeters} meters away</strong>
                      </div>
                    )}
                    <div>
                      <span>Coords: {member.lastLocation.latitude.toFixed(6)}°, {member.lastLocation.longitude.toFixed(6)}°</span>
                    </div>
                    {member.lastLocation.accuracy && (
                      <div>
                        <span>GPS Accuracy: ±{Math.round(member.lastLocation.accuracy)}m</span>
                      </div>
                    )}
                    {member.lastLocation.timestamp && (
                      <div>
                        <FiClock size={12} />
                        <span>Updated: {new Date(member.lastLocation.timestamp).toLocaleTimeString()}</span>
                      </div>
                    )}
                    {status === "stale" && (
                      <div style={{ color: "#b45309", fontSize: "11px", fontWeight: "700", marginTop: "2px" }}>
                        ⚠️ Stale Location - Phone may be locked/offline
                      </div>
                    )}
                  </div>

                  <div className="popup-actions">
                    {onOpenDirections ? (
                      <button
                        type="button"
                        onClick={() => onOpenDirections(member)}
                        className="btn-popup-directions"
                        style={{ width: "100%", border: "none", cursor: "pointer" }}
                      >
                        <FiNavigation size={13} /> Open Directions
                      </button>
                    ) : (
                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-popup-directions"
                      >
                        <FiNavigation size={13} /> Open Directions
                      </a>
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

export default FamilyTrackingMap;
