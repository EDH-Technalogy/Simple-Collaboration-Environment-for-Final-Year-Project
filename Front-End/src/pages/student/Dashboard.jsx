import { eachDayOfInterval, format, startOfDay, subDays } from "date-fns";
import {
  Activity,
  CalendarDays,
  FolderGit2,
  GitPullRequest,
} from "lucide-react";
import { useId, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Button from "../../components/Button";
import Avatar from "../../components/Avatar";
import RepoOverviewStatCard from "../../components/repo/RepoOverviewStatCard";
import { REPO_OVERVIEW_STAT_PALETTES } from "../../components/repo/repoOverviewStatPalettes";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/themContext";
import { resolveShellBasePath } from "../../lib/roles";
import {
  useFacultyProjectsByStudent,
  useFacultyProjectsByTeacher,
  useLinkedStudentRecord,
  useLinkedTeacherRecord,
  useSemester,
  useVcAccessibleRepositoriesForViewer,
  useVcUserActivity,
} from "../../services/useApi";
const SURFACE_CARD =
  "rounded-3xl border border-(--color-light-card-border) bg-(--color-light-card-bg) shadow-xs dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)";
const SOFT_PANEL =
  "rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary";

function compactNumber(value) {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat(undefined, {
    notation: n >= 10000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(Number.isFinite(n) ? n : 0);
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

function getEventDate(event) {
  const raw =
    event?.createdAt ??
    event?.timestamp ??
    event?.time ??
    event?.date ??
    event?.occurredAt ??
    event?.updatedAt;
  const date = raw ? new Date(raw) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function getEventLabel(event) {
  return (
    event?.message ||
    event?.title ||
    event?.action ||
    event?.eventType ||
    event?.type ||
    event?.name ||
    "Repository activity"
  );
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function initialsFromName(name) {
  return String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function StatTile({ icon, label, value, hint, paletteIndex = 0 }) {
  const palette =
    REPO_OVERVIEW_STAT_PALETTES[
      paletteIndex % REPO_OVERVIEW_STAT_PALETTES.length
    ];
  return (
    <RepoOverviewStatCard
      icon={icon}
      label={label}
      value={compactNumber(value)}
      hint={hint}
      palette={palette}
    />
  );
}

function PanelHeading({ eyebrow, title, body, action }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted dark:text-dark-muted">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-1 text-lg font-semibold text-primary dark:text-dark-primary">
          {title}
        </h2>
        {body ? (
          <p className="mt-1 text-sm leading-6 text-secondary dark:text-dark-secondary">
            {body}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

function DashboardTooltip({ active, label, payload, suffix = "" }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) px-3 py-2 shadow-md dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted dark:text-dark-muted">
        {label}
      </p>
      {payload.map((entry) => (
        <div
          key={entry.dataKey}
          className="mt-1 flex items-center gap-2 text-xs text-primary dark:text-dark-primary"
        >
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span>{`${entry.value}${suffix}`}</span>
        </div>
      ))}
    </div>
  );
}

export default function StudentDashboard() {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const chartFillId = useId().replace(/:/g, "");
  const location = useLocation();
  const { user } = useAuth();
  const shellBase = resolveShellBasePath(location.pathname, user?.role);
  const isTeacherShell = shellBase === "/teacher";
  const profilePath =
    shellBase === "/student" || shellBase === "/teacher"
      ? `${shellBase}/profile`
      : `${shellBase}/settings`;
  const { data: student, isFetching: studentFetching } = useLinkedStudentRecord(
    user ?? null,
    {
      notifyOnError: false,
      enabled: Boolean(user) && !isTeacherShell,
    },
  );
  const { data: teacher, isFetching: teacherFetching } = useLinkedTeacherRecord(user ?? null, {
    notifyOnError: false,
    enabled: Boolean(user) && isTeacherShell,
  });
  const linkedRecord = isTeacherShell ? teacher : student;
  const semesterId =
    linkedRecord?.semesterId ||
    linkedRecord?.semester?.id ||
    linkedRecord?.currentSemesterId ||
    null;
  const { data: semester } = useSemester(semesterId, {
    enabled: Boolean(semesterId),
    notifyOnError: false,
  });
  const { data: studentProjectsPayload } = useFacultyProjectsByStudent(student?.id, {
    enabled: Boolean(!isTeacherShell && student?.id),
    notifyOnError: false,
  });
  const { data: teacherProjectsPayload } = useFacultyProjectsByTeacher(teacher?.id, {
    enabled: Boolean(isTeacherShell && teacher?.id),
    notifyOnError: false,
  });
  const activityUsernameCandidates = useMemo(
    () => [
      user?.username,
      user?.user_name,
      user?.preferred_username,
      user?.preferredUsername,
      linkedRecord?.username,
      linkedRecord?.userName,
      linkedRecord?.user_name,
    ],
    [linkedRecord, user],
  );
  const activityUsername =
    activityUsernameCandidates.find((value) => String(value ?? "").trim()) ||
    "";
  const avatarSrc =
    user?.photoUrl ||
    user?.photo_url ||
    linkedRecord?.profilePicture ||
    linkedRecord?.photoUrl ||
    linkedRecord?.photo_url ||
    "";
  const ownerKey =
    linkedRecord?.linkedApplicationUserId ||
    linkedRecord?.applicationUserId ||
    linkedRecord?.gatewayUserId ||
    user?.id ||
    "";
  const { data: repositoriesPayload } = useVcAccessibleRepositoriesForViewer(ownerKey, {
    enabled: Boolean(ownerKey || activityUsername),
    activityUsernameFallback: activityUsername,
    notifyOnError: false,
  });
  const { data: activityPayload, isFetching: activityFetching } = useVcUserActivity(activityUsernameCandidates, {
    enabled: activityUsernameCandidates.some((value) =>
      Boolean(String(value ?? "").trim()),
    ),
    notifyOnError: false,
  });

  const labelName =
    user?.fullName ||
    [linkedRecord?.firstName, linkedRecord?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    user?.username ||
    user?.email ||
    "";
  const avatarInitials = initialsFromName(labelName);

  const projects = useMemo(
    () =>
      normalizeListPayload(
        isTeacherShell ? teacherProjectsPayload : studentProjectsPayload,
        "projects",
      ),
    [isTeacherShell, studentProjectsPayload, teacherProjectsPayload],
  );
  const repositories = useMemo(
    () => normalizeListPayload(repositoriesPayload, "repositories", "repos"),
    [repositoriesPayload],
  );
  const activityEvents = useMemo(
    () => normalizeListPayload(activityPayload, "activities", "events"),
    [activityPayload],
  );
  const activeDays = useMemo(() => {
    const days = new Set();
    activityEvents.forEach((event) => {
      const date = getEventDate(event);
      if (!date) return;
      days.add(format(startOfDay(date), "yyyy-MM-dd"));
    });
    return days.size;
  }, [activityEvents]);

  const focusSeries = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(i18n.language, {
      weekday: "short",
    });
    const end = startOfDay(new Date());
    const start = subDays(end, 6);
    const counts = new Map();
    activityEvents.forEach((event) => {
      const date = getEventDate(event);
      if (!date) return;
      const key = format(startOfDay(date), "yyyy-MM-dd");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    return eachDayOfInterval({ start, end }).map((date) => {
      const key = format(date, "yyyy-MM-dd");
      return {
        key,
        label: formatter.format(date),
        events: counts.get(key) ?? 0,
      };
    });
  }, [activityEvents, i18n.language]);

  const semesterDates = useMemo(() => {
    const startRaw =
      semester?.startDate ||
      semester?.academicYear?.startDate ||
      linkedRecord?.semesterStartDate ||
      linkedRecord?.semesterDetails?.startDate ||
      linkedRecord?.semesterDetails?.academicYear?.startDate ||
      linkedRecord?.semesterAcademicYear?.startDate ||
      linkedRecord?.academicYear?.startDate;
    const endRaw =
      semester?.endDate ||
      semester?.academicYear?.endDate ||
      linkedRecord?.semesterEndDate ||
      linkedRecord?.semesterDetails?.endDate ||
      linkedRecord?.semesterDetails?.academicYear?.endDate ||
      linkedRecord?.semesterAcademicYear?.endDate ||
      linkedRecord?.academicYear?.endDate;
    const start = startRaw ? new Date(startRaw) : null;
    const end = endRaw ? new Date(endRaw) : null;
    if (
      !start ||
      !end ||
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      start.getTime() >= end.getTime()
    ) {
      return null;
    }
    return { start, end };
  }, [semester, linkedRecord]);
  const semesterProgress = useMemo(() => {
    if (!semesterDates) {
      return { percent: 0, daysRemaining: null, label: "" };
    }
    const today = startOfDay(new Date());
    const start = startOfDay(semesterDates.start);
    const end = startOfDay(semesterDates.end);
    const total = Math.max(1, end.getTime() - start.getTime());
    const elapsed = today.getTime() - start.getTime();
    const daysRemaining = Math.max(
      0,
      Math.ceil((end.getTime() - today.getTime()) / 86400000),
    );
    return {
      percent: clampPercent((elapsed / total) * 100),
      daysRemaining,
      label: `${format(start, "MMM d, yyyy")} - ${format(end, "MMM d, yyyy")}`,
    };
  }, [semesterDates]);
  const completionPercent = semesterProgress.percent;
  const isFetching = isTeacherShell ? teacherFetching : studentFetching;
  const linkedState = linkedRecord?.id
    ? t("studentDashboard.snapshot.linked")
    : isFetching
      ? t("studentDashboard.snapshot.loading")
      : t("studentDashboard.snapshot.pending");
  const chartTick =
    theme === "dark"
      ? "var(--color-dark-text-muted)"
      : "var(--color-light-text-muted)";
  const chartGrid =
    theme === "dark" ? "rgba(77, 153, 255, 0.18)" : "rgba(51, 133, 255, 0.16)";
  const chartRingRemainder =
    theme === "dark" ? "rgba(77, 153, 255, 0.16)" : "rgba(51, 133, 255, 0.12)";

  const recentActivities = useMemo(
    () =>
      activityEvents
        .slice()
        .sort((a, b) => (getEventDate(b)?.getTime() ?? 0) - (getEventDate(a)?.getTime() ?? 0))
        .slice(0, 4)
        .map((event, index) => {
          const date = getEventDate(event);
          return {
            id: event?.id ?? event?.uuid ?? `${index}-${getEventLabel(event)}`,
            time: date
              ? new Intl.DateTimeFormat(i18n.language, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(date)
              : t("studentDashboard.snapshot.notAvailable"),
            message: getEventLabel(event),
          };
        }),
    [activityEvents, i18n.language, t],
  );

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto bg-white p-4 md:p-5 dark:bg-dark-card-bg">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-primary dark:text-dark-primary">
          {t("studentDashboard.header.title", { name: labelName })}
        </h1>
        <p className="text-sm text-secondary dark:text-dark-secondary">
          {t("studentDashboard.header.description")}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-4">
        <StatTile
          icon={FolderGit2}
          label={t("studentSelfProfile.stats.repositories")}
          value={repositories.length}
          hint={t("studentDashboard.metrics.workspaceHint")}
          paletteIndex={0}
        />
        <StatTile
          icon={GitPullRequest}
          label={t("studentSelfProfile.stats.projects")}
          value={projects.length}
          hint={t("studentDashboard.priorities.items.reviewBody")}
          paletteIndex={3}
        />
        <StatTile
          icon={Activity}
          label={t("studentDashboard.metrics.activeDays")}
          value={activeDays}
          hint={t("studentDashboard.metrics.activeDaysHint")}
          paletteIndex={2}
        />
        <StatTile
          icon={CalendarDays}
          label={t("studentDashboard.progress.title")}
          value={`${completionPercent}%`}
          hint={semesterProgress.label || t("studentDashboard.progress.subtitle")}
          paletteIndex={1}
        />
      </div>

      <div className="grid gap-5 lg:gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-5">
            <section className={`${SURFACE_CARD} p-4 md:p-5`}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <Link
                    to={profilePath}
                    className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-(--color-light-card-border) bg-light-app-tertiary p-1 shadow-sm dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary"
                  >
                    <Avatar
                      src={avatarSrc}
                      initials={avatarInitials}
                      alt={labelName}
                      sizeClass="flex size-full items-center justify-center rounded-xl text-lg"
                    />
                  </Link>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-lg font-semibold text-primary dark:text-dark-primary">
                        {labelName}
                      </h2>
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                        {linkedState}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary px-3 py-2 text-xs text-secondary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-secondary">
                        {t("studentDashboard.header.summaryProgram")}:{" "}
                        <strong className="font-semibold text-primary dark:text-dark-primary">
                          {linkedRecord?.department?.name ||
                            (typeof linkedRecord?.department === "string"
                              ? linkedRecord.department
                              : "") ||
                            t("studentDashboard.snapshot.notAvailable")}
                        </strong>
                      </span>
                      <span className="rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary px-3 py-2 text-xs text-secondary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-secondary">
                        {t("studentDashboard.header.summaryCode")}:{" "}
                        <strong className="font-mono font-semibold text-primary dark:text-dark-primary">
                          {linkedRecord?.code || "—"}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
                <Link to={`${shellBase}/workspace`} className="shrink-0">
                  <Button
                    type="button"
                    variant="primary"
                    icon={<FolderGit2 strokeWidth={1.9} aria-hidden />}
                    className="w-full gap-2 sm:w-auto"
                  >
                    {t("studentDashboard.quick.workspace")}
                  </Button>
                </Link>
              </div>
            </section>

            <section className="grid gap-5">
              <div className={`${SURFACE_CARD} p-4 md:p-5`}>
                <PanelHeading
                  eyebrow={t("studentDashboard.momentum.eyebrow")}
                  title={t("studentDashboard.momentum.title")}
                  body={
                    activityFetching
                      ? t("studentDashboard.snapshot.loading")
                      : t("studentDashboard.momentum.subtitle")
                  }
                />
                {activityEvents.length ? (
                  <div className="mt-5 h-72 w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={focusSeries}
                        margin={{ top: 10, right: 8, left: -10, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id={`student-focus-${chartFillId}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="var(--color-chart-blue-primary)"
                              stopOpacity={0.32}
                            />
                            <stop
                              offset="100%"
                              stopColor="var(--color-chart-blue-primary)"
                              stopOpacity={0.02}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          vertical={false}
                          stroke={chartGrid}
                          strokeDasharray="4 8"
                        />
                        <XAxis
                          dataKey="label"
                          tickLine={false}
                          axisLine={false}
                          tick={{
                            fill: chartTick,
                            fontSize: 11,
                          }}
                        />
                        <YAxis
                          width={34}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                          tick={{
                            fill: chartTick,
                            fontSize: 11,
                          }}
                        />
                        <Tooltip
                          content={<DashboardTooltip suffix=" events" />}
                        />
                        <Area
                          type="monotone"
                          dataKey="events"
                          stroke="var(--color-chart-blue-primary)"
                          strokeWidth={2.5}
                          fill={`url(#student-focus-${chartFillId})`}
                          dot={false}
                          activeDot={{
                            r: 4,
                            fill: "var(--color-chart-blue-primary)",
                            strokeWidth: 0,
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className={`${SOFT_PANEL} mt-5 p-6 text-sm leading-6 text-secondary dark:text-dark-secondary`}>
                    {t("studentSelfProfile.activityFeed.empty")}
                  </div>
                )}
              </div>
            </section>

          </div>

          <aside className="space-y-5">
            <section className={`${SURFACE_CARD} p-4`}>
              <PanelHeading
                eyebrow={t("studentDashboard.progress.eyebrow")}
                title={t("studentDashboard.progress.title")}
                body={t("studentDashboard.progress.subtitle")}
              />
              <div className="mt-4 grid place-items-center">
                <div className="relative h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: t("studentDashboard.progress.complete"),
                            value: completionPercent,
                          },
                          {
                            name: t("studentDashboard.progress.remaining"),
                            value: 100 - completionPercent,
                          },
                        ]}
                        dataKey="value"
                        innerRadius={62}
                        outerRadius={88}
                        stroke="none"
                        startAngle={90}
                        endAngle={-270}
                      >
                        <Cell fill="var(--color-chart-blue-primary)" />
                        <Cell fill={chartRingRemainder} />
                      </Pie>
                      <Tooltip content={<DashboardTooltip suffix="%" />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-semibold tracking-tight text-primary dark:text-dark-primary">
                      {completionPercent}%
                    </span>
                    <span className="mt-1 text-xs text-secondary dark:text-dark-secondary">
                      {t("studentDashboard.progress.complete")}
                    </span>
                    {semesterProgress.daysRemaining != null ? (
                      <span className="mt-1 text-[11px] text-muted dark:text-dark-muted">
                        {t("studentDashboard.progress.daysRemaining", {
                          count: semesterProgress.daysRemaining,
                        })}
                      </span>
                    ) : null}
                  </div>
                </div>
                {semesterProgress.label ? (
                  <p className="text-center text-xs text-secondary dark:text-dark-secondary">
                    {semesterProgress.label}
                  </p>
                ) : null}
              </div>
            </section>

            <section className={`${SURFACE_CARD} p-4`}>
              <PanelHeading
                eyebrow={t("studentDashboard.actions.eyebrow")}
                title={t("studentDashboard.actions.title")}
              />
              <div className="mt-4">
                <div className="relative ps-6">
                  <span className="absolute inset-y-0 start-[0.42rem] w-px bg-light-divider dark:bg-dark-divider" />
                  <div className="space-y-4">
                    {(recentActivities.length
                      ? recentActivities
                      : [
                          {
                            id: "empty",
                            time: t("studentDashboard.snapshot.notAvailable"),
                            message: t("studentSelfProfile.activityFeed.empty"),
                          },
                        ]).map((item) => (
                      <div key={item.id} className="relative min-w-0">
                        <span className="absolute -start-6 top-1.5 size-2 rounded-full bg-(--color-light-text-muted) dark:bg-(--color-dark-text-muted)" />
                        <p className="text-xs text-secondary dark:text-dark-secondary">
                          {item.time}
                        </p>
                        <p className="mt-1 truncate text-sm text-primary dark:text-dark-primary">
                          {item.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <Link
                  to={`${shellBase}/notifications`}
                  className="mt-5 inline-flex text-xs font-medium text-(--color-chart-blue-primary) transition-colors hover:underline dark:text-(--color-chart-blue-secondary)"
                >
                  {t("studentDashboard.changelog.view")}
                </Link>
              </div>
            </section>
          </aside>
      </div>
    </div>
  );
}
