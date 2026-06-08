import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import {
  BarChart3,
  BookMarked,
  CheckCircle2,
  GitCommitHorizontal,
  GitPullRequest,
  LayoutList,
  ListTodo,
  Milestone as MilestoneIcon,
  PieChart as PieChartIcon,
  Users,
} from "lucide-react";
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
import { useTranslation } from "react-i18next";
import SettingsSectionCard from "../../components/SettingsSectionCard";
import RepoOverviewStatCard from "../../components/repo/RepoOverviewStatCard";
import { REPO_OVERVIEW_STAT_PALETTES } from "../../components/repo/repoOverviewStatPalettes";
import { useTheme } from "../../context/themContext";
import {
  useVcRepoMilestones,
  useVcRepoStatistics,
  useVcRepoTasks,
} from "../../services/useApi";

/** Aligned with `index.css` @theme chart tokens — Recharts renders SVG reliably with hex fills. */
const CHART_HEX = {
  blue: "#0066ff",
  blueSecondary: "#3385ff",
  teal: "#0f766e",
  violet: "#7c3aed",
  orange: "#ea580c",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
};

const STACK_COLORS = {
  commits: CHART_HEX.blue,
  pushes: CHART_HEX.teal,
  pulls: CHART_HEX.violet,
  tasks: CHART_HEX.orange,
};

const TASK_STATUS_KEYS = ["open", "progress", "review", "completed", "cancelled"];

const TASK_STATUS_HEX = {
  open: CHART_HEX.blueSecondary,
  progress: CHART_HEX.warning,
  review: CHART_HEX.violet,
  completed: CHART_HEX.success,
  cancelled: CHART_HEX.error,
};

/** Matches `StudentRepoTasks` normalization — pie labels reuse `studentRepo.tasks.status.*`. */
function simplifyTaskStatus(value) {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return "open";
  if (raw === "in_progress" || raw === "in-progress") return "progress";
  if (raw === "in_review" || raw === "in-review") return "review";
  if (
    raw === "complete" ||
    raw === "completed" ||
    raw === "done" ||
    raw === "closed" ||
    raw.includes("complete")
  )
    return "completed";
  return raw.includes("cancel") ? "cancelled" : raw;
}

function simplifyMilestoneStatus(value) {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw.includes("complete") || raw === "done" || raw === "closed") {
    return "completed";
  }
  return raw || "open";
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

