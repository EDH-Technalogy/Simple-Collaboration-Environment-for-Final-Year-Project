import { clearLegacyBrowserAuthKeys } from "./legacyStorageClear";
import { authUsesCookieRefresh } from "./httpCredentials";
import { tokenMemory } from "./tokenMemory";

export const STORAGE_ACCESS_TOKEN_KEY = "spa_access_token";
export const STORAGE_REFRESH_TOKEN_KEY = "spa_refresh_token";

function canUseBrowserStorage() {
  return typeof window !== "undefined" && !authUsesCookieRefresh();
}

export function persistTokens(access, refresh) {
  const nextAccess =
    typeof access === "string" && access.length > 0 ? access : null;
  const nextRefresh =
    typeof refresh === "string" && refresh.length > 0 ? refresh : null;

  tokenMemory.setPair(nextAccess, nextRefresh);

  if (!canUseBrowserStorage()) return;

  try {
    if (nextAccess) {
      window.localStorage.setItem(STORAGE_ACCESS_TOKEN_KEY, nextAccess);
    } else {
      window.localStorage.removeItem(STORAGE_ACCESS_TOKEN_KEY);
    }

    if (nextRefresh) {
      window.localStorage.setItem(STORAGE_REFRESH_TOKEN_KEY, nextRefresh);
    } else {
      window.localStorage.removeItem(STORAGE_REFRESH_TOKEN_KEY);
    }
  } catch {
    /* ignore browser storage failures */
  }
}

export function hydrateTokensFromStorage() {
  if (!canUseBrowserStorage()) return;

  try {
    const access = window.localStorage.getItem(STORAGE_ACCESS_TOKEN_KEY);
    const refresh = window.localStorage.getItem(STORAGE_REFRESH_TOKEN_KEY);
    tokenMemory.setPair(access, refresh);
  } catch {
    tokenMemory.clear();
  }
}

export function clearAuthStorage() {
  tokenMemory.clear();
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_ACCESS_TOKEN_KEY);
      window.localStorage.removeItem(STORAGE_REFRESH_TOKEN_KEY);
    } catch {
      /* ignore browser storage failures */
    }
  }
  clearLegacyBrowserAuthKeys();
}

export function getStoredAccessToken() {
  return tokenMemory.getAccess();
}

export function getStoredRefreshTokenMem() {
  return tokenMemory.getRefresh();
}
