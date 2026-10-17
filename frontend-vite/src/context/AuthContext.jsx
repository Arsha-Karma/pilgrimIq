import React, { createContext, useState, useEffect, useContext } from "react";
import { apiLogin, apiRegister, apiGoogleLogin, apiGetProfile } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("pilgrim_token") || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("pilgrim_token");
      if (storedToken) {
        try {
          const profileData = await apiGetProfile(storedToken);
          setUser(profileData);
          setToken(storedToken);
        } catch (err) {
          console.error("Failed to restore session:", err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const data = await apiLogin(email, password);
      setUser(data);
      setToken(data.token);
      localStorage.setItem("pilgrim_token", data.token);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const data = await apiRegister(userData);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const googleAuth = async (googlePayload) => {
    setError(null);
    try {
      const data = await apiGoogleLogin(googlePayload);
      setUser(data);
      setToken(data.token);
      localStorage.setItem("pilgrim_token", data.token);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("pilgrim_token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        register,
        googleAuth,
        logout,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
