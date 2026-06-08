import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  BadgeCheck,
  Bell,
  Hash,
  Inbox,
  LayoutList,
  MoreHorizontal,
  Search as SearchIcon,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownContent,
  DropdownItem,
  DropdownMenuRoot,
  DropdownTrigger,
} from "../DropdownMenu";
import Field from "../Field";
import IC from "../IC";
import Icon from "../Icon";
import Pagination from "../Pagination";
import StatusPill from "../StatusPill";
import Table from "../Table";
import TableBody from "../TableBody";
import TableColumn from "../TableColumn";
import TableHeader from "../TableHeader";
import TableRow from "../TableRow";
import TableToolbar from "../TableToolbar";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { resolveNotificationRecipientId } from "../../lib/notificationRecipientId";
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
import { useAuth } from "../../context/AuthContext";
import { useDeleteNotification, useUserNotifications } from "../../services/useApi";

export default function AdminNotificationInboxTable({
  basePath = "/admin/notification",
}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = resolveNotificationRecipientId(user);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize]);

  const zeroPage = Math.max(page - 1, 0);
  const {
    data: pagePayload,
    isLoading,
    isError,
    error,
  } = useUserNotifications(
    userId,
    { page: zeroPage, size: pageSize },
    {
      enabled: Boolean(userId),
      notifyOnError: true,
    },
  );
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

  const requestDelete = (row) => {
    const confirmed = window.confirm(
      t("notificationInbox.deleteConfirm", {
        defaultValue: "Delete this notification?",
      }),
    );
    if (!confirmed) return;
    deleteMutation.mutate(String(row.id));
  };

  const rowsRaw = Array.isArray(pagePayload?.content)
    ? pagePayload.content
    : extractNotificationList(pagePayload);

  const totalElements =
    typeof pagePayload?.totalElements === "number"
      ? pagePayload.totalElements
      : rowsRaw.length;
  const serverTotalPages =
    typeof pagePayload?.totalPages === "number"
      ? pagePayload.totalPages
      : Math.max(1, Math.ceil(totalElements / pageSize));

  const locale =
    i18n.language === "ps"
      ? "ps-AF"
      : i18n.language === "prs"
        ? "fa-AF"
        : "en-US";

  const enriched = useMemo(() => {
    return rowsRaw
      .map((row) => {
        const id = getNotificationRecordId(row);
        const subject = notificationSubject(row);
        const preview = notificationBodyPreview(row);
        const typeKey = String(row?.type ?? "custom")
          .toLowerCase()
          .replace(/-/g, "_");
        const typeLabel = i18n.exists(`adminShared.notificationType.${typeKey}`)
          ? t(`adminShared.notificationType.${typeKey}`)
          : String(row?.type ?? "—");
        const channelRaw =
          row?.channel != null ? String(row.channel).toUpperCase() : "";
        const channelKey = channelRaw.toLowerCase();
        const channelLabel = channelRaw
          ? i18n.exists(`adminShared.notificationChannel.${channelKey}`)
            ? t(`adminShared.notificationChannel.${channelKey}`)
            : channelRaw
          : "—";
        return {
          id,
          raw: row,
          subject,
          preview,
          typeLabel,
          typeKey,
          channelRaw,
          channelLabel,
          unread: isNotificationUnread(row),
          incoming: isNotificationIncoming(row, userId),
          status: row?.status,
          when: parseNotificationDate(row),
        };
      })
      .filter((r) => r.id !== "");
  }, [rowsRaw, i18n, t, userId]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return enriched;
    return enriched.filter((x) =>
      [x.subject, x.preview, x.typeLabel, x.channelLabel]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [enriched, debouncedSearch]);

  const headerData = useMemo(
    () => [
      {
        title: "",
        tooltip: t("notificationInbox.messageLabel"),
        icon: (
          <Inbox className="size-3.5 shrink-0 opacity-80" strokeWidth={2} />
        ),
      },
      {
        title: t("adminNotifications.table.subject"),
        tooltip: t("notificationInbox.noSubject"),
        icon: (
          <LayoutList
            className="size-3.5 shrink-0 opacity-90"
            strokeWidth={2}
          />
        ),
      },
      {
        title: t("adminNotifications.table.type"),
        icon: (
          <Hash className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
        ),
      },
      {
        title: t("adminNotifications.table.channel"),
        icon: <Bell className="size-3.5 shrink-0" strokeWidth={2} />,
      },
      {
        title: t("adminNotifications.table.status"),
        tooltip: t("adminShared.filters.allStatus"),
        icon: <BadgeCheck className="size-3.5 shrink-0" strokeWidth={2} />,
      },
      {
        title: t("adminNotifications.table.direction"),
        icon: (
          <Inbox className="size-3.5 shrink-0 opacity-70" strokeWidth={2} />
        ),
      },
      {
        title: t("adminNotifications.table.sent"),
        tooltip: t("notificationInbox.received"),
        icon: (
          <LayoutList
            className="size-3.5 shrink-0 opacity-80"
            strokeWidth={2}
          />
        ),
      },
      {
        title: t("adminStudents.table.actions"),
        align: "center",
        icon: <MoreHorizontal className="size-3.5 shrink-0" strokeWidth={2} />,
      },
    ],
    [t],
  );

  if (!userId) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-5 bg-light-app-bg dark:bg-dark-shell">
        <p className="text-sm text-(--color-light-text-muted) dark:text-dark-text-muted">
          {t("settings.account.needsLogin")}
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 flex-col gap-3.5 bg-light-app-bg p-4 md:p-5 dark:bg-dark-shell">
        <p className="text-sm font-medium text-(--color-light-error-text) dark:text-dark-error-text">
          {t("notificationInbox.loadError")}
        </p>
        <p className="text-xs text-muted dark:text-dark-muted">
          {error?.message ?? ""}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto bg-light-app-bg p-4 md:p-5 dark:bg-dark-card-bg min-h-screen">
      <header>
        <h1 className="text-2xl font-bold text-primary dark:text-dark-primary">
          {t("notificationInbox.title")}
        </h1>
        <p className="mt-1 text-sm text-light-text-secondary dark:text-dark-text-secondary">
          {t("notificationInbox.subtitle")}
        </p>
      </header>

      <div className=" flex gap-y-1 flex-col">
        <Table
          toolbar={
            <TableToolbar>
              <TableToolbar.Row justify="between" className="flex-wrap gap-3">
                <div className="flex min-w-0 flex-1 flex-wrap gap-2 sm:flex-nowrap">
                  <div className="min-w-0 flex-1 sm:max-w-md">
                    <Field
                      id="notifications-search"
                      placeholder={t("notificationInbox.searchPlaceholder")}
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      iconD={IC.search}
                    />
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-(--color-light-card-border) bg-(--color-light-card-bg) px-3 py-1.5 text-[11px] font-semibold text-(--color-light-text-secondary) dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:text-(--color-dark-text-secondary)">
                  <SearchIcon className="size-3.5 opacity-70" strokeWidth={2} />
                  {t("adminNotifications.toolbar.serverPage", {
                    page,
                    pages: Math.max(serverTotalPages, 1),
                  })}
                </span>
              </TableToolbar.Row>
            </TableToolbar>
          }
        >
          <TableHeader headerData={headerData} />
          <TableBody>
            {isLoading ? (
              <TableRow className="table-advanced-tr--empty cursor-default">
                <TableColumn
                  colSpan={headerData.length}
                  className="py-14 text-center text-sm text-muted dark:text-dark-muted"
                >
                  {t("notificationInbox.loading")}
                </TableColumn>
              </TableRow>
            ) : null}

            {!isLoading &&
              filtered.map((row) => (
                <TableRow
                  key={row.id}
                  className={`cursor-pointer border-l-4 ${notificationChannelStripeClass(row.channelRaw)}`}
                  onClick={() =>
                    navigate(
                      `${basePath.replace(/\/$/, "")}/${encodeURIComponent(row.id)}`,
                    )
                  }
                >
                  <TableColumn className="w-2">
                    <span
                      className={`inline-flex size-2 rounded-full ${
                        row.unread
                          ? "bg-(--color-light-timeline-accent) dark:bg-(--color-dark-timeline-accent)"
                          : "bg-(--color-light-text-muted)/30 dark:bg-dark-text-muted/30"
                      }`}
                      aria-hidden
                    />
                  </TableColumn>
                  <TableColumn nowrap={false}>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span
                        className={`line-clamp-1 max-w-xl text-sm ${row.unread ? "font-semibold" : "font-medium"} text-primary dark:text-dark-primary`}
                      >
                        {row.subject || t("notificationInbox.noSubject")}
                      </span>
                      <span className="line-clamp-1 text-xs text-(--color-light-text-muted) dark:text-dark-text-muted">
                        {row.preview}
                      </span>
                    </div>
                  </TableColumn>
                  <TableColumn>
                    <span
                      className={[
                        "inline-flex max-w-52 truncate rounded-full border px-2.5 py-0.5 text-[10px] font-semibold",
                        notificationTypePillClasses(row.raw?.type),
                      ].join(" ")}
                    >
                      {row.typeLabel}
                    </span>
                  </TableColumn>
                  <TableColumn>
                    <span
                      className={[
                        "inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold",
                        notificationChannelPillClasses(row.channelRaw),
                      ].join(" ")}
                    >
                      {row.channelLabel}
                    </span>
                  </TableColumn>
                  <TableColumn>
                    {row.status ? (
                      <StatusPill
                        variant={notificationStatusVariant(row.status)}
                        dot={false}
                        className="text-[10px]"
                      >
                        {i18n.exists(
                          `adminShared.notificationStatus.${String(row.status).toLowerCase()}`,
                        )
                          ? t(
                              `adminShared.notificationStatus.${String(row.status).toLowerCase()}`,
                            )
                          : String(row.status)}
                      </StatusPill>
                    ) : (
                      "—"
                    )}
                  </TableColumn>
                  <TableColumn>
                    <span
                      className={[
                        "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                        row.incoming
                          ? "border-(--color-light-success-border) bg-(--color-light-success-bg) text-(--color-light-success-text) dark:border-(--color-dark-success-border) dark:bg-(--color-dark-success-bg) dark:text-(--color-dark-success-text)"
                          : "border-(--color-light-card-border) bg-(--color-light-app-secondary) text-(--color-light-text-secondary) dark:border-(--color-dark-card-border) dark:bg-(--color-dark-app-secondary) dark:text-(--color-dark-text-secondary)",
                      ].join(" ")}
                    >
                      {row.incoming
                        ? t("notificationInbox.directionToYou")
                        : t("notificationInbox.directionOtherRecipient")}
                    </span>
                  </TableColumn>
                  <TableColumn className="whitespace-nowrap text-xs">
                    {row.when instanceof Date &&
                    !Number.isNaN(row.when.valueOf?.() ?? NaN)
                      ? row.when.toLocaleString(locale)
                      : "—"}
                  </TableColumn>
                  <TableColumn className="text-center">
                    <div
                      role="presentation"
                      className="inline-flex justify-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenuRoot>
                        <DropdownTrigger showArrow={false}>
                          <span className="inline-flex rounded-lg border border-transparent p-1.5 hover:border-(--color-light-input-border) hover:bg-(--color-light-nav-hover-bg) dark:hover:border-(--color-dark-input-border) dark:hover:bg-(--color-dark-card-hover)">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 15 15"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM12.5 8.625C13.1213 8.625 13.625 8.12132 13.625 7.5C13.625 6.87868 13.1213 6.375 12.5 6.375C11.8787 6.375 11.375 6.87868 11.375 7.5C11.375 8.12132 11.8787 8.625 12.5 8.625Z"
                                fill="currentColor"
                              />
                            </svg>
                          </span>
                        </DropdownTrigger>
                        <DropdownContent align="end">
                          <DropdownItem
                            onClick={() =>
                              navigate(
                                `${basePath.replace(/\/$/, "")}/${encodeURIComponent(row.id)}`,
                              )
                            }
                          >
                            {t("adminShared.actions.viewDetails")}
                          </DropdownItem>
                          <DropdownItem
                            variant="danger"
                            icon={<Trash2 className="size-4" strokeWidth={2} />}
                            disabled={deleteMutation.isPending}
                            onClick={() => requestDelete(row)}
                          >
                            {t("adminShared.actions.delete")}
                          </DropdownItem>
                        </DropdownContent>
                      </DropdownMenuRoot>
                    </div>
                  </TableColumn>
                </TableRow>
              ))}

            {!isLoading && filtered.length === 0 ? (
              <TableRow className="table-advanced-tr--empty cursor-default">
                <TableColumn
                  colSpan={headerData.length}
                  nowrap={false}
                  className="py-12 text-center text-muted dark:text-dark-muted"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Icon
                      d={IC.bell}
                      className="mx-auto size-10 text-(--color-light-text-muted) dark:text-dark-text-muted stroke-[1.25]"
                    />
                    <span className="font-medium">
                      {t("notificationInbox.empty")}
                    </span>
                  </div>
                </TableColumn>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
        <Pagination
          currentPage={page}
          totalPages={Math.max(serverTotalPages, 1)}
          totalItems={totalElements}
          pageSize={pageSize}
          onPageChange={(nextPage, nextSize) => {
            if (nextSize !== pageSize) {
              setPageSize(nextSize);
              setPage(1);
              return;
            }
            setPage(nextPage);
          }}
        />
      </div>
    </div>
  );
}
