import { unwrapNotificationEnvelope } from "./notificationEnvelope";

function updateNotificationRecord(record, notificationId) {
  if (!record) return record;
  const id = String(record.id ?? record.notificationId ?? "").trim();
  if (id !== String(notificationId).trim()) return record;
  return {
    ...record,
    read: true,
    status: "READ",
  };
}

function updateNotificationCollection(value, notificationId) {
  if (Array.isArray(value)) {
    return value.map((row) => updateNotificationRecord(row, notificationId));
  }
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value.content)) {
    return {
      ...value,
      content: value.content.map((row) =>
        updateNotificationRecord(row, notificationId),
      ),
    };
  }
  return updateNotificationRecord(value, notificationId);
}

function rewrapNotificationEnvelope(original, nextValue) {
  if (!original || typeof original !== "object") return nextValue;
  if (
    Object.prototype.hasOwnProperty.call(original, "json") &&
    original.json &&
    typeof original.json === "object"
  ) {
    return {
      ...original,
      json: rewrapNotificationEnvelope(original.json, nextValue),
    };
  }
  if (
    Object.prototype.hasOwnProperty.call(original, "success") &&
    original.success === true &&
    Object.prototype.hasOwnProperty.call(original, "data")
  ) {
    return {
      ...original,
      data: rewrapNotificationEnvelope(original.data, nextValue),
    };
  }
  return nextValue;
}

export function optimisticallyMarkNotificationRead(
  queryClient,
  userId,
  notificationId,
) {
  const notifId = String(notificationId ?? "").trim();
  const userKey = String(userId ?? "").trim();
  if (!notifId || !userKey) return;

  queryClient.setQueriesData(
    { queryKey: ["notifications", "detail", notifId] },
    (current) => rewrapNotificationEnvelope(
      current,
      updateNotificationCollection(unwrapNotificationEnvelope(current), notifId),
    ),
  );

  queryClient.setQueriesData(
    { queryKey: ["notifications", "user", userKey] },
    (current) => rewrapNotificationEnvelope(
      current,
      updateNotificationCollection(unwrapNotificationEnvelope(current), notifId),
    ),
  );

  queryClient.setQueryData(["notifications", "unread", userKey], (current) => {
    if (typeof current === "number") {
      return Math.max(0, current - 1);
    }
    if (current && typeof current === "object") {
      const count = Number(current.count ?? current.unreadCount ?? current.totalUnread ?? 0);
      const next = Math.max(0, count - 1);
      if (Object.prototype.hasOwnProperty.call(current, "count")) {
        return { ...current, count: next };
      }
      if (Object.prototype.hasOwnProperty.call(current, "unreadCount")) {
        return { ...current, unreadCount: next };
      }
      if (Object.prototype.hasOwnProperty.call(current, "totalUnread")) {
        return { ...current, totalUnread: next };
      }
    }
    return current;
  });
}
