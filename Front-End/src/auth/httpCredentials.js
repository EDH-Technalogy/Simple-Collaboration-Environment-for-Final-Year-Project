/**
 * Vite env helpers for Axios `withCredentials` and cookie-based refresh.
 * Set in `.env`: `VITE_API_WITH_CREDENTIALS`, `VITE_AUTH_COOKIE_REFRESH`.
 */

function envIsTrue(key) {
  return import.meta.env[key] === "true";
}

function envIsFalse(key) {
  return import.meta.env[key] === "false";
}

/**
 * Send cookies on API requests (needed for HttpOnly session/refresh cookies and
 * credentialed cross-origin calls). Disable with `VITE_API_WITH_CREDENTIALS=false`.
 */
export function apiWithCredentialsEnabled() {
  if (envIsFalse("VITE_API_WITH_CREDENTIALS")) return false;
  if (envIsTrue("VITE_API_WITH_CREDENTIALS")) return true;
  /* Cookie refresh implies credentialed refresh calls; default client to match. */
  return envIsTrue("VITE_AUTH_COOKIE_REFRESH");
}

/** POST refresh with empty body; refresh token comes from HttpOnly cookie. */
export function authUsesCookieRefresh() {
  return envIsTrue("VITE_AUTH_COOKIE_REFRESH");
}
