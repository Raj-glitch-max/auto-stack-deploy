// components/AuthProvider.tsx
"use client"
import React, { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function loadMe() {
    try {
      // Restore tokens from localStorage
      if (typeof window !== 'undefined') {
        const storedToken = localStorage.getItem("access_token");
        const storedRefresh = localStorage.getItem("refresh_token");
        
        if (storedToken && storedRefresh) {
          (globalThis as any)._AS_ACCESS_TOKEN = storedToken;
          (globalThis as any)._AS_REFRESH_TOKEN = storedRefresh;
          
          // Try to fetch user data
          try {
            const me = await api.get("/me");
            setUser(me.data);
          } catch (error: any) {
            // If token is invalid, clear everything
            console.log("Failed to load user, clearing tokens");
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            (globalThis as any)._AS_ACCESS_TOKEN = null;
            (globalThis as any)._AS_REFRESH_TOKEN = null;
          }
        }
      }
    } catch (error) {
      console.error("Error loading user:", error);
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

  async function signup(email: string, password: string) {
    const res = await api.post("/signup", { email, password });
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
      localStorage.removeItem("user");
    }
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, setUser, loading, login, signup, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

