import axios from "axios";

// Combined deploy (frontend served BY the backend, same origin): leave
// VITE_API_URL unset at build time and calls go to "/api" automatically.
// Two-service deploy (separate frontend/backend Railway services): set
// VITE_API_URL to the backend's public URL, e.g. https://roskyro-api.up.railway.app/api
const baseURL = import.meta.env.VITE_API_URL || "/api";

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("roskyro_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
