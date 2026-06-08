import { createElement, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useParams } from "react-router-dom";
import { Clock, Eye, GitBranch, Globe, MapPin, Star } from "lucide-react";
import Avatar from "../../components/Avatar";
import Button from "../../components/Button";
import ContributionHeatmap from "../../components/repo/ContributionHeatmap";
import { useAuth } from "../../context/AuthContext";
import { resolveShellBasePath, settingsPathForShell } from "../../lib/roles";
import useActivityHeatmap from "../../hooks/useActivityHeatmap";
import {
  useFacultyProjectsByStudent,
  useFacultyProjectsByTeacher,
  useLinkedStudentRecord,
  useLinkedTeacherRecord,
  useVcAccessibleRepositoriesForViewer,
  useUserByUsername,
  useVcUserActivity,
} from "../../services/useApi";
import {
  buildPersonInitials,
  resolveProfilePhotoUrl,
} from "../../lib/profileMedia";
import { bucketVcActivityEvents } from "../../utils/vcActivityBuckets";
const SURFACE_CARD =
  "rounded-md border border-(--color-light-card-border) bg-(--color-light-card-bg)  dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)";
const SOFT_PANEL =
  "rounded-md border border-(--color-light-card-border) bg-light-app-tertiary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary";

function displayOrDash(value, fallback = "—") {
  if (value == null) return fallback;
  const text = String(value).trim();
  return text ? text : fallback;
}

function normalizeListPayload(payload, ...keys) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  for (const key of keys) {
    if (Array.isArray(payload[key])) return payload[key];
  }
  if (Array.isArray(payload.content)) return payload.content;
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data && typeof payload.data === "object") {
    const nested = normalizeListPayload(payload.data, ...keys);
    if (nested.length) return nested;
  }
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.results)) return payload.results;
  return [];
}

function formatDate(value, locale) {
  if (!value) return "";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  } catch {
    return String(value);
  }
}

function formatMonthYear(value, locale) {
  try {
    return new Intl.DateTimeFormat(locale, {
      month: "long",
      year: "numeric",
    }).format(value);
  } catch {
    return "";
  }
}

function formatStatus(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  return raw
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function repoName(repo, fallback) {
  return (
    repo?.name ||
    repo?.repositoryName ||
    repo?.repoName ||
    repo?.full_name ||
    repo?.fullName ||
    fallback
  );
}

function normalizeRepoKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "");
}

function addRepoKey(set, value) {
  const key = normalizeRepoKey(value);
  if (!key) return;
  set.add(key);
  const parts = key.split("/").filter(Boolean);
  if (parts.length > 1) set.add(parts[parts.length - 1]);
}

function activityEvent(event) {
  if (!event || typeof event !== "object") return event;
  const nested = event.json ?? event.payload ?? event.data;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return { ...event, ...nested };
  }
  if (typeof nested === "string") {
    try {
      const parsed = JSON.parse(nested);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return { ...event, ...parsed };
      }
    } catch {
      return event;
    }
  }
  return event;
}

function repoKeysFromRepository(repo) {
  const keys = new Set();
  if (!repo || typeof repo !== "object") return keys;
  const owner =
    repo.ownerUsername ??
    repo.owner_username ??
    repo.owner?.username ??
    repo.owner?.login ??
    repo.owner ??
    "";
  const name =
    repo.name ??
    repo.repositoryName ??
    repo.repository_name ??
    repo.repoName ??
    repo.repo_name ??
    "";
  addRepoKey(keys, repo.full_name ?? repo.fullName);
  addRepoKey(keys, name);
  if (owner && name) addRepoKey(keys, `${owner}/${name}`);
  return keys;
}

