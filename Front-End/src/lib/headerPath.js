/**
 * Formats the location pathname as a readable app path segment for the shell header.
 * @param {string} pathname
 * @returns {string}
 */
export function formatHeaderFullPath(pathname) {
  if (!pathname || pathname === "/") return "/";
  const trimmed = pathname.replace(/\/+$/, "") || "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

/**
 * Splits pathname into breadcrumb fragments (decoded, non-empty segments).
 * @param {string} pathname
 * @returns {string[]}
 */
export function splitPathFragments(pathname) {
  const full = formatHeaderFullPath(pathname);
  if (full === "/") return [];
  return full
    .split("/")
    .filter(Boolean)
    .map((seg) => {
      try {
        return decodeURIComponent(seg);
      } catch {
        return seg;
      }
    });
}
