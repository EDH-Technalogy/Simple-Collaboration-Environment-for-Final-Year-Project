import { isValid, parseISO } from "date-fns";
import { unwrapNotificationEnvelope } from "./notificationEnvelope";

export function extractNotificationList(payload) {
  const page = unwrapNotificationEnvelope(payload);
  if (!page) return [];
  if (Array.isArray(page)) return page;
  if (Array.isArray(page.content)) return page.content;
  return [];
}

export function getNotificationRecordId(row) {
  if (!row) return "";
  return String(row.id ?? row.notificationId ?? "");
}

export function isNotificationUnread(row) {
  if (row?.read === true) return false;
  if (row?.read === false) return true;
  const s = String(row?.status ?? "").toUpperCase();
  if (s === "READ" || s === "SENT" || s === "DELIVERED") return false;
  return s === "PENDING" || s === "UNREAD" || !s;
}

export function parseNotificationDate(row) {
  const raw =
    row?.createdAt ??
    row?.created_at ??
    row?.sentAt ??
    row?.timestamp ??
    null;
  if (!raw) return null;
  try {
    if (raw instanceof Date && isValid(raw)) return raw;
    if (typeof raw === "string") {
      const d = parseISO(raw);
      return isValid(d) ? d : null;
    }
    return null;
  } catch {
    return null;
  }
}

export function notificationSubject(row) {
  return (
    row?.subject ??
    row?.title ??
    row?.summary ??
    ""
  );
}

export function notificationBodyPreview(row) {
  const body =
    row?.body ?? row?.message ?? row?.description ?? row?.content ?? "";
  const oneLine = String(body).replace(/\s+/g, " ").trim();
  return oneLine.slice(0, 180);
}

/** Map API notification status to StatusPill variant */
export function notificationStatusVariant(status) {
  const s = String(status ?? "").toUpperCase();
  if (s === "FAILED" || s === "ERROR") return "error";
  if (s === "PENDING" || s === "UNREAD" || s === "QUEUED" || s === "RETRYING")
    return "warning";
  if (s === "PROCESSING") return "info";
  if (s === "SENT" || s === "DELIVERED" || s === "READ") return "success";
  if (s === "SKIPPED") return "neutral";
  return "neutral";
}

/**
 * Personal inbox rows: incoming if addressed to current user id (Keycloak sub or app id).
 */
export function isNotificationIncoming(row, viewerUserKey) {
  const rec = row?.recipientUserId != null ? String(row.recipientUserId).trim() : "";
  const me = viewerUserKey != null ? String(viewerUserKey).trim() : "";
  if (!me || !rec) return true;
  return rec.toLowerCase() === me.toLowerCase();
}
