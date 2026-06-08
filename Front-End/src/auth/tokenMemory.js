import { authUsesCookieRefresh } from "./httpCredentials";

/** In-memory token pair. Omit refresh when gateway uses HttpOnly cookie refresh only. */
let accessToken = null;
let refreshTokenMemory = null;

export const tokenMemory = {
  setAccess(token) {
    accessToken =
      typeof token === "string" && token.length > 0 ? token : null;
  },

  setRefresh(token) {
    if (authUsesCookieRefresh()) return;
    refreshTokenMemory =
      typeof token === "string" && token.length > 0 ? token : null;
  },

  setPair(access, refresh) {
    this.setAccess(access);
    this.setRefresh(refresh);
  },

  getAccess() {
    return accessToken;
  },

  getRefresh() {
    if (authUsesCookieRefresh()) return null;
    return refreshTokenMemory;
  },

  clear() {
    accessToken = null;
    refreshTokenMemory = null;
  },
};
