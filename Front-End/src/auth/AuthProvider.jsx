/* eslint-disable react-refresh/only-export-components -- React context + provider live together */
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import AuthBootstrapOverlay from "./AuthBootstrapOverlay";
import {
  hydrateFromCookieBootstrap,
  hydrateFromStoredBearerSession,
  fetchCurrentGatewayUser,
  logoutLocalGateway,
} from "./authService";
import { authUsesCookieRefresh } from "./httpCredentials";
import { userHasAppFacet } from "./routeRoleGate";
import {
  clearAuthStorage,
  getStoredAccessToken,
} from "./storageBridge";
import { enqueueBackendRefresh } from "./refreshCoordinator";

export const AuthReactContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const [cookieBootPending, setCookieBootPending] = useState(
    () => authUsesCookieRefresh(),
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const nextUser = authUsesCookieRefresh()
          ? await hydrateFromCookieBootstrap()
          : await hydrateFromStoredBearerSession();
        if (!cancelled && nextUser) setUser(nextUser);
      } finally {
        if (!cancelled) setCookieBootPending(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!cookieBootPending && !hydrated) setHydrated(true);
  }, [cookieBootPending, hydrated]);

  useEffect(() => {
    function handler(ev) {
      const next = /** @type {CustomEvent<{ user?: object }>} */ (ev).detail
        ?.user;
      if (next && typeof next === "object") setUser(next);
    }
    window.addEventListener("spa-session-refreshed", handler);
    return () => window.removeEventListener("spa-session-refreshed", handler);
  }, []);

  useEffect(() => {
    if (!hydrated || !user) return;
    const mem = Boolean(getStoredAccessToken());
    const cookieBootstrap = authUsesCookieRefresh();
    if (!mem && !cookieBootstrap) setUser(null);
  }, [hydrated, user]);

  useEffect(() => {
    if (!hydrated || !user) return undefined;
    let cancelled = false;
    const refresh = async () => {
      const token = await enqueueBackendRefresh();
      if (!cancelled && token) {
        const next = await fetchCurrentGatewayUser().catch(() => null);
        if (!cancelled && next && typeof next === "object") setUser(next);
      }
    };
    const interval = window.setInterval(refresh, 4 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [hydrated, user]);

  const login = useCallback((next) => {
    setUser(next);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutLocalGateway();
      setUser(null);
    } catch {
      clearAuthStorage();
      setUser(null);
    }
    if (!window.location.pathname.includes("/login")) {
      window.location.assign("/login");
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const next = await fetchCurrentGatewayUser();
      if (next && typeof next === "object") {
        setUser(next);
      }
      return next;
    } catch {
      return null;
    }
  }, []);

  const hasRole = useCallback(
    (role) => userHasAppFacet(user?.normalizedRoles, role),
    [user?.normalizedRoles],
  );

  const hasAnyRole = useCallback(
    (roles) => roles.some((r) => hasRole(r)),
    [hasRole],
  );

  const hasAllRoles = useCallback(
    (roles) => roles.length > 0 && roles.every((r) => hasRole(r)),
    [hasRole],
  );

  const isAdminCb = useCallback(() => hasRole("admin"), [hasRole]);
  const isTeacherCb = useCallback(() => hasRole("teacher"), [hasRole]);
  const isStudentCb = useCallback(
    () => hasRole("student") || hasRole("user"),
    [hasRole],
  );
  const isEmployeeCb = useCallback(() => {
    const ut = String(user?.user_type ?? "").toLowerCase();
    return ut === "staff" || ut === "employee";
  }, [user?.user_type]);
  const isAuthorCb = useCallback(() => hasRole("author"), [hasRole]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated:
        hydrated &&
        (Boolean(
          user &&
            (user.id != null ||
              `${user.email ?? ""}`.trim().length > 0 ||
              `${user.user_name ?? ""}`.trim().length > 0),
        ) ||
          Boolean(getStoredAccessToken())),
      hydrated,
      login,
      logout,
      refreshSession,
      hasRole,
      hasAnyRole,
      hasAllRoles,
      isAdmin: isAdminCb,
      isTeacher: isTeacherCb,
      isStudent: isStudentCb,
      isEmployee: isEmployeeCb,
      isAuthor: isAuthorCb,
    }),
    [
      hydrated,
      isAdminCb,
      isAuthorCb,
      isEmployeeCb,
      isStudentCb,
      isTeacherCb,
      user,
      login,
      logout,
      refreshSession,
      hasRole,
      hasAnyRole,
      hasAllRoles,
    ],
  );

  if (cookieBootPending) return <AuthBootstrapOverlay />;

  return (
    <AuthReactContext.Provider value={value}>{children}</AuthReactContext.Provider>
  );
}
