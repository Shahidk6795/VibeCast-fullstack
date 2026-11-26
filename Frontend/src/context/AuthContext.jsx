/* eslint-disable no-empty */
import React, { createContext, useState, useEffect, useCallback, useMemo } from "react";
import { API_URL } from "../config";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem("vc_token") || "";
    } catch {
      return "";
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("vc_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [isLoaded, setIsLoaded] = useState(!token);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const persistSession = useCallback((nextToken, nextUser) => {
    setToken(nextToken || "");
    setUser(nextUser || null);
    try {
      if (nextToken) localStorage.setItem("vc_token", nextToken);
      else localStorage.removeItem("vc_token");

      if (nextUser) localStorage.setItem("vc_user", JSON.stringify(nextUser));
      else localStorage.removeItem("vc_user");
    } catch {}
  }, []);

  const logout = useCallback(() => {
    persistSession("", null);
  }, [persistSession]);

  useEffect(() => {
    if (!token) {
      setIsLoaded(true);
      return;
    }

    let active = true;
    fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (active && data?.user) {
          persistSession(token, data.user);
        }
      })
      .catch(() => {
        if (active) persistSession("", null);
      })
      .finally(() => {
        if (active) setIsLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [token, persistSession]);

  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Sign in failed");
    persistSession(data.token, data.user);
    setAuthModalOpen(false);
    return data.user;
  }, [persistSession]);

  const register = useCallback(async (name, email, password) => {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration failed");
    persistSession(data.token, data.user);
    setAuthModalOpen(false);
    return data.user;
  }, [persistSession]);

  const googleLogin = useCallback(async (credential) => {
    const res = await fetch(`${API_URL}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Google sign in failed");
    persistSession(data.token, data.user);
    setAuthModalOpen(false);
    return data.user;
  }, [persistSession]);

  const value = useMemo(() => ({
    user,
    token,
    isLoaded,
    isSignedIn: Boolean(user && token),
    isAdmin: Boolean(user && user.role === "admin"),
    authModalOpen,
    openAuthModal: () => setAuthModalOpen(true),
    closeAuthModal: () => setAuthModalOpen(false),
    login,
    register,
    googleLogin,
    logout
  }), [user, token, isLoaded, authModalOpen, login, register, googleLogin, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};