function repoKeysFromActivity(event) {
  const ev = activityEvent(event);
  const keys = new Set();
  if (!ev || typeof ev !== "object") return keys;
  const repo =
    ev.repo ?? ev.repository ?? ev.repositoryName ?? ev.repository_name;
  if (typeof repo === "string") addRepoKey(keys, repo);
  if (repo && typeof repo === "object") {
    for (const key of repoKeysFromRepository(repo)) keys.add(key);
  }
  const owner =
    ev.ownerUsername ??
    ev.owner_username ??
    ev.repoOwnerUsername ??
    ev.repo_owner_username ??
    ev.repoOwner ??
    ev.ownerName ??
    ev.owner ??
    "";
  const name =
    ev.repoName ??
    ev.repo_name ??
    ev.repositoryName ??
    ev.repository_name ??
    "";
  addRepoKey(keys, name);
  if (owner && name) addRepoKey(keys, `${owner}/${name}`);

  const urlText = String(
    ev.repositoryUrl ?? ev.repository_url ?? ev.pullRequestUrl ?? "",
  );
  const match = urlText.match(/\/repos\/([^/?#]+)\/([^/?#]+)/i);
  if (match) {
    addRepoKey(
      keys,
      `${decodeURIComponent(match[1])}/${decodeURIComponent(match[2])}`,
    );
  }
  return keys;
}

function hasRepositorySignal(event) {
  return repoKeysFromActivity(event).size > 0;
}

function repoVisibility(repo, t) {
  const raw = String(repo?.visibility ?? "").trim().toLowerCase();
  if (repo?.private || raw === "private") {
    return t("studentSelfProfile.visibility.private");
  }
  if (raw === "academic") return t("studentSelfProfile.visibility.academic");
  return t("studentSelfProfile.visibility.public");
}

function StatPill({ value, label }) {
  return (
    <div className="min-w-0 text-center">
      <div className="text-lg font-bold text-primary dark:text-dark-primary">
        {value}
      </div>
      <div className="text-xs text-secondary dark:text-dark-secondary">
        {label}
      </div>
    </div>
  );
}

function InfoRow({ icon: IconComponent, label, value, href = "" }) {
  const content = href ? (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className="break-all text-sm font-medium text-(--color-chart-blue-primary) transition-colors hover:underline dark:text-(--color-chart-blue-secondary)"
    >
      {value}
    </a>
  ) : (
    <p className="break-words text-sm font-medium text-primary dark:text-dark-primary">
      {value}
    </p>
  );

  return (
    <div className="flex min-w-0 items-start gap-3">
      {createElement(IconComponent, {
        className: "mt-0.5 size-4 shrink-0 text-muted dark:text-dark-muted",
        strokeWidth: 1.9,
        "aria-hidden": true,
      })}
      <div className="min-w-0">
        <p className="text-xs text-secondary dark:text-dark-secondary">
          {label}
        </p>
        <div className="mt-1 min-w-0">{content}</div>
      </div>
    </div>
  );
}

export default function Profile() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { username: routeUsername } = useParams();
  const locationCtx = useLocation();
  const [showMore, setShowMore] = useState(false);
  const shellBase = resolveShellBasePath(locationCtx.pathname, user?.role);
  const requestedUsername = String(routeUsername ?? "").trim();
  const selfUsername = String(user?.username ?? user?.user_name ?? "").trim();
  const isSelfProfile = !requestedUsername || requestedUsername === selfUsername;
  const { data: routedUser, isLoading: routedUserLoading } = useUserByUsername(
    requestedUsername,
    {
      enabled: Boolean(requestedUsername),
      notifyOnError: false,
    },
  );
  const profileUser = useMemo(
    () => (isSelfProfile ? user : (routedUser ?? {})),
    [isSelfProfile, routedUser, user],
  );
  const profileUserReady = isSelfProfile ? Boolean(user) : Boolean(routedUser);
  const role = String(
    profileUser?.role ?? profileUser?.user_type ?? user?.role ?? "",
  )
    .trim()
    .toLowerCase();
  const {
    data: student,
    isLoading,
    isError,
  } = useLinkedStudentRecord(profileUser, {
    notifyOnError: false,
    enabled: profileUserReady && role !== "teacher",
  });
  const { data: teacher, isLoading: teacherLoading } = useLinkedTeacherRecord(
    profileUser,
    {
      notifyOnError: false,
      enabled: profileUserReady && role === "teacher",
    },
  );

  const personRecord = role === "teacher" ? teacher : student;
  const hasLinkedRecord = Boolean(personRecord?.id);
  const showUnlinkedNotice =
    isSelfProfile &&
    !isLoading &&
    !teacherLoading &&
    (isError || !hasLinkedRecord);
  const locale = i18n.language || undefined;

  const labelName =
    profileUser?.fullName ||
    [personRecord?.firstName, personRecord?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    [profileUser?.first_name, profileUser?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    profileUser?.username ||
    profileUser?.user_name ||
    profileUser?.email ||
    t("studentProfile.na");

  const username = displayOrDash(
    personRecord?.username || profileUser?.username || profileUser?.user_name,
    t("studentProfile.na"),
  );
  const photoUrl = useMemo(
    () => resolveProfilePhotoUrl(personRecord ?? profileUser ?? {}),
    [personRecord, profileUser],
  );
  const initials = useMemo(
    () =>
      buildPersonInitials(personRecord ?? profileUser ?? {}, profileUser?.email),
    [personRecord, profileUser],
  );

  const ownerKey = String(
    personRecord?.linkedApplicationUserId ??
      personRecord?.applicationUserId ??
      personRecord?.gatewayUserId ??
      profileUser?.id ??
      "",
  ).trim();
  const vcUsernameCandidates = useMemo(
    () => [
      profileUser?.username,
      profileUser?.user_name,
      profileUser?.preferred_username,
      profileUser?.preferredUsername,
      requestedUsername,
      personRecord?.username,
      personRecord?.userName,
      personRecord?.user_name,
    ],
    [personRecord, profileUser, requestedUsername],
  );
  const vcUsername = String(
    vcUsernameCandidates.find((value) => String(value ?? "").trim()) ?? "",
  ).trim();
  const { data: reposPayload } = useVcAccessibleRepositoriesForViewer(ownerKey, {
    enabled: Boolean(ownerKey || vcUsername),
    notifyOnError: false,
    activityUsernameFallback: vcUsername || undefined,
  });
  const repositories = useMemo(
    () => normalizeListPayload(reposPayload, "repositories", "repos"),
    [reposPayload],
  );
  const joinedDate =
    formatDate(profileUser?.createdAt || profileUser?.created_at, locale) ||
    t("studentProfile.na");
  const personLocation = [
    personRecord?.addressCity,
    personRecord?.addressProvince,
  ]
    .map((item) => String(item ?? "").trim())
    .filter(Boolean)
    .join(", ");
  const statusLabel =
    formatStatus(personRecord?.status) || t("studentProfile.na");
  const semesterLabel =
    personRecord?.semesterDetails?.name ||
    personRecord?.semesterDetails?.code ||
    (personRecord?.semester
      ? t(`studentForm.options.semester${personRecord.semester}`)
      : t("studentProfile.na"));
  const headline = [
    personRecord?.department,
    role !== "teacher" && semesterLabel !== t("studentProfile.na")
      ? semesterLabel
      : "",
    role === "teacher" ? t("adminShared.roles.teacher") : "",
  ]
    .filter(Boolean)
    .join(" • ");
  const { data: rawActivityPayload } = useVcUserActivity(vcUsernameCandidates, {
    enabled: vcUsernameCandidates.some((value) =>
      Boolean(String(value ?? "").trim()),
    ),
    notifyOnError: false,
  });
  const rawActivity = useMemo(
    () => normalizeListPayload(rawActivityPayload, "activities", "events"),
    [rawActivityPayload],
  );
  const accessibleRepoKeys = useMemo(() => {
    const keys = new Set();
    for (const repo of repositories) {
      for (const key of repoKeysFromRepository(repo)) keys.add(key);
    }
    return keys;
  }, [repositories]);
  const repositoryActivity = useMemo(() => {
    const repoEvents = rawActivity.filter(hasRepositorySignal);
    if (!accessibleRepoKeys.size) return repoEvents;
    const matched = repoEvents.filter((event) => {
      const eventKeys = repoKeysFromActivity(event);
      for (const key of eventKeys) {
        if (accessibleRepoKeys.has(key)) return true;
      }
      return false;
    });
    return matched.length ? matched : repoEvents;
  }, [accessibleRepoKeys, rawActivity]);

  const { data: facultyProjects = [] } = useFacultyProjectsByStudent(
    student?.id,
    {
      enabled: Boolean(student?.id) && role !== "teacher",
      notifyOnError: false,
    },
  );
  const { data: teacherProjects = [] } = useFacultyProjectsByTeacher(
    teacher?.id,
    {
      enabled: Boolean(teacher?.id) && role === "teacher",
      notifyOnError: false,
    },
  );
  const profileProjects = role === "teacher" ? teacherProjects : facultyProjects;

  const buckets = useMemo(
    () => bucketVcActivityEvents(repositoryActivity),
    [repositoryActivity],
  );
  const heatmap = useActivityHeatmap(repositoryActivity);
  const totalContributions = heatmap.total;

  const visibilityColor = (repo) => {
    const raw = String(repo?.visibility ?? "").trim().toLowerCase();
    if (repo?.private || raw === "private") {
      return "bg-red-50 text-red-700 border-red-200";
    }
    return "bg-green-50 text-green-700 border-green-200";
  };

  const languageColor = (language) => {
    const colors = {
      TypeScript: { dot: "#3178c6", label: "TypeScript" },
      JavaScript: { dot: "#f7df1e", label: "JavaScript" },
      Python: { dot: "#3776ab", label: "Python" },
      Markdown: { dot: "#083fa1", label: "Markdown" },
    };
    return colors[language] || { dot: "#858585", label: language };
  };

  const pinnedItems = useMemo(() => {
    if (repositories.length > 0) {
      return repositories.slice(0, 2).map((repo, index) => ({
        key: String(repo?.id ?? repo?.name ?? index),
        name:
          repo?.name ||
          repo?.repoName ||
          repo?.full_name ||
          repo?.fullName ||
          t("studentSelfProfile.pinned.repositoryFallback", {
            count: index + 1,
          }),
        visibility: repo?.private
          ? t("studentSelfProfile.visibility.private")
          : t("studentSelfProfile.visibility.public"),
        desc:
          repo?.description ||
          t("studentSelfProfile.pinned.repositoryDescriptionFallback"),
        stars: Number(
          repo?.stars ?? repo?.stargazers_count ?? repo?.stargazersCount ?? 0,
        ),
      }));
    }

    return profileProjects.slice(0, 2).map((project, index) => ({
      key: String(project?.id ?? index),
      name:
        project?.title ||
        project?.name ||
        project?.topic ||
        t("studentSelfProfile.pinned.projectFallback", { count: index + 1 }),
      visibility: t("studentSelfProfile.visibility.academic"),
      desc:
        project?.description ||
        project?.department?.name ||
        project?.departmentName ||
        t("studentSelfProfile.pinned.projectDescriptionFallback"),
      stars: 0,
    }));
  }, [profileProjects, repositories, t]);

  const allContributionRows = useMemo(
    () =>
      [
        ...buckets.pushes,
        ...buckets.pulls,
        ...buckets.merges,
        ...buckets.other,
      ].sort(
        (a, b) => (b.at || 0) - (a.at || 0),
      ),
    [buckets],
  );

  const contributionRows = useMemo(
    () =>
      showMore
        ? allContributionRows.slice(0, 8)
        : allContributionRows.slice(0, 4),
    [allContributionRows, showMore],
  );

  const leftBadges = [
    student?.department,
    semesterLabel !== t("studentProfile.na") ? semesterLabel : "",
    statusLabel !== t("studentProfile.na") ? statusLabel : "",
  ].filter(Boolean);

  if (isLoading || teacherLoading || routedUserLoading) {
    return (
      <div className="relative flex-1 bg-light-app-bg p-4 pb-8 dark:bg-dark-card-bg md:p-5">
        <div
          className={`${SURFACE_CARD} mx-auto max-w-7xl p-6 text-sm text-secondary dark:text-dark-secondary`}
        >
          {t("studentProfile.loading")}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 bg-white p-4 pb-8 dark:bg-dark-card-bg md:p-5">
      <div className="mx-auto w-full max-w-7xl min-w-0 space-y-5">
        {showUnlinkedNotice ? (
          <section className="rounded-[1.25rem] border border-(--color-light-warning-border) bg-(--color-light-warning-bg) px-4 py-3 text-sm text-(--color-light-warning-text) dark:border-(--color-dark-warning-border) dark:bg-(--color-dark-warning-bg) dark:text-(--color-dark-warning-text)">
            {t("studentSelfProfile.unlinkedNotice")}
          </section>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[20rem_minmax(0,1fr)]">
          <aside className="min-w-0">
            <div className={`${SURFACE_CARD} min-w-0 p-5 md:p-6`}>
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6 h-32 w-32 overflow-hidden rounded-full border-4 border-(--color-light-card-border) dark:border-(--color-dark-card-border)">
                  <Avatar
                    src={photoUrl}
                    alt={labelName}
                    initials={initials}
                    sizeClass="flex h-32 w-32 items-center justify-center rounded-full text-3xl"
                  />
                </div>

                <h1 className="break-words text-2xl font-bold text-primary dark:text-dark-primary">
                  {labelName}
                </h1>
                <p className="mt-2 break-all text-sm text-secondary dark:text-dark-secondary">
                  @{username}
                </p>
                <p className="mt-3 text-sm text-primary dark:text-dark-primary">
                  {headline || t("studentSelfProfile.header.subtitle")}
                </p>

                {isSelfProfile ? (
                  <Link to={settingsPathForShell(shellBase)} className="mt-5 w-full">
                    <Button type="button" variant="primary" fullWidth>
                      {t("studentSelfProfile.actions.editProfile")}
                    </Button>
                  </Link>
                ) : null}

                <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                  <StatPill
                    value={String(repositories.length)}
                    label={t("studentSelfProfile.stats.repositories")}
                  />
                  <div className="text-secondary dark:text-dark-secondary">
                    ·
                  </div>
                  <StatPill
                    value={String(profileProjects.length)}
                    label={t("studentSelfProfile.stats.projects")}
                  />
                </div>

                <div className="mt-8 w-full space-y-4 text-left">
                  <InfoRow
                    icon={MapPin}
                    label={t("studentSelfProfile.info.location")}
                    value={personLocation || t("studentProfile.na")}
                  />
                  <InfoRow
                    icon={Globe}
                    label={t("studentSelfProfile.info.repositoryUsername")}
                    value={vcUsername || t("studentProfile.na")}
                  />
                  <InfoRow
                    icon={Clock}
                    label={t("studentSelfProfile.info.memberSince")}
                    value={joinedDate}
                  />
                </div>

                <div className="mt-8 flex max-w-full flex-wrap justify-center gap-2">
                  {leftBadges.map((badge) => (
                    <span
                      key={badge}
                      className="badge max-w-full break-words text-center"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <main className="min-w-0 space-y-5">
            <section className={`${SURFACE_CARD} p-4`}>
              <p className="text-sm text-primary dark:text-dark-primary">
                {t("studentSelfProfile.achievement.banner", {
                  count: totalContributions,
                })}
              </p>
            </section>

            <section className={`${SURFACE_CARD} min-w-0 p-4 md:p-5`}>
              <h2 className="text-lg font-semibold text-primary dark:text-dark-primary">
                {t("studentSelfProfile.pinned.title")}
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {pinnedItems.length === 0 ? (
                  <div
                    className={`${SOFT_PANEL} p-4 text-sm text-secondary dark:text-dark-secondary sm:col-span-2`}
                  >
                    {t("studentSelfProfile.pinned.empty")}
                  </div>
                ) : (
                  pinnedItems.map((item) => (
                    <div
                      key={item.key}
                      className="min-w-0 rounded-[1.15rem] border border-(--color-light-card-border) p-4 dark:border-(--color-dark-card-border)"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-primary dark:text-dark-primary">
                            {item.name}
                          </p>
                          <p className="mt-1 text-xs text-secondary dark:text-dark-secondary">
                            {item.visibility}
                          </p>
                          <p className="mt-2 break-words text-xs leading-5 text-secondary dark:text-dark-secondary">
                            {item.desc}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5 text-secondary dark:text-dark-secondary">
                          <Star
                            className="size-4"
                            strokeWidth={1.9}
                            aria-hidden
                          />
                          <span className="text-sm">{item.stars}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className={`${SURFACE_CARD} min-w-0 p-4 md:p-5`}>
              <h2 className="text-lg font-semibold text-primary dark:text-dark-primary">
                {t("studentSelfProfile.heatmap.title", {
                  count: totalContributions,
                })}
              </h2>
              <ContributionHeatmap
                weeks={heatmap.weeks}
                max={heatmap.max}
                valueLabel={t("studentSelfProfile.activity.contributions", {
                  defaultValue: "contributions",
                })}
                emptyLabel={t("studentSelfProfile.activityFeed.empty")}
              />
            </section>

            <section className={`${SURFACE_CARD} min-w-0 p-4 md:p-5`}>
              <h2 className="text-lg font-semibold text-primary dark:text-dark-primary">
                {t("studentSelfProfile.activityFeed.title")}
              </h2>

              <div className="mt-6 space-y-6">
                <div className="border-s-2 border-light-divider ps-4 dark:border-dark-divider">
                  <p className="text-sm font-semibold text-primary dark:text-dark-primary">
                    {formatMonthYear(new Date(), locale)}
                  </p>
                  <p className="mt-1 text-sm text-secondary dark:text-dark-secondary">
                    {t("studentSelfProfile.heatmap.title", {
                      count: totalContributions,
                    })}
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {contributionRows.length === 0 ? (
                      <div
                        className={`${SOFT_PANEL} p-4 text-sm text-secondary dark:text-dark-secondary sm:col-span-2`}
                      >
                        {t("studentSelfProfile.activityFeed.empty")}
                      </div>
                    ) : (
                      contributionRows.map((item) => (
                        <div
                          key={item.id}
                          className="min-w-0 rounded-[1.15rem] border border-(--color-light-card-border) p-4 dark:border-(--color-dark-card-border)"
                        >
                          <p className="break-words text-sm font-semibold text-primary dark:text-dark-primary">
                            {item.label}
                          </p>
                          <p className="mt-2 break-all text-xs leading-5 text-secondary dark:text-dark-secondary">
                            {displayOrDash(
                              item.repo,
                              t("studentSelfProfile.recent.noRepository"),
                            )}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {allContributionRows.length > 4 ? (
                <div className="mt-6 text-center">
                  <Button
                    type="button"
                    variant="tertiary"
                    onClick={() => setShowMore((current) => !current)}
                  >
                    {showMore
                      ? t("studentSelfProfile.actions.showLess")
                      : t("studentSelfProfile.actions.showMore")}
                  </Button>
                </div>
              ) : null}
            </section>
            <div className="rounded-xl border border-[#e4e8ef] bg-white p-6 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
              <h3 className="text-lg font-semibold text-[#0a1224] dark:text-dark-text-primary">
                {t("studentSelfProfile.stats.repositories")}
              </h3>

              <div className="mt-4 space-y-3">
                {repositories.map((repo) => {
                  const lang = languageColor(repo.language);
                  const name = repoName(
                    repo,
                    t("studentSelfProfile.pinned.repositoryDescriptionFallback"),
                  );
                  const visibility = repoVisibility(repo, t);
                  const updatedAt = formatDate(
                    repo.updatedAt || repo.updated_at || repo.createdAt,
                    locale,
                  );
                  return (
                    <div
                      key={repo.id ?? repo.repositoryId ?? name}
                      className="rounded-lg border border-[#e4e8ef] bg-white p-4 transition-colors hover:border-[#cfd7e6] hover:bg-[#f7f8fa] dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:hover:border-(--color-dark-input-border-focus) dark:hover:bg-dark-app-tertiary"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Repo Name & Visibility */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="cursor-pointer text-sm font-semibold text-[#0a1224] hover:text-[#0066ff] dark:text-dark-text-primary dark:hover:text-(--color-chart-blue-secondary)">
                              {name}
                            </h4>
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${visibilityColor(repo)}`}
                            >
                              {visibility}
                            </span>
                          </div>

                          {/* Description */}
                          <p className="mt-2 line-clamp-2 text-xs text-[#5f6f87] dark:text-dark-text-secondary">
                            {repo.description ||
                              t(
                                "studentSelfProfile.pinned.repositoryDescriptionFallback",
                              )}
                          </p>

                          {/* Footer: Language, Stars, Forks, Updated */}
                          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#5f6f87] dark:text-dark-text-secondary">
                            {repo.language && (
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="inline-block w-2 h-2 rounded-full"
                                  style={{ backgroundColor: lang.dot }}
                                />
                                <span>{repo.language}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              <span>
                                {Number(
                                  repo.stars ??
                                    repo.stargazers_count ??
                                    repo.stargazersCount ??
                                    0,
                                )}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <GitBranch className="w-3 h-3" />
                              <span>
                                {Number(repo.forks ?? repo.forksCount ?? 0)}
                              </span>
                            </div>

                            {updatedAt ? (
                              <span className="text-[#98a2b3] dark:text-dark-text-muted">
                                {updatedAt}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {/* Right Side: Eye Icon */}
                        <div className="flex-shrink-0">
                          <Eye className="h-4 w-4 cursor-pointer text-[#98a2b3] hover:text-[#0a1224] dark:text-dark-text-muted dark:hover:text-dark-text-primary" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Load More Button */}
              {repositories.length > 6 && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setShowMore(!showMore)}
                    className="rounded-lg border border-[#e4e8ef] px-6 py-2 text-sm font-medium text-[#0066ff] transition-colors hover:bg-[#edf4ff] dark:border-(--color-dark-card-border) dark:text-(--color-chart-blue-secondary) dark:hover:border-(--color-dark-input-border-focus) dark:hover:bg-dark-app-tertiary"
                  >
                    {showMore
                      ? t("studentSelfProfile.actions.showLess")
                      : t("studentSelfProfile.actions.showMore")}
                  </button>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
