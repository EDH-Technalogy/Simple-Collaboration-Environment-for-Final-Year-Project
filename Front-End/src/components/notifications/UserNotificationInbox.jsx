import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import {
  useDeleteNotification,
  useMarkNotificationRead,
  useUserNotificationUnreadCount,
  useUserNotifications,
} from "../../services/useApi";
import {
  DropdownContent,
  DropdownItem,
  DropdownMenuRoot,
  DropdownTrigger,
} from "../DropdownMenu";
import Field from "../Field";
import IC from "../IC";
import StatusPill from "../StatusPill";
import {
  extractNotificationList,
  getNotificationRecordId,
  isNotificationIncoming,
  isNotificationUnread,
  notificationBodyPreview,
  notificationStatusVariant,
  notificationSubject,
  parseNotificationDate,
} from "../../utils/notificationDisplay";
import {
  notificationChannelPillClasses,
  notificationChannelStripeClass,
  notificationTypePillClasses,
} from "../../utils/notificationVisuals";
import { resolveNotificationRecipientId } from "../../lib/notificationRecipientId";
import { optimisticallyMarkNotificationRead } from "../../utils/notificationCache";

/**
 * Inbox list for the signed-in user. Navigate to `${basePath}/:id` on row click.
 * @param {string} basePath - e.g. `/admin/notification` (no trailing slash)
 */
