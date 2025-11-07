// lib/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  withCredentials: true, // send cookies (refresh token cookie)
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
  const token = (globalThis as any)._AS_ACCESS_TOKEN;
  if (token && config.headers) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const originalReq = err.config;
    if (err.response && err.response.status === 401 && !originalReq._retry) {
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
          const res = await api.post("/refresh", {}, { withCredentials: true });
          const accessToken = res.data.access_token;
          (globalThis as any)._AS_ACCESS_TOKEN = accessToken;
          processQueue(null, accessToken);
          originalReq.headers["Authorization"] = "Bearer " + accessToken;
          resolve(api(originalReq));
        } catch (e) {
          processQueue(e, null);
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

