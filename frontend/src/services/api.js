import axios from "axios";

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const apiBaseUrl = configuredApiUrl
  ? configuredApiUrl.endsWith("/api")
    ? configuredApiUrl
    : `${configuredApiUrl.replace(/\/$/, "")}/api`
  : "/api";

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

export default api;
