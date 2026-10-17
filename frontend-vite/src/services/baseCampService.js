import { getHeaders, fetchAPI } from "./api";

export const apiGetBaseCamps = async (queryParams = {}, token = null) => {
  const params = new URLSearchParams();
  if (queryParams.search) params.append("search", queryParams.search);
  if (queryParams.status && queryParams.status !== "all") params.append("status", queryParams.status);
  if (queryParams.district) params.append("district", queryParams.district);
  if (queryParams.state) params.append("state", queryParams.state);

  const queryString = params.toString() ? `?${params.toString()}` : "";
  const data = await fetchAPI(`/base-camps${queryString}`, {
    method: "GET",
    headers: getHeaders(token),
  });
  return data.data || [];
};

export const apiGetBaseCampById = async (id, token = null) => {
  const data = await fetchAPI(`/base-camps/${id}`, {
    method: "GET",
    headers: getHeaders(token),
  });
  return data.data;
};

export const apiCreateBaseCamp = async (baseCampData, token) => {
  const data = await fetchAPI("/base-camps", {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(baseCampData),
  });
  return data;
};

export const apiUpdateBaseCamp = async (id, baseCampData, token) => {
  const data = await fetchAPI(`/base-camps/${id}`, {
    method: "PUT",
    headers: getHeaders(token),
    body: JSON.stringify(baseCampData),
  });
  return data;
};

export const apiUpdateBaseCampStatus = async (id, status, token) => {
  const data = await fetchAPI(`/base-camps/${id}/status`, {
    method: "PATCH",
    headers: getHeaders(token),
    body: JSON.stringify({ status }),
  });
  return data;
};

export const apiDeleteBaseCamp = async (id, token) => {
  const data = await fetchAPI(`/base-camps/${id}`, {
    method: "DELETE",
    headers: getHeaders(token),
  });
  return data;
};
