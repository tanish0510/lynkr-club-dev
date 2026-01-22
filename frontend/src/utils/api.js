import axios from 'axios';

// ALWAYS use window.location.origin in production (browser runtime)
// This ensures API calls go to the current domain (lynkr.club) regardless of build-time env vars
// The build-time REACT_APP_BACKEND_URL is only used for development
const BACKEND_URL = window.location.origin;
export const API_URL = `${BACKEND_URL}/api`;

// Debug: Log the API URL to verify it's correct
if (typeof window !== 'undefined') {
  console.log('[API Config] BACKEND_URL:', BACKEND_URL);
  console.log('[API Config] API_URL:', API_URL);
  console.log('[API Config] window.location.origin:', window.location.origin);
}

const api = axios.create({
  baseURL: API_URL,
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