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
      // try to get access token via refresh first
      const r = await api.post("/refresh", {}, { withCredentials: true }).catch(() => null);
      if (r && r.data?.access_token) {
        (globalThis as any)._AS_ACCESS_TOKEN = r.data.access_token;
        const res = await api.get("/me");
        setUser(res.data);
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMe();
  }, []);

  async function login(email: string, password: string) {
    // sends form-data to /login (auth.login expects form-data)
    const fd = new FormData();
    fd.append("username", email);
    fd.append("password", password);
    const res = await api.post("/login", fd, { withCredentials: true });
    (globalThis as any)._AS_ACCESS_TOKEN = res.data.access_token;
    const me = await api.get("/me");
    setUser(me.data);
    return me.data;
  }

  async function signup(name: string, email: string, password: string) {
    const res = await api.post("/signup", { name, email, password });
    return res.data;
  }

  async function logout() {
    await api.post("/logout");
    (globalThis as any)._AS_ACCESS_TOKEN = null;
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, login, signup, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

