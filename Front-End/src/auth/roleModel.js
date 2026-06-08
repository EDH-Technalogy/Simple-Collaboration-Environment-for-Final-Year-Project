/** Primary shell when multiple facets exist (dean→admin, staff→teacher at token layer). */
const FACET_PRIORITY = ["admin", "teacher", "student", "author", "user"];

const IGNORE_REALM = new Set(
  ["OFFLINE_ACCESS", "UMA_AUTHORIZATION"].map((s) => s.toUpperCase()),
);

function isDefaultRolesComposite(role) {
  return /^DEFAULT-ROLES-/i.test(role);
}

/**
 * Probe keys derived from one realm/API role label, e.g. `ADMIN_USER` → `ADMIN_USER` + `ADMIN`;
 * `faculty-user` → `FACULTY-USER` + `FACULTY`.
 */
export function realmRoleMatchTokens(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return [];
  const full = s.toUpperCase();
  const head = (full.split(/[-_]+/, 2)[0] ?? "").trim();
  return [...new Set([full, head].filter(Boolean))];
}

function matchFacetFromToken(upper) {
  if (!upper) return null;
  if (upper === "USER") return "user";
  if (
    upper === "ADMIN" ||
    upper === "SUPER_ADMIN" ||
    upper === "ADMIN_USER"
  ) {
    return "admin";
  }
  if (
    upper === "TEACHER" ||
    upper === "FACULTY_USER" ||
    upper === "FACULTY" ||
    upper === "FACULTY-USER"
  ) {
    return "teacher";
  }
  if (upper === "STUDENT") return "student";
  if (
    upper === "EMPLOYEE" ||
    upper === "STAFF" ||
    upper === "HR" ||
    upper === "FACULTY_STAFF"
  ) {
    return "teacher";
  }
  if (upper === "DEAN") return "admin";
  if (
    upper === "AUTHOR" ||
    upper === "AUTHOR_USER" ||
    upper === "BLOG_AUTHOR" ||
    upper === "CONTENT_AUTHOR" ||
    upper === "BLOG_WRITER"
  ) {
    return "author";
  }
  return null;
}

export function collectFacetsFromRawRoles(rawStrings) {
  const facets = new Set();
  for (const raw of rawStrings) {
    const s = String(raw ?? "").trim();
    if (!s) continue;
    if (IGNORE_REALM.has(s.toUpperCase()) || isDefaultRolesComposite(s)) continue;

    for (const token of realmRoleMatchTokens(s)) {
      const f = matchFacetFromToken(token);
      if (f) facets.add(f);
    }
  }

  if (facets.size === 0) {
    facets.add("student");
    facets.add("user");
  }

  return FACET_PRIORITY.filter((f) => facets.has(f));
}

export function pickPrimaryFacet(sorted) {
  return sorted[0] ?? "student";
}

export function normalizeFacetKey(input) {
  const v = input.trim().toLowerCase();
  const map = {
    admin: "admin",
    teacher: "teacher",
    student: "student",
    staff: "teacher",
    employee: "teacher",
    dean: "admin",
    author: "author",
    user: "user",
  };
  return map[v] ?? null;
}

export function finalizeAuthProfile(baseUser, tokenParsed) {
  const apiLike = baseUser;

  const list = [];

  const ur = apiLike?.roles ?? apiLike?.role;
  if (Array.isArray(ur))
    ur.forEach((x) => list.push(String(x)));
  else if (typeof ur === "string" && ur) list.push(ur);

  const ra = tokenParsed?.realm_access;
  const realmRoles =
    ra && typeof ra === "object" && Array.isArray(ra.roles) ? ra.roles : [];
  realmRoles.forEach((r) => list.push(String(r)));

  const res = tokenParsed?.resource_access;
  if (res && typeof res === "object") {
    for (const v of Object.values(res)) {
      if (v && typeof v === "object" && Array.isArray(v.roles)) {
        v.roles.forEach((role) => list.push(role));
      }
    }
  }

  const interim =
    typeof apiLike?.user_type === "string" ? apiLike.user_type : "";
  if (interim) list.push(interim);

  const explicitRole = typeof apiLike?.role === "string" ? apiLike.role : "";
  if (explicitRole && !Array.isArray(apiLike.roles)) list.push(explicitRole);

  let normalizedRoles = collectFacetsFromRawRoles(list);
  if (!normalizedRoles.length) {
    normalizedRoles = ["student", "user"];
  }
  const role = pickPrimaryFacet(normalizedRoles);

  return {
    ...baseUser,
    normalizedRoles,
    role,
  };
}