export default function UserNotificationInbox({ basePath }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = resolveNotificationRecipientId(user);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const debouncedSearch = useDebouncedValue(search, 300);

  const {
    data: pageData,
    isLoading,
    isError,
  } = useUserNotifications(
    userId,
    { page: 0, size: 100 },
    { enabled: Boolean(userId), notifyOnError: true },
  );

  const { data: unreadRaw } = useUserNotificationUnreadCount(userId, {
    enabled: Boolean(userId),
    notifyOnError: false,
  });
  const markReadMutation = useMarkNotificationRead({
    showErrorToast: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["notifications", "user", userId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["notifications", "unread", userId],
      });
    },
  });
  const deleteMutation = useDeleteNotification({
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["notifications", "user", userId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["notifications", "unread", userId],
      });
    },
  });

  const requestDelete = (event, item) => {
    event.stopPropagation();
    const confirmed = window.confirm(
      t("notificationInbox.deleteConfirm", {
        defaultValue: "Delete this notification?",
      }),
    );
    if (!confirmed) return;
    deleteMutation.mutate(String(item.id));
  };

  const unreadTotal =
    typeof unreadRaw === "number"
      ? unreadRaw
      : unreadRaw && typeof unreadRaw === "object"
        ? Number(unreadRaw.count ?? unreadRaw.unreadCount ?? 0) || 0
        : 0;

  const rows = useMemo(() => {
    const raw = extractNotificationList(pageData);
    return raw
      .map((row) => {
        const id = getNotificationRecordId(row);
        const subject = notificationSubject(row);
        const preview = notificationBodyPreview(row);
        const unread = isNotificationUnread(row);
        const created = parseNotificationDate(row);
        const timeLabel =
          created != null
            ? formatDistanceToNow(created, { addSuffix: true })
            : "";
        const typeKey = String(row?.type ?? "custom")
          .toLowerCase()
          .replace(/-/g, "_");
        const typeLabel = i18n.exists(`adminShared.notificationType.${typeKey}`)
          ? t(`adminShared.notificationType.${typeKey}`)
          : String(row?.type ?? "—");
        const channelRaw =
          row?.channel != null ? String(row.channel).toUpperCase() : "";
        const channelKey = channelRaw.toLowerCase();
        const channelLabel = i18n.exists(
          `adminShared.notificationChannel.${channelKey}`,
        )
          ? t(`adminShared.notificationChannel.${channelKey}`)
          : channelRaw || "—";
        const incoming = isNotificationIncoming(row, userId);
        return {
          id,
          subject,
          preview,
          unread,
          timeLabel,
          typeLabel,
          typeKey,
          channelRaw,
          channelLabel,
          incoming,
          status: row?.status,
          raw: row,
        };
      })
      .filter((r) => r.id !== "");
  }, [pageData, i18n, t, userId]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "unread" && !r.unread) return false;
      if (!q) return true;
      const hay = [r.subject, r.preview, r.typeLabel].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [rows, debouncedSearch, filter]);

  const filterTabs = [
    { id: "all", label: t("notificationInbox.filterAll") },
    { id: "unread", label: t("notificationInbox.filterUnread") },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto bg-white p-4 md:p-5 dark:bg-dark-app-secondary">
      <header className="flex flex-col gap-1 border-b border-light-divider pb-4 dark:border-dark-divider sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary dark:text-dark-primary md:text-2xl">
            {t("notificationInbox.title")}
          </h1>
          <p className="mt-1 text-sm text-light-text-secondary dark:text-(--color-dark-text-secondary)">
            {t("notificationInbox.subtitle")}
          </p>
          <p className="mt-1 text-[11px] font-medium text-(--color-light-text-muted) dark:text-dark-text-muted">
            {t("notificationInbox.unreadSummary", { count: unreadTotal })}
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 sm:max-w-md">
          <Field
            id="inbox-search"
            placeholder={t("notificationInbox.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            iconD={IC.search}
          />
        </div>
        <div className="flex shrink-0 gap-1 rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-1 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={[
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                filter === tab.id
                  ? "bg-(--color-light-nav-active-bg) text-(--color-light-nav-text-active) dark:bg-(--color-dark-card-hover) dark:text-(--color-dark-timeline-accent)"
                  : "text-(--color-light-text-muted) hover:bg-(--color-light-nav-hover-bg) dark:text-dark-text-muted dark:hover:bg-(--color-dark-card-hover)",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {isError ? (
        <div className="rounded-xl border border-(--color-light-error-border) bg-(--color-light-error-bg)/40 px-4 py-8 text-center text-sm text-(--color-light-error-text) dark:border-dark-error-border dark:bg-dark-error-bg/20 dark:text-dark-error-text">
          {t("notificationInbox.loadError")}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:shadow-black/20">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-16 text-sm text-(--color-light-text-muted) dark:text-dark-text-muted">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {t("notificationInbox.loading")}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-16 text-center text-sm text-(--color-light-text-muted) dark:text-dark-text-muted">
            {t("notificationInbox.empty")}
          </div>
        ) : (
          <ul className="divide-y divide-light-divider dark:divide-dark-divider">
            {filtered.map((item) => (
              <li key={item.id}>
                <div
                  onClick={() => {
                    if (item.unread) {
                      optimisticallyMarkNotificationRead(queryClient, userId, item.id);
                      markReadMutation.mutate(String(item.id));
                    }
                    navigate(
                      `${basePath.replace(/\/$/, "")}/${encodeURIComponent(item.id)}`,
                    );
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      event.currentTarget.click();
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className={[
                    "flex w-full cursor-pointer gap-3 border-l-4 py-3 ps-3 pe-4 text-left transition-colors md:ps-4",
                    notificationChannelStripeClass(item.channelRaw),
                    "hover:bg-(--color-light-nav-hover-bg) dark:hover:bg-(--color-dark-card-hover)",
                    item.unread
                      ? "bg-(--color-light-nav-active-bg)/35 dark:bg-[rgba(0,102,255,0.08)]"
                      : "",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      item.unread
                        ? "bg-(--color-light-timeline-accent) dark:bg-(--color-dark-timeline-accent)"
                        : "bg-(--color-light-text-muted)/35 dark:bg-dark-text-muted/35",
                    ].join(" ")}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={[
                          "truncate text-sm",
                          item.unread
                            ? "font-semibold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)"
                            : "font-medium text-(--color-light-text-secondary) dark:text-(--color-dark-text-secondary)",
                        ].join(" ")}
                      >
                        {item.subject || t("notificationInbox.noSubject")}
                      </span>
                      <span
                        className={[
                          "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                          notificationTypePillClasses(item.raw?.type),
                        ].join(" ")}
                      >
                        {item.typeLabel}
                      </span>
                      <span
                        className={[
                          "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                          notificationChannelPillClasses(item.channelRaw),
                        ].join(" ")}
                      >
                        {item.channelLabel}
                      </span>
                      <span
                        className={[
                          "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                          item.incoming
                            ? "border-(--color-light-success-border) bg-(--color-light-success-bg) text-(--color-light-success-text) dark:border-(--color-dark-success-border) dark:bg-(--color-dark-success-bg) dark:text-(--color-dark-success-text)"
                            : "border-(--color-light-card-border) bg-(--color-light-app-secondary) text-(--color-light-text-secondary) dark:border-(--color-dark-card-border) dark:bg-(--color-dark-app-secondary) dark:text-(--color-dark-text-secondary)",
                        ].join(" ")}
                      >
                        {item.incoming
                          ? t("notificationInbox.directionToYou")
                          : t("notificationInbox.directionOtherRecipient")}
                      </span>
                      {item.status ? (
                        <StatusPill
                          variant={notificationStatusVariant(item.status)}
                          dot={false}
                          className="text-[10px]"
                        >
                          {i18n.exists(
                            `adminShared.notificationStatus.${String(item.status).toLowerCase()}`,
                          )
                            ? t(
                                `adminShared.notificationStatus.${String(item.status).toLowerCase()}`,
                              )
                            : String(item.status)}
                        </StatusPill>
                      ) : null}
                    </div>
                    {item.preview ? (
                      <p className="mt-0.5 line-clamp-2 text-xs text-(--color-light-text-muted) dark:text-dark-text-muted">
                        {item.preview}
                      </p>
                    ) : null}
                    {item.timeLabel ? (
                      <p className="mt-1 text-[10px] text-(--color-light-text-muted) dark:text-dark-text-muted">
                        {item.timeLabel}
                      </p>
                    ) : null}
                  </div>
                  <div
                    role="presentation"
                    className="ms-2 flex shrink-0 items-start pt-1"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <DropdownMenuRoot>
                      <DropdownTrigger
                        showArrow={false}
                        aria-label={t("adminStudents.table.actions")}
                        className="size-8 rounded-lg"
                      >
                        <MoreHorizontal className="size-4" strokeWidth={2} />
                      </DropdownTrigger>
                      <DropdownContent align="end">
                        <DropdownItem
                          variant="danger"
                          icon={<Trash2 className="size-4" strokeWidth={2} />}
                          disabled={deleteMutation.isPending}
                          onClick={(event) => requestDelete(event, item)}
                        >
                          {t("adminShared.actions.delete")}
                        </DropdownItem>
                      </DropdownContent>
                    </DropdownMenuRoot>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
