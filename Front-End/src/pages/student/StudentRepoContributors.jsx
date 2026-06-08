import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock,
  Send,
  ShieldCheck,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation, useOutletContext } from "react-router-dom";
import Avatar from "../../components/Avatar";
import Button from "../../components/Button";
import GlobalModal from "../../components/GlobalModal";
import RepoOverviewStatCard from "../../components/repo/RepoOverviewStatCard";
import { REPO_OVERVIEW_STAT_PALETTES } from "../../components/repo/repoOverviewStatPalettes";
import SearchableSelect from "../../components/SearchableSelect";
import SettingsSectionCard from "../../components/SettingsSectionCard";
import { buildPersonInitials, resolveProfilePhotoUrl } from "../../lib/profileMedia";
import { resolveShellBasePath } from "../../lib/roles";
import {
  useSessionProfile,
  useUserSearch,
  useVcInviteRepositoryCollaborator,
  useVcRepositoryInvitations,
  useVcRepository,
} from "../../services/useApi";

function normalizeList(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.content)) return raw.content;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.items)) return raw.items;
  return [];
}

function collaboratorList(rawRepo, fallbackRepo) {
  const source =
    rawRepo?.collaborators ??
    rawRepo?.collaborator ??
    fallbackRepo?.collaborators ??
    fallbackRepo?.Collaborators ??
    [];
  if (Array.isArray(source)) return source;
  if (source && typeof source === "object") return Object.values(source);
  return [];
}

function displayName(entry) {
  if (!entry) return "—";
  if (typeof entry === "string") return entry;
  const full = [
    entry.first_name ?? entry.firstName,
    entry.last_name ?? entry.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
  return (
    full ||
    entry.displayName ||
    entry.username ||
    entry.userName ||
    entry.email ||
    String(entry.id ?? "—")
  );
}

function usernameOf(entry) {
  if (!entry || typeof entry !== "object") return "";
  return String(entry.username ?? entry.userName ?? "").trim();
}

function emailOf(entry) {
  if (!entry || typeof entry !== "object") return "";
  return String(entry.email ?? "").trim();
}

function roleLabel(entry) {
  if (!entry || typeof entry !== "object") return "Collaborator";
  const roles = Array.isArray(entry.roles)
    ? entry.roles
        .map((role) =>
          typeof role === "string"
            ? role
            : role?.name ?? role?.roleName ?? role?.authority ?? "",
        )
        .filter(Boolean)
    : [];
  if (roles.length) return roles[0];
  return entry.contributorRole ?? entry.role ?? entry.status ?? "Collaborator";
}

function formatInviteTime(raw, locale, t) {
  if (!raw) return t("studentRepo.contributors.invitations.justNow");
  const value = new Date(raw);
  if (Number.isNaN(value.getTime())) {
    return t("studentRepo.contributors.invitations.justNow");
  }
  try {
    const time = new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(value);
    return t("studentRepo.contributors.invitations.sentAt", { time });
  } catch {
    return t("studentRepo.contributors.invitations.sentAt", {
      time: value.toISOString(),
    });
  }
}

/** Two-letter initials for invitation labels or emails. */
function inviteDisplayInitials(label) {
  const s = String(label ?? "").trim();
  if (!s) return "?";
  const at = s.indexOf("@");
  const head = at > 0 ? s.slice(0, at) : s;
  const parts = head.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0][0];
    const b = parts[parts.length - 1][0];
    if (a && b) return `${a}${b}`.toUpperCase();
  }
  return head.slice(0, 2).toUpperCase() || "?";
}

function inviteStatusAccent(status) {
  const s = String(status ?? "").toUpperCase();
  if (s === "ACCEPTED")
    return "from-(--color-chart-success)/85 to-teal-600/55 dark:to-teal-500/45";
  if (s === "REJECTED")
    return "from-(--color-chart-error)/80 to-rose-600/55 dark:to-rose-500/45";
  return "from-(--color-chart-warning)/90 to-amber-600/50 dark:to-amber-500/45";
}

