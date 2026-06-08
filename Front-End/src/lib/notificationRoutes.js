import { resolveShellBasePath } from "./roles";

/**
 * Path to the notifications inbox for the current shell (admin uses singular `/notification`).
 * @param {string} pathname - `location.pathname`
 * @param {string} [userRole] - SPA role from auth (`user.role`)
 * @returns {string|null}
 */
export function notificationsInboxPath(pathname, userRole) {
  const shell = resolveShellBasePath(pathname, userRole);
  if (shell === "/admin") return "/admin/notification";
  return `${shell}/notifications`;
}
