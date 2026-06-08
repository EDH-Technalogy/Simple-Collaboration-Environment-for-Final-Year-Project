/**
 * Some gateways/API wrappers return nested shapes, e.g.:
 * { json: { success: true, data: { content: [...], page, … } } }
 */
export function unwrapNotificationEnvelope(data) {
  let v = data;
  for (let i = 0; i < 8; i += 1) {
    if (v == null) return v;
    if (typeof v !== "object") return v;
    if (
      Object.prototype.hasOwnProperty.call(v, "json") &&
      v.json != null &&
      typeof v.json === "object" &&
      !Array.isArray(v.json)
    ) {
      v = v.json;
      continue;
    }
    if (
      Object.prototype.hasOwnProperty.call(v, "success") &&
      v.success === true &&
      Object.prototype.hasOwnProperty.call(v, "data") &&
      v.data !== undefined
    ) {
      v = v.data;
      continue;
    }
    break;
  }
  return v;
}

/** Numeric unread count after gateway wrapping. */
export function extractNotificationUnreadCountPayload(raw) {
  const v = unwrapNotificationEnvelope(raw);
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (v != null && typeof v === "object") {
    const n = Number(
      v.count ?? v.unreadCount ?? v.totalUnread ?? v.total_unread ?? NaN,
    );
    if (!Number.isNaN(n)) return n;
  }
  return 0;
}
