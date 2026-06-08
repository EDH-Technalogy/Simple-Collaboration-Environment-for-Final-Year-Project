/**
 * Axios client for the API gateway.
 * Every request attaches `Authorization: Bearer <access_token>` when logged in (`tokenMemory`).
 * On `401`, one coordinated refresh runs (`enqueueBackendRefresh`); success retries the request
 * with the new access token. If refresh fails or no refresh token exists, storage is cleared and
 * the app redirects to `/login`.
 */
import axios from "axios";
import { clearAuthStorage, getStoredAccessToken } from "../auth/storageBridge";
import {
  apiWithCredentialsEnabled,
  authUsesCookieRefresh,
} from "../auth/httpCredentials";
import { enqueueBackendRefresh } from "../auth/refreshCoordinator";
import { tokenMemory } from "../auth/tokenMemory";

const apiClient = axios.create({
  baseURL: "",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60_000,
  withCredentials: apiWithCredentialsEnabled(),
});

function isAuthBypassUrl(url) {
  if (!url) return false;
  return /\/api\/v1\/auth\/(login|signup|google|forgot-password|reset-password|verify-email|resend-verification)/i.test(
    url,
  );
}

function isRefreshRequestUrl(url) {
  const u = String(url ?? "");
  return /\/api\/v1\/auth\/refresh(-token)?(\/|\?|$)/i.test(u);
}

apiClient.interceptors.request.use((config) => {
  const token = getStoredAccessToken();
  if (token && !config.skipAuthToken) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (
      status !== 401 ||
      typeof window === "undefined" ||
      !originalRequest
    )
      return Promise.reject(error);

    const reqUrl = String(originalRequest.url ?? "");

    if (isRefreshRequestUrl(reqUrl)) {
      clearAuthStorage();
      if (!window.location.pathname.includes("/login")) {
        window.location.assign("/login");
      }
      return Promise.reject(error);
    }

    if (originalRequest._authRetry) {
      clearAuthStorage();
      if (!window.location.pathname.includes("/login")) {
        window.location.assign("/login");
      }
      return Promise.reject(error);
    }

    if (isAuthBypassUrl(reqUrl)) {
      clearAuthStorage();
      return Promise.reject(error);
    }

    if (originalRequest.skipAuthRedirect) {
      return Promise.reject(error);
    }

    originalRequest._authRetry = true;
    const cookieMode = authUsesCookieRefresh();
    if (!cookieMode && !tokenMemory.getRefresh()) {
      clearAuthStorage();
      if (!window.location.pathname.includes("/login")) {
        window.location.assign("/login");
      }
      return Promise.reject(error);
    }

    const nextAccess = await enqueueBackendRefresh();
    if (!nextAccess) {
      clearAuthStorage();
      if (!window.location.pathname.includes("/login")) {
        window.location.assign("/login");
      }
      return Promise.reject(error);
    }

    originalRequest.headers.Authorization = `Bearer ${nextAccess}`;
    return apiClient(originalRequest);
  },
);

export default apiClient;
