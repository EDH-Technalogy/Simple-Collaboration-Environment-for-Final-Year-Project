import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { format, isValid, parseISO } from "date-fns";
import { useAuth } from "../../context/AuthContext";
import {
  useVcAcceptRepositoryInvitation,
  useVcRejectRepositoryInvitation,
  useMarkNotificationRead,
  useNotification,
} from "../../services/useApi";
import Button from "../Button";
import IC from "../IC";
import Icon from "../Icon";
import StatusPill from "../StatusPill";
import {
  isNotificationIncoming,
  isNotificationUnread,
  notificationStatusVariant,
  notificationSubject,
} from "../../utils/notificationDisplay";
import {
  notificationChannelPillClasses,
  notificationTypePillClasses,
} from "../../utils/notificationVisuals";
import { resolveNotificationRecipientId } from "../../lib/notificationRecipientId";
import { optimisticallyMarkNotificationRead } from "../../utils/notificationCache";

function formatDetailDate(raw) {
  if (!raw) return "";
  try {
    const d =
      typeof raw === "string"
        ? parseISO(raw)
        : raw instanceof Date
          ? raw
          : null;
    if (!d || !isValid(d)) return "";
    return format(d, "PPpp");
  } catch {
    return "";
  }
}

function parseNotificationMetadata(raw) {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  if (typeof raw !== "string") return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function resolveShellPrefix(basePath) {
  const raw = typeof basePath === "string" ? basePath.trim() : "";
  if (!raw) return "";
  const normalized = raw.replace(/\/+$/, "");
  const idx = normalized.lastIndexOf("/notifications");
  if (idx <= 0) return "";
  return normalized.slice(0, idx);
}

function resolveActionTarget(metadata, basePath) {
  const uiPath =
    typeof metadata?.uiPath === "string" && metadata.uiPath.trim()
      ? metadata.uiPath.trim()
      : "";
  if (uiPath) {
    if (uiPath.startsWith("/repository/")) {
      const prefix = resolveShellPrefix(basePath);
      return { kind: "ui", value: `${prefix}${uiPath}` };
    }
    return { kind: "ui", value: uiPath };
  }

  const owner =
    typeof metadata?.repositoryOwner === "string"
      ? metadata.repositoryOwner.trim()
      : "";
  const repo =
    typeof metadata?.repositoryName === "string"
      ? metadata.repositoryName.trim()
      : "";
  const taskNumber =
    metadata?.taskNumber != null && String(metadata.taskNumber).trim()
      ? String(metadata.taskNumber).trim()
      : "";
  if (owner && repo && taskNumber) {
    const prefix = resolveShellPrefix(basePath);
    return {
      kind: "ui",
      value: `${prefix}/repository/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/tasks/issue/${encodeURIComponent(taskNumber)}`,
    };
  }

  const absolute =
    typeof metadata?.actionUrl === "string" && metadata.actionUrl.trim()
      ? metadata.actionUrl.trim()
      : typeof metadata?.viewEndpoint === "string" &&
          metadata.viewEndpoint.trim()
        ? metadata.viewEndpoint.trim()
        : "";
  if (!absolute) return null;

  try {
    const parsed = new URL(absolute, window.location.href);
    if (parsed.origin === window.location.origin) {
      return {
        kind: "ui",
        value: `${parsed.pathname}${parsed.search}${parsed.hash}`,
      };
    }
  } catch {
    /* ignore parse failure */
  }
  return { kind: "external", value: absolute };
}

/**
 * Single-message detail for the signed-in user's notification.
 * Redesigned with modern, refined luxury-minimalism aesthetic.
 * @param {string} basePath - inbox path for back navigation (no trailing slash)
 */
export default function UserNotificationDetailScreen({ basePath }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const notificationId = id != null ? String(id).trim() : "";
  const { user } = useAuth();
  const userId = resolveNotificationRecipientId(user);
  const queryClient = useQueryClient();
  const markedRef = useRef(false);
  const [actionMessage, setActionMessage] = useState({
    id: "",
    text: "",
  });

  const { data, isLoading, isError, error } = useNotification(notificationId, {
    enabled: Boolean(notificationId),
    notifyOnError: true,
  });

  const { mutate: markReadMutate } = useMarkNotificationRead({
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

  const acceptInvitation = useVcAcceptRepositoryInvitation({
    onSuccess: async (response) => {
      const nextStatus =
        response?.status ?? response?.data?.status ?? "ACCEPTED";
      setActionMessage({
        id: notificationId,
        text: `Invitation ${String(nextStatus).toLowerCase()}.`,
      });
      await queryClient.invalidateQueries({
        queryKey: ["notifications", "user", userId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["notifications", "unread", userId],
      });
    },
  });

  const rejectInvitation = useVcRejectRepositoryInvitation({
    onSuccess: async (response) => {
      const nextStatus =
        response?.status ?? response?.data?.status ?? "REJECTED";
      setActionMessage({
        id: notificationId,
        text: `Invitation ${String(nextStatus).toLowerCase()}.`,
      });
      await queryClient.invalidateQueries({
        queryKey: ["notifications", "user", userId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["notifications", "unread", userId],
      });
    },
  });

  useEffect(() => {
    markedRef.current = false;
  }, [notificationId]);

  useEffect(() => {
    if (!data || !notificationId || !isNotificationUnread(data)) return;
    if (markedRef.current) return;
    markedRef.current = true;
    optimisticallyMarkNotificationRead(queryClient, userId, notificationId);
    markReadMutate(notificationId);
  }, [data, markReadMutate, notificationId, queryClient, userId]);

  const subject = notificationSubject(data ?? {});
  const body =
    data?.body ?? data?.message ?? data?.content ?? data?.description ?? "";
  const typeKey = String(data?.type ?? "custom")
    .toLowerCase()
    .replace(/-/g, "_");
  const typeLabel = i18n.exists(`adminShared.notificationType.${typeKey}`)
    ? t(`adminShared.notificationType.${typeKey}`)
    : String(data?.type ?? "—");
  const channelRaw =
    data?.channel != null ? String(data.channel).toUpperCase() : "";
  const channelKey = channelRaw.toLowerCase();
  const channelLabel = channelRaw
    ? i18n.exists(`adminShared.notificationChannel.${channelKey}`)
      ? t(`adminShared.notificationChannel.${channelKey}`)
      : channelRaw
    : "";
  const statusKey = String(data?.status ?? "")
    .toLowerCase()
    .replace(/-/g, "_");
  const statusDisplay =
    data?.status && i18n.exists(`adminShared.notificationStatus.${statusKey}`)
      ? t(`adminShared.notificationStatus.${statusKey}`)
      : data?.status != null
        ? String(data.status)
        : "";

  const incoming = isNotificationIncoming(data ?? {}, userId);
  const reference = data?.referenceId ?? data?.reference ?? "";
  const metadata = useMemo(
    () => parseNotificationMetadata(data?.metadata),
    [data?.metadata],
  );
  const actionTarget = useMemo(
    () => resolveActionTarget(metadata, basePath),
    [basePath, metadata],
  );
  const invitationId =
    typeof metadata?.invitationId === "string" ? metadata.invitationId : "";
  const currentActionMessage =
    actionMessage.id === notificationId ? actionMessage.text : "";
  const showInvitationActions =
    String(data?.type ?? "") === "REPOSITORY_INVITATION_SENT" &&
    String(metadata?.actionType ?? "") === "REPOSITORY_INVITATION" &&
    invitationId &&
    userId &&
    !currentActionMessage;

  const sentDisplay = formatDetailDate(
    data?.createdAt ?? data?.sentAt ?? data?.created_at,
  );
  const senderName = metadata?.senderName ?? metadata?.actorName ?? "";
  const receiverName = metadata?.receiverName ?? metadata?.recipientName ?? "";

  const inboxPath = basePath.replace(/\/$/, "");

  if (!notificationId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-white dark:bg-dark-card-bg ">
        <div className="animate-fade-in">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-light-app-tertiary dark:bg-dark-card-bg">
            <Icon
              d={IC.bell}
              className="h-8 w-8 text-light-text-muted dark:text-dark-text-muted"
            />
          </div>
          <p className="text-center text-sm font-medium text-light-text-muted dark:text-dark-text-muted">
            {t("notificationInbox.invalidId")}
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate(inboxPath)}>
          {t("notificationInbox.back")}
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-light-app-bg via-white to-light-app-tertiary p-8 dark:from-dark-app-bg dark:via-dark-shell dark:to-dark-app-tertiary">
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-10 w-10">
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-blue-500 border-r-blue-400 dark:border-t-blue-400 dark:border-r-blue-300" />
          </div>
          <p className="text-sm font-medium text-light-text-muted dark:text-dark-text-muted">
            {t("notificationInbox.loading")}
          </p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 bg-gradient-to-br from-light-app-bg via-white to-light-app-tertiary p-6 dark:from-dark-app-bg dark:via-dark-shell dark:to-dark-app-tertiary">
        <div className="animate-fade-in">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-light-error-bg dark:bg-dark-error-bg">
            <Icon
              d={IC.bell}
              className="h-8 w-8 text-light-error-text dark:text-dark-error-text"
            />
          </div>
          <h2 className="mb-2 text-center text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
            {t("notificationInbox.notFound")}
          </h2>
          <p className="max-w-md text-center text-sm text-light-text-secondary dark:text-dark-text-secondary">
            {error?.message
              ? String(error.message)
              : t("notificationInbox.notFoundHint")}
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate(inboxPath)}>
          {t("notificationInbox.back")}
        </Button>
      </div>
    );
  }

  const channelAccentClass =
    {
      IN_APP: "bg-sky-500",
      EMAIL: "bg-violet-500",
      PUSH: "bg-emerald-500",
      SMS: "bg-amber-500",
    }[channelRaw] || "bg-slate-400";

  const openRelatedItem = () => {
    if (!actionTarget?.value) return;
    if (actionTarget.kind === "ui") {
      navigate(actionTarget.value);
      return;
    }
    window.location.assign(actionTarget.value);
  };

  return (
    <div className="flex w-full flex-col overflow-y-auto bg-light-app-bg p-4 dark:bg-dark-shell md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(inboxPath)}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-default bg-white px-3 py-2 text-xs font-semibold text-secondary transition-colors hover:bg-hover dark:border-dark-default dark:bg-dark-card-bg dark:text-dark-secondary dark:hover:bg-dark-hover"
        >
          <Icon d={IC.chevLeft} className="size-3.5 stroke-[2]" />
          {t("notificationInbox.back")}
        </button>
      </div>

      <div className="mx-auto w-full max-w-5xl">
        <article className="relative overflow-hidden rounded-xl border border-light-card-border bg-white shadow-sm dark:border-dark-card-border dark:bg-dark-card-bg">
          <div className={`absolute left-0 top-0 h-1 w-full ${channelAccentClass}`} />
          <header className="relative px-5 py-6 md:px-7 md:py-8">
            <div className="relative">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span
                  className={[
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
                    notificationTypePillClasses(data?.type),
                  ].join(" ")}
                >
                  <span className="size-1.5 rounded-full bg-current opacity-60" />
                  {typeLabel}
                </span>
                {channelLabel ? (
                  <span
                    className={[
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
                      notificationChannelPillClasses(channelRaw),
                    ].join(" ")}
                  >
                    <span className="size-1.5 rounded-full bg-current opacity-60" />
                    {channelLabel}
                  </span>
                ) : null}
                <span
                  className={[
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
                    incoming
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                      : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
                  ].join(" ")}
                >
                  <span className={`size-1.5 rounded-full ${incoming ? "bg-emerald-500" : "bg-slate-400"}`} />
                  {incoming
                    ? t("notificationInbox.directionToYou")
                    : t("notificationInbox.directionOtherRecipient")}
                </span>
                {data?.status ? (
                  <StatusPill
                    variant={notificationStatusVariant(data.status)}
                    dot={true}
                  >
                    {statusDisplay}
                  </StatusPill>
                ) : null}
              </div>

              <div className="mb-6">
                <p className="mb-2 text-xs font-semibold uppercase text-light-text-muted dark:text-dark-text-muted">
                  {t("notificationInbox.messageLabel")}
                </p>
                <h1 className="text-2xl font-bold leading-tight text-light-text-primary dark:text-dark-text-primary md:text-3xl">
                  {subject || (
                    <span className="text-light-text-muted dark:text-dark-text-muted opacity-50">
                      {t("notificationInbox.noSubject")}
                    </span>
                  )}
                </h1>
              </div>

              {/* Metadata Grid */}
              {(sentDisplay || channelLabel || reference) && (
                <div className="grid gap-4 border-t border-light-card-border pt-6 dark:border-dark-card-border sm:grid-cols-3">
                  {sentDisplay ? (
                    <div>
                      <dt className="mb-1 text-xs font-semibold uppercase text-light-text-muted dark:text-dark-text-muted">
                        {t("notificationInbox.received")}
                      </dt>
                      <dd className="font-medium text-light-text-primary dark:text-dark-text-primary">
                        {sentDisplay}
                      </dd>
                    </div>
                  ) : null}
                  {channelLabel ? (
                    <div>
                      <dt className="mb-1 text-xs font-semibold uppercase text-light-text-muted dark:text-dark-text-muted">
                        {t("notificationInbox.channel")}
                      </dt>
                      <dd className="font-medium text-light-text-primary dark:text-dark-text-primary">
                        {channelLabel}
                      </dd>
                    </div>
                  ) : null}
                  {reference !== "" && reference != null ? (
                    <div className="sm:col-span-1">
                      <dt className="mb-1 text-xs font-semibold uppercase text-light-text-muted dark:text-dark-text-muted">
                        {t("notificationInbox.reference")}
                      </dt>
                      <dd className="font-mono text-xs text-light-text-secondary dark:text-dark-text-secondary break-all">
                        {String(reference)}
                      </dd>
                    </div>
                  ) : null}
                </div>
              )}

              {(senderName || receiverName) && (
                <div className="mt-6 grid gap-4 border-t border-light-card-border pt-6 dark:border-dark-card-border sm:grid-cols-2">
                  {senderName ? (
                    <div>
                      <dt className="mb-1 text-xs font-semibold uppercase tracking-widest text-light-text-muted dark:text-dark-text-muted opacity-70">
                        Sender
                      </dt>
                      <dd className="font-medium text-light-text-primary dark:text-dark-text-primary">
                        {senderName}
                      </dd>
                    </div>
                  ) : null}
                  {receiverName ? (
                    <div>
                      <dt className="mb-1 text-xs font-semibold uppercase tracking-widest text-light-text-muted dark:text-dark-text-muted opacity-70">
                        Receiver
                      </dt>
                      <dd className="font-medium text-light-text-primary dark:text-dark-text-primary">
                        {receiverName}
                      </dd>
                    </div>
                  ) : null}
                </div>
              )}

              {actionTarget ? (
                <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-light-card-border pt-6 dark:border-dark-card-border">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={openRelatedItem}
                  >
                    Open related item
                  </Button>
                </div>
              ) : null}

              {showInvitationActions ? (
                <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-light-card-border pt-6 dark:border-dark-card-border">
                  <Button
                    type="button"
                    loading={acceptInvitation.isPending}
                    disabled={
                      acceptInvitation.isPending || rejectInvitation.isPending
                    }
                    onClick={() =>
                      acceptInvitation.mutate({
                        invitationId,
                        userId,
                      })
                    }
                  >
                    Accept invitation
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    loading={rejectInvitation.isPending}
                    disabled={
                      acceptInvitation.isPending || rejectInvitation.isPending
                    }
                    onClick={() =>
                      rejectInvitation.mutate({
                        invitationId,
                        userId,
                      })
                    }
                  >
                    Decline invitation
                  </Button>
                </div>
              ) : null}
              {currentActionMessage ? (
                <div className="mt-6 rounded-xl border border-(--color-light-success-border) bg-(--color-light-success-bg) px-4 py-3 text-sm text-(--color-light-success-text) dark:border-(--color-dark-success-border) dark:bg-(--color-dark-success-bg) dark:text-(--color-dark-success-text)">
                  {currentActionMessage}
                </div>
              ) : null}
            </div>
          </header>
          <div className="border-t border-light-card-border px-5 py-6 dark:border-dark-card-border md:px-7 md:py-8">
            <p className="mb-3 text-xs font-semibold uppercase text-light-text-muted dark:text-dark-text-muted">
              {t("notificationInbox.body")}
            </p>
            <div className="rounded-lg border border-light-card-border bg-light-app-secondary p-5 text-light-text-primary dark:border-dark-card-border dark:bg-dark-app-secondary dark:text-dark-text-primary">
              <p className="whitespace-pre-wrap text-sm leading-7">
                {body ? (
                  body
                ) : (
                  <span className="text-light-text-muted dark:text-dark-text-muted opacity-50">
                    {t("notificationInbox.noBody")}
                  </span>
                )}
              </p>
            </div>
          </div>
        </article>
      </div>

      {/* Footer Spacing */}
      <div className="mt-8" />
    </div>
  );
}
