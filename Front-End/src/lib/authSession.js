import { finalizeAuthProfile } from "../auth/roleModel";
import { normalizeUserPayload } from "./roles";

/** Decode JWT payload (no signature verification — only for UX / routing claims). */
export function decodeJwtPayload(accessToken) {
  if (!accessToken || typeof accessToken !== "string") return null;
  const parts = accessToken.split(".");
  if (parts.length < 2) return null;
  try {
    let b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4;
    if (pad) b64 += "=".repeat(4 - pad);
    const json = atob(b64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** Build normalized `user` + tokens from gateway auth JSON (login, refresh, Google, …). */
export function buildAuthSession(data = {}) {
  const access_token = data.access_token ?? data.accessToken ?? "";
  const refresh_token = data.refresh_token ?? data.refreshToken ?? "";

  const apiUser =
    typeof data.user === "object" && data.user !== null ? data.user : data;

  const tokenParsed = decodeJwtPayload(access_token) ?? {};
  const baseProfile = normalizeUserPayload(apiUser, tokenParsed);
  const user = finalizeAuthProfile(
    typeof baseProfile === "object" && baseProfile !== null
      ? { ...baseProfile }
      : {},
    typeof tokenParsed === "object" && tokenParsed !== null ? tokenParsed : {},
  );

  return {
    ...data,
    access_token,
    refresh_token,
    user,
  };
}
