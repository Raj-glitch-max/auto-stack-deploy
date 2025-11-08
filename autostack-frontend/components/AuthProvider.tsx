// components/AuthProvider.tsx
"use client"
import React, { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function loadMe() {
    // Don't try to load user on public pages to avoid redirect loop
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      const publicPaths = ['/login', '/signup', '/', '/docs', '/pricing', '/how-it-works', '/deploy'];
      if (publicPaths.includes(currentPath)) {
        setLoading(false);
        setUser(null);
        return;
      }
    }
    
    try {
      // Try to get token from localStorage first
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
      
      // Try to get user info
      const res = await api.get("/me");
      setUser(res.data);
    } catch (e) {
      // If that fails, try refresh token
      try {
        const refreshToken = typeof window !== 'undefined' 
          ? localStorage.getItem("refresh_token")
          : (globalThis as any)._AS_REFRESH_TOKEN;
        
        if (refreshToken) {
          const r = await api.post("/refresh", { refresh_token: refreshToken });
          const accessToken = r.data.access_token;
          (globalThis as any)._AS_ACCESS_TOKEN = accessToken;
          if (typeof window !== 'undefined') {
            localStorage.setItem("access_token", accessToken);
          }
          const res = await api.get("/me");
          setUser(res.data);
        } else {
          setUser(null);
        }
      } catch (refreshError) {
        setUser(null);
      }
    } finally {
      setLoading(false);
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

