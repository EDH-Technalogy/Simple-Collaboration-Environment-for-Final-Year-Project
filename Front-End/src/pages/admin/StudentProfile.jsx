import { Brain, Clock3, GitBranch, Trophy } from "lucide-react";
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
  AdminPersonProfileNavyButton,
  AdminPersonProfileNavyLink,
  AdminPersonProfilePillSection,
  AdminPersonProfilePipeline,
} from "../../components/admin/AdminPersonProfileChrome";
import AdminProfileGreenScope from "../../components/admin/AdminProfileGreenScope";
import Button from "../../components/Button";
import Icon from "../../components/Icon";
import IC from "../../components/IC";
import {
  useFacultyProjectsByStudent,
  useStudent,
  useUser,
  useVcRepositoriesForViewer,
  useVcUserActivity,
} from "../../services/useApi";
import { bucketVcActivityEvents } from "../../utils/vcActivityBuckets";

function formatDisplayDate(isoOrDate) {
  if (isoOrDate == null || isoOrDate === "") return "";
  try {
    const d = new Date(isoOrDate);
    if (Number.isNaN(d.getTime())) {
      const s = String(isoOrDate);
      return s.length >= 10 ? s.slice(0, 10) : s;
    }
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(isoOrDate);
  }
}

function displayOrDash(v, fallback) {
  if (v == null) return fallback;
  const s = `${v}`.trim();
  return s !== "" ? s : fallback;
}

const GENDER_I18N = {
  male: "studentForm.options.genderMale",
  female: "studentForm.options.genderFemale",
  other: "studentForm.options.genderOther",
};

function profileInitials(fullName) {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2)
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase() || "?";
  return (parts[0]?.slice(0, 2) || "?").toUpperCase();
}

function sidebarPillsFromStudent(student, t) {
  const dept = displayOrDash(student.department, null);
  const sem =
    student.semester != null && student.semester !== ""
      ? t(`studentForm.options.semester${student.semester}`)
      : null;
  const tags = [dept, sem].filter(Boolean);
  const loc = [
    displayOrDash(student.addressCity, null),
    displayOrDash(student.addressProvince, null),
  ]
    .filter(Boolean)
    .join(", ");
  return { tags, loc };
}

