import axios from 'axios';

// Local dev: use VITE_BACKEND_URL (or fallback to localhost:8000) so /api hits backend.
// Production: default to current origin (https://lynkr.club).
const BACKEND_URL =
  typeof import.meta !== "undefined" && import.meta.env.VITE_BACKEND_URL
    ? import.meta.env.VITE_BACKEND_URL
    : typeof import.meta !== "undefined" && import.meta.env.DEV
      ? "http://localhost:8000"
    : window.location.origin;
export const API_URL = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;