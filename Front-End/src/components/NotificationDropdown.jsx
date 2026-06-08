import { useMemo, useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import Dropdown from "./Dropdown";
import Avatar from "./Avatar";
import { useClickOutSide } from "../hooks/useClickOutside";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import {
  useMarkNotificationRead,
  useUserNotifications,
} from "../services/useApi";
import { notificationsInboxPath } from "../lib/notificationRoutes";
import { resolveNotificationRecipientId } from "../lib/notificationRecipientId";
import {
  extractNotificationList,
  getNotificationRecordId,
  isNotificationUnread,
  notificationSubject,
  parseNotificationDate,
} from "../utils/notificationDisplay";
import {
  notificationChannelStripeClass,
  notificationTypePillClasses,
} from "../utils/notificationVisuals";
import { optimisticallyMarkNotificationRead } from "../utils/notificationCache";

const DOT_COLORS = [
  "bg-violet-500",
  "bg-emerald-500",
  "bg-blue-500",
  "bg-amber-500",
  "bg-slate-400",
];

function hashHue(text) {
  const s = String(text ?? "x");
  let h = 0;
  for (let i = 0; i < s.length; i += 1)
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export default function NotificationDropdown({ onClose }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  const ref = useClickOutSide(onClose);
  const { user } = useAuth();
  const userId = resolveNotificationRecipientId(user);

  const [activeTab, setActiveTab] = useState("all");

  const { data: pageData, isLoading } = useUserNotifications(
    userId,
    { page: 0, size: 25 },
    { enabled: Boolean(userId), notifyOnError: false },
  );

  const markReadMutation = useMarkNotificationRead({
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["notifications", "user", userId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["notifications", "unread", userId],
      });
    },
  });

  const notifications = useMemo(() => {
    const rows = extractNotificationList(pageData);
    return rows
      .map((row) => {
        const id = getNotificationRecordId(row);
      const title = notificationSubject(row) || t("notificationDropdown.fallbackTitle");
      const desc =
        row?.body ??
        row?.message ??
        row?.description ??
        "";
      const unread = isNotificationUnread(row);
      const created = parseNotificationDate(row);
      const timeLabel =
        created != null
          ? formatDistanceToNow(created, { addSuffix: true })
          : "";
      const typeKey = String(row?.type ?? "custom")
        .toLowerCase()
        .replace(/-/g, "_");
      const typeShort = i18n.exists(`adminShared.notificationType.${typeKey}`)
        ? t(`adminShared.notificationType.${typeKey}`)
        : String(row?.type ?? "?");
      const initials = String(title || "?")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("")
        .slice(0, 2);
      const colorClass = DOT_COLORS[hashHue(String(id || title)) % DOT_COLORS.length];

      return {
        id,
        title,
        desc,
        unread,
        time: timeLabel,
        avatar: initials || "—",
        color: colorClass,
        typeShort,
        channel: row?.channel != null ? String(row.channel).toUpperCase() : "",
        raw: row,
      };
    })
      .filter((n) => n.id !== "");
  }, [pageData, t, i18n]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.unread).length,
    [notifications],
  );

  const filtered = useMemo(
    () =>
      activeTab === "unread"
        ? notifications.filter((n) => n.unread)
        : notifications,
    [activeTab, notifications],
  );

  const markRead = useCallback(
    (id) => {
      const item = notifications.find(
        (n) => String(n.id) === String(id) && n.unread,
      );
      if (!item) return;
      optimisticallyMarkNotificationRead(queryClient, userId, id);
      markReadMutation.mutate(String(id));
    },
    [markReadMutation, notifications, queryClient, userId],
  );

  const markAllRead = useCallback(() => {
    const pending = notifications.filter((n) => n.unread);
    for (const n of pending) {
      markReadMutation.mutate(String(n.id));
    }
  }, [markReadMutation, notifications]);

  const viewAllPath = useMemo(
    () => notificationsInboxPath(pathname, user?.role),
    [pathname, user?.role],
  );

  return (
    <Dropdown className="w-85 sm:w-95" ref={ref}>
      <div className="flex items-center justify-between border-b border-light-divider px-4 pb-3 pt-4 dark:border-dark-divider">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-primary dark:text-dark-primary">
            {t("notificationDropdown.title")}
          </span>
          {unreadCount > 0 && (
            <span className="inline-flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-accent/15 px-1.5 text-[10px] font-bold leading-none text-accent dark:bg-dark-accent/20 dark:text-dark-accent">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              disabled={markReadMutation.isPending}
              className="text-[11px] font-medium text-accent dark:text-dark-accent hover:underline disabled:opacity-50"
            >
              {t("notificationDropdown.markAllRead")}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label={t("notificationDropdown.close")}
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg text-(--color-light-text-muted) transition-colors hover:bg-(--color-light-nav-hover-bg) dark:text-dark-text-muted dark:hover:bg-(--color-dark-card-hover)"
          >
            <span aria-hidden>×</span>
          </button>
        </div>
      </div>

      <div className="flex gap-1 px-4 py-2.5">
        {["all", "unread"].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-3 py-1 text-xs font-medium capitalize transition-colors ${
              activeTab === tab
                ? "bg-(--color-light-nav-active-bg) text-(--color-light-nav-text-active) dark:bg-(--color-dark-card-hover) dark:text-(--color-dark-timeline-accent)"
                : "text-(--color-light-text-muted) hover:bg-(--color-light-nav-hover-bg) dark:text-dark-text-muted dark:hover:bg-(--color-dark-card-hover)"
            }`}
          >
            {t(`notificationDropdown.tabs.${tab}`)}
            {tab === "unread" && unreadCount > 0 && (
              <span className="ml-1.5 text-[10px]">({unreadCount})</span>
            )}
          </button>
        ))}
      </div>

      <ul className="max-h-80 divide-y divide-light-divider overflow-y-auto scrollbar-thin dark:divide-dark-divider">
        {isLoading ? (
          <li className="py-10 text-center text-xs text-(--color-light-text-muted) dark:text-dark-text-muted">
            {t("notificationDropdown.loading")}
          </li>
        ) : filtered.length === 0 ? (
          <li className="py-10 text-center text-xs text-(--color-light-text-muted) dark:text-dark-text-muted">
            {t("notificationDropdown.empty")}
          </li>
        ) : (
          filtered.map((n) => (
            <li
              key={String(n.id)}
              className={`group flex cursor-pointer gap-3 border-l-4 py-3 ps-3 pe-4 transition-colors hover:bg-(--color-light-nav-hover-bg) dark:hover:bg-(--color-dark-card-hover) ${notificationChannelStripeClass(n.channel)} ${
                n.unread
                  ? "bg-(--color-light-nav-active-bg)/40 dark:bg-[rgba(0,102,255,0.12)]"
                  : ""
              }`}
              onClick={() => {
                markRead(n.id);
                navigate(
                  `${viewAllPath.replace(/\/$/, "")}/${encodeURIComponent(n.id)}`,
                );
                onClose?.();
              }}
            >
              <div className="relative mt-0.5 shrink-0">
                <Avatar
                  initials={n.avatar}
                  colorClass={n.color}
                  size="w-8 h-8"
                />
                {n.unread && (
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-(--color-light-card-bg) bg-(--color-light-timeline-accent) dark:border-(--color-dark-card-bg) dark:bg-(--color-dark-timeline-accent)" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                  <p
                    className={`min-w-0 truncate text-xs font-semibold leading-snug ${
                      n.unread
                        ? "text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)"
                        : "text-(--color-light-text-secondary) dark:text-(--color-dark-text-secondary)"
                    }`}
                  >
                    {n.title}
                  </p>
                  <span
                    className={[
                      "max-w-[9rem] shrink-0 truncate rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none",
                      notificationTypePillClasses(n.raw?.type),
                    ].join(" ")}
                  >
                    {n.typeShort}
                  </span>
                  </div>
                  {n.time ? (
                    <span className="mt-0.5 shrink-0 text-[10px] text-(--color-light-text-muted) dark:text-dark-text-muted">
                      {n.time}
                    </span>
                  ) : null}
                </div>
                {n.desc ? (
                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-(--color-light-text-muted) dark:text-dark-text-muted">
                    {n.desc}
                  </p>
                ) : null}
              </div>
            </li>
          ))
        )}
      </ul>

      <div className="border-t border-light-divider px-4 py-3 dark:border-dark-divider">
        <button
          type="button"
          onClick={() => {
            navigate(viewAllPath);
            onClose?.();
          }}
          className="w-full text-xs font-medium text-accent hover:underline dark:text-dark-accent"
        >
          {t("notificationDropdown.viewAll")}
        </button>
      </div>
    </Dropdown>
  );
}
