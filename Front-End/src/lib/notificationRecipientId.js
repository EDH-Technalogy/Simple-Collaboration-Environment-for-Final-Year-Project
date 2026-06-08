import { decodeJwtPayload } from "./authSession";
import { getStoredAccessToken } from "../auth/storageBridge";

/**
 * User id segment for notification REST + React Query keys.
 *
 * Backend (Keycloak OAuth2 resource server): WS principal is JWT `sub`, and
 * `convertAndSendToUser(recipientUserId)` must match that same string. Persisted
 * `notifications.recipient_user_id` must use the same id; REST controllers often
 * require `GET …/user/{userId}` to match the authenticated JWT subject.
 *
 * The SPA profile may expose an internal gateway `user.id`; if it differs from
 * Keycloak `sub`, notification calls must still use `sub`.
 */
export function resolveNotificationRecipientId(user) {
  const u = typeof user === "object" && user != null ? user : null;
  const token = getStoredAccessToken();
  const subFromToken =
    typeof token === "string" && token.trim().length > 0
      ? decodeJwtPayload(token)?.sub
      : null;

  const candidates = [
    subFromToken,
    typeof u?.sub === "string" ? u.sub : null,
    u?.oauth_sub ?? u?.oauthSub ?? null,
    u?.keycloak_subject ?? u?.keycloakSubject ?? null,
    u?.external_id ?? u?.externalId ?? null,
    u?.id,
  ];

  for (const c of candidates) {
    const s = c != null ? String(c).trim() : "";
    if (s) return s;
  }
  return "";
}
