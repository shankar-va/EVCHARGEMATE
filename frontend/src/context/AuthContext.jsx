import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const data = await api.getSession();
        if (data && data.success) {
          setUser(data.data);
        }
      } catch (err) {
        // No active session
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (credentials) => {
    try {
      const data = await api.login(credentials);
      // The backend returns { success, message, data: user } and an HttpOnly cookie
      if (data.success && data.data) {
        setUser(data.data);
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

  const logout = async () => {
    await api.logout();
    setUser(null);
    // Remove old localStorage usages just in case
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
