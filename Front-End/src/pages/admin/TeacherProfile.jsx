import { GraduationCap, UsersRound } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import {
  AdminProfileHighlightCard,
  AdminProfileMetricCard,
  AdminProfilePeerCompareCard,
  AdminProfileSemiGaugeCard,
} from "../../components/admin/AdminProfileDashboard";
import ContributionHeatmap from "../../components/repo/ContributionHeatmap";
import useActivityHeatmap from "../../hooks/useActivityHeatmap";
import {
  AdminPersonProfileBreadcrumbs,
  AdminPersonProfileExpandableList,
  AdminPersonProfileFrame,
  AdminPersonProfileHero,
  AdminPersonProfileMiniCard,
  AdminPersonProfilePillSection,
  AdminPersonProfilePipeline,
} from "../../components/admin/AdminPersonProfileChrome";
import AdminProfileGreenScope from "../../components/admin/AdminProfileGreenScope";
import Button from "../../components/Button";
import Icon from "../../components/Icon";
import IC from "../../components/IC";
import {
  useFacultyProjectsByTeacher,
  useTeacher,
  useUser,
  useVcRepositoriesForViewer,
  useVcUserActivity,
} from "../../services/useApi";
import { bucketVcActivityEvents } from "../../utils/vcActivityBuckets";

function profileInitials(fullName) {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2)
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase() || "?";
  return (parts[0]?.slice(0, 2) || "?").toUpperCase();
}

function formatDisplayDate(isoOrDate, locale = undefined) {
  if (isoOrDate == null || isoOrDate === "") return "";
  try {
    const d = new Date(isoOrDate);
    if (Number.isNaN(d.getTime())) return String(isoOrDate);
    return d.toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(isoOrDate);
  }
}

function groupsFromProjects(projects) {
  /** @type {Map<string, { id: string; name: string }>} */
  const m = new Map();
  if (!Array.isArray(projects)) return [];
  for (const p of projects) {
    const g = p?.group ?? p?.studentGroup ?? p?.facultyGroup;
    const gidRaw =
      (typeof g === "object" && g?.id != null ? g.id : null) ??
      (typeof g === "string" && g.trim() ? g.trim() : null);
    if (gidRaw == null) continue;
    const gid = String(gidRaw);
    if (m.has(gid)) continue;
    let name =
      (typeof g === "object" && g && (g.name || g.title)) || gid || "?";
    if (typeof name !== "string") name = gid;
    m.set(gid, { id: gid, name });
  }
  return [...m.values()];
}

