// lib/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  withCredentials: true, // send cookies (refresh token cookie)
  timeout: 15000, // 15 second timeout
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

let isRefreshing = false;
let failedQueue: any[] = [];
let refreshAttempts = 0;
const MAX_REFRESH_ATTEMPTS = 3;

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

const clearTokens = () => {
  (globalThis as any)._AS_ACCESS_TOKEN = null;
  (globalThis as any)._AS_REFRESH_TOKEN = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }
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
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (res) => {
    // Reset refresh attempts on successful response
    refreshAttempts = 0;
    return res;
  },
  async (err) => {
    const originalReq = err.config;
    
    // Skip refresh for auth endpoints
    const isAuthEndpoint = originalReq?.url?.includes('/login') || 
                          originalReq?.url?.includes('/signup') ||
                          originalReq?.url?.includes('/refresh') ||
                          originalReq?.url?.includes('/auth/google') ||
                          originalReq?.url?.includes('/auth/github');
    
    // Handle 401 errors with token refresh
    if (err.response && err.response.status === 401 && !originalReq?._retry && !isAuthEndpoint) {
      // Check if we've exceeded max refresh attempts
      if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
        console.error("❌ Max refresh attempts exceeded. Clearing tokens.");
        clearTokens();
        refreshAttempts = 0;
        return Promise.reject(new Error("Authentication failed. Please login again."));
      }

      if (isRefreshing) {
        // Queue this request while refresh is in progress
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
      refreshAttempts++;

      return new Promise(async (resolve, reject) => {
        try {
          // Get refresh token from localStorage or global
          let refreshToken = (globalThis as any)._AS_REFRESH_TOKEN;
          if (!refreshToken && typeof window !== 'undefined') {
            refreshToken = localStorage.getItem("refresh_token");
          }
          
          if (!refreshToken) {
            console.warn("⚠️ No refresh token available");
            clearTokens();
            processQueue(new Error("No refresh token"), null);
            reject(new Error("No refresh token"));
            return;
          }

          console.log("🔄 Attempting to refresh access token...");
          const res = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/refresh`,
            { refresh_token: refreshToken },
            {
              headers: { "Content-Type": "application/json" },
              timeout: 10000,
            }
          );
          
          const accessToken = res.data.access_token;
          const newRefreshToken = res.data.refresh_token || refreshToken;
          
          if (!accessToken) {
            throw new Error("No access token in refresh response");
          }
          
          // Update stored tokens
          (globalThis as any)._AS_ACCESS_TOKEN = accessToken;
          (globalThis as any)._AS_REFRESH_TOKEN = newRefreshToken;
          if (typeof window !== 'undefined') {
            localStorage.setItem("access_token", accessToken);
            localStorage.setItem("refresh_token", newRefreshToken);
          }
          
          console.log("✅ Token refresh successful");
          refreshAttempts = 0; // Reset on success
          processQueue(null, accessToken);
          originalReq.headers["Authorization"] = "Bearer " + accessToken;
          resolve(api(originalReq));
        } catch (e: any) {
          // Refresh failed - clear tokens and logout
          console.error("❌ Token refresh failed:", e.message);
          clearTokens();
          processQueue(e, null);
          
          // Redirect to login if we're in the browser
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            console.log("🔐 Redirecting to login...");
            window.location.href = '/login';
          }
          
          reject(e);
        } finally {
          isRefreshing = false;
        }
      });
    }
    
    return Promise.reject(err);
  }
);

export default api;