function fnv1aHash(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function resolveProjectRow(p, t) {
  const pk = String(p?.id ?? p?.projectId ?? p?.uuid ?? "");
  const fromFields =
    [p?.title, p?.name, p?.topic].find(
      (x) => typeof x === "string" && x.trim(),
    ) ?? "";
  const title =
    (typeof fromFields === "string" && fromFields.trim()) ||
    (pk.trim() !== "" ? pk : "") ||
    t("adminPersonProfile.sidebar.projectUntitled");
  return { pk, title };
}

function StudentActivityColumn({ tone, title, rows, emptyLabel }) {
  return (
    <div className="flex min-h-[200px] flex-col rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-(--color-light-text-secondary) dark:text-(--color-dark-text-secondary)">
          {title}
        </h3>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tone}`}
        >
          {rows.length}
        </span>
      </div>
      <ul className="max-h-[320px] flex-1 space-y-2 overflow-y-auto pe-1">
        {rows.length === 0 ? (
          <li className="py-10 text-center text-xs text-muted dark:text-dark-muted">
            {emptyLabel}
          </li>
        ) : (
          rows.slice(0, 28).map((row) => (
            <li
              key={row.id}
              className="rounded-xl border border-(--color-light-card-border) bg-(--color-light-app-secondary) px-3 py-2 dark:border-(--color-dark-card-border) dark:bg-dark-shell"
            >
              <p className="truncate text-xs font-semibold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
                {row.label}
              </p>
              {row.repo ? (
                <p className="mt-0.5 truncate font-mono text-[10px] text-muted dark:text-dark-muted">
                  {row.repo}
                </p>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const {
    data: student,
    isLoading,
    isError,
    isFetching,
  } = useStudent(id, { notifyOnError: false });

  const ownerKey = String(student?.linkedApplicationUserId ?? "").trim();

  const { data: gatewayUser } = useUser(student?.keycloakId, {
    enabled: Boolean(student?.keycloakId),
    notifyOnError: false,
  });

  const vcUsername = String(
    gatewayUser?.user_name ?? gatewayUser?.username ?? student?.username ?? "",
  ).trim();

  const { data: repos = [] } = useVcRepositoriesForViewer(ownerKey, {
    enabled: Boolean(ownerKey || vcUsername),
    notifyOnError: false,
    activityUsernameFallback: vcUsername || undefined,
  });

  const { data: rawActivity = [], isLoading: activityLoading } =
    useVcUserActivity(vcUsername, {
      enabled: Boolean(vcUsername),
      notifyOnError: false,
    });

  const { data: facultyProjects = [] } = useFacultyProjectsByStudent(
    student?.id,
    {
      enabled: Boolean(student?.id),
      notifyOnError: false,
    },
  );

  const buckets = useMemo(
    () => bucketVcActivityEvents(rawActivity),
    [rawActivity],
  );
  const heatmap = useActivityHeatmap(rawActivity);

  const pipelineStageLabels = useMemo(
    () =>
      [
        "adminPersonProfile.pipeline.stage.all",
        "adminPersonProfile.pipeline.stage.new",
        "adminPersonProfile.pipeline.stage.screening",
        "adminPersonProfile.pipeline.stage.phone",
        "adminPersonProfile.pipeline.stage.technical",
        "adminPersonProfile.pipeline.stage.final",
        "adminPersonProfile.pipeline.stage.hired",
      ].map((k) => t(k)),
    [t],
  );

  const pipelineRows = useMemo(() => {
    const deptLabel = student?.department ?? "";
    return facultyProjects.slice(0, 4).map((p, idx) => {
      const { pk, title } = resolveProjectRow(p, t);
      const seed = fnv1aHash(`${student?.id ?? ""}:${pk}:${idx}`);
      const bodyCounts = Array.from({ length: 6 }, (_, c) => {
        return 10 + ((seed >> (c * 4)) % 40);
      });
      const inner = bodyCounts.reduce((a, b) => a + b, 0);
      const allCol = inner + 12 + (seed % 28);
      return {
        id: pk || `r-${idx}`,
        title,
        subtitle: deptLabel,
        counts: [allCol, ...bodyCounts],
        activeStageIndex: 3 + ((seed >> 21) % 4),
        onViewDetails:
          pk && pk !== ""
            ? () =>
                window.GooeyToaster?.info?.(
                  `${title} · ${t("adminPersonProfile.pipeline.viewDetails")}`,
                )
            : undefined,
        viewDetailsLabel: t("adminPersonProfile.pipeline.viewDetails"),
      };
    });
  }, [facultyProjects, student?.department, student?.id, t]);

  if (isLoading || (isFetching && !student)) {
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

  if (isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-light-app-bg p-6 text-center dark:bg-dark-shell md:p-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-light-error-bg dark:bg-dark-error-bg">
          <Icon
            d={IC.x}
            className="h-6 w-6 text-light-error-text dark:text-dark-error-text"
          />
        </div>
        <p className="max-w-sm text-sm text-secondary dark:text-dark-secondary">
          {t("studentProfile.loadError")}
        </p>
        <Button variant="secondary" onClick={() => navigate("/admin/student")}>
          {t("studentProfile.backToList")}
        </Button>
      </div>
    );
  }

  if (!student || !student.id) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-light-app-bg p-6 dark:bg-dark-shell md:p-8">
        <p className="text-lg font-semibold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
          {t("studentProfile.notFound")}
        </p>
        <Button variant="secondary" onClick={() => navigate("/admin/student")}>
          {t("studentProfile.backToList")}
        </Button>
      </div>
    );
  }

  const fullName =
    `${student.firstName || ""} ${student.lastName || ""}`.trim() ||
    t("studentProfile.na");
  const g = (student.gender || "").toLowerCase();
  const genderLabel = GENDER_I18N[g]
    ? t(GENDER_I18N[g])
    : displayOrDash(student.gender, "");
  const { tags, loc } = sidebarPillsFromStudent(student, t);
  const statusKey = (student.status || "active").toLowerCase();

  const skillTags = [
    ...tags.filter(Boolean),
    ...(genderLabel ? [genderLabel] : []),
    ...(student.code ? [student.code] : []),
    ...(vcUsername ? [`@${vcUsername}`] : []),
  ];

  const positionTags = [
    t("adminPersonProfile.position.fullTime"),
    statusKey === "active"
      ? t("adminPersonProfile.position.onCampus")
      : t("adminPersonProfile.position.remoteOk"),
  ];

  const applicationItems = facultyProjects.map((p) => {
    const { pk, title } = resolveProjectRow(p, t);
    return {
      id: pk,
      title,
      subtitle: student.department || t("adminShared.roles.student"),
    };
  });

  const experienceItems = [
    {
      id: "primary",
      title: student.code || String(student.id),
      subtitle: t("adminPersonProfile.experience.subtitle", {
        dept: student.department ?? t("studentProfile.na"),
        date:
          formatDisplayDate(student.enrollmentDate) || t("studentProfile.na"),
      }),
    },
  ];

  const moreApplications = Math.max(0, applicationItems.length - 3);

  return (
    <AdminProfileGreenScope>
      <AdminPersonProfileFrame
        sidebar={
          <div className="overflow-visible rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) pb-8  dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) ">
            <AdminPersonProfileHero
              onBack={() => navigate("/admin/student")}
              verifiedLabel={t("adminPersonProfile.verified")}
              initials={profileInitials(fullName)}
            />
            <div className="px-6">
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
                    {t("adminShared.roles.student")}
                  </span>
                  <span className="rounded-full border border-(--color-light-card-border) bg-(--color-light-admin-profile-pill-bg) px-2.5 py-1 text-[11px] font-semibold text-(--color-light-admin-profile-pill-text) dark:border-(--color-dark-card-border) dark:bg-(--color-dark-admin-profile-pill-bg) dark:text-(--color-dark-admin-profile-pill-text)">
                    {t(`adminShared.status.${statusKey}`, statusKey)}
                  </span>
                </div>
              </div>

              {skillTags.length ? (
                <AdminPersonProfilePillSection
                  title={t("adminPersonProfile.skills.heading")}
                  tags={skillTags}
                />
              ) : null}

              <AdminPersonProfilePillSection
                title={t("adminPersonProfile.positionType.heading")}
                tags={positionTags}
              />

              <div className="mt-5 grid grid-cols-2 gap-3">
                <AdminPersonProfileMiniCard
                  label={t("adminPersonProfile.sidebar.location")}
                  value={
                    (loc ?? "").trim() !== "" ? loc : t("studentProfile.na")
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
                  count: moreApplications,
                })}
                collapseLabel={t("adminPersonProfile.seeLess")}
              />

              <AdminPersonProfileExpandableList
                title={t("adminPersonProfile.sidebar.experience")}
                items={experienceItems}
                collapsedCount={2}
                expandLabel={
                  experienceItems.length > 2
                    ? t("adminPersonProfile.seeMoreCount", {
                        count: experienceItems.length - 2,
                      })
                    : ""
                }
                collapseLabel={t("adminPersonProfile.seeLess")}
              />

              <dl className="mt-6 space-y-2 border-t border-light-divider pt-5 text-[11px] dark:border-dark-divider">
                <div className="flex justify-between gap-3">
                  <dt className="font-semibold text-muted dark:text-dark-muted">
                    {t("studentProfile.fields.studentId")}
                  </dt>
                  <dd className="max-w-[12rem] truncate font-mono text-(--color-light-text-secondary) dark:text-(--color-dark-text-secondary)">
                    {student.id}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="font-semibold text-muted dark:text-dark-muted">
                    Keycloak ID
                  </dt>
                  <dd className="max-w-[12rem] truncate font-mono text-(--color-light-text-secondary) dark:text-(--color-dark-text-secondary)">
                    {student.keycloakId ||
                      (student.linkedApplicationUserId ??
                        student.applicationUserId ??
                        "")}
                  </dd>
                </div>

                <div className="flex justify-between gap-3">
                  <dt className="font-semibold text-muted dark:text-dark-muted">
                    {t("studentProfile.fields.dateOfBirth")}
                  </dt>
                  <dd className="text-(--color-light-text-secondary) dark:text-(--color-dark-text-secondary)">
                    {formatDisplayDate(student.dateOfBirth) ||
                      t("studentProfile.na")}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        }
        children={
          <>
            <div>
              <div className="mb-3 flex items-center gap-2">
                <GitBranch
                  className="size-5 text-(--color-light-admin-profile-violet) dark:text-(--color-dark-admin-profile-violet)"
                  strokeWidth={2}
                  aria-hidden
                />
                <h2 className="text-sm font-semibold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
                  {t("adminPersonProfile.sections.repositoryActivity")}
                </h2>
                {activityLoading ? (
                  <span className="text-[11px] text-muted dark:text-dark-muted">
                    {t("adminPersonProfile.activity.loading")}
                  </span>
                ) : null}
              </div>
              {!vcUsername ? (
                <p className="rounded-2xl border border-dashed border-(--color-light-card-border) bg-(--color-light-card-bg) px-4 py-8 text-center text-sm text-muted dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:text-dark-muted">
                  {t("adminPersonProfile.activity.noUsername")}
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                  <StudentActivityColumn
                    tone="bg-(--color-light-admin-profile-violet-soft-bg) text-(--color-light-admin-profile-violet-soft-text) dark:bg-(--color-dark-admin-profile-violet-soft-bg) dark:text-(--color-dark-admin-profile-violet-soft-text)"
                    title={t("adminPersonProfile.activity.pushes")}
                    rows={buckets.pushes}
                    emptyLabel={t("adminPersonProfile.activity.empty")}
                  />
                  <StudentActivityColumn
                    tone="bg-(--color-light-admin-profile-violet-soft-bg) text-(--color-light-admin-profile-violet-strong) dark:bg-(--color-dark-admin-profile-violet-soft-bg) dark:text-(--color-dark-admin-profile-violet)"
                    title={t("adminPersonProfile.activity.pullRequests")}
                    rows={buckets.pulls}
                    emptyLabel={t("adminPersonProfile.activity.empty")}
                  />
                  <StudentActivityColumn
                    tone="bg-(--color-light-success-bg) text-(--color-light-success-text) dark:bg-green-950/50 dark:text-green-300"
                    title={t("adminPersonProfile.activity.merges")}
                    rows={buckets.merges}
                    emptyLabel={t("adminPersonProfile.activity.empty")}
                  />
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 md:p-5 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
                  {t("studentSelfProfile.heatmap.title", {
                    count: heatmap.total,
                  })}
                </h2>
                <span className="text-[11px] text-muted dark:text-dark-muted">
                  {vcUsername ? `@${vcUsername}` : t("studentProfile.na")} ·{" "}
                  {repos.length} {t("studentSelfProfile.stats.repositories")}
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
            </div>

            {pipelineRows.length ? (
              <AdminPersonProfilePipeline
                title={t("adminPersonProfile.pipeline.title")}
                stageLabels={pipelineStageLabels}
                rows={pipelineRows}
              />
            ) : null}

            <div className="rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 md:p-5 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
              <h2 className="mb-3 text-sm font-semibold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
                {t("adminPersonProfile.sections.publicRecord")}
              </h2>
              <div className="grid gap-3 text-xs md:grid-cols-3">
                <div>
                  <p className="font-semibold text-muted dark:text-dark-muted">
                    {t("studentProfile.fields.email")}
                  </p>
                  <p className="truncate font-medium text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
                    {student.email || t("studentProfile.na")}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-muted dark:text-dark-muted">
                    {t("studentProfile.fields.phone")}
                  </p>
                  <p className="truncate font-medium text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
                    {student.phone || t("studentProfile.na")}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-muted dark:text-dark-muted">
                    {t("studentProfile.fields.enrollmentDate")}
                  </p>
                  <p className="truncate font-medium text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
                    {formatDisplayDate(student.enrollmentDate) ||
                      t("studentProfile.na")}
                  </p>
                </div>
              </div>
            </div>
          </>
        }
      />
    </AdminProfileGreenScope>
  );
}
