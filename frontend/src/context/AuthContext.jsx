import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const clearUserScopedCache = () => {
    try {
      // Remove any EV-CHARGEMATE cached data to avoid cross-user leakage
      const keys = Object.keys(localStorage);
      keys.forEach((k) => {
        if (k.startsWith('evcm_')) localStorage.removeItem(k);
      });
      sessionStorage.clear();
    } catch {
      // ignore storage failures
    }
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const [sessionRes, bookingsRes] = await Promise.all([
        api.getSession().catch(() => ({ success: false })),
        api.getUserBookings().catch(() => []) 
      ]);

      if (sessionRes && sessionRes.success && sessionRes.data) {
        setUser(sessionRes.data);
      } else {
        setUser(null);
      }

      setBookings(Array.isArray(bookingsRes) ? bookingsRes : []);
    } catch (err) {
      console.error("Auth hydration error:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Attempt absolute core hydration upon mount exactly once safely validating HTTP cookies 
    fetchUserData();
  }, []);

  const login = async (credentials) => {
    try {
      clearUserScopedCache();
      const data = await api.login(credentials);
      if (data.success && data.data) {
        await fetchUserData(); // Reliably set everything in memory
      }
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const register = async (userData) => {
    try {
      await api.register(userData);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const adminLogin = async (credentials) => {
    try {
      clearUserScopedCache();
      const data = await api.adminLogin(credentials);
      if (data.success && data.data) {
        setUser(data.data); // Admins typically lack standard booking layouts
        setLoading(false);
      }
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const adminRegister = async (userData) => {
    try {
      await api.adminRegister(userData);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logout = async () => {
    await api.logout().catch(() => {});
    setUser(null);
    setBookings([]);
    
    // Explicit cleanout
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    clearUserScopedCache();
  };

  const value = {
    user,
    bookings,
    loading,
    login,
    register,
    adminLogin,
    adminRegister,
    logout,
    fetchUserData // Expose if any external layer wants a violent refresh action
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};