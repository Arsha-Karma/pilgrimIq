import React, { useState } from "react";
import { FiX, FiSearch, FiStar, FiNavigation, FiCheck, FiInfo } from "react-icons/fi";
import "./ViewAllServicesModal.css";

const ViewAllServicesModal = ({
  isOpen,
  onClose,
  category,
  radiusKm,
  places = [],
  originCoords,
  selectedPlaceIds = [],
  onSelectPlace,
  onViewDetails,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("distance"); // "distance" | "rating"
  const [dietaryFilter, setDietaryFilter] = useState("all"); // "all" | "veg" | "vegan" | "jain"

  if (!isOpen) return null;

  const categoryTitles = {
    accommodation: "Nearby Accommodation (Hotels & Lodges)",
    restaurants: "Nearby Restaurants & Food Facilities",
    parking: "Nearby Parking Facilities",
    hospitals: "Nearby Hospitals & Clinics",
    pharmacies: "Nearby Pharmacies & Medical Stores",
    restrooms: "Nearby Public Restrooms",
    drinkingWater: "Nearby Drinking Water Kiosks",
    atms: "Nearby ATMs & Cash Counters",
  };

  const title = categoryTitles[category] || `Nearby ${category} Results`;

  const originLat = originCoords?.latitude || originCoords?.lat;
  const originLng = originCoords?.longitude || originCoords?.lng;

  // Filter places by search term & dietary preference
  let filteredPlaces = places.filter((p) => {
    const matchesSearch =
      (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.address || "").toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (category === "restaurants" && dietaryFilter !== "all") {
      if (dietaryFilter === "veg" && !p.dietaryInfo?.isVegetarian) return false;
      if (dietaryFilter === "vegan" && !p.dietaryInfo?.isVegan) return false;
      if (dietaryFilter === "jain" && !p.dietaryInfo?.isJain) return false;
    }

    return true;
  });

  // Sort places
  filteredPlaces.sort((a, b) => {
    if (sortBy === "rating") {
      const ratingA = a.rating || 0;
      const ratingB = b.rating || 0;
      if (ratingB !== ratingA) return ratingB - ratingA;
    }
    return a.distanceKm - b.distanceKm;
  });

  return (
    <div className="view-all-overlay">
      <div className="view-all-modal">
        <div className="view-all-header">
          <div>
            <div className="category-tag">Search Radius: {radiusKm} km</div>
            <h2>{title}</h2>
            <p className="subtitle">Displaying {filteredPlaces.length} of {places.length} places</p>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close">
            <FiX size={22} />
          </button>
        </div>

        {/* Filter & Sort Controls */}
        <div className="view-all-toolbar">
          <div className="search-input-wrapper">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder={`Search ${category}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="sort-group">
            <label>Sort By:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="distance">Distance (Nearest First)</option>
              <option value="rating">Rating (Highest First)</option>
            </select>
          </div>

          {category === "restaurants" && (
            <div className="dietary-filter-group">
              <button
                type="button"
                className={`diet-chip ${dietaryFilter === "all" ? "active" : ""}`}
                onClick={() => setDietaryFilter("all")}
              >
                All Food
              </button>
              <button
                type="button"
                className={`diet-chip ${dietaryFilter === "veg" ? "active" : ""}`}
                onClick={() => setDietaryFilter("veg")}
              >
                🌱 Veg Only
              </button>
              <button
                type="button"
                className={`diet-chip ${dietaryFilter === "vegan" ? "active" : ""}`}
                onClick={() => setDietaryFilter("vegan")}
              >
                🌿 Vegan
              </button>
              <button
                type="button"
                className={`diet-chip ${dietaryFilter === "jain" ? "active" : ""}`}
                onClick={() => setDietaryFilter("jain")}
              >
                ✨ Jain
              </button>
            </div>
          )}
        </div>

        {/* Results List */}
        <div className="view-all-body">
          {filteredPlaces.length === 0 ? (
            <div className="no-results-box">
              <p>No {category} found within {radiusKm} km matching your filters.</p>
            </div>
          ) : (
            <div className="places-grid">
              {filteredPlaces.map((place, idx) => {
                const placeId = place.externalPlaceId || idx;
                const isSelected = selectedPlaceIds.includes(placeId);
                const directionsUrl = originLat && originLng
                  ? `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${place.latitude},${place.longitude}`
                  : `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;

                return (
                  <div key={placeId} className={`place-card-full ${isSelected ? "is-selected" : ""}`}>
                    <div className="card-top">
                      <span className="place-type">{place.placeType || place.category}</span>
                      <span className="distance-badge">📍 {place.distanceKm} km</span>
                    </div>

                    <h3 className="card-title">{place.name}</h3>

                    <div className="card-rating-row">
                      <FiStar className="star-icon" />
                      <span className="rating-val">{place.rating ? `${place.rating} / 5` : "Rating Not Available"}</span>
                      {place.isOpen !== null && place.isOpen !== undefined && (
                        <span className={`status-pill ${place.isOpen ? "open" : "closed"}`}>
                          {place.isOpen ? "Open Now" : "Closed"}
                        </span>
                      )}
                    </div>

                    <p className="card-address">{place.address}</p>

                    {/* Dietary badge */}
                    {place.dietaryInfo && place.dietaryInfo.isVegetarian && (
                      <span className="dietary-match-badge">🌱 {place.dietaryInfo.label}</span>
                    )}

                    <div className="card-actions">
                      {onViewDetails && (
                        <button
                          type="button"
                          className="btn-card-act details"
                          onClick={() => onViewDetails(place)}
                        >
                          <FiInfo size={14} /> Details
                        </button>
                      )}

                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-card-act directions"
                      >
                        <FiNavigation size={14} /> Directions
                      </a>

                      {onSelectPlace && (
                        <button
                          type="button"
                          className={`btn-card-act select ${isSelected ? "selected" : ""}`}
                          onClick={() => onSelectPlace(place)}
                        >
                          {isSelected ? <><FiCheck size={14} /> Selected</> : "Select"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="view-all-footer">
          <button type="button" className="btn-close-footer" onClick={onClose}>
            Close Results
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewAllServicesModal;
