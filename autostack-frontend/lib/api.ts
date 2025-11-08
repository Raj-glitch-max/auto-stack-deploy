// lib/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  withCredentials: true, // send cookies (refresh token cookie)
  timeout: 10000, // 10 second timeout
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.request.use((config) => {
  // Try to get token from global first, then localStorage
  let token = (globalThis as any)._AS_ACCESS_TOKEN;
  if (!token && typeof window !== 'undefined') {
    token = localStorage.getItem("access_token");
    if (token) {
      (globalThis as any)._AS_ACCESS_TOKEN = token;
    }
  }
  if (token && config.headers) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const originalReq = err.config;
    
    // Skip refresh for login and signup endpoints
    const isAuthEndpoint = originalReq.url?.includes('/login') || 
                          originalReq.url?.includes('/signup') ||
                          originalReq.url?.includes('/refresh');
    
    if (err.response && err.response.status === 401 && !originalReq._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalReq.headers["Authorization"] = "Bearer " + token;
            return api(originalReq);
          })
          .catch((e) => Promise.reject(e));
      }

      originalReq._retry = true;
      isRefreshing = true;

      return new Promise(async (resolve, reject) => {
        try {
          // Get refresh token from localStorage or global
          let refreshToken = (globalThis as any)._AS_REFRESH_TOKEN;
          if (!refreshToken && typeof window !== 'undefined') {
            refreshToken = localStorage.getItem("refresh_token");
          }
          
          if (!refreshToken) {
            // No refresh token - just reject, don't redirect
            // Let components handle the error
            processQueue(new Error("No refresh token"), null);
            reject(new Error("No refresh token"));
            return;
          }

          const res = await api.post("/refresh", { refresh_token: refreshToken });
          const accessToken = res.data.access_token;
          
          // Update stored tokens
          (globalThis as any)._AS_ACCESS_TOKEN = accessToken;
          if (typeof window !== 'undefined') {
            localStorage.setItem("access_token", accessToken);
          }
          
          processQueue(null, accessToken);
          originalReq.headers["Authorization"] = "Bearer " + accessToken;
          resolve(api(originalReq));
        } catch (e) {
          // Refresh failed, clear tokens but don't redirect
          // Let components handle the error
          (globalThis as any)._AS_ACCESS_TOKEN = null;
          (globalThis as any)._AS_REFRESH_TOKEN = null;
          if (typeof window !== 'undefined') {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
          }
          processQueue(e, null);
          reject(e);
        } finally{
          isRefreshing = false;
        }
      });
    }
    return Promise.reject(err);
  }
);

export default api;

