import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { DEFAULT_AVATAR } from '@/constants/avatars';
import { applyAvatarTheme, applySavedTheme, applyPaletteTheme, resetAvatarTheme } from '@/utils/avatarTheme';
import { getStoredToken, setStoredToken, clearSession, isTokenExpired } from '@/utils/sessionStorage';

const AuthContext = createContext(null);

const applyUserTheme = (userData) => {
  if (!userData) return;
  if (userData.theme_colors && userData.theme_colors.primary) {
    applySavedTheme(userData.theme_colors);
  } else if (userData.extracted_palette && userData.extracted_palette.length > 0) {
    applyPaletteTheme(userData.extracted_palette);
  } else {
    applyAvatarTheme(userData.avatar);
  }
};

/** How often to check if the JWT has expired (ms). */
const SESSION_CHECK_INTERVAL_MS = 60 * 1000;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => getStoredToken());
  // Keep loading true until we've resolved auth (token check + fetchUser). Prevents blank screen on direct /app/* or refresh.
  const [loading, setLoading] = useState(true);
  const sessionCheckIntervalRef = useRef(null);
  const userSetByExternalAuthRef = useRef(false);
  /** After login/signup we have the correct user from response; skip fetchUser once so /user/me cannot overwrite with stale role. */
  const skipFetchUserOnceRef = useRef(false);

  // Local dev: VITE_BACKEND_URL (or fallback to localhost:8000). Production: current origin.
  const BACKEND_URL =
    typeof import.meta !== 'undefined' && import.meta.env.VITE_BACKEND_URL
      ? import.meta.env.VITE_BACKEND_URL
      : typeof import.meta !== 'undefined' && import.meta.env.DEV
        ? 'http://localhost:8000'
      : window.location.origin;
  const API = `${BACKEND_URL}/api`;

  // Full logout: clear in-memory state and all persisted auth so next login never sees previous role.
  const logout = useCallback(() => {
    userSetByExternalAuthRef.current = false;
    skipFetchUserOnceRef.current = false;
    setToken(null);
    setUser(null);
    setLoading(false);
    resetAvatarTheme();
    clearSession();
    delete axios.defaults.headers.common['Authorization'];
    if (sessionCheckIntervalRef.current) {
      clearInterval(sessionCheckIntervalRef.current);
      sessionCheckIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    if (userSetByExternalAuthRef.current) {
      userSetByExternalAuthRef.current = false;
      setLoading(false);
      return;
    }
    if (skipFetchUserOnceRef.current) {
      skipFetchUserOnceRef.current = false;
      setLoading(false);
      return;
    }
    // Session timeout: if token is already expired on load, logout immediately
    if (isTokenExpired(token)) {
      logout();
      setLoading(false);
      return;
    }
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    fetchUser();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Periodic session timeout check and on tab focus
  useEffect(() => {
    if (!token) return;
    const checkExpiry = () => {
      if (isTokenExpired(token)) {
        logout();
      }
    };
    sessionCheckIntervalRef.current = setInterval(checkExpiry, SESSION_CHECK_INTERVAL_MS);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkExpiry();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
        sessionCheckIntervalRef.current = null;
      }
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [token, logout]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/user/me`, { timeout: 15000 });
      setUser(response.data);
      applyUserTheme(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      // Always set loading false after resolve so protected routes never hang on loading
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password }, { timeout: 15000 });
    const { token: newToken, user: userData } = response.data;
    skipFetchUserOnceRef.current = true;
    setToken(newToken);
    setUser(userData);
    applyUserTheme(userData);
    setStoredToken(newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setLoading(false);
    return userData;
  };

  const signup = async (email, password, role = 'USER', profile = {}) => {
    const usernameSource = (profile.username || email.split('@')[0] || '').toLowerCase();
    const username = usernameSource.replace(/[^a-z0-9_]/g, '').slice(0, 30);
    const payload = {
      email,
      password,
      role,
      username: username || `user${Date.now().toString().slice(-6)}`,
      avatar: profile.avatar || DEFAULT_AVATAR,
      full_name: profile.full_name || email.split('@')[0],
      phone: profile.phone || '0000000000',
      dob: profile.dob || '2000-01-01',
      gender: profile.gender || 'prefer_not_to_say',
    };
    const response = await axios.post(`${API}/auth/signup`, payload, { timeout: 15000 });
    const { token: newToken, user: userData } = response.data;
    skipFetchUserOnceRef.current = true;
    setToken(newToken);
    setUser(userData);
    applyUserTheme(userData);
    setStoredToken(newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setLoading(false);
    return userData;
  };

  // Let partner login (and any external auth) update token so fetchUser runs and ProtectedRoute sees user
  const setTokenFromStorage = (newToken) => {
    if (newToken) {
      setStoredToken(newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    }
    setToken(newToken || null);
  };

  // Partner (and other external) login: set token + user from response so role is correct and /user/me doesn't overwrite with wrong role
  const setTokenAndUser = useCallback((newToken, userData) => {
    if (newToken) {
      setStoredToken(newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    }
    setToken(newToken || null);
    if (userData) {
      setUser(userData);
      applyUserTheme(userData);
      userSetByExternalAuthRef.current = true;
    }
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, loading, setTokenFromStorage, setTokenAndUser }}>
      {children}
    </AuthContext.Provider>
  );
};