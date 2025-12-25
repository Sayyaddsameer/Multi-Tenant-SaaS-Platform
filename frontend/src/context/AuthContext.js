import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Check if token is expired
        if (decoded.exp * 1000 < Date.now()) {
          logout();
        } else {
          setUser(decoded);
        }
      } catch (e) {
        logout();
      }
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password, tenantSubdomain) => {
    const { data } = await api.post('/auth/login', { email, password, tenantSubdomain });
    localStorage.setItem('token', data.token); // Store token
    setToken(data.token);
    setUser(jwtDecode(data.token));
    return data;
  };

  const register = async (formData) => {
    const { data } = await api.post('/auth/register-tenant', formData);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};