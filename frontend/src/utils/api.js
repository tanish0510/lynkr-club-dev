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

const _raw = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

/** Waitlist POST can take longer on cold start; use 25s for this endpoint only. */
export const WAITLIST_TIMEOUT_MS = 25000;

import { getStoredToken } from '@/utils/sessionStorage';

/** Paths under /api that must not send Bearer (stale USER/ADMIN token breaks partner login, etc.). */
function shouldOmitBearerForPath(url) {
  const path = (url || '').replace(/^\//, '').split('?')[0];
  if (!path) return false;
  return (
    path === 'leads' ||
    path.startsWith('waitlist/') ||
    path === 'auth/login' ||
    path === 'auth/signup' ||
    path === 'auth/send-signup-otp' ||
    path === 'auth/resend-verification' ||
    path.startsWith('auth/verify-email') ||
    path === 'partner/auth/login'
  );
}

_raw.interceptors.request.use((config) => {
  if (shouldOmitBearerForPath(config.url || '')) {
    delete config.headers.Authorization;
    return config;
  }
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }
  return config;
});

const _inflight = new Map();

const api = {
  get(url, config) {
    const key = url + (config?.params ? JSON.stringify(config.params) : '');
    const existing = _inflight.get(key);
    if (existing) return existing;
    const req = _raw.get(url, config).finally(() => _inflight.delete(key));
    _inflight.set(key, req);
    return req;
  },
  post: (...a) => _raw.post(...a),
  put: (...a) => _raw.put(...a),
  patch: (...a) => _raw.patch(...a),
  delete: (...a) => _raw.delete(...a),
  request: (...a) => _raw.request(...a),
  interceptors: _raw.interceptors,
  defaults: _raw.defaults,
};

/**
 * Resolve image URLs that come from the backend as relative paths
 * (e.g. "/api/uploads/catalog/file.jpg"). In production nginx proxies
 * these, but in local dev the frontend origin differs from the backend.
 */
export function resolveImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  if (url.startsWith('/api/')) return `${BACKEND_URL}${url}`;
  return url;
}

export default api;