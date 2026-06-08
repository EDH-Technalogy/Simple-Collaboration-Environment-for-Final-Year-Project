import { Navigate, useLocation } from "react-router-dom";
import AuthBootstrapOverlay from "../auth/AuthBootstrapOverlay";
import { normalizedUserMatchesRoutes } from "../auth/routeRoleGate";
import { useAuth } from "../auth/useAuth";

function rolesList(user) {
  const raw = user?.normalizedRoles;
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  return raw.map((r) => String(r));
}

/**
 * @param {{
 *   children: import("react").ReactNode;
 *   allowedRoles?: string[];
 *   roleMode?: "any" | "all";
 *   authenticateOnly?: boolean;
 * }} props
 * When `authenticateOnly` is true, only a signed-in session is required (`allowedRoles` ignored).
 * Otherwise `allowedRoles` must be a non-empty list (empty array is treated as misconfiguration → unauthorized).
 */
export default function ProtectedRoute({
  children,
  allowedRoles,
  roleMode = "any",
  authenticateOnly = false,
}) {
  const location = useLocation();
  const { hydrated, user, isAuthenticated } = useAuth();

  if (!hydrated) {
    return <AuthBootstrapOverlay />;
  }

  if (!isAuthenticated || !user) {
    return (
      <Navigate to="/login" state={{ from: location }} replace />
    );
  }

  if (authenticateOnly) {
    return children;
  }

  if (!allowedRoles?.length) {
    return <Navigate to="/unauthorized" replace />;
  }

  const list = rolesList(user);
  if (!list?.length) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (!normalizedUserMatchesRoutes(list, allowedRoles, roleMode)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
