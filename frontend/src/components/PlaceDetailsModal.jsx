import React from "react";
import { FiX, FiMapPin, FiStar, FiPhone, FiGlobe, FiClock, FiCheck, FiNavigation } from "react-icons/fi";
import "./PlaceDetailsModal.css";

const PlaceDetailsModal = ({ isOpen, onClose, place, originCoords, onSelectPlace, isSelected }) => {
  if (!isOpen || !place) return null;

  const lat = place.latitude;
  const lng = place.longitude;
  const originLat = originCoords?.latitude || originCoords?.lat;
  const originLng = originCoords?.longitude || originCoords?.lng;

  const googleMapsDirectionsUrl = originLat && originLng
    ? `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${lat},${lng}`
    : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

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
                <p>{place.address || "Address details not available"}</p>
              </div>
            </div>

            <div className="detail-row">
              <FiPhone className="detail-icon" />
              <div>
                <strong>Phone Contact</strong>
                <p>{place.contact?.phone || "Not available"}</p>
              </div>
            </div>

            <div className="detail-row">
              <FiClock className="detail-icon" />
              <div>
                <strong>Opening Hours</strong>
                <p>{place.openingHours || "Hours not available"}</p>
              </div>
            </div>

            {place.contact?.website && (
              <div className="detail-row">
                <FiGlobe className="detail-icon" />
                <div>
                  <strong>Website / Map Profile</strong>
                  <a href={place.contact.website} target="_blank" rel="noopener noreferrer">
                    Visit Official Listing &rarr;
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="place-details-footer">
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
        </div>
      </div>
    </div>
  );
};

export default PlaceDetailsModal;
