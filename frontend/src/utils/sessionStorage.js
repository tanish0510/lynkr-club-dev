/**
 * Session and auth storage helpers.
 * - Token is stored in localStorage; session cache can use sessionStorage.
 * - On logout we clear token and all sessionStorage so a new login gets a clean session.
 * - JWT expiry is checked so we logout when the token has expired (session timeout).
 */

const TOKEN_KEY = 'token';

/** All localStorage keys that must be cleared on logout so no previous role/session can leak. */
const AUTH_STORAGE_KEYS = [TOKEN_KEY];

/**
 * Decode JWT payload without verification (client-side only; backend validates).
 * Returns { exp } or null if invalid.
 */
export function getTokenExpiry(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload.exp != null ? payload.exp * 1000 : null; // exp is seconds, return ms
  } catch {
    return null;
  }
}

/**
 * Returns true if the token is expired (or invalid).
 */
export function isTokenExpired(token) {
  const exp = getTokenExpiry(token);
  if (exp == null) return true;
  return Date.now() >= exp;
}

/**
 * Clear all auth/session data. Call on logout.
 * - Removes every known auth key from localStorage so no previous role/token can affect next login.
 * - Clears sessionStorage so any session-scoped cache is wiped.
 */
export function clearSession() {
  AUTH_STORAGE_KEYS.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch (_) {
      // ignore
    }
  });
  try {
    sessionStorage.clear();
  } catch (_) {
    // ignore
  }
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}
