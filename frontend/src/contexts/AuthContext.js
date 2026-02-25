import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Local dev: VITE_BACKEND_URL (or fallback to localhost:8000). Production: current origin.
  const BACKEND_URL =
    typeof import.meta !== 'undefined' && import.meta.env.VITE_BACKEND_URL
      ? import.meta.env.VITE_BACKEND_URL
      : typeof import.meta !== 'undefined' && import.meta.env.DEV
        ? 'http://localhost:8000'
      : window.location.origin;
  const API = `${BACKEND_URL}/api`;

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/user/me`, { timeout: 15000 });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password }, { timeout: 15000 });
    const { token: newToken, user: userData } = response.data;
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('token', newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
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
      full_name: profile.full_name || email.split('@')[0],
      phone: profile.phone || '0000000000',
      dob: profile.dob || '2000-01-01',
      gender: profile.gender || 'prefer_not_to_say',
    };
    const response = await axios.post(`${API}/auth/signup`, payload, { timeout: 15000 });
    const { token: newToken, user: userData } = response.data;
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('token', newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    return userData;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  // Let partner login (and any external auth) update token so fetchUser runs and ProtectedRoute sees user
  const setTokenFromStorage = (newToken) => {
    if (newToken) {
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    }
    setToken(newToken || null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, loading, setTokenFromStorage }}>
      {children}
    </AuthContext.Provider>
  );
};