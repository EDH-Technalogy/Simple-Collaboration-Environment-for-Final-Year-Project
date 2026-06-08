import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  BookOpenCheck,
  Building2,
  CalendarDays,
  CircleAlert,
  FolderGit2,
  GraduationCap,
  Landmark,
  Loader2,
  School,
  UsersRound,
} from "lucide-react";
import SettingsSectionCard from "../../components/SettingsSectionCard";
import RepoOverviewStatCard from "../../components/repo/RepoOverviewStatCard";
import { REPO_OVERVIEW_STAT_PALETTES } from "../../components/repo/repoOverviewStatPalettes";
import AuthorDashboardSummary from "../../components/author/AuthorDashboardSummary";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/themContext";
import {
  useBatches,
  useDepartments,
  useFaculties,
  useFacultyGroups,
  useFacultyProjects,
  useStudentsPage,
  useTeachersPage,
} from "../../services/useApi";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function pageTotal(page, fallback = 0) {
  const total = Number(page?.totalElements ?? page?.total ?? page?.count);
  if (Number.isFinite(total) && total >= 0) return total;
  return fallback;
}

function compactNumber(value) {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat(undefined, {
    notation: n >= 10000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(Number.isFinite(n) ? n : 0);
}

function normalizedStatus(row, fallback = "active") {
  return String(
    row?.status ??
      row?.state ??
      row?.projectStatus ??
      row?.project_status ??
      fallback,
  )
    .trim()
    .toLowerCase();
}

function titleOf(row) {
  return (
    row?.projectName ??
    row?.project_name ??
    row?.title ??
    row?.name ??
    row?.repositoryName ??
    "Untitled"
  );
}

function fullName(row) {
  const direct = row?.fullName ?? row?.name ?? "";
  const composed = [row?.firstName, row?.lastName].filter(Boolean).join(" ");
  return String(composed || direct || "Unassigned").trim();
}

function facultyName(row) {
  const value =
    row?.facultyName ??
    row?.faculty_name ??
    row?.faculty?.name ??
    row?.faculty?.title ??
    row?.faculty ??
    "Unassigned";
  return typeof value === "object"
    ? "Unassigned"
    : String(value || "Unassigned");
}

function departmentName(row) {
  const value =
    row?.departmentName ??
    row?.department_name ??
    row?.department?.name ??
    row?.department ??
    "Unassigned";
  return typeof value === "object"
    ? "Unassigned"
    : String(value || "Unassigned");
}

function dueDateOf(row) {
  const raw =
    row?.deadline ??
    row?.dueDate ??
    row?.due_date ??
    row?.endDate ??
    row?.end_date ??
    row?.submissionDate;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function projectRoute(project) {
  if (project?.id != null && project?.id !== "") {
    return `/admin/projects/workspace/${encodeURIComponent(project.id)}`;
  }
  const owner =
    project?.owner ??
    project?.repositoryOwner ??
    project?.repoOwner ??
    project?.repository?.owner;
  const repo =
    project?.repo ??
    project?.repositoryName ??
    project?.repoName ??
    project?.repository?.name;
  if (owner && repo) {
    return `/admin/projects/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  }
  return "/admin/projects?tab=projects";
}

function daysUntil(date) {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / 86400000);
}

function countBy(rows, selector, limit = 5) {
  const counts = new Map();
  rows.forEach((row) => {
    const key = selector(row);
    if (!key) return;
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return [...counts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
    .slice(0, limit);
}

const CHART_HEX = {
  blue: "#0066ff",
  teal: "#0f766e",
  violet: "#7c3aed",
  orange: "#ea580c",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  slate: "#64748b",
};

const PIE_VARIANT = [
  CHART_HEX.blue,
  CHART_HEX.violet,
  CHART_HEX.teal,
  CHART_HEX.orange,
  "#0891b2",
  CHART_HEX.slate,
];

function statusData(projects) {
  const labels = [
    ["active", "Active", CHART_HEX.blue],
    ["ongoing", "Ongoing", CHART_HEX.blue],
    ["progress", "In progress", CHART_HEX.blue],
    ["pending", "Pending", CHART_HEX.warning],
    ["review", "Review", CHART_HEX.violet],
    ["completed", "Completed", CHART_HEX.success],
    ["cancelled", "Cancelled", CHART_HEX.error],
  ];
  const counts = new Map();
  projects.forEach((project) => {
    const raw = normalizedStatus(project, "active");
    const match = labels.find(([key]) => raw.includes(key));
    const label = match?.[1] ?? "Other";
    const color = match?.[2] ?? CHART_HEX.slate;
    const prev = counts.get(label) ?? { status: label, value: 0, color };
    counts.set(label, { ...prev, value: prev.value + 1 });
  });
  return [...counts.values()].sort((a, b) => b.value - a.value);
}

function ChartTooltipBody({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[180px] rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) px-3.5 py-2.5 shadow-lg backdrop-blur-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
      {label ? (
        <p className="mb-2 border-b border-light-divider pb-2 text-xs font-semibold text-primary dark:border-dark-divider dark:text-dark-primary">
          {label}
        </p>
      ) : null}
      <ul className="space-y-1.5">
        {payload.map((entry, index) => (
          <li
            key={`${entry.name}-${index}`}
            className="flex items-center justify-between gap-4 text-[11px]"
          >
            <span className="flex items-center gap-2 text-muted dark:text-dark-muted">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: entry.color || entry.fill || CHART_HEX.blue,
                }}
                aria-hidden
              />
              {entry.name}
            </span>
            <span className="font-semibold tabular-nums text-primary dark:text-dark-primary">
              {entry.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatTile({ icon, label, value, hint, paletteIndex = 0, loading }) {
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
    >
      {loading ? (
        <div className="mt-1 flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-muted dark:text-dark-muted" />
          <span className="text-xs font-medium text-secondary dark:text-dark-secondary">
            Loading
          </span>
        </div>
      ) : null}
    </RepoOverviewStatCard>
  );
}

function Panel({ icon, title, subtitle, children, className = "" }) {
  return (
    <SettingsSectionCard
      icon={icon}
      title={title}
      description={subtitle}
      className={`rounded-3xl border-(--color-light-card-border) shadow-xs dark:border-(--color-dark-card-border) ${className}`}
    >
      {children}
    </SettingsSectionCard>
  );
}

function ProjectStatusPanel({ projects, chart }) {
  const data = statusData(projects);
  const total = projects.length;

  return (
    <Panel
      icon={BarChart3}
      title="Project Status"
      subtitle="Current project records from faculty-service"
      className="min-h-[290px] lg:col-span-2"
    >
      <div className="mb-3 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-tight text-primary dark:text-dark-primary">
          {compactNumber(total)}
        </span>
        <span className="text-xs font-medium text-secondary dark:text-dark-secondary">
          total projects
        </span>
      </div>
      {data.length ? (
        <div className="h-[250px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              barSize={34}
              margin={{ top: 8, right: 12, left: -8, bottom: 8 }}
            >
              <CartesianGrid
                vertical={false}
                stroke={chart.gridColor}
                strokeDasharray="4 6"
              />
              <XAxis
                dataKey="status"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: chart.axisTickColor }}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: chart.axisTickColor }}
                width={40}
              />
              <Tooltip
                cursor={{ fill: chart.hoverCursor, radius: chart.cursorRadius }}
                content={<ChartTooltipBody />}
                animationDuration={200}
              />
              <Legend wrapperStyle={{ paddingTop: 14, fontSize: 12 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {data.map((row) => (
                  <Cell key={row.status} fill={row.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState text="No project records returned yet." />
      )}
    </Panel>
  );
}

function DepartmentDistributionPanel({ students, chart }) {
  const data = countBy(students, departmentName, 6);

  return (
    <Panel
      icon={UsersRound}
      title="Student Distribution"
      subtitle="Largest departments by registered students"
      className="min-h-[290px]"
    >
      {data.length ? (
        <div className="flex flex-col items-center gap-4">
          <div className="relative mx-auto h-[210px] w-full max-w-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                <Tooltip cursor={false} content={<ChartTooltipBody />} />
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="54%"
                  outerRadius="86%"
                  paddingAngle={2}
                  strokeWidth={2}
                  stroke={chart.pieStroke}
                  animationBegin={100}
                  animationDuration={900}
                  animationEasing="ease-out"
                  isAnimationActive
                >
                  {data.map((row, index) => (
                    <Cell
                      key={row.name}
                      fill={PIE_VARIANT[index % PIE_VARIANT.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full space-y-2">
            {data.map((row, index) => (
              <div key={row.name} className="flex items-center gap-2 text-xs">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    background: PIE_VARIANT[index % PIE_VARIANT.length],
                  }}
                />
                <span className="min-w-0 flex-1 truncate text-secondary dark:text-dark-secondary">
                  {row.name}
                </span>
                <span className="font-semibold text-primary dark:text-dark-primary">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState text="No student records returned yet." />
      )}
    </Panel>
  );
}

function projectStatusMeta(project) {
  const status = normalizedStatus(project, "active");
  if (status.includes("completed")) {
    return {
      label: "Completed",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200",
    };
  }
  if (status.includes("review")) {
    return {
      label: "Review",
      className:
        "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200",
    };
  }
  if (status.includes("pending")) {
    return {
      label: "Pending",
      className:
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200",
    };
  }
  if (status.includes("cancelled") || status.includes("rejected")) {
    return {
      label: "Cancelled",
      className:
        "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200",
    };
  }
  if (status.includes("progress") || status.includes("ongoing")) {
    return {
      label: "In progress",
      className:
        "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-200",
    };
  }
  return {
    label: status || "Active",
    className:
      "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-400/20 dark:bg-slate-500/10 dark:text-slate-200",
  };
}

function DepartmentPanel({ departments, teachers }) {
  const rows = countBy(teachers, departmentName, 6);
  return (
    <Panel
      icon={Building2}
      title="Departments"
      subtitle={`${departments.length} departments configured`}
    >
      <div className="space-y-3">
        {rows.length ? (
          rows.map((row) => {
            const pct = Math.round(
              (row.value / Math.max(1, teachers.length)) * 100,
            );
            return (
              <div key={row.name}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="truncate text-secondary dark:text-dark-secondary">
                    {row.name}
                  </span>
                  <span className="font-semibold text-primary dark:text-dark-primary">
                    {row.value} staff
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-light-app-tertiary dark:bg-dark-app-tertiary">
                  <div
                    className="h-full rounded-full bg-(--color-light-input-border-focus) transition-[width] duration-700 ease-out dark:bg-(--color-dark-input-border-focus)"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <EmptyState text="No teacher placement data returned yet." />
        )}
      </div>
    </Panel>
  );
}

function RecentProjectsPanel({ projects, onOpenProject }) {
  const rows = [...projects]
    .sort((a, b) => {
      const da = new Date(a?.createdAt ?? a?.createAt ?? a?.updatedAt ?? 0);
      const db = new Date(b?.createdAt ?? b?.createAt ?? b?.updatedAt ?? 0);
      return db.getTime() - da.getTime();
    })
    .slice(0, 5);

  return (
    <Panel
      icon={FolderGit2}
      title="Recent Projects"
      subtitle="Latest faculty project records"
    >
      <div className="space-y-2">
        {rows.length ? (
          rows.map((project) => {
            const status = projectStatusMeta(project);
            return (
              <button
                type="button"
                key={project?.id ?? titleOf(project)}
                onClick={() => onOpenProject(project)}
                className="w-full rounded-2xl border border-(--color-light-card-border) bg-light-app-tertiary p-3 text-left transition-colors hover:bg-light-app-tertiary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-light-input-border-focus) focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-light-card-bg) dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:hover:bg-dark-app-tertiary/80 dark:focus-visible:ring-(--color-dark-input-border-focus) dark:focus-visible:ring-offset-(--color-dark-card-bg)"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-primary dark:text-dark-primary">
                      {titleOf(project)}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted dark:text-dark-muted">
                      {fullName(project?.teacher)} · {fullName(project?.student)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${status.className}`}
                  >
                    {status.label}
                  </span>
                </div>
              </button>
            );
          })
        ) : (
          <EmptyState text="No project records returned yet." />
        )}
      </div>
    </Panel>
  );
}

