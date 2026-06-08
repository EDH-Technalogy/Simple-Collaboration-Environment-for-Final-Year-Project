const LEGACY_TOKEN_KEYS = ["access_token", "refresh_token", "user", "userId"];

/** Remove superseded SPA keys (tokens no longer tracked in LS). */
export function clearLegacyBrowserAuthKeys() {
  if (typeof window === "undefined") return;
  try {
    for (const k of LEGACY_TOKEN_KEYS) {
      localStorage.removeItem(k);
    }
  } catch {
    /* ignore */
  }
}
