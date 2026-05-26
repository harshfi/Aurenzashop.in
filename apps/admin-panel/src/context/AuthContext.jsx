import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const checkAuth = async ({ silent = false } = {}) => {
    try {
      const res = await api.get("/auth/admin/me");
      if (res.data?.success) {
        setAdmin(res.data.admin);
        setAuthError("");
      } else {
        setAdmin(null);
        if (!silent) setAuthError("Admin session not found.");
      }
    } catch (err) {
      setAdmin(null);
      if (!silent) {
        if (err?.isAuthError) setAuthError("Admin session expired. Please sign in again.");
        else if (err?.code === "ERR_NETWORK") setAuthError("Backend is unreachable.");
        else setAuthError("Unable to verify admin session.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth({ silent: true });
  }, []);

  const login = async (email, password) => {
    try {
      const loginRes = await api.post("/auth/admin/login", { email, password });
      if (loginRes.data?.success) {
        const verifyRes = await api.get("/auth/admin/me");
        if (verifyRes.data?.success && verifyRes.data?.admin) {
          setAdmin(verifyRes.data.admin);
          setAuthError("");
          return { success: true };
        }

        setAdmin(null);
        return {
          success: false,
          message: "Session could not be persisted. Ensure admin app and API use the same host origin.",
        };
      }
      return { success: false, message: "Invalid response from server" };
    } catch (err) {
      if (err.code === "ERR_NETWORK") {
        return {
          success: false,
          message: "Backend is unreachable. Start API server on http://localhost:8080.",
        };
      }
      if (err?.isAuthError) {
        return {
          success: false,
          message: "Login succeeded but session cookie was rejected by browser. Use the same host for admin and API (both localhost or both 127.0.0.1).",
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
      setAuthError("");
    }
  };

  return (
    <AuthContext.Provider value={{ admin, loading, authError, login, logout, checkAuth }}>
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