function invitationRow(raw) {
  if (!raw || typeof raw !== "object") return null;
  return {
    id: String(raw.id ?? raw.invitationId ?? crypto.randomUUID()),
    invitedUser: String(raw.invited_user ?? raw.invitedUser ?? raw.guest ?? "—"),
    status: String(raw.status ?? "PENDING"),
    createdAt: String(raw.created_at ?? raw.createdAt ?? ""),
    role: String(raw.role ?? "Collaborator"),
  };
}

export default function StudentRepoContributors() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language || undefined;
  const location = useLocation();
  const { owner, repo, repositoryMeta } = useOutletContext() ?? {};
  const shellBase = resolveShellBasePath(location.pathname, undefined);
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteSearchOpen, setInviteSearchOpen] = useState(false);
  const [inviteQuery, setInviteQuery] = useState("");
  const [selectedInvitee, setSelectedInvitee] = useState("");

  const { data: sessionUser } = useSessionProfile({
    notifyOnError: false,
  });
  const { data: fresh } = useVcRepository(owner, repo, {
    notifyOnError: false,
    enabled: Boolean(owner && repo),
    refetchInterval: 15000,
  });
  const invitationsQ = useVcRepositoryInvitations(owner, repo, {
    notifyOnError: false,
    enabled: Boolean(owner && repo),
    refetchInterval: 10000,
  });
  const searchQ = useUserSearch(inviteQuery, {
    notifyOnError: false,
    enabled: inviteOpen && inviteQuery.trim().length > 0,
  });
  const inviteMutation = useVcInviteRepositoryCollaborator({
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["vc", "repos", owner, repo, "invitations"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["vc", "repos", owner, repo],
      });
      setSelectedInvitee("");
      setInviteQuery("");
      setInviteSearchOpen(false);
      setInviteOpen(false);
    },
  });

  const collaborators = useMemo(
    () => collaboratorList(repositoryMeta, fresh),
    [fresh, repositoryMeta],
  );

  const canManage = useMemo(() => {
    const sessionUsername = String(
      sessionUser?.username ?? sessionUser?.preferred_username ?? "",
    ).trim();
    const ownerId = String(
      repositoryMeta?.ownerUserId ?? fresh?.ownerUserId ?? "",
    ).trim();
    const sessionId = String(sessionUser?.id ?? "").trim();
    return Boolean(
      (sessionUsername && owner && sessionUsername === owner) ||
        (ownerId && sessionId && ownerId === sessionId),
    );
  }, [fresh?.ownerUserId, owner, repositoryMeta?.ownerUserId, sessionUser?.id, sessionUser?.preferred_username, sessionUser?.username]);

  const collaboratorCards = useMemo(
    () =>
      collaborators.map((entry, index) => ({
        key: String(entry?.id ?? usernameOf(entry) ?? index),
        name: displayName(entry),
        username: usernameOf(entry),
        email: emailOf(entry),
        role: roleLabel(entry),
        avatarUrl: resolveProfilePhotoUrl(entry),
        initials: buildPersonInitials(entry),
        profilePath: usernameOf(entry)
          ? `${shellBase}/profile/${encodeURIComponent(usernameOf(entry))}`
          : "",
      })),
    [collaborators, shellBase],
  );

  const existingUsernames = useMemo(
    () => new Set(collaboratorCards.map((row) => row.username).filter(Boolean)),
    [collaboratorCards],
  );

  const searchOptions = useMemo(() => {
    return normalizeList(searchQ.data)
      .map((user) => {
        const username = usernameOf(user);
        const id = String(user?.id ?? "").trim();
        const inviteKey = id;
        const email = emailOf(user);
        const label = displayName(user);
        const description = [username ? `@${username}` : "", email]
          .filter(Boolean)
          .join(" • ");
        if (!inviteKey) return null;
        return {
          value: inviteKey,
          label,
          description: description || id,
          username,
          email,
          searchText: [label, username, email, id].filter(Boolean).join(" "),
          avatarUrl: resolveProfilePhotoUrl(user),
          initials: buildPersonInitials(user),
        };
      })
      .filter(Boolean)
      .filter((option) => {
        const sessionId = String(sessionUser?.id ?? "").trim();
        const ownerId = String(
          repositoryMeta?.ownerUserId ?? fresh?.ownerUserId ?? "",
        ).trim();
        return option.value !== sessionId && option.value !== ownerId;
      })
      .filter((option) => !existingUsernames.has(option.username));
  }, [
    existingUsernames,
    fresh?.ownerUserId,
    repositoryMeta?.ownerUserId,
    searchQ.data,
    sessionUser?.id,
  ]);

  const selectedInviteeOption =
    searchOptions.find((option) => option.value === selectedInvitee) ?? null;

  const invitationRows = useMemo(
    () =>
      normalizeList(invitationsQ.data)
        .map(invitationRow)
        .filter(Boolean),
    [invitationsQ.data],
  );

  const invitationPending = useMemo(
    () =>
      invitationRows.filter(
        (row) => String(row.status).toUpperCase() === "PENDING",
      ),
    [invitationRows],
  );

  const invitationResponded = useMemo(
    () =>
      invitationRows.filter(
        (row) => String(row.status).toUpperCase() !== "PENDING",
      ),
    [invitationRows],
  );

  const totalInvites = invitationPending.length;

  async function submitInvite() {
    if (!selectedInvitee || !owner || !repo) return;
    await inviteMutation.mutateAsync({
      owner,
      repo,
      guest: selectedInvitee,
    });
  }

  return (
    <div className="space-y-5">
      <SettingsSectionCard
        title={t("studentRepo.contributors.title")}
        description={t("studentRepo.contributors.subtitle")}
        icon={Users}
        action={
          canManage ? (
            <Button
              type="button"
              icon={<UserPlus className="h-4 w-4" strokeWidth={1.8} />}
              onClick={() => {
                setInviteOpen(true);
                setInviteSearchOpen(true);
              }}
            >
              Invite collaborator
            </Button>
          ) : null
        }
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <RepoOverviewStatCard
            icon={Users}
            label={t("studentRepo.contributors.stats.collaborators")}
            value={collaboratorCards.length}
            palette={REPO_OVERVIEW_STAT_PALETTES[0]}
          />
          <RepoOverviewStatCard
            icon={Clock}
            label={t("studentRepo.contributors.stats.pendingInvites")}
            value={totalInvites}
            palette={REPO_OVERVIEW_STAT_PALETTES[1]}
          />
          <RepoOverviewStatCard
            icon={ShieldCheck}
            label={t("studentRepo.contributors.stats.accessLabel")}
            palette={REPO_OVERVIEW_STAT_PALETTES[2]}
          >
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-(--color-light-input-border) bg-light-app-tertiary px-2.5 py-1.5 text-xs font-medium text-secondary dark:border-dark-input-border dark:bg-dark-app-tertiary dark:text-dark-secondary">
              <ShieldCheck className="size-3.5 shrink-0" strokeWidth={1.8} />
              <span className="min-w-0 truncate">
                {canManage
                  ? t("studentRepo.contributors.stats.accessManage")
                  : t("studentRepo.contributors.stats.accessView")}
              </span>
            </div>
          </RepoOverviewStatCard>
        </div>

        <div className="mt-5 space-y-4">
          {invitationRows.length ? (
            <section className="overflow-hidden rounded-3xl border border-(--color-light-card-border) bg-(--color-light-card-bg) shadow-md dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
              <div className="border-b border-light-divider bg-linear-to-r from-light-app-tertiary to-(--color-light-card-bg) px-5 py-4 dark:border-dark-divider dark:from-dark-app-tertiary dark:to-(--color-dark-card-bg)">
                <p className="text-sm font-semibold text-primary dark:text-dark-primary">
                  {t("studentRepo.contributors.invitations.sectionTitle")}
                </p>
                <p className="mt-1 text-xs text-secondary dark:text-dark-secondary">
                  {t("studentRepo.contributors.invitations.sectionHint")}
                </p>
              </div>
              <div className="space-y-6 p-5">
                {invitationPending.length ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-chart-warning" strokeWidth={1.85} />
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted dark:text-dark-muted">
                        {t("studentRepo.contributors.invitations.pendingTitle")}
                      </p>
                      <span className="rounded-full bg-light-app-tertiary px-2 py-0.5 text-[10px] font-bold text-secondary dark:bg-dark-app-tertiary dark:text-dark-secondary">
                        {invitationPending.length}
                      </span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {invitationPending.map((invite) => (
                        <div
                          key={invite.id}
                          className="relative overflow-hidden rounded-2xl border border-(--color-light-card-border) bg-linear-to-br from-(--color-light-card-bg) to-light-app-tertiary shadow-xs transition-all hover:border-(--color-light-input-border) hover:shadow-sm dark:border-(--color-dark-card-border) dark:from-(--color-dark-card-bg) dark:to-dark-app-tertiary dark:hover:border-(--color-dark-input-border-focus)"
                        >
                          <div
                            className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${inviteStatusAccent(invite.status)}`}
                          />
                          <div className="flex gap-4 p-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) text-sm font-semibold text-(--color-chart-blue-primary) shadow-inner dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-hover) dark:text-(--color-chart-blue-secondary)">
                              {inviteDisplayInitials(invite.invitedUser)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-primary dark:text-dark-primary">
                                {invite.invitedUser}
                              </p>
                              <p className="mt-1 text-[11px] text-muted dark:text-dark-muted">
                                {formatInviteTime(invite.createdAt, locale, t)}
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1 rounded-full border border-chart-warning/35 bg-light-app-tertiary px-2 py-0.5 text-[10px] font-semibold uppercase text-chart-warning dark:bg-dark-app-tertiary">
                                  <Clock className="h-3 w-3" strokeWidth={2} />
                                  {invite.status}
                                </span>
                                <span className="rounded-full border border-(--color-light-card-border) px-2 py-0.5 text-[10px] font-semibold uppercase text-secondary dark:border-(--color-dark-card-border) dark:text-dark-secondary">
                                  {invite.role}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {invitationResponded.length ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2
                        className="h-4 w-4 text-chart-success"
                        strokeWidth={1.85}
                      />
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted dark:text-dark-muted">
                        {t("studentRepo.contributors.invitations.respondedTitle")}
                      </p>
                      <span className="rounded-full bg-light-app-tertiary px-2 py-0.5 text-[10px] font-bold text-secondary dark:bg-dark-app-tertiary dark:text-dark-secondary">
                        {invitationResponded.length}
                      </span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {invitationResponded.map((invite) => {
                        const accepted =
                          String(invite.status).toUpperCase() === "ACCEPTED";
                        const StatusIcon = accepted ? CheckCircle2 : XCircle;
                        return (
                          <div
                            key={invite.id}
                            className="relative overflow-hidden rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) shadow-xs transition-all hover:border-(--color-light-input-border-focus) hover:shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)"
                          >
                            <div
                              className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${inviteStatusAccent(invite.status)}`}
                            />
                            <div className="flex gap-4 p-4">
                              <div
                                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${
                                  accepted
                                    ? "border-chart-success/30 bg-linear-to-br from-emerald-500/15 to-transparent text-chart-success"
                                    : "border-chart-error/30 bg-linear-to-br from-rose-500/12 to-transparent text-chart-error"
                                }`}
                              >
                                <StatusIcon className="h-7 w-7" strokeWidth={1.75} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-primary dark:text-dark-primary">
                                  {invite.invitedUser}
                                </p>
                                <p className="mt-1 text-[11px] text-muted dark:text-dark-muted">
                                  {formatInviteTime(invite.createdAt, locale, t)}
                                </p>
                                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase">
                                  <StatusIcon className="h-3 w-3" strokeWidth={2} />
                                  {invite.status}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>
      </SettingsSectionCard>

      <GlobalModal
        variant="sheet"
        open={inviteOpen}
        setOpen={(open) => {
          if (!open) setInviteSearchOpen(false);
          setInviteOpen(open);
        }}
        title={t("studentRepo.contributors.invite.modalTitle")}
        subtitle={t("studentRepo.contributors.invite.modalSubtitle")}
        isClose
        footer={
          <>
            <Button
              type="button"
              variant="tertiary"
              onClick={() => {
                setInviteSearchOpen(false);
                setInviteOpen(false);
              }}
            >
              {t("studentRepo.contributors.invite.cancel")}
            </Button>
            <Button
              type="button"
              icon={<Send className="h-4 w-4" strokeWidth={1.8} />}
              disabled={!selectedInvitee || inviteMutation.isPending}
              loading={inviteMutation.isPending}
              onClick={submitInvite}
            >
              {t("studentRepo.contributors.invite.send")}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted dark:text-dark-muted">
              {t("studentRepo.contributors.invite.findUser")}
            </p>
            <SearchableSelect
              open={inviteSearchOpen}
              onOpenChange={setInviteSearchOpen}
              value={selectedInvitee}
              onValueChange={setSelectedInvitee}
              closeOnSelect={false}
              options={searchOptions}
              placeholder={t("studentRepo.contributors.invite.placeholder")}
              searchPlaceholder={t(
                "studentRepo.contributors.invite.searchPlaceholder",
              )}
              searchValue={inviteQuery}
              onSearchChange={(nextValue) => {
                setInviteQuery(nextValue);
                if (selectedInvitee) {
                  setSelectedInvitee("");
                }
              }}
              loading={searchQ.isFetching}
              clearable
              clearSearchOnOpen={false}
              className="min-h-8 bg-(--color-light-card-bg) dark:bg-(--color-dark-card-bg)"
              contentClassName="z-[1105]"
              renderOption={(option) => (
                <div className="flex min-w-0 items-start gap-3">
                  <Avatar
                    src={option.avatarUrl}
                    alt={option.label}
                    initials={option.initials}
                    className="rounded-full border border-(--color-light-card-border) dark:border-(--color-dark-card-border)"
                    sizeClass="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-primary dark:text-dark-primary">
                      {option.label}
                    </div>
                    <div className="truncate text-xs text-muted dark:text-dark-muted">
                      {option.username ? `@${option.username}` : option.value}
                    </div>
                    <div className="truncate text-xs text-muted dark:text-dark-muted">
                      {option.email || option.description}
                    </div>
                  </div>
                </div>
              )}
            />
            <p className="mt-2 text-[11px] text-muted dark:text-dark-muted">
              {t("studentRepo.contributors.invite.hint")}
            </p>
          </div>

          <div className="rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary p-4 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted dark:text-dark-muted">
              {t("studentRepo.contributors.invite.previewLabel")}
            </p>
            {selectedInviteeOption ? (
              <div className="mt-3 flex items-start gap-3 rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) px-3 py-3 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
                <Avatar
                  src={selectedInviteeOption.avatarUrl}
                  alt={selectedInviteeOption.label}
                  initials={selectedInviteeOption.initials}
                  className="rounded-full border border-(--color-light-card-border) dark:border-(--color-dark-card-border)"
                  sizeClass="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-primary dark:text-dark-primary">
                    {selectedInviteeOption.label}
                  </p>
                  <p className="mt-1 text-xs text-muted dark:text-dark-muted">
                    {selectedInviteeOption.description || selectedInviteeOption.value}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted dark:text-dark-muted">
                {t("studentRepo.contributors.invite.previewEmpty")}
              </p>
            )}
          </div>
        </div>
      </GlobalModal>
    </div>
  );
}