function AcademicCalendarPanel({ projects, batches, onOpenProject }) {
  const upcoming = projects
    .map((project) => ({ project, due: dueDateOf(project) }))
    .filter((row) => row.due && daysUntil(row.due) >= 0)
    .sort((a, b) => a.due.getTime() - b.due.getTime())
    .slice(0, 3);
  const month = new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <Panel
      icon={CalendarDays}
      title={month}
      subtitle={`${batches.length} intake batches tracked`}
    >
      <div className="space-y-2">
        {upcoming.length ? (
          upcoming.map(({ project, due }) => (
            <button
              type="button"
              key={`${project?.id ?? titleOf(project)}-${due.toISOString()}`}
              onClick={() => onOpenProject(project)}
              className="w-full rounded-2xl border border-sky-200/80 bg-sky-50 p-3 text-left transition-colors hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-light-input-border-focus) focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-light-card-bg) dark:border-sky-500/20 dark:bg-sky-500/10 dark:hover:bg-sky-500/15 dark:focus-visible:ring-(--color-dark-input-border-focus) dark:focus-visible:ring-offset-(--color-dark-card-bg)"
            >
              <p className="text-sm font-semibold text-primary dark:text-dark-primary">
                {titleOf(project)}
              </p>
              <p className="mt-1 text-xs text-secondary dark:text-dark-secondary">
                Due in {daysUntil(due)} day(s) ·{" "}
                {new Intl.DateTimeFormat(undefined, {
                  month: "short",
                  day: "numeric",
                }).format(due)}
              </p>
            </button>
          ))
        ) : (
          <EmptyState text="No upcoming project deadlines found." />
        )}
      </div>
    </Panel>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-(--color-light-card-border) bg-light-app-tertiary/60 px-4 py-6 text-center text-xs text-muted dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary/60 dark:text-dark-muted">
      {text}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const studentsPage = useStudentsPage(
    { page: 0, pageSize: 200, notifyOnError: false },
    { staleTime: 60_000 },
  );
  const teachersPage = useTeachersPage(
    { page: 0, pageSize: 200, notifyOnError: false },
    { staleTime: 60_000 },
  );
  const departmentsQuery = useDepartments({ staleTime: 60_000 });
  const facultiesQuery = useFaculties({ staleTime: 60_000 });
  const projectsQuery = useFacultyProjects(
    { page: 0, size: 200 },
    { staleTime: 60_000 },
  );
  const groupsQuery = useFacultyGroups(
    { page: 0, size: 200 },
    { staleTime: 60_000 },
  );
  const batchesQuery = useBatches({ staleTime: 60_000 });

  const students = studentsPage.data?.content ?? [];
  const teachers = teachersPage.data?.content ?? [];
  const departments = asArray(departmentsQuery.data);
  const faculties = asArray(facultiesQuery.data);
  const projects = asArray(projectsQuery.data);
  const groups = asArray(groupsQuery.data);
  const batches = asArray(batchesQuery.data);

  const isLoading =
    studentsPage.isLoading ||
    teachersPage.isLoading ||
    departmentsQuery.isLoading ||
    facultiesQuery.isLoading ||
    projectsQuery.isLoading;
  const hasError =
    studentsPage.isError ||
    teachersPage.isError ||
    departmentsQuery.isError ||
    facultiesQuery.isError ||
    projectsQuery.isError;
  const chart = {
    axisTickColor: isDark ? "#94a3b8" : "#64748b",
    gridColor: isDark ? "rgba(148,163,184,0.12)" : "rgba(148,163,184,0.22)",
    hoverCursor: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)",
    pieStroke: isDark ? "#111827" : "#ffffff",
    cursorRadius: 10,
  };

  const cards = useMemo(
    () => [
      {
        icon: GraduationCap,
        label: "Total students",
        value: pageTotal(studentsPage.data, students.length),
        hint: "Registered student records from faculty-service",
        paletteIndex: 0,
      },
      {
        icon: FolderGit2,
        label: "Active projects",
        value: projects.filter(
          (p) => !["completed", "cancelled"].includes(normalizedStatus(p)),
        ).length,
        hint: `${projects.length} total project records`,
        paletteIndex: 3,
      },
      {
        icon: UsersRound,
        label: "Teaching staff",
        value: pageTotal(teachersPage.data, teachers.length),
        hint: "Teacher records connected to departments",
        paletteIndex: 2,
      },
      {
        icon: Building2,
        label: "Departments",
        value: departments.length,
        hint: `${faculties.length} faculties, ${batches.length} batches`,
        paletteIndex: 1,
      },
    ],
    [
      batches.length,
      departments.length,
      faculties.length,
      projects,
      students.length,
      studentsPage.data,
      teachers.length,
      teachersPage.data,
    ],
  );
  const openProject = (project) => {
    navigate(projectRoute(project));
  };

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto bg-white p-4 md:p-5 dark:bg-dark-card-bg">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-primary dark:text-dark-primary">
          Academic Dashboard
        </h1>
        <p className="text-sm text-secondary dark:text-dark-secondary">
          {user?.role === "admin"
            ? "Live overview from faculty-service records."
            : "Role-aware academic overview from the connected services."}
        </p>
      </div>

      {hasError ? (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
          <CircleAlert className="h-4 w-4" />
          Some dashboard data could not be loaded. Available cards still use the
          responses that succeeded.
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-4">
        {cards.map((card, idx) => (
          <StatTile
            key={card.label}
            {...card}
            paletteIndex={card.paletteIndex ?? idx}
            loading={isLoading}
          />
        ))}
      </div>

      <div className="grid gap-5 lg:gap-6 xl:grid-cols-3">
        <ProjectStatusPanel projects={projects} chart={chart} />
        <DepartmentDistributionPanel students={students} chart={chart} />
      </div>

      <div className="grid gap-5 lg:gap-6 xl:grid-cols-3">
        <DepartmentPanel departments={departments} teachers={teachers} />
        <RecentProjectsPanel projects={projects} onOpenProject={openProject} />
        <AcademicCalendarPanel
          projects={projects}
          batches={batches}
          onOpenProject={openProject}
        />
      </div>

      <AuthorDashboardSummary />

      <div className="grid gap-3 md:grid-cols-3 xl:gap-4">
        <StatTile
          icon={School}
          label="Faculties"
          value={faculties.length}
          hint="Configured faculty records"
          paletteIndex={0}
          loading={facultiesQuery.isLoading}
        />
        <StatTile
          icon={BookOpenCheck}
          label="Project groups"
          value={groups.length}
          hint="Student collaboration groups"
          paletteIndex={3}
          loading={groupsQuery.isLoading}
        />
        <StatTile
          icon={Landmark}
          label="Academic batches"
          value={batches.length}
          hint="Intake cohorts in registry"
          paletteIndex={2}
          loading={batchesQuery.isLoading}
        />
      </div>
    </div>
  );
}
