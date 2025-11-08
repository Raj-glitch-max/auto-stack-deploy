// components/AuthProvider.tsx
"use client"
import React, { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function loadMe() {
    // COMPLETELY DISABLED - Don't load user automatically
    // Only load tokens from localStorage, don't make API calls
    setLoading(false);
    setUser(null);
    
    // Just restore tokens if they exist
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem("access_token");
      const storedRefresh = localStorage.getItem("refresh_token");
      if (storedToken) {
        (globalThis as any)._AS_ACCESS_TOKEN = storedToken;
      }
      if (storedRefresh) {
        (globalThis as any)._AS_REFRESH_TOKEN = storedRefresh;
      }
    }
  }

  useEffect(() => {
    loadMe();
  }, []);

  async function login(email: string, password: string) {
    // Use JSON instead of FormData
    const res = await api.post("/login", { email, password });
    const accessToken = res.data.access_token;
    const refreshToken = res.data.refresh_token;
    
    // Store tokens
    (globalThis as any)._AS_ACCESS_TOKEN = accessToken;
    (globalThis as any)._AS_REFRESH_TOKEN = refreshToken;
    if (typeof window !== 'undefined') {
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
    }
    
    const me = await api.get("/me");
    setUser(me.data);
    return me.data;
  }

  async function signup(name: string, email: string, password: string) {
    const res = await api.post("/signup", { name, email, password });
    return res.data;
  }

  async function logout() {
    try {
      await api.post("/logout");
    } catch (e) {
      // Ignore errors on logout
    }
    // Clear tokens
    (globalThis as any)._AS_ACCESS_TOKEN = null;
    (globalThis as any)._AS_REFRESH_TOKEN = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, login, signup, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

