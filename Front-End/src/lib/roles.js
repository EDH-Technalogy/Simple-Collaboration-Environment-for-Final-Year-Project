/**
 * Normalize backend auth payloads and derive app routing role (`admin`, `teacher`, …).
 */

import { realmRoleMatchTokens } from "../auth/roleModel";

const ROLE_ROUTE_BASE = {
  admin: "/admin/dashboard",
  teacher: "/teacher/dashboard",
  student: "/student/dashboard",
  staff: "/staff/dashboard",
  dean: "/dean/dashboard",
  author: "/author/dashboard",
};

function upperList(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((x) => String(x).toUpperCase());
}

function deriveAppRole(userTypeRaw, realmRolesUpper, inheritedRolesUpper) {
  const ut = String(userTypeRaw ?? "").toUpperCase();

  const all = new Set();
  const rawPieces = [
    ...(ut ? [userTypeRaw] : []),
    ...(Array.isArray(realmRolesUpper) ? realmRolesUpper : []).map(String),
    ...(Array.isArray(inheritedRolesUpper) ? inheritedRolesUpper : []).map(
      String,
    ),
  ];
  for (const piece of rawPieces) {
    const s = String(piece ?? "").trim();
    if (!s || /^DEFAULT-ROLES-/i.test(s)) continue;
    const up = s.toUpperCase();
    if (up === "OFFLINE_ACCESS" || up === "UMA_AUTHORIZATION") continue;
    for (const token of realmRoleMatchTokens(s)) all.add(token);
  }

  if (
    all.has("ADMIN") ||
    all.has("SUPER_ADMIN") ||
    all.has("ADMIN_USER") ||
    ut === "ADMIN"
  )
    return "admin";
  if (
    ut === "TEACHER" ||
    all.has("TEACHER") ||
    all.has("FACULTY_USER") ||
    all.has("FACULTY") ||
    all.has("FACULTY-USER")
  ) {
    return "teacher";
  }
  if (
    ut === "STAFF" ||
    ut === "EMPLOYEE" ||
    all.has("STAFF") ||
    all.has("EMPLOYEE")
  ) {
    return "teacher";
  }
  if (ut === "DEAN" || all.has("DEAN")) return "admin";
  if (ut === "STUDENT" || all.has("STUDENT")) return "student";
  /*
   * Keycloak defaults (e.g. default-roles-*, offline_access) only → SPA `student`,
   * so `/student/*` ProtectedRoute accepts the session (was `user`).
   */
  if (ut === "USER") return "student";

  if (
    ut === "AUTHOR" ||
    ut === "AUTHOR_USER" ||
    all.has("AUTHOR") ||
    all.has("AUTHOR_USER") ||
    all.has("BLOG_AUTHOR") ||
    all.has("CONTENT_AUTHOR") ||
    all.has("BLOG_WRITER")
  ) {
    return "author";
  }

  return "student";
}

/**
 * Builds a SPA user shape from REST `user` payload and optional Keycloak `tokenParsed`.
 */
export function normalizeUserPayload(apiUser = null, tokenParsed = {}) {
  const u =
    typeof apiUser === "object" && apiUser !== null ? { ...apiUser } : {};

  const realmRolesUpper = upperList(tokenParsed?.realm_access?.roles);
  const inherited = upperList(u.roles);

  const id =
    u.id ??
    u.sub ??
    tokenParsed?.sub ??
    tokenParsed?.user_id ??
    null;

  const email = u.email ?? tokenParsed?.email ?? "";
  const user_name =
    u.user_name ?? u.username ?? tokenParsed?.preferred_username ?? "";

  const first_name = u.first_name ?? tokenParsed?.given_name ?? "";
  const last_name = u.last_name ?? tokenParsed?.family_name ?? "";
  const fullName = [first_name, last_name].filter(Boolean).join(" ").trim();

  const interimType =
    u.user_type ?? tokenParsed?.user_type ?? u.role ?? "";

  const role = deriveAppRole(interimType, realmRolesUpper, inherited);
  const user_type = u.user_type ?? tokenParsed?.user_type ?? role;

  return {
    ...u,
    id,
    email,
    user_name,
    username: user_name,
    first_name,
    last_name,
    role,
    user_type: user_type ?? role,
    fullName:
      fullName ||
      `${u.fullName ?? ""}`.trim() ||
      `${user_name}`.trim() ||
      `${email}`,
  };
}

export function postLoginPath(user) {
  const r =
    typeof user?.role === "string" ? user.role.toLowerCase() : "student";
  if (r === "user") return ROLE_ROUTE_BASE.student;
  return ROLE_ROUTE_BASE[r] ?? ROLE_ROUTE_BASE.student;
}

/**
 * Primary dashboard URL for the signed-in user (faculty app or author workspace).
 */
export function getDashboardPathForUser(user) {
  if (!user || typeof user.role !== "string") return null;
  const r = user.role.toLowerCase();
  if (r === "author") return ROLE_ROUTE_BASE.author;
  if (r === "user") return ROLE_ROUTE_BASE.student;
  return ROLE_ROUTE_BASE[r] ?? ROLE_ROUTE_BASE.student;
}

/**
 * Sidebar / header base dashboard path keyed by SPA role (`admin`, `teacher`, …).
 */
export function getFacultyDashboardPath(role) {
  switch (role) {
    case "admin":
      return "/admin";
    case "teacher":
      return "/teacher";
    case "student":
      return "/student";
    case "staff":
      return "/staff";
    case "dean":
      return "/dean";
    case "author":
      return "/author";
    case "user":
      return "/student";
    default:
      return "/student";
  }
}

const SHELL_PREFIXES = [
  "/admin",
  "/teacher",
  "/student",
  "/author",
  "/staff",
  "/dean",
];

/**
 * Resolves the active app shell prefix from the URL so sidebar links stay on
 * `/staff/*` or `/dean/*` when those shells are used, while facets are admin/teacher.
 *
 * @param {string} pathname
 * @param {string} [primaryRole]
 * @returns {string}
 */
/** Settings route for the active shell (`/student` → plural `settings`, admin/dean → singular `setting`). */
export function settingsPathForShell(shellPath) {
  const s = typeof shellPath === "string" ? shellPath.trim() : "";
  if (!s || s === "/") return "/student/settings";
  if (s === "/student") return "/student/settings";
  if (s === "/admin" || s === "/dean") return `${s}/setting`;
  return `${s}/settings`;
}

export function resolveShellBasePath(pathname, primaryRole) {
  const raw = typeof pathname === "string" ? pathname : "";
  const normalized = raw.startsWith("/") ? raw : `/${raw}`;
  const hit = SHELL_PREFIXES.find(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
  if (hit) return hit;
  const r =
    typeof primaryRole === "string" && primaryRole.trim()
      ? primaryRole.trim().toLowerCase()
      : "student";
  return getFacultyDashboardPath(r === "user" ? "student" : r) ?? "/student";
}
