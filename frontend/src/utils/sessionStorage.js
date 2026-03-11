/**
 * Session and auth storage helpers.
 * - Token is stored in localStorage; session cache can use sessionStorage.
 * - On logout we clear token and all sessionStorage so a new login gets a clean session.
 * - JWT expiry is checked so we logout when the token has expired (session timeout).
 */

const TOKEN_KEY = 'token';

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
 * - Removes token from localStorage.
 * - Clears sessionStorage so any session-scoped cache is wiped and next login is a fresh session.
 */
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
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
