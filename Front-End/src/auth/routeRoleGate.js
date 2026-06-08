import { normalizeFacetKey } from "./roleModel";

/**
 * Legacy route / UI role names → facets stored on the session after normalization.
 * @param {string} roleInput
 * @returns {string[]}
 */
export function routeRoleAliases(roleInput) {
  const x = String(roleInput ?? "").trim().toLowerCase();
  if (x === "staff" || x === "employee") return ["teacher"];
  if (x === "dean") return ["admin"];
  return [x];
}

function canonList(normalizedRoles) {
  if (!Array.isArray(normalizedRoles) || normalizedRoles.length === 0) return [];
  return normalizedRoles.map((r) => String(r).toLowerCase());
}

/**
 * Strict facet match for `hasRole` (no legacy alias expansion except student↔user).
 */
export function userHasAppFacet(normalizedRoles, roleInput) {
  const canon = canonList(normalizedRoles);
  if (!canon.length) return false;
  const rawLow = String(roleInput ?? "").trim().toLowerCase();
  const k = normalizeFacetKey(roleInput.trim());

  if (k === "student" || rawLow === "student") {
    return canon.some((x) => x === "student" || x === "user");
  }
  if (rawLow === "user" || k === "user") {
    return canon.includes("user") || canon.includes("student");
  }

  if (k) return canon.includes(k);
  return canon.includes(rawLow);
}

/**
 * Route / RBAC: legacy labels in `allowedRoles` expand to current facets.
 */
export function userMatchesRouteAllowedRole(normalizedRoles, roleInput) {
  const aliases = routeRoleAliases(roleInput);
  return aliases.some((a) => userHasAppFacet(normalizedRoles, a));
}

/**
 * @deprecated Prefer `userHasAppFacet` or `userMatchesRouteAllowedRole`.
 */
export function userHasNormalizedRole(normalizedRoles, roleInput) {
  return userMatchesRouteAllowedRole(normalizedRoles, roleInput);
}

/** Match route `allowedRoles` lists — `student` gates also allow reader `user`. */
export function normalizedUserMatchesRoutes(
  normalizedRoles,
  allowed,
  mode = "any",
) {
  if (!allowed.length) return true;
  const test = (r) => userMatchesRouteAllowedRole(normalizedRoles, r);
  return mode === "all" ? allowed.every(test) : allowed.some(test);
}
