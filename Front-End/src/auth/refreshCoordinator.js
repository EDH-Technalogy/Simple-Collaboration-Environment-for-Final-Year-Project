import axios from "axios";
import { buildAuthSession } from "../lib/authSession";
import { AUTH } from "../services/RouteConfig";
import { apiWithCredentialsEnabled, authUsesCookieRefresh } from "./httpCredentials";
import { persistTokens } from "./storageBridge";
import { tokenMemory } from "./tokenMemory";

let inflight = null;

async function executeRefreshInner() {
  const useCookieRefresh = authUsesCookieRefresh();
  const refreshFromMemory = tokenMemory.getRefresh();

  if (!useCookieRefresh && !refreshFromMemory) {
    return null;
  }

  try {
    const body = useCookieRefresh ? {} : { refresh_token: refreshFromMemory };

    const { data } = await axios.post(AUTH.REFRESH_TOKEN, body, {
      headers: { "Content-Type": "application/json" },
      timeout: 60_000,
      withCredentials: apiWithCredentialsEnabled(),
    });

    const session = buildAuthSession(data);
    const nextAccess = session.access_token || null;
    const nextRefresh =
      session.refresh_token && String(session.refresh_token).length > 0
        ? String(session.refresh_token)
        : refreshFromMemory ?? null;

    persistTokens(nextAccess, nextRefresh ?? null);

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("spa-session-refreshed", {
          detail: { user: session.user },
        }),
      );
    }

    return nextAccess;
  } catch {
    return null;
  }
}

/** One coordinated refresh burst for concurrent 401s. */
export function enqueueBackendRefresh() {
  if (!inflight) {
    inflight = executeRefreshInner().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}
