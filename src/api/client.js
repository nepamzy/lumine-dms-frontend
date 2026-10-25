import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // sends the httpOnly refresh-token cookie automatically
});

// In-memory only — the access token is short-lived (15 min) and deliberately
// never persisted to localStorage. On a fresh page load, the refresh-token
// cookie (httpOnly, set by the backend) is used to silently get a new one.
let accessToken = null;
let onUnauthorized = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Endpoints reachable with no session at all — login (wrong password)
    // and reset-password (expired/used reset link) both throw their own
    // plain 401 for reasons that have nothing to do with an expired access
    // token. Without this exclusion, that 401 triggered a silent refresh
    // attempt, which itself 401's (there's no session to refresh), and
    // THAT error replaced the real one — so a wrong password showed
    // "Invalid or expired refresh token" instead of "Incorrect email/phone
    // or password", with no way to tell what actually went wrong.
    // /auth/refresh is excluded for a different, structural reason: retrying
    // a failed refresh by calling refresh again is circular and used to
    // deadlock — the retry awaits `refreshPromise`, but the failing refresh
    // call IS `refreshPromise`, so it was awaiting its own settlement and
    // never resolved.
    const isPreAuthEndpoint = ["/auth/refresh", "/auth/login", "/auth/reset-password"].some((path) =>
      originalRequest.url?.includes(path)
    );
    if (error.response?.status === 401 && !originalRequest._retry && !isPreAuthEndpoint) {
      originalRequest._retry = true;
      try {
        // Multiple simultaneous 401s should only trigger one refresh call
        if (!refreshPromise) {
          refreshPromise = api.post("/auth/refresh").finally(() => {
            refreshPromise = null;
          });
        }
        const { data } = await refreshPromise;
        setAccessToken(data.data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        setAccessToken(null);
        if (onUnauthorized) onUnauthorized();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