function numberValue(raw) {
  const n = Number(raw ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function optionalNumber(raw) {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function objectNumberValue(source, ...keys) {
  const wanted = new Set(
    keys.map((key) =>
      String(key)
        .replace(/[^a-z0-9]/gi, "")
        .toLowerCase(),
    ),
  );
  for (const key of keys) {
    const n = optionalNumber(source?.[key]);
    if (n != null) return n;
  }
  if (source && typeof source === "object") {
    for (const [key, value] of Object.entries(source)) {
      const normalized = String(key)
        .replace(/[^a-z0-9]/gi, "")
        .toLowerCase();
      if (wanted.has(normalized)) {
        const n = optionalNumber(value);
        if (n != null) return n;
      }
    }
  }
  return null;
}

function boundedPercent(raw) {
  return Math.max(0, Math.min(100, numberValue(raw)));
}

function embeddedMilestoneTasks(milestone) {
  const value =
    milestone?.tasks ??
    milestone?.issues ??
    milestone?.taskList ??
    milestone?.task_list ??
    milestone?.milestoneTasks ??
    milestone?.milestone_tasks;
  return Array.isArray(value) ? value : [];
}

function taskMilestoneNumber(task) {
  const milestone = task?.milestone;
  return optionalNumber(
    task?.milestoneNumber ??
      task?.milestone_number ??
      task?.milestoneNo ??
      task?.milestone_no ??
      (milestone && typeof milestone === "object"
        ? milestone.milestoneNumber ??
          milestone.milestone_number ??
          milestone.number ??
          milestone.no
        : milestone),
  );
}

function taskMilestoneId(task) {
  const milestone = task?.milestone;
  const raw =
    task?.milestoneId ??
    task?.milestone_id ??
    (milestone && typeof milestone === "object"
      ? milestone.id ?? milestone.milestoneId ?? milestone.milestone_id
      : !optionalNumber(milestone)
        ? milestone
        : "") ??
    "";
  return raw != null && raw !== "" ? String(raw) : "";
}

function taskMatchesMilestone(task, milestone) {
  const milestoneNumber = optionalNumber(
    milestone?.number ??
      milestone?.milestoneNumber ??
      milestone?.milestone_number ??
      milestone?.milestoneNo,
  );
  const taskNumber = taskMilestoneNumber(task);
  if (milestoneNumber != null && taskNumber != null) {
    return taskNumber === milestoneNumber;
  }

  const milestoneId =
    milestone?.id ??
    milestone?.milestoneId ??
    milestone?.milestone_id ??
    "";
  if (milestoneId != null && milestoneId !== "" && taskMilestoneId(task)) {
    return taskMilestoneId(task) === String(milestoneId);
  }

  const milestoneTitle = String(
    milestone?.title ?? milestone?.name ?? milestone?.milestoneTitle ?? "",
  )
    .trim()
    .toLowerCase();
  const taskMilestoneTitle = String(
    task?.milestoneTitle ??
      task?.milestone_title ??
      task?.milestoneName ??
      task?.milestone_name ??
      task?.milestone?.title ??
      task?.milestone?.name ??
      "",
  )
    .trim()
    .toLowerCase();
  return Boolean(milestoneTitle && taskMilestoneTitle === milestoneTitle);
}

function milestoneTaskCounts(tasks, milestone) {
  const sourceTasks = embeddedMilestoneTasks(milestone);
  const taskList = sourceTasks.length
    ? sourceTasks
    : tasks.filter((task) => taskMatchesMilestone(task, milestone));
  const counts = {
    total: 0,
    completed: 0,
  };

  taskList.forEach((task) => {
    counts.total += 1;
    if (
      task?.completed === true ||
      task?.isCompleted === true ||
      task?.completedAt ||
      task?.completed_at ||
      simplifyTaskStatus(task?.status ?? task?.state ?? task?.taskStatus) ===
        "completed"
    ) {
      counts.completed += 1;
    }
  });

  return counts;
}

function milestoneCompletion(milestone, tasks) {
  if (simplifyMilestoneStatus(milestone?.status) === "completed") {
    return 100;
  }

  const counts = milestoneTaskCounts(tasks, milestone);
  const apiCompletion = objectNumberValue(
    milestone,
    "completionPercentage",
    "completion_percentage",
    "progressPercentage",
    "progress_percentage",
    "percentComplete",
    "percent_complete",
    "completion",
    "progress",
  );
  const apiCompleted = objectNumberValue(
    milestone,
    "completedTasks",
    "completed_tasks",
    "completedTaskCount",
    "completed_task_count",
    "completedIssues",
    "completed_issues",
    "closedTasks",
    "closed_tasks",
    "doneTasks",
    "done_tasks",
    "finishedTasks",
    "finished_tasks",
    "completedCount",
    "completed_count",
    "doneCount",
    "done_count",
  );
  const apiTotal = objectNumberValue(
    milestone,
    "totalTasks",
    "total_tasks",
    "tasksCount",
    "taskCount",
    "issuesCount",
    "issueCount",
    "totalIssues",
    "total_issues",
    "totalCount",
    "total_count",
    "count",
  );
  const apiOpen = objectNumberValue(
    milestone,
    "openTasks",
    "open_tasks",
    "openCount",
    "open_count",
  );
  const apiProgress = objectNumberValue(
    milestone,
    "inProgressTasks",
    "in_progress_tasks",
    "progressTasks",
    "progress_tasks",
    "progressCount",
    "progress_count",
    "inProgressCount",
    "in_progress_count",
  );
  const apiReview = objectNumberValue(
    milestone,
    "inReviewTasks",
    "in_review_tasks",
    "reviewTasks",
    "review_tasks",
    "reviewCount",
    "review_count",
    "inReviewCount",
    "in_review_count",
  );
  const apiCancelled = objectNumberValue(
    milestone,
    "cancelledTasks",
    "cancelled_tasks",
    "canceledTasks",
    "canceled_tasks",
  );
  const requiredTasks = optionalNumber(
    milestone?.requiredTasks ?? milestone?.required_tasks,
  );
  const completed = Math.max(apiCompleted ?? 0, counts.completed);
  const derivedApiTotal =
    (apiCompleted ?? 0) +
    (apiOpen ?? 0) +
    (apiProgress ?? 0) +
    (apiReview ?? 0) +
    (apiCancelled ?? 0);
  const target =
    requiredTasks != null && requiredTasks > 0
      ? requiredTasks
      : Math.max(apiTotal ?? 0, derivedApiTotal, counts.total);

  if (apiCompletion != null && apiCompletion > 0) {
    return boundedPercent(apiCompletion);
  }

  if (target > 0) {
    return Math.round((Math.min(completed, target) / target) * 100);
  }

  return apiCompletion != null ? boundedPercent(apiCompletion) : 0;
}

function metricCardDefinitions(milestoneCount, issueCount, overview) {
  return [
    {
      labelKey: "studentRepo.statistics.cards.contributors",
      value: numberValue(overview?.totalContributors),
      Icon: Users,
      paletteIndex: 0,
      hintKey: "studentRepo.statistics.cards.hint",
    },
    {
      labelKey: "studentRepo.statistics.cards.commits",
      value: numberValue(overview?.totalCommits),
      Icon: GitCommitHorizontal,
      paletteIndex: 1,
      hintKey: "studentRepo.statistics.cards.hint",
    },
    {
      labelKey: "studentRepo.statistics.cards.pullRequests",
      value: numberValue(overview?.totalPullRequests),
      Icon: GitPullRequest,
      paletteIndex: 2,
      hintKey: "studentRepo.statistics.cards.hint",
    },
    {
      labelKey: "studentRepo.statistics.cards.completedTasks",
      value: numberValue(overview?.totalCompletedTasks),
      Icon: CheckCircle2,
      paletteIndex: 3,
      hintKey: "studentRepo.statistics.cards.hint",
    },
    {
      labelKey: "studentRepo.statistics.cards.totalMarks",
      value: numberValue(overview?.totalMilestoneMarks),
      Icon: BookMarked,
      paletteIndex: 1,
      hintKey: "studentRepo.statistics.cards.totalMarksHint",
    },
    {
      labelKey: "studentRepo.statistics.cards.earnedMarks",
      value: numberValue(overview?.totalEarnedTaskMarks),
      Icon: CheckCircle2,
      paletteIndex: 3,
      hintKey: "studentRepo.statistics.cards.earnedMarksHint",
    },
    {
      labelKey: "studentRepo.statistics.cards.milestones",
      value: milestoneCount,
      Icon: MilestoneIcon,
      paletteIndex: 0,
      hintKey: "studentRepo.statistics.cards.milestonesHint",
    },
    {
      labelKey: "studentRepo.statistics.cards.issues",
      value: issueCount,
      Icon: ListTodo,
      paletteIndex: 2,
      hintKey: "studentRepo.statistics.cards.issuesHint",
    },
  ];
}

function contributorInitials(displayName, username) {
  const raw = String(displayName || username || "").trim();
  if (!raw) return "?";
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase().slice(0, 2);
  }
  return raw.slice(0, 2).toUpperCase();
}

function truncateLabel(value, max = 22) {
  const s = String(value ?? "").trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

const chartMotionProps = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
};

export default function StudentRepoStatistics() {
  const { owner, repo } = useOutletContext() ?? {};
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const statsQ = useVcRepoStatistics(owner, repo, { notifyOnError: false });

  const milestonesQ = useVcRepoMilestones(
    owner,
    repo,
    {},
    { notifyOnError: false },
  );

  const tasksQ = useVcRepoTasks(owner, repo, {}, { notifyOnError: false });

  const loading =
    Boolean(owner && repo) &&
    (statsQ.isFetching || milestonesQ.isFetching || tasksQ.isFetching);

  const data = statsQ.data ?? {};
  const overview = data?.overview ?? {};
  const milestones = useMemo(
    () => (Array.isArray(milestonesQ.data) ? milestonesQ.data : []),
    [milestonesQ.data],
  );
  const tasks = useMemo(
    () => (Array.isArray(tasksQ.data) ? tasksQ.data : []),
    [tasksQ.data],
  );

  const contributors = useMemo(() => {
    const pkg = statsQ.data ?? {};
    const rows = Array.isArray(pkg.contributors) ? pkg.contributors : [];
    return rows.map((row, index) => ({
      id: row?.userId ?? row?.username ?? `contributor-${index}`,
      username: String(row?.username ?? "unknown"),
      displayName: String(row?.displayName ?? row?.username ?? "Unknown"),
      commits: numberValue(row?.commits),
      pushes: numberValue(row?.pushes),
      pulls: numberValue(row?.pullRequests),
      mergedPulls: numberValue(row?.mergedPullRequests),
      completedTasks: numberValue(row?.completedTasks),
      assignedTasks: numberValue(row?.assignedTasks),
      activityScore: numberValue(row?.activityScore),
      assignedMarks: numberValue(row?.assignedMarks),
      earnedMarks: numberValue(row?.earnedMarks),
      marksPercentage: numberValue(row?.marksPercentage),
    }));
  }, [statsQ.data]);

  const taskStatusSlices = useMemo(() => {
    const counts = {
      open: 0,
      progress: 0,
      review: 0,
      completed: 0,
      cancelled: 0,
    };
    tasks.forEach((row) => {
      const key = simplifyTaskStatus(row?.status);
      if (counts[key] != null) counts[key]++;
      else counts.open++;
    });
    return TASK_STATUS_KEYS.filter((key) => counts[key] > 0).map((key) => ({
      key,
      name: t(`studentRepo.tasks.status.${key}`),
      value: counts[key],
      fill: TASK_STATUS_HEX[key],
    }));
  }, [tasks, t]);

  const milestoneBars = useMemo(() => {
    const sorted = [...milestones].sort(
      (a, b) => numberValue(a?.number) - numberValue(b?.number),
    );
    return sorted.map((m) => {
      const num = m?.number ?? "—";
      const title =
        truncateLabel(m?.title ?? t("studentRepo.tasks.milestones.untitled"), 20)
      const label =
        truncateLabel(`#${num} · ${title}`, 34);
      return {
        label,
        completion: milestoneCompletion(m, tasks),
      };
    });
  }, [milestones, tasks, t]);

  const contributorBars = useMemo(
    () =>
      contributors.map((row) => ({
        name: truncateLabel(row.displayName, 16),
        commits: row.commits,
        pushes: row.pushes,
        pulls: row.pulls,
        tasks: row.completedTasks,
      })),
    [contributors],
  );

  const activityShare = useMemo(
    () =>
      contributors
        .filter((row) => row.activityScore > 0)
        .map((row) => ({
          name: row.displayName,
          value: row.activityScore,
        })),
    [contributors],
  );

  const PIE_VARIANT = ["#0066ff", "#7c3aed", "#0f766e", "#ea580c", "#0891b2"];

  const maxActivityScore = useMemo(
    () => contributors.reduce((m, row) => Math.max(m, row.activityScore), 0),
    [contributors],
  );

  const cardModels = metricCardDefinitions(
    milestones.length,
    tasks.length,
    overview,
  );

  const hasContributorData = contributors.length > 0;
  const overviewSignal =
    numberValue(overview?.totalContributors) +
      numberValue(overview?.totalCommits) +
      numberValue(overview?.totalPullRequests) +
      numberValue(overview?.totalCompletedTasks) >
    0;
  const hasRepoShape =
    milestones.length > 0 || tasks.length > 0 || overviewSignal;
  const empty =
    !loading &&
    !hasContributorData &&
    milestones.length === 0 &&
    tasks.length === 0 &&
    !overviewSignal;

  const axisTickColor = isDark ? "#94a3b8" : "#64748b";
  const gridColor = isDark ? "rgba(148,163,184,0.12)" : "rgba(148,163,184,0.22)";
  const hoverCursor = isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)";
  const cursorRadius = 10;

  return (
    <SettingsSectionCard
      title={t("studentRepo.statistics.title")}
      description={t("studentRepo.statistics.subtitle")}
      icon={BarChart3}
    >
      {loading ? (
        <div className="space-y-4" aria-busy aria-label={t("studentRepo.statistics.loading")}>
          <div className="grid animate-pulse gap-3 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`sk-${i}`}
                className="h-28 rounded-3xl bg-light-app-tertiary dark:bg-dark-app-tertiary"
              />
            ))}
          </div>
          <div className="h-[380px] animate-pulse rounded-3xl bg-light-app-tertiary dark:bg-dark-app-tertiary" />
        </div>
      ) : null}

      {!loading && empty ? (
        <p className="text-sm leading-relaxed text-muted dark:text-dark-muted">
          {t("studentRepo.statistics.empty")}
        </p>
      ) : null}

      {!loading && !empty ? (
        <div className="space-y-8">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:gap-4">
            {cardModels.map((card, idx) => (
              <Motion.li
                key={`${card.labelKey}-${idx}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.38,
                  delay: idx * 0.05,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <RepoOverviewStatCard
                  icon={card.Icon}
                  label={t(card.labelKey)}
                  value={card.value}
                  hint={t(card.hintKey)}
                  palette={
                    REPO_OVERVIEW_STAT_PALETTES[
                      card.paletteIndex % REPO_OVERVIEW_STAT_PALETTES.length
                    ]
                  }
                />
              </Motion.li>
            ))}
          </ul>

          <Motion.div {...chartMotionProps} transition={{ ...chartMotionProps.transition, delay: 0.12 }}>
            <div className="grid gap-5 lg:gap-6 xl:grid-cols-2">
              <SettingsSectionCard
                icon={PieChartIcon}
                title={t("studentRepo.statistics.charts.taskStatusTitle")}
                description={t("studentRepo.statistics.charts.taskStatusHint")}
                className="rounded-3xl border-(--color-light-card-border) shadow-xs dark:border-(--color-dark-card-border)"
              >
                {tasks.length === 0 ? (
                  <p className="py-14 text-center text-sm text-muted dark:text-dark-muted">
                    {t("studentRepo.statistics.charts.noTasks")}
                  </p>
                ) : (
                  <div className="relative h-[360px] w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
                        <Tooltip
                          cursor={false}
                          content={<ChartTooltipBody />}
                          animationDuration={300}
                        />
                        <Pie
                          data={taskStatusSlices}
                          dataKey="value"
                          nameKey="name"
                          innerRadius="58%"
                          outerRadius="88%"
                          strokeWidth={2}
                          paddingAngle={2}
                          stroke={isDark ? "#030712" : "#ffffff"}
                          animationBegin={120}
                          animationDuration={820}
                          animationEasing="ease-out"
                          isAnimationActive
                        >
                          {taskStatusSlices.map((entry) => (
                            <Cell key={`slice-${entry.key}`} fill={entry.fill} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-10">
                      <p className="text-4xl font-bold tabular-nums tracking-tight text-primary dark:text-dark-primary">
                        {tasks.length}
                      </p>
                      <p className="mt-0.5 max-w-48 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-muted dark:text-dark-muted">
                        {t("studentRepo.statistics.charts.tasksTotalCenter")}
                      </p>
                    </div>
                  </div>
                )}
              </SettingsSectionCard>

              <SettingsSectionCard
                icon={MilestoneIcon}
                title={t("studentRepo.statistics.charts.milestonesTitle")}
                description={t("studentRepo.statistics.charts.milestonesHint")}
                className="rounded-3xl border-(--color-light-card-border) shadow-xs dark:border-(--color-dark-card-border)"
              >
                {milestoneBars.length === 0 ? (
                  <p className="py-14 text-center text-sm text-muted dark:text-dark-muted">
                    {t("studentRepo.statistics.charts.noMilestones")}
                  </p>
                ) : (
                  <div className="h-[360px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={milestoneBars}
                        margin={{ top: 12, right: 20, bottom: 12, left: 12 }}
                      >
                        <CartesianGrid stroke={gridColor} strokeDasharray="4 8" horizontal={false} />
                        <XAxis
                          type="number"
                          domain={[0, 100]}
                          tick={{ fontSize: 11, fill: axisTickColor }}
                          axisLine={{ stroke: gridColor }}
                          tickLine={{ stroke: gridColor }}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <YAxis
                          type="category"
                          dataKey="label"
                          width={148}
                          tick={{ fontSize: 11, fill: axisTickColor }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: hoverCursor, radius: cursorRadius }}
                          content={<ChartTooltipBody />}
                          animationDuration={200}
                        />
                        <Legend
                          verticalAlign="bottom"
                          wrapperStyle={{ fontSize: 12, paddingTop: 14 }}
                          payload={[
                            {
                              value: t("studentRepo.statistics.charts.milestonePct"),
                              type: "square",
                              color: CHART_HEX.success,
                            },
                          ]}
                        />
                        <Bar
                          name={t("studentRepo.statistics.charts.milestonePct")}
                          dataKey="completion"
                          fill={CHART_HEX.success}
                          radius={[0, 10, 10, 0]}
                          barSize={16}
                          animationDuration={900}
                          animationEasing="ease-out"
                          isAnimationActive
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </SettingsSectionCard>
            </div>
          </Motion.div>

          {hasContributorData ? (
            <Motion.div
              {...chartMotionProps}
              transition={{ ...chartMotionProps.transition, delay: 0.2 }}
              className="space-y-3"
            >
              <p className="text-xs text-secondary dark:text-dark-secondary">
                {t("studentRepo.statistics.charts.contributorSectionIntro")}
              </p>
              <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
                <SettingsSectionCard
                  icon={BarChart3}
                  title={t("studentRepo.statistics.breakdown.title")}
                  description={t("studentRepo.statistics.breakdown.hint")}
                  className="rounded-3xl border-(--color-light-card-border) shadow-xs dark:border-(--color-dark-card-border)"
                >
                  <div className="h-[380px] w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={contributorBars} margin={{ top: 8, right: 12, left: -8, bottom: 8 }}>
                        <CartesianGrid stroke={gridColor} strokeDasharray="4 6" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11, fill: axisTickColor }}
                          axisLine={false}
                          tickLine={false}
                          interval={0}
                          angle={-18}
                          textAnchor="end"
                          height={64}
                          dy={8}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 11, fill: axisTickColor }}
                          axisLine={false}
                          tickLine={false}
                          width={40}
                        />
                        <Tooltip
                          cursor={{ fill: hoverCursor, radius: cursorRadius }}
                          content={<ChartTooltipBody />}
                          animationDuration={200}
                        />
                        <Legend
                          wrapperStyle={{
                            paddingTop: 16,
                            fontSize: 12,
                          }}
                        />
                        <Bar
                          dataKey="commits"
                          name={t("studentRepo.statistics.metrics.commits")}
                          fill={STACK_COLORS.commits}
                          radius={[8, 8, 0, 0]}
                          animationDuration={800}
                          animationEasing="ease-out"
                          isAnimationActive
                        />
                        <Bar
                          dataKey="pushes"
                          name={t("studentRepo.statistics.metrics.pushes")}
                          fill={STACK_COLORS.pushes}
                          radius={[8, 8, 0, 0]}
                          animationDuration={900}
                          animationEasing="ease-out"
                          isAnimationActive
                        />
                        <Bar
                          dataKey="pulls"
                          name={t("studentRepo.statistics.metrics.pullRequests")}
                          fill={STACK_COLORS.pulls}
                          radius={[8, 8, 0, 0]}
                          animationDuration={1000}
                          animationEasing="ease-out"
                          isAnimationActive
                        />
                        <Bar
                          dataKey="tasks"
                          name={t("studentRepo.statistics.metrics.completedTasks")}
                          fill={STACK_COLORS.tasks}
                          radius={[8, 8, 0, 0]}
                          animationDuration={1100}
                          animationEasing="ease-out"
                          isAnimationActive
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </SettingsSectionCard>

                <SettingsSectionCard
                  icon={PieChartIcon}
                  title={t("studentRepo.statistics.share.title")}
                  description={t("studentRepo.statistics.share.hint")}
                  className="rounded-3xl border-(--color-light-card-border) shadow-xs dark:border-(--color-dark-card-border)"
                >
                  <div className="h-[380px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 4, bottom: 4 }}>
                        <Tooltip
                          cursor={false}
                          content={<ChartTooltipBody />}
                        />
                        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                        <Pie
                          data={activityShare}
                          dataKey="value"
                          nameKey="name"
                          innerRadius="52%"
                          outerRadius="86%"
                          paddingAngle={2.5}
                          strokeWidth={2}
                          stroke={isDark ? "#111827" : "#ffffff"}
                          animationBegin={100}
                          animationDuration={900}
                          animationEasing="ease-out"
                          isAnimationActive
                        >
                          {activityShare.map((entry, index) => (
                            <Cell
                              key={`act-${entry.name}-${index}`}
                              fill={
                                PIE_VARIANT[index % PIE_VARIANT.length] ?? CHART_HEX.blue
                              }
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </SettingsSectionCard>
              </div>
            </Motion.div>
          ) : (
            !hasContributorData &&
            hasRepoShape && (
              <p className="rounded-2xl border border-dashed border-(--color-light-card-border) bg-light-app-tertiary/60 px-4 py-3 text-xs text-muted dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary/60 dark:text-dark-muted">
                {t("studentRepo.statistics.breakdown.hint")}
              </p>
            )
          )}

          {hasContributorData ? (
            <Motion.div {...chartMotionProps} transition={{ ...chartMotionProps.transition, delay: 0.28 }}>
              <SettingsSectionCard
                icon={LayoutList}
                title={t("studentRepo.statistics.summary.title")}
                description={t("studentRepo.statistics.summary.hint")}
                className="rounded-3xl border-(--color-light-card-border) shadow-xs dark:border-(--color-dark-card-border)"
              >
                <div className="overflow-hidden rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) shadow-xs dark:border-(--color-dark-card-border) dark:bg-dark-card-bg">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-light-divider bg-light-app-tertiary text-start text-[11px] font-semibold uppercase tracking-wide text-muted dark:border-dark-divider dark:bg-dark-app-tertiary dark:text-dark-muted">
                          <th className="sticky left-0 z-1 w-10 whitespace-nowrap border-e border-light-divider bg-light-app-tertiary px-3 py-3 dark:border-dark-divider dark:bg-dark-app-tertiary">
                            {t("studentRepo.statistics.table.rank")}
                          </th>
                          <th className="sticky left-10 z-1 min-w-[200px] whitespace-nowrap border-e border-light-divider bg-light-app-tertiary px-3 py-3 dark:border-dark-divider dark:bg-dark-app-tertiary">
                            {t("studentRepo.statistics.table.contributor")}
                          </th>
                          <th className="whitespace-nowrap px-3 py-3 text-end">
                            {t("studentRepo.statistics.table.commits")}
                          </th>
                          <th className="whitespace-nowrap px-3 py-3 text-end">
                            {t("studentRepo.statistics.table.pushes")}
                          </th>
                          <th className="whitespace-nowrap px-3 py-3 text-end">
                            {t("studentRepo.statistics.table.pulls")}
                          </th>
                          <th className="whitespace-nowrap px-3 py-3 text-end">
                            {t("studentRepo.statistics.table.merged")}
                          </th>
                          <th className="whitespace-nowrap px-3 py-3 text-end">
                            {t("studentRepo.statistics.table.tasksDone")}
                          </th>
                          <th className="whitespace-nowrap px-3 py-3 text-end">
                            {t("studentRepo.statistics.table.marks")}
                          </th>
                          <th className="whitespace-nowrap px-3 py-3 text-end">
                            {t("studentRepo.statistics.table.scorePct")}
                          </th>
                          <th className="min-w-[140px] whitespace-nowrap px-3 py-3 text-end">
                            {t("studentRepo.statistics.table.activity")}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-light-divider dark:divide-dark-divider">
                        {contributors.map((row, rank) => {
                          const activityPct =
                            maxActivityScore > 0
                              ? Math.round(
                                  (row.activityScore / maxActivityScore) * 100,
                                )
                              : 0;
                          const initials = contributorInitials(
                            row.displayName,
                            row.username,
                          );
                          return (
                            <tr
                              key={row.id}
                              className="group text-primary transition-colors hover:bg-light-app-tertiary/85 dark:text-dark-primary dark:hover:bg-dark-app-tertiary/85"
                            >
                              <td className="sticky left-0 z-0 border-e border-light-divider bg-(--color-light-card-bg) px-3 py-3 text-center text-xs font-semibold tabular-nums text-muted transition-colors group-hover:bg-light-app-tertiary/85 dark:border-dark-divider dark:bg-dark-card-bg dark:text-dark-muted dark:group-hover:bg-dark-app-tertiary/85">
                                {rank + 1}
                              </td>
                              <td className="sticky left-10 z-0 border-e border-light-divider bg-(--color-light-card-bg) px-3 py-3 transition-colors group-hover:bg-light-app-tertiary/85 dark:border-dark-divider dark:bg-dark-card-bg dark:group-hover:bg-dark-app-tertiary/85">
                                <div className="flex min-w-[180px] items-center gap-3">
                                  <span
                                    className="flex size-10 shrink-0 items-center justify-center rounded-full border border-(--color-light-input-border) bg-light-app-tertiary text-[11px] font-bold text-primary shadow-xs dark:border-dark-input-border dark:bg-dark-app-tertiary dark:text-dark-primary"
                                    aria-hidden
                                  >
                                    {initials}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="truncate font-semibold text-primary dark:text-dark-primary">
                                      {row.displayName}
                                    </p>
                                    <p className="truncate text-xs text-secondary dark:text-dark-secondary">
                                      @{row.username}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-end tabular-nums text-secondary dark:text-dark-secondary">
                                {row.commits}
                              </td>
                              <td className="px-3 py-3 text-end tabular-nums text-secondary dark:text-dark-secondary">
                                {row.pushes}
                              </td>
                              <td className="px-3 py-3 text-end tabular-nums text-secondary dark:text-dark-secondary">
                                {row.pulls}
                              </td>
                              <td className="px-3 py-3 text-end tabular-nums text-secondary dark:text-dark-secondary">
                                {row.mergedPulls}
                              </td>
                              <td className="px-3 py-3 text-end tabular-nums text-secondary dark:text-dark-secondary">
                                {row.completedTasks}
                              </td>
                              <td className="px-3 py-3 text-end tabular-nums text-secondary dark:text-dark-secondary">
                                {row.earnedMarks} / {row.assignedMarks}
                              </td>
                              <td className="px-3 py-3 text-end tabular-nums text-secondary dark:text-dark-secondary">
                                {row.marksPercentage}%
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:justify-end sm:gap-2">
                                  <div className="h-2 w-full max-w-[120px] overflow-hidden rounded-full bg-light-app-tertiary dark:bg-dark-app-tertiary">
                                    <div
                                      className="h-full rounded-full bg-(--color-light-input-border-focus) transition-[width] duration-700 ease-out dark:bg-(--color-dark-input-border-focus)"
                                      style={{ width: `${activityPct}%` }}
                                    />
                                  </div>
                                  <span className="shrink-0 text-end text-xs font-semibold tabular-nums text-primary dark:text-dark-primary">
                                    {row.activityScore}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </SettingsSectionCard>
            </Motion.div>
          ) : null}
        </div>
      ) : null}
    </SettingsSectionCard>
  );
}
