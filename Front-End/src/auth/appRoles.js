/**
 * Application RBAC facets (aligned with `finalizeAuthProfile` / `normalizedRoles`).
 * Staff and dean realm roles are folded into `teacher` and `admin` respectively.
 *
 * @type {readonly ["admin", "teacher", "student", "author"]}
 */
export const APP_ROLE_FACETS = Object.freeze([
  "admin",
  "teacher",
  "student",
  "author",
]);

/**
 * Any signed-in user who may use public-site writer tools (`/write`, `/library`, …).
 * `student` in allowed lists still accepts the reader `user` facet via `routeRoleGate`.
 *
 * @type {readonly ["admin", "teacher", "student", "author"]}
 */
export const PUBLIC_SITE_MEMBER_ROLES = APP_ROLE_FACETS;
