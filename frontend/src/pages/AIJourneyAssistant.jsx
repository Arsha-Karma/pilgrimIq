import React, { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "../components/Navbar";
import UserSidebar from "../components/UserSidebar";
import { useAuth } from "../context/AuthContext";
import {
  apiSendAssistantMessage,
  apiGetJourneyAssistantContext,
  apiGetJourneyAssistantHistory,
  apiClearJourneyAssistantHistory,
} from "../services/journeyAssistantService";
import "../styles/AIJourneyAssistant.css";
import {
  FiSend,
  FiTrash2,
  FiCpu,
  FiCompass,
  FiHeart,
  FiCloudRain,
  FiMapPin,
  FiAlertTriangle,
  FiClock,
  FiUserCheck,
  FiNavigation,
  FiPhone,
} from "react-icons/fi";

const SUGGESTED_QUESTIONS = [
  "How is my journey going?",
  "Can I continue my journey?",
  "What should I do now?",
  "Where can I take a rest?",
  "What is my current journey progress?",
  "Is the weather suitable for travel?",
  "Where is the nearest hospital?",
  "Where is my family member?",
  "Do I need to take a break?",
  "Give me today's journey guidance",
];

function AIJourneyAssistant() {
  const { token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load Context & Conversation History
  const loadContextAndHistory = useCallback(async () => {
    if (!token) return;
    try {
      // 1. Fetch Journey Context Snapshot
      const contextRes = await apiGetJourneyAssistantContext(null, token);
      if (contextRes && contextRes.context) {
        setContext(contextRes.context);
      }

      // 2. Fetch Chat History
      const historyRes = await apiGetJourneyAssistantHistory(null, null, token);
      if (historyRes && historyRes.history && historyRes.history.length > 0) {
        setMessages(historyRes.history);
        setConversationId(historyRes.history[0].conversationId);
      } else {
        // Initial Welcome Message
        const welcomeMsg = {
          sender: "assistant",
          message: `👋 Welcome to **PilgrimIQ Journey Assistant**!\n\nI am your dedicated context-aware pilgrimage assistant. I monitor your journey progress, real-time weather advisories, personal & family medical risks, and nearby emergency/hospital facilities to guide your journey safely.\n\nSelect a question below or type a message to start!`,
          timestamp: new Date().toISOString(),
          isEmergency: false,
        };
        setMessages([welcomeMsg]);
      }
    } catch (err) {
      console.error("Error loading assistant context or history:", err);
    }
  }, [token]);

  useEffect(() => {
    loadContextAndHistory();
  }, [loadContextAndHistory]);

  const handleSendMessage = async (textToSend = null) => {
    const messageContent = (textToSend || inputText).trim();
    if (!messageContent || isLoading) return;

    if (!textToSend) setInputText("");

    const timestamp = new Date().toISOString();
    const tempUserMsg = {
      sender: "user",
      message: messageContent,
      timestamp,
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const response = await apiSendAssistantMessage(
        messageContent,
        context?.journey?.id || null,
        conversationId,
        token
      );

      if (response && response.success) {
        if (response.conversationId) {
          setConversationId(response.conversationId);
        }

        if (response.context) {
          setContext(response.context);
        }

        const assistantMsg = {
          sender: "assistant",
          message: response.reply,
          timestamp: new Date().toISOString(),
          isEmergency: response.isEmergency || false,
          suggestedPlaces: response.suggestedPlaces || [],
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error(response?.message || "Failed to get AI response");
      }
    } catch (err) {
      console.error("Error sending message to assistant:", err);
      const fallbackMsg = {
        sender: "assistant",
        message: "I'm unable to access the required journey information right now. Please try again shortly or check the relevant PilgrimIQ section.",
        timestamp: new Date().toISOString(),
        isEmergency: false,
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear your conversation history?")) {
      return;
    }

    try {
      await apiClearJourneyAssistantHistory(conversationId, token);
      setConversationId(null);
      const welcomeMsg = {
        sender: "assistant",
        message: `👋 Conversation cleared. How can I assist your pilgrimage today?`,
        timestamp: new Date().toISOString(),
        isEmergency: false,
      };
      setMessages([welcomeMsg]);
    } catch (err) {
      alert("Failed to clear history: " + err.message);
    }
  };

  return (
    <div className="pilgrim-dashboard-wrapper">
      <Navbar />

      <div className="pilgrim-dashboard-container" style={{ paddingTop: "72px" }}>
        <UserSidebar activeTab="journey-assistant" />

        <div className="pilgrim-main-content">
          <div className="ai-assistant-container">
            {/* HEADER */}
            <div className="assistant-header">
              <div className="assistant-title-group">
                <div className="assistant-avatar-icon">
                  <FiCpu />
                </div>
                <div>
                  <h3 className="assistant-name">PilgrimIQ Journey Assistant</h3>
                  <div className="assistant-subtitle">
                    <span className="status-dot-online"></span>
                    <span>Context-Aware Pilgrimage Companion</span>
                  </div>
                </div>
              </div>

              <div className="assistant-header-actions">
                <button
                  type="button"
                  className="btn-clear-chat"
                  onClick={handleClearHistory}
                  title="Clear conversation history"
                >
                  <FiTrash2 /> Clear Chat
                </button>
              </div>
            </div>

            {/* CONTEXT SNAPSHOT BAR */}
            {context && (
              <div className="context-summary-bar">
                {context.journey && (
                  <div className="context-chip">
                    <FiCompass style={{ color: "#38bdf8" }} />
                    <span>Stage: <strong>{context.journey.journeyStage}</strong> ({context.journey.progressPercentage}%)</span>
                  </div>
                )}

                {context.journey?.destination && (
                  <div className="context-chip">
                    <FiMapPin style={{ color: "#f43f5e" }} />
                    <span>Destination: <strong>{context.journey.destination}</strong></span>
                  </div>
                )}

                {context.weather && (
                  <div className="context-chip">
                    <FiCloudRain style={{ color: "#38bdf8" }} />
                    <span>Weather: <strong>{context.weather.temperature}°C, {context.weather.condition}</strong></span>
                  </div>
                )}

                {context.user && (
                  <div className={`context-chip risk-${(context.user.riskLevel || "LOW").toLowerCase()}`}>
                    <FiHeart />
                    <span>Medical Risk: <strong>{context.user.riskLevel} Risk</strong></span>
                  </div>
                )}

                {context.user && (
                  <div className="context-chip">
                    <FiUserCheck style={{ color: "#10b981" }} />
                    <span>Doctor Review: <strong>{context.user.doctorApprovalStatus || "None"}</strong></span>
                  </div>
                )}
              </div>
            )}

            {/* CHAT MESSAGES AREA */}
            <div className="chat-messages-area">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`message-group ${msg.sender === "user" ? "user" : "assistant"} ${
                    msg.isEmergency ? "emergency" : ""
                  }`}
                >
                  <div className="message-bubble">
                    {msg.isEmergency && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#ef4444", fontWeight: "700", marginBottom: "6px" }}>
                        <FiAlertTriangle size={18} /> EMERGENCY NOTICE
                      </div>
                    )}
                    <div>{msg.message}</div>

                    {/* SUGGESTED PLACES CARDS */}
                    {msg.suggestedPlaces && msg.suggestedPlaces.length > 0 && (
                      <div className="suggested-places-container">
                        <div className="suggested-places-header">
                          <FiMapPin style={{ color: "#f43f5e" }} />
                          <span>Medical Facilities Near <strong>{context?.journey?.destination || "Pilgrimage Destination"}</strong></span>
                        </div>

                        {msg.suggestedPlaces.map((place, idx) => {
                          const defaultLat = context?.journey?.destinationLatitude || 10.6811;
                          const defaultLng = context?.journey?.destinationLongitude || 79.8458;
                          const mapsDirUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude || defaultLat},${place.longitude || defaultLng}`;
                          const mapsViewUrl = place.contact?.website || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((place.name || "") + " " + (place.address || ""))}`;

                          return (
                            <div key={idx} className="place-card-detailed">
                              <div className="place-card-top">
                                <div style={{ flex: 1 }}>
                                  <div className="place-card-title">
                                    <span>📍 {place.name}</span>
                                    <span className="place-badge">{place.placeType || "Medical Facility"}</span>
                                  </div>
                                  <div className="place-card-address">{place.address}</div>
                                </div>
                                <div className="place-card-distance">
                                  {place.distanceKm} km
                                </div>
                              </div>

                              <div className="place-card-info-row">
                                {place.rating && <span className="info-tag">⭐ {place.rating} / 5</span>}
                                {place.openingHours && <span className="info-tag">🕒 {place.openingHours}</span>}
                              </div>

                              <div className="place-card-actions">
                                <a
                                  href={mapsDirUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn-place-action btn-directions"
                                >
                                  <FiNavigation /> Get Directions
                                </a>
                                <a
                                  href={mapsViewUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn-place-action btn-view"
                                >
                                  <FiMapPin /> View on Map
                                </a>
                                {place.contact?.phone && place.contact.phone !== "Contact Not Available" && place.contact.phone !== "Contact at facility" && (
                                  <a
                                    href={`tel:${place.contact.phone}`}
                                    className="btn-place-action btn-call"
                                  >
                                    <FiPhone /> Call
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="message-meta">
                    <FiClock style={{ verticalAlign: "middle", marginRight: "3px" }} />
                    {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="message-group assistant">
                  <div className="typing-indicator-bubble">
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* SUGGESTED QUESTIONS CHIPS */}
            <div className="suggested-questions-section">
              <div className="suggested-questions-label">Suggested Questions</div>
              <div className="suggested-questions-scroll">
                {SUGGESTED_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="chip-question"
                    onClick={() => handleSendMessage(q)}
                    disabled={isLoading}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* CHAT INPUT BAR */}
            <div className="chat-input-bar">
              <input
                type="text"
                className="chat-input-field"
                placeholder="Ask about your journey progress, health risk, weather, or emergency services..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isLoading}
              />

              <button
                type="button"
                className="btn-send-message"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isLoading}
                title="Send message"
              >
                <FiSend />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIJourneyAssistant;
