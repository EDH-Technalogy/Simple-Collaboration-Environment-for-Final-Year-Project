/**
 * SPA auth façade — bootstrap (cookie refresh), `/me`, and logout.
 */
import apiClient from "../api/client";
import { AUTH } from "../services/RouteConfig";
import { normalizeUserPayload } from "../lib/roles";
import { decodeJwtPayload } from "../lib/authSession";
import { finalizeAuthProfile } from "./roleModel";
import { authUsesCookieRefresh } from "./httpCredentials";
import { enqueueBackendRefresh } from "./refreshCoordinator";
import {
  clearAuthStorage,
  getStoredAccessToken,
  hydrateTokensFromStorage,
} from "./storageBridge";

export async function fetchCurrentGatewayUser() {
  const { data } = await apiClient.get(AUTH.ME);
  const tokenParsed = decodeJwtPayload(getStoredAccessToken() ?? "") ?? {};

  const mergedClaims = {
    ...tokenParsed,
    ...(typeof data === "object" && data !== null ? data : {}),
  };

  if (typeof data?.user === "object" && data.user !== null) {
    const base = normalizeUserPayload(data.user, mergedClaims);
    return finalizeAuthProfile(
      typeof base === "object" && base !== null ? { ...base } : {},
      mergedClaims,
    );
  }

  const realmRoles = Array.isArray(data?.realmRoles) ? data.realmRoles : [];

  const synthetic = {
    id: data?.sub ?? data?.id ?? null,
    user_name:
      typeof data?.username === "string"
        ? data.username
        : typeof data?.user_name === "string"
          ? data.user_name
          : "",
    email: typeof data?.email === "string" ? data.email : "",
    roles: realmRoles.length > 0 ? realmRoles : data?.roles,
  };

  const base = normalizeUserPayload(synthetic, mergedClaims);
  return finalizeAuthProfile(
    typeof base === "object" && base !== null ? { ...base } : {},
    mergedClaims,
  );
}

export async function logoutRemoteGateway() {
  try {
    await apiClient.post(AUTH.LOGOUT, {});
  } catch {
    /* best-effort */
  }
}

export async function logoutLocalGateway() {
  await logoutRemoteGateway();
  clearAuthStorage();
}

/** Cold-load when gateway sets HttpOnly refresh cookie. */
export async function hydrateFromCookieBootstrap() {
  if (!authUsesCookieRefresh()) return null;
  const next = await enqueueBackendRefresh();
  if (!next) return null;
  try {
    return await fetchCurrentGatewayUser();
  } catch {
    clearAuthStorage();
    return null;
  }
}

/** Cold-load when SPA manages bearer access + refresh tokens. */
export async function hydrateFromStoredBearerSession() {
  if (authUsesCookieRefresh()) return null;

  hydrateTokensFromStorage();
  if (!getStoredAccessToken()) return null;

  try {
    return await fetchCurrentGatewayUser();
  } catch {
    clearAuthStorage();
    return null;
  }
}