export default function TeacherProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const locale =
    i18n.language === "ps"
      ? "ps-AF"
      : i18n.language === "prs"
        ? "fa-AF"
        : undefined;

  const {
    data: teacher,
    isLoading,
    isError,
    isFetching,
  } = useTeacher(id, { notifyOnError: false });

  const { data: projects = [] } = useFacultyProjectsByTeacher(teacher?.id, {
    enabled: Boolean(teacher?.id),
    notifyOnError: false,
  });

  const ownerKey = String(
    teacher?.linkedApplicationUserId ??
      teacher?.applicationUserId ??
      teacher?.gatewayUserId ??
      "",
  ).trim();

  const userLookupId = String(
    teacher?.keycloak ??
      teacher?.applicationUserId ??
      teacher?.gatewayUserId ??
      teacher?.keycloakId ??
      "",
  ).trim();

  const { data: gatewayUser } = useUser(userLookupId, {
    enabled: Boolean(userLookupId),
    notifyOnError: false,
  });

  const vcUsername = String(
    gatewayUser?.user_name ?? gatewayUser?.username ?? teacher?.username ?? "",
  ).trim();
  const { data: repos = [] } = useVcRepositoriesForViewer(ownerKey, {
    enabled: Boolean(ownerKey || vcUsername),
    notifyOnError: false,
    activityUsernameFallback: vcUsername || undefined,
  });

  const { data: rawActivity = [] } = useVcUserActivity(vcUsername, {
    enabled: Boolean(vcUsername),
    notifyOnError: false,
  });
  const buckets = useMemo(
    () => bucketVcActivityEvents(rawActivity),
    [rawActivity],
  );
  const heatmap = useActivityHeatmap(rawActivity);

  const derivedGroups = useMemo(() => groupsFromProjects(projects), [projects]);

  const aspectScore = useMemo(() => {
    const base = 58;
    const bump =
      projects.length * 5 + derivedGroups.length * 4 + repos.length * 2;
    return Math.min(98, Math.max(44, base + Math.min(bump, 32)));
  }, [projects.length, derivedGroups.length, repos.length]);

  const peerCompare = useMemo(() => {
    const peer = Math.min(
      95,
      Math.max(50, aspectScore + ((teacher?.id?.length || 2) % 7) - 3),
    );
    return { subject: aspectScore, peer };
  }, [aspectScore, teacher?.id]);

  if (isLoading || (isFetching && !teacher)) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-light-app-bg p-6 dark:bg-dark-shell md:p-8">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-(--color-light-card-border) border-t-(--color-light-text-primary) dark:border-(--color-dark-card-border) dark:border-t-(--color-dark-text-primary)"
          aria-hidden
        />
        <p className="text-sm text-muted dark:text-dark-muted">
          {t("adminPersonProfile.loading")}
        </p>
      </div>
    );
  }

  if (isError || !teacher?.id) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-light-app-bg p-6 dark:bg-dark-shell md:p-8">
        <p className="text-lg font-semibold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
          {t("adminPersonProfile.teacher.notFound")}
        </p>
        <Button variant="secondary" onClick={() => navigate("/admin/teacher")}>
          {t("adminPersonProfile.backToTeachers")}
        </Button>
      </div>
    );
  }

  const fullName =
    `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim() ||
    t("studentProfile.na");
  const statusKey = (teacher.status || "active").toLowerCase();

  const sidebarTags = [
    teacher.department,
    teacher.educationRank,
    vcUsername ? `@${vcUsername}` : null,
  ].filter(Boolean);

  const applicationItems = projects.map((p) => {
    const pk = String(p?.id ?? p?.uuid ?? "");
    const title =
      [p?.title, p?.name, p?.topic].find(
        (x) => typeof x === "string" && x.trim(),
      ) ?? pk;
    return {
      id: pk,
      title,
      subtitle: teacher.department || t("adminShared.roles.teacher"),
    };
  });

  const sidebar = (
    <div className="overflow-visible rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) pb-8  dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) ">
      <AdminPersonProfileHero
        onBack={() => navigate("/admin/teacher")}
        verifiedLabel={t("adminPersonProfile.verified")}
        initials={profileInitials(fullName)}
      />
      <div className="px-6 ">
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
              {fullName}
            </h1>
            <p className="mt-0.5 text-xs text-muted dark:text-dark-muted">
              @{vcUsername || t("studentProfile.na")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-(--color-light-admin-profile-violet-soft-border) bg-(--color-light-admin-profile-violet-soft-bg) px-3 py-1 text-[11px] font-semibold text-(--color-light-admin-profile-violet-soft-text) dark:border-(--color-dark-admin-profile-violet-soft-border) dark:bg-(--color-dark-admin-profile-violet-soft-bg) dark:text-(--color-dark-admin-profile-violet-soft-text)">
              {t("adminShared.roles.teacher")}
            </span>
            <span className="rounded-full border border-(--color-light-card-border) bg-(--color-light-admin-profile-pill-bg) px-2.5 py-1 text-[11px] font-semibold text-(--color-light-admin-profile-pill-text) dark:border-(--color-dark-card-border) dark:bg-(--color-dark-admin-profile-pill-bg) dark:text-(--color-dark-admin-profile-pill-text)">
              {t(`adminShared.status.${statusKey}`, statusKey)}
            </span>
          </div>
        </div>

        {sidebarTags.length ? (
          <AdminPersonProfilePillSection
            title={t("adminPersonProfile.skills.heading")}
            tags={sidebarTags}
          />
        ) : null}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <AdminPersonProfileMiniCard
            label={t("adminPersonProfile.sidebar.location")}
            value={
              [teacher.addressCity, teacher.addressProvince]
                .filter(Boolean)
                .join(", ") || t("studentProfile.na")
            }
          />
          <AdminPersonProfileMiniCard
            label={t("adminPersonProfile.mini.timezone")}
            value={t("adminPersonProfile.timezone.unset")}
          />
        </div>

        <AdminPersonProfileExpandableList
          title={t("adminPersonProfile.sidebar.applications")}
          items={applicationItems}
          collapsedCount={3}
          expandLabel={t("adminPersonProfile.seeMoreCount", {
            count: Math.max(0, applicationItems.length - 3),
          })}
          collapseLabel={t("adminPersonProfile.seeLess")}
        />

        <dl className="mt-6 space-y-2 border-t border-light-divider pt-5 text-[11px] dark:border-dark-divider">
          <div className="flex justify-between gap-3">
            <dt className="font-semibold text-muted dark:text-dark-muted">
              {t("adminPersonProfile.fields.teacherId")}
            </dt>
            <dd className="max-w-[12rem] truncate font-mono text-(--color-light-text-secondary) dark:text-(--color-dark-text-secondary)">
              {teacher.id}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-semibold text-muted dark:text-dark-muted">
              Keycloak ID
            </dt>
            <dd className="max-w-[12rem] truncate font-mono text-(--color-light-text-secondary) dark:text-(--color-dark-text-secondary)">
              {teacher.keycloakId ||
                (teacher.linkedApplicationUserId ??
                  teacher.applicationUserId ??
                  teacher.gatewayUserId ??
                  "")}
            </dd>
          </div>

          <div className="flex justify-between gap-3">
            <dt className="font-semibold text-muted dark:text-dark-muted">
              {t("adminPersonProfile.fields.joined")}
            </dt>
            <dd className="text-light-text-secondary dark:text-dark-text-secondary">
              {formatDisplayDate(teacher.joined, locale) ||
                t("studentProfile.na")}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );

  const children = (
    <>
      <div className="grid grid-cols-1 gap-4">
        <AdminProfilePeerCompareCard
          title={t("adminPersonProfile.charts.peerCompareDept")}
          subjectLabel={t("adminPersonProfile.charts.you")}
          peerLabel={t("adminPersonProfile.charts.deptAverage")}
          subjectPct={peerCompare.subject}
          peerPct={peerCompare.peer}
        />
      </div>

      <div className="rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 md:p-5 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
            {t("studentSelfProfile.heatmap.title", {
              count: heatmap.total,
            })}
          </h2>
          <span className="text-[11px] text-muted dark:text-dark-muted">
            {vcUsername ? `@${vcUsername}` : t("studentProfile.na")}
          </span>
        </div>
        <ContributionHeatmap
          weeks={heatmap.weeks}
          max={heatmap.max}
          valueLabel={t("studentSelfProfile.activity.contributions", {
            defaultValue: "contributions",
          })}
          emptyLabel={t("studentSelfProfile.activityFeed.empty")}
        />
        <div className="mt-4 grid gap-3 text-xs sm:grid-cols-4">
          <div className="rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary p-3 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
            <p className="text-muted dark:text-dark-muted">
              {t("adminPersonProfile.activity.pushes")}
            </p>
            <p className="mt-1 text-lg font-semibold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
              {buckets.pushes.length}
            </p>
          </div>
          <div className="rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary p-3 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
            <p className="text-muted dark:text-dark-muted">
              {t("adminPersonProfile.activity.pullRequests")}
            </p>
            <p className="mt-1 text-lg font-semibold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
              {buckets.pulls.length}
            </p>
          </div>
          <div className="rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary p-3 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
            <p className="text-muted dark:text-dark-muted">
              {t("adminPersonProfile.activity.merges")}
            </p>
            <p className="mt-1 text-lg font-semibold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
              {buckets.merges.length}
            </p>
          </div>
          <div className="rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary p-3 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
            <p className="text-muted dark:text-dark-muted">
              {t("studentSelfProfile.stats.repositories")}
            </p>
            <p className="mt-1 text-lg font-semibold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
              {repos.length}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
            {t("adminPersonProfile.sections.assignedProjects")}
          </h2>
        </div>
        {projects.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted dark:text-dark-muted">
            {t("adminPersonProfile.teacher.noProjects")}
          </p>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {projects.map((p) => {
              const pk = String(p?.id ?? p?.uuid ?? "");
              const title =
                [p?.title, p?.name, p?.topic].find(
                  (x) => typeof x === "string" && x.trim(),
                ) ?? pk;
              return (
                <li
                  key={pk || title}
                  className="flex items-center gap-3 rounded-xl border border-(--color-light-card-border) bg-(--color-light-app-secondary) px-4 py-3 dark:border-(--color-dark-card-border) dark:bg-dark-shell"
                >
                  <GraduationCap
                    className="size-5 shrink-0 text-(--color-blue-500)"
                    strokeWidth={2}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
                      {title}
                    </p>
                    <p className="truncate text-[11px] text-muted dark:text-dark-muted">
                      {t("adminPersonProfile.project.id", { id: pk })}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
        <h2 className="mb-3 text-sm font-semibold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
          {t("adminPersonProfile.sections.assignedGroups")}
        </h2>
        {derivedGroups.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted dark:text-dark-muted">
            {t("adminPersonProfile.teacher.noGroups")}
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {derivedGroups.map((g) => (
              <li
                key={g.id}
                className="rounded-xl border border-(--color-light-card-border) bg-(--color-light-app-secondary) px-4 py-3 dark:border-(--color-dark-card-border) dark:bg-dark-shell"
              >
                <p className="text-sm font-semibold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
                  {g.name}
                </p>
                <p className="font-mono text-[11px] text-muted dark:text-dark-muted">
                  {g.id}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
        <h2 className="mb-3 text-sm font-semibold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
          {t("adminPersonProfile.sections.publicRecord")}
        </h2>
        <div className="grid gap-3 text-xs md:grid-cols-3">
          <div>
            <p className="font-semibold text-muted dark:text-dark-muted">
              {t("studentProfile.fields.email")}
            </p>
            <p className="truncate font-medium text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
              {teacher.email || t("studentProfile.na")}
            </p>
          </div>
          <div>
            <p className="font-semibold text-muted dark:text-dark-muted">
              {t("studentProfile.fields.phone")}
            </p>
            <p className="truncate font-medium text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
              {teacher.phone || t("studentProfile.na")}
            </p>
          </div>
          <div>
            <p className="font-semibold text-muted dark:text-dark-muted">
              {t("adminPersonProfile.fields.addressCity")}
            </p>
            <p className="truncate font-medium text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
              {[teacher.addressCity, teacher.addressProvince]
                .filter(Boolean)
                .join(", ") || t("studentProfile.na")}
            </p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <AdminProfileGreenScope>
      <AdminPersonProfileFrame sidebar={sidebar} children={children} />
    </AdminProfileGreenScope>
  );
}
