import { fetchAPI, getHeaders } from "./api";

export const apiSendAssistantMessage = async (message, journeyId = null, conversationId = null, token = null) => {
  return fetchAPI("/journey-assistant/chat", {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify({ message, journeyId, conversationId }),
  });
};

export const apiGetJourneyAssistantContext = async (journeyId = null, token = null) => {
  const query = journeyId ? `?journeyId=${encodeURIComponent(journeyId)}` : "";
  return fetchAPI(`/journey-assistant/context${query}`, {
    method: "GET",
    headers: getHeaders(token),
  });
};

export const apiGetJourneyAssistantHistory = async (conversationId = null, journeyId = null, token = null) => {
  const params = new URLSearchParams();
  if (conversationId) params.append("conversationId", conversationId);
  if (journeyId) params.append("journeyId", journeyId);
  const query = params.toString() ? `?${params.toString()}` : "";

  return fetchAPI(`/journey-assistant/history${query}`, {
    method: "GET",
    headers: getHeaders(token),
  });
};

export const apiClearJourneyAssistantHistory = async (conversationId = null, token = null) => {
  const query = conversationId ? `?conversationId=${encodeURIComponent(conversationId)}` : "";
  return fetchAPI(`/journey-assistant/history${query}`, {
    method: "DELETE",
    headers: getHeaders(token),
  });
};
