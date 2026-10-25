import React from "react";
import { FiX, FiMapPin, FiStar, FiPhone, FiGlobe, FiClock, FiCheck, FiNavigation, FiCreditCard, FiHome, FiShield } from "react-icons/fi";
import "./PlaceDetailsModal.css";

const PlaceDetailsModal = ({ isOpen, onClose, place, originCoords, onSelectPlace, isSelected, onBookStay, isBooked = false, canBookStay = true }) => {
  if (!isOpen || !place) return null;

  const lat = place.latitude;
  const lng = place.longitude;
  const originLat = originCoords?.latitude || originCoords?.lat;
  const originLng = originCoords?.longitude || originCoords?.lng;

  const googleMapsDirectionsUrl = originLat && originLng
    ? `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${lat},${lng}`
    : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  const googleMapsListingUrl = place.contact?.website ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name} ${place.address || ""}`)}`;

  const isAccommodation =
    place.category === "accommodation" ||
    (place.placeType && (
      place.placeType.toLowerCase().includes("hotel") ||
      place.placeType.toLowerCase().includes("lodge") ||
      place.placeType.toLowerCase().includes("lodging") ||
      place.placeType.toLowerCase().includes("guest")
    ));

  // Room categories preview for accommodation
  const demoRoomsPreview = [
    { type: "Standard Non-AC", price: "₹950", capacity: "2 Adults, 1 Child", amenities: "Hot Water, Twin Beds, RO Water" },
    { type: "Deluxe AC Room", price: "₹1,850", capacity: "2 Adults, 2 Children", amenities: "Air Conditioning, Queen Bed, Wi-Fi" },
    { type: "Family Suite (3 Beds)", price: "₹2,950", capacity: "Up to 6 Guests", amenities: "3 Beds, 2 Baths, AC, Mandir Shuttle" },
  ];

  return (
    <div className="place-details-overlay">
      <div className="place-details-modal">
        <div className="place-details-header">
          <div className="place-title-group">
            <span className="place-category-badge">{place.placeType || place.category || "Service"}</span>
            <h2>{place.name}</h2>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close">
            <FiX size={20} />
          </button>
        </div>

        <div className="place-details-body">
          {/* Rating & Distance Bar */}
          <div className="place-meta-bar">
            <div className="meta-item rating">
              <FiStar className="star-icon" />
              <span>{place.rating ? `${place.rating} / 5` : "Rating Not Available"}</span>
              {place.userRatingsTotal && <small>({place.userRatingsTotal} reviews)</small>}
            </div>

            <div className="meta-item distance">
              <FiMapPin className="pin-icon" />
              <span>{place.distanceKm} km from Pilgrimage Center</span>
            </div>

            {place.isOpen !== null && place.isOpen !== undefined && (
              <div className={`meta-item status ${place.isOpen ? "open" : "closed"}`}>
                <FiClock />
                <span>{place.isOpen ? "Open Now" : "Closed"}</span>
              </div>
            )}
          </div>

          {/* ACCOMMODATION SPECIFIC SECTION */}
          {isAccommodation && (
            <div className="accommodation-detail-block" style={{ marginBottom: "20px", background: "#f8faff", border: "1px solid #dbeafe", borderRadius: "12px", padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: "800", color: "#1e40af", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <FiHome size={15} /> Available Room Categories & Pricing
                </span>
                {isBooked ? (
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#065f46", background: "#d1fae5", padding: "3px 10px", borderRadius: "999px" }}>
                    ✓ Already Booked
                  </span>
                ) : (
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#047857", background: "#dcfce7", padding: "2px 8px", borderRadius: "999px" }}>
                    Instant Confirmation
                  </span>
                )}
              </div>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 12px 0" }}>
                Verified pilgrim room categories with instant booking reservation confirmation.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
                {demoRoomsPreview.map((rm, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <div>
                      <strong style={{ fontSize: "13.5px", color: "#0f172a" }}>{rm.type}</strong>
                      <div style={{ fontSize: "11.5px", color: "#64748b" }}>👥 {rm.capacity} • {rm.amenities}</div>
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: "800", color: "#047857" }}>{rm.price} <small style={{ fontSize: "10.5px", color: "#64748b" }}>/nt</small></span>
                  </div>
                ))}
              </div>

              <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "8px", padding: "8px 12px", fontSize: "11.5px", color: "#065f46" }}>
                <FiShield size={12} style={{ marginRight: "4px" }} />
                <strong>Cancellation Policy:</strong> Free 100% refund up to 24 hours prior to check-in. 50% refund within 24 hours.
              </div>
            </div>
          )}

          {/* Dietary Information if Restaurant */}
          {place.dietaryInfo && (
            <div className="dietary-info-box">
              <span className="dietary-tag-title">🥗 Dietary Information:</span>
              <div className="dietary-badges">
                {place.dietaryInfo.isVegetarian && <span className="badge veg">🌱 Pure Veg / Vegetarian Option</span>}
                {place.dietaryInfo.isVegan && <span className="badge vegan">🌿 Vegan Friendly</span>}
                {place.dietaryInfo.isJain && <span className="badge jain">✨ Jain Suitable</span>}
                {!place.dietaryInfo.isVegetarian && !place.dietaryInfo.isVegan && !place.dietaryInfo.isJain && (
                  <span className="badge info">Dietary info not specified by venue</span>
                )}
              </div>
            </div>
          )}

          {/* Address & Contact */}
          <div className="details-grid">
            <div className="detail-row">
              <FiMapPin className="detail-icon" />
              <div>
                <strong>Address</strong>
                <p>{place.address || `Located near ${place.name}`}</p>
              </div>
            </div>

            <div className="detail-row">
              <FiPhone className="detail-icon" />
              <div>
                <strong>Phone Contact</strong>
                <p>
                  {place.contact?.phone && place.contact.phone !== "Not available" && place.contact.phone !== "Contact Not Available" ? (
                    <a href={`tel:${place.contact.phone}`} style={{ color: "#2563eb", textDecoration: "none", fontWeight: "700" }}>
                      📞 {place.contact.phone}
                    </a>
                  ) : (
                    <a href="tel:+919447128900" style={{ color: "#2563eb", textDecoration: "none", fontWeight: "700" }}>
                      📞 +91 94471 28900 (Helpline Desk)
                    </a>
                  )}
                </p>
              </div>
            </div>

            <div className="detail-row">
              <FiClock className="detail-icon" />
              <div>
                <strong>Opening Hours</strong>
                <p>{place.openingHours || "Open 24/7"}</p>
              </div>
            </div>

            <div className="detail-row">
              <FiGlobe className="detail-icon" />
              <div>
                <strong>Google Maps Listing & Contact</strong>
                <a
                  href={googleMapsListingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#2563eb", fontWeight: "700", textDecoration: "none" }}
                >
                  View Listing, Reviews & Contact on Google Maps &rarr;
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="place-details-footer" style={{ flexWrap: "wrap" }}>
          <a
            href={googleMapsDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-directions"
          >
            <FiNavigation size={16} /> Get Directions
          </a>

          {onSelectPlace && (
            <button
              type="button"
              className={`btn-select-place ${isSelected ? "selected" : ""}`}
              onClick={() => {
                onSelectPlace(place);
                onClose();
              }}
            >
              {isSelected ? (
                <>
                  <FiCheck size={16} /> Selected for Journey
                </>
              ) : (
                "Select Place"
              )}
            </button>
          )}

          {isAccommodation && onBookStay && (
            isBooked ? (
              <button
                type="button"
                className="btn-select-place"
                disabled
                style={{ background: "#059669", color: "#ffffff", display: "inline-flex", alignItems: "center", gap: "6px", cursor: "default", opacity: 0.95 }}
              >
                <FiCheck size={15} /> Already Booked
              </button>
            ) : (
              <button
                type="button"
                className="btn-select-place"
                disabled={!canBookStay}
                style={{
                  background: canBookStay ? "#059669" : "#94a3b8",
                  color: "#ffffff",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: canBookStay ? "pointer" : "not-allowed",
                  opacity: canBookStay ? 1 : 0.7
                }}
                title={!canBookStay ? "Please complete journey planner details (dates & mode) above to book accommodation" : "Book accommodation stay"}
                onClick={() => {
                  if (!canBookStay) return;
                  onClose();
                  onBookStay(place);
                }}
              >
                <FiCreditCard size={15} /> Book Stay
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaceDetailsModal;
