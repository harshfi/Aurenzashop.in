import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const res = await api.get("/auth/admin/me");
      if (res.data?.success) {
        setAdmin(res.data.admin);
      } else {
        setAdmin(null);
      }
    } catch (err) {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/admin/login", { email, password });
      if (res.data?.success) {
        setAdmin(res.data.admin);
        return { success: true };
      }
      return { success: false, message: "Invalid response from server" };
    } catch (err) {
      if (err.code === "ERR_NETWORK") {
        return {
          success: false,
          message: "Backend is unreachable. Start API server on http://localhost:8080.",
        };
      }
      return {
        success: false,
        message: err.response?.data?.message || "Login failed. Check your network or credentials.",
      };
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/admin/logout");
    } catch {
      // The local admin session is cleared even if the API is unavailable.
    } finally {
      setAdmin(null);
    }
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
