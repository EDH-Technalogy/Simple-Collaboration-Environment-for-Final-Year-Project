import {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Link,
  Navigate,
  useOutletContext,
  useParams,
} from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Flag,
  Gauge,
  ListChecks,
  Lock,
  Milestone as MilestoneIcon,
  PencilLine,
  RotateCcw,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "../../components/Button";
import Field from "../../components/Field";
import GlobalModal from "../../components/GlobalModal";
import RepoOverviewStatCard from "../../components/repo/RepoOverviewStatCard";
import { REPO_OVERVIEW_STAT_PALETTES } from "../../components/repo/repoOverviewStatPalettes";
import SettingsSectionCard from "../../components/SettingsSectionCard";
import { useAuth } from "../../context/AuthContext";
import {
  canEditIssueOrMilestoneGradingForms,
  canViewMilestoneGradingContext,
  repoViewerUsername,
  usernamesLikelySame,
} from "../../lib/vcAcademicVisibility";
import {
  useVcCloseRepoMilestone,
  useVcPatchRepoMilestone,
  useVcReopenRepoMilestone,
  useVcRepoMilestoneByNumber,
  useVcRepoTasks,
} from "../../services/useApi";
import {
  subscribeCompleting,
  getCompletingSet,
} from "../../lib/completingTasksStore";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function decodeRouteSegment(raw) {
  if (raw == null || raw === "") return "";
  try {
    return decodeURIComponent(String(raw));
  } catch {
    return String(raw);
  }
}

function asNumber(raw) {
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function progressValue(value) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function milestoneNumberValue(milestone, ...keys) {
  const wanted = new Set(
    keys.map((key) =>
      String(key)
        .replace(/[^a-z0-9]/gi, "")
        .toLowerCase(),
    ),
  );
  for (const key of keys) {
    const n = asNumber(milestone?.[key]);
    if (n != null) return n;
  }
  if (milestone && typeof milestone === "object") {
    for (const [key, value] of Object.entries(milestone)) {
      const normalized = String(key)
        .replace(/[^a-z0-9]/gi, "")
        .toLowerCase();
      if (wanted.has(normalized)) {
        const n = asNumber(value);
        if (n != null) return n;
      }
    }
  }
  return null;
}

function embeddedMilestoneTasks(milestone) {
  return asArray(
    milestone?.tasks ??
      milestone?.issues ??
      milestone?.taskList ??
      milestone?.task_list ??
      milestone?.milestoneTasks ??
      milestone?.milestone_tasks,
  );
}

function normalizedText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function milestoneIsComplete(milestone) {
  const status = normalizedText(milestone?.status ?? milestone?.state);
  return (
    status === "closed" ||
    status === "done" ||
    status === "complete" ||
    status === "completed" ||
    status.includes("complete")
  );
}

function taskMilestoneNumber(task) {
  const milestone = task?.milestone;
  return asNumber(
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
      : !asNumber(milestone)
        ? milestone
        : "") ??
    "";
  return raw != null && raw !== "" ? String(raw) : "";
}

function taskMatchesMilestone(task, milestoneNumber, milestoneId) {
  const milestoneNum = asNumber(milestoneNumber);
  const taskNum = taskMilestoneNumber(task);
  if (milestoneNum != null && taskNum != null) return taskNum === milestoneNum;
  if (milestoneId && taskMilestoneId(task) === String(milestoneId)) return true;
  return false;
}

function formatDate(value, locale) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function dueDateMs(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function formatTimeRemaining(targetMs, nowMs, t) {
  if (!targetMs) return t("studentRepo.tasks.detail.none");
  const diff = targetMs - nowMs;
  if (diff <= 0) {
    return t("studentRepo.tasks.milestoneDetail.timerExpired", "Due now");
  }
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const days = Math.floor(diff / day);
  const hours = Math.floor((diff % day) / hour);
  const minutes = Math.floor((diff % hour) / minute);
  if (days > 0) {
    return t("studentRepo.tasks.milestoneDetail.timerDays", {
      defaultValue: "{{days}}d {{hours}}h left",
      days,
      hours,
    });
  }
  if (hours > 0) {
    return t("studentRepo.tasks.milestoneDetail.timerHours", {
      defaultValue: "{{hours}}h {{minutes}}m left",
      hours,
      minutes,
    });
  }
  return t("studentRepo.tasks.milestoneDetail.timerMinutes", {
    defaultValue: "{{minutes}}m left",
    minutes: Math.max(1, minutes),
  });
}

function dateInputFromIso(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function isoFromDateInput(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function intOrNull(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function draftFromMilestone(m) {
  return {
    title: String(m.title ?? ""),
    description: String(m.description ?? ""),
    dueDate: dateInputFromIso(m.dueDate),
    maxScore: m.maxScore != null ? String(m.maxScore) : "",
    passingScore: m.passingScore != null ? String(m.passingScore) : "",
    requiredTasks: m.requiredTasks != null ? String(m.requiredTasks) : "",
    rubric: String(m.rubric ?? ""),
  };
}

function normalizeTaskStatus(value) {
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
  if (raw.includes("cancel")) return "cancelled";
  return raw;
}

function countTasksByStatus(list) {
  const counts = {
    total: list.length,
    open: 0,
    progress: 0,
    review: 0,
    completed: 0,
  };
  list.forEach((task) => {
    const status =
      task?.completed === true ||
      task?.isCompleted === true ||
      task?.completedAt ||
      task?.completed_at
        ? "completed"
        : normalizeTaskStatus(task?.status ?? task?.state ?? task?.taskStatus);
    if (Object.prototype.hasOwnProperty.call(counts, status)) {
      counts[status] += 1;
    }
  });
  return counts;
}

function taskStatusTone(status) {
  switch (status) {
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300";
    case "review":
      return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300";
    case "progress":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300";
    case "cancelled":
      return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300";
    default:
      return "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-500/20 dark:bg-zinc-500/10 dark:text-zinc-300";
  }
}

function StatusBadge({ label, tone }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        tone,
      )}
    >
      {label}
    </span>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary px-3 py-3 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
      <div className="mt-0.5 text-muted dark:text-dark-muted">
        {createElement(icon, { className: "h-4 w-4", strokeWidth: 1.8 })}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted dark:text-dark-muted">
          {label}
        </p>
        <p className="mt-1 text-sm text-primary dark:text-dark-primary">{value}</p>
      </div>
    </div>
  );
}

export default function StudentRepoMilestoneDetail() {
  const { t, i18n } = useTranslation();
  const { user, isStudent, isTeacher, isAdmin } = useAuth();
  const canEditGradingForms = canEditIssueOrMilestoneGradingForms({
    isStudent,
    isTeacher,
    isAdmin,
  });
  const outletCtx = useOutletContext() ?? {};
  const {
    milestoneNumber: milestoneNumberParam,
    owner: ownerParam,
    repo: repoParam,
  } = useParams();
  const owner = outletCtx.owner ?? decodeRouteSegment(ownerParam);
  const repo = outletCtx.repo ?? decodeRouteSegment(repoParam);
  const repoBase = outletCtx.repoBase ?? "";
  const repoBasePath = String(repoBase);
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    dueDate: "",
    maxScore: "",
    passingScore: "",
    requiredTasks: "",
    rubric: "",
  });
  const [nowMs, setNowMs] = useState(() => Date.now());
  const autoCloseKeyRef = useRef("");

  const milestoneNumber = milestoneNumberParam;
  const {
    data: milestone,
    isLoading,
    isError,
    refetch,
  } = useVcRepoMilestoneByNumber(owner, repo, milestoneNumber, {
    notifyOnError: true,
  });

  const msKey =
    milestone?.number != null ? milestone.number : milestoneNumber;
  const { data: repoTasks = [] } = useVcRepoTasks(
    owner,
    repo,
    {},
    { enabled: Boolean(owner && repo), notifyOnError: false },
  );

  const [completingCounts, setCompletingCounts] = useState(() => new Map());

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    function recompute(set) {
      const map = new Map();
      const s = set ?? getCompletingSet();
      for (const task of repoTasks) {
        if (!task) continue;
        if (!task?.milestoneNumber) continue;
        if (s.has(String(task.number))) {
          const m = Number(task.milestoneNumber);
          map.set(m, (map.get(m) || 0) + 1);
        }
      }
      setCompletingCounts(map);
    }
    const unsub = subscribeCompleting((s) => recompute(s));
    recompute();
    return unsub;
  }, [repoTasks]);

  const milestoneIdStr =
    milestone?.id != null ? String(milestone.id) : "";

  const canViewGrading = canViewMilestoneGradingContext(
    isStudent,
    user,
    milestone?.createdBy,
  );
  const currentUsername = repoViewerUsername(user);
  const isAdminOrTeacherRoute =
    repoBasePath.startsWith("/admin/") ||
    repoBasePath === "/admin" ||
    repoBasePath.startsWith("/teacher/") ||
    repoBasePath === "/teacher";
  const isRepoOwner =
    currentUsername && usernamesLikelySame(currentUsername, owner);
  const canViewAllTasks =
    isAdminOrTeacherRoute ||
    isRepoOwner ||
    (typeof isTeacher === "function" && isTeacher()) ||
    (typeof isAdmin === "function" && isAdmin());
  const canManageMilestone =
    canViewAllTasks ||
    (Boolean(milestone?.createdBy) &&
      usernamesLikelySame(currentUsername, milestone.createdBy));

  const milestoneTitle = normalizedText(
    milestone?.title ?? milestone?.name ?? milestone?.milestoneTitle,
  );

  const matchesCurrentMilestone = useCallback((task) => {
    if (taskMatchesMilestone(task, msKey, milestoneIdStr)) return true;
    const taskMilestoneTitle = normalizedText(
      task?.milestoneTitle ??
        task?.milestone_title ??
        task?.milestoneName ??
        task?.milestone_name ??
        task?.milestone?.title ??
        task?.milestone?.name,
    );
    return Boolean(milestoneTitle && taskMilestoneTitle === milestoneTitle);
  }, [milestoneIdStr, milestoneTitle, msKey]);

  const allMilestoneTasks = useMemo(() => {
    const embeddedTasks = embeddedMilestoneTasks(milestone);
    if (embeddedTasks.length) return embeddedTasks;
    if (msKey == null) return [];
    return repoTasks.filter((task) => matchesCurrentMilestone(task));
  }, [milestone, repoTasks, msKey, matchesCurrentMilestone]);

  const invalidateScope = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["vc", "repos", "milestone", owner, repo, milestoneNumber],
      }),
      queryClient.invalidateQueries({
        queryKey: ["vc", "repos", "milestones", owner, repo],
      }),
      queryClient.invalidateQueries({
        queryKey: ["vc", "repos", "tasks", owner, repo],
      }),
      queryClient.invalidateQueries({
        queryKey: ["vc", "repos", "task-dashboard", owner, repo],
      }),
      queryClient.invalidateQueries({
        queryKey: ["vc", "repos", "statistics", owner, repo],
      }),
    ]);
  };

  const patchMilestone = useVcPatchRepoMilestone({
    onSuccess: async () => {
      await invalidateScope();
      setEditOpen(false);
    },
  });

  const closeMilestoneMut = useVcCloseRepoMilestone({
    onSuccess: async () => {
      await invalidateScope();
      setCloseConfirmOpen(false);
    },
  });

  const reopenMilestoneMut = useVcReopenRepoMilestone({
    onSuccess: async () => {
      await invalidateScope();
    },
  });

  const status = String(milestone?.status ?? "open").toLowerCase();
  const completingCountForThis = completingCounts.get(Number(msKey)) || 0;
  let completion = 0;
  const taskCounts = countTasksByStatus(allMilestoneTasks);
  const aggregateTotalTasks = milestoneNumberValue(
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
  const totalTasks = Math.max(aggregateTotalTasks ?? 0, taskCounts.total);
  const aggregateCompletedTasks =
    milestoneNumberValue(
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
  const completedTasks = Math.max(
    aggregateCompletedTasks ?? 0,
    taskCounts.completed,
  );
  const openTasks =
    milestoneNumberValue(
      milestone,
      "openTasks",
      "open_tasks",
      "openCount",
      "open_count",
    ) ??
    taskCounts.open;
  const inProgressTasks =
    milestoneNumberValue(
      milestone,
      "inProgressTasks",
      "in_progress_tasks",
      "progressTasks",
      "progress_tasks",
      "progressCount",
      "progress_count",
      "inProgressCount",
      "in_progress_count",
    ) ?? taskCounts.progress;
  const inReviewTasks =
    milestoneNumberValue(
      milestone,
      "inReviewTasks",
      "in_review_tasks",
      "reviewTasks",
      "review_tasks",
      "reviewCount",
      "review_count",
      "inReviewCount",
      "in_review_count",
    ) ?? taskCounts.review;
  const derivedTotalTasks =
    totalTasks > 0
      ? totalTasks
      : completedTasks + openTasks + inProgressTasks + inReviewTasks;
  const requiredTasks = milestoneNumberValue(
    milestone,
    "requiredTasks",
    "required_tasks",
  );
  const apiCompletion = milestoneNumberValue(
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
  const completionTarget =
    requiredTasks != null && requiredTasks > 0
      ? requiredTasks
      : derivedTotalTasks;
  let effectiveCompleted = completedTasks;
  if (milestoneIsComplete(milestone)) {
    completion = 100;
    effectiveCompleted =
      completionTarget > 0 ? completionTarget : Math.max(completedTasks, 1);
  } else if (apiCompletion != null && apiCompletion > 0) {
    completion = progressValue(apiCompletion);
  } else if (completionTarget > 0) {
    effectiveCompleted = Math.min(
      completionTarget,
      completedTasks + Number(completingCountForThis || 0),
    );
    completion = Math.round((effectiveCompleted / completionTarget) * 100);
  } else if (apiCompletion != null) {
    completion = progressValue(apiCompletion);
  } else {
    completion = 0;
  }
  const dueDate = formatDate(milestone?.dueDate, i18n.language);
  const dueMs = dueDateMs(milestone?.dueDate);
  const timeRemaining = formatTimeRemaining(dueMs, nowMs, t);
  const allTaskCounts = countTasksByStatus(allMilestoneTasks);
  const allTasksCompleted =
    allTaskCounts.total > 0 && allTaskCounts.completed >= allTaskCounts.total;
  const progressComplete = completion >= 100;
  const mutatingLifecycle =
    closeMilestoneMut.isPending || reopenMilestoneMut.isPending;

  useEffect(() => {
    if (!milestone || status === "closed" || !canManageMilestone) return;
    if (mutatingLifecycle) return;
    if (!allTasksCompleted || !progressComplete) return;
    const key = `${owner}/${repo}/${milestoneNumber}:tasks-complete`;
    if (autoCloseKeyRef.current === key) return;
    autoCloseKeyRef.current = key;
    closeMilestoneMut.mutate({ owner, repo, milestoneNumber });
  }, [
    allTasksCompleted,
    canManageMilestone,
    closeMilestoneMut,
    milestone,
    milestoneNumber,
    mutatingLifecycle,
    owner,
    progressComplete,
    repo,
    status,
  ]);

  function openEditModal() {
    if (!milestone) return;
    setDraft(draftFromMilestone(milestone));
    setEditOpen(true);
  }

  async function submitPatch() {
    await patchMilestone.mutateAsync({
      owner,
      repo,
      milestoneNumber,
      title: draft.title.trim(),
      description: draft.description.trim() || null,
      dueDate: isoFromDateInput(draft.dueDate),
      maxScore: canEditGradingForms
        ? intOrNull(draft.maxScore)
        : (milestone?.maxScore ?? null),
      passingScore: canEditGradingForms
        ? intOrNull(draft.passingScore)
        : (milestone?.passingScore ?? null),
      requiredTasks: intOrNull(draft.requiredTasks),
      rubric: canEditGradingForms
        ? draft.rubric.trim() || null
        : (milestone?.rubric != null && String(milestone.rubric).trim() !== ""
            ? String(milestone.rubric)
            : null),
    });
  }

  async function runCloseMilestone() {
    await closeMilestoneMut.mutateAsync({ owner, repo, milestoneNumber });
  }

  async function runReopenMilestone() {
    await reopenMilestoneMut.mutateAsync({ owner, repo, milestoneNumber });
  }

  if (!owner || !repo || milestoneNumber == null || milestoneNumber === "") {
    return <Navigate to=".." relative="path" replace />;
  }

  if (!isLoading && isError) {
    return (
      <div className="space-y-4">
        <Link
          to={repoBase ? `${repoBase}/tasks` : ".."}
          relative={repoBase ? undefined : "path"}
          className="inline-flex items-center gap-2 text-xs font-medium text-(--color-chart-blue-primary) dark:text-(--color-chart-blue-secondary)"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" strokeWidth={1.8} />
          {t("studentRepo.tasks.milestoneDetail.back")}
        </Link>
        <p className="text-sm text-light-error-text dark:text-dark-error-text">
          {t("studentRepo.tasks.milestoneDetail.loadError")}
        </p>
        <Button type="button" variant="secondary" onClick={() => refetch()}>
          {t("studentRepo.tasks.taskDetail.retry")}
        </Button>
      </div>
    );
  }

  if (!isLoading && milestone == null) {
    return <Navigate to=".." relative="path" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={repoBase ? `${repoBase}/tasks` : ".."}
          relative={repoBase ? undefined : "path"}
          className="inline-flex items-center gap-2 text-xs font-medium text-(--color-chart-blue-primary) transition-colors hover:underline dark:text-(--color-chart-blue-secondary)"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" strokeWidth={1.8} />
          {t("studentRepo.tasks.milestoneDetail.back")}
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            icon={<PencilLine className="h-4 w-4" />}
            disabled={!milestone || isLoading || mutatingLifecycle || !canManageMilestone}
            onClick={openEditModal}
          >
            {t("studentRepo.tasks.milestoneDetail.editTitle")}
          </Button>
          {status !== "closed" ? (
            <Button
              type="button"
              variant="danger"
              icon={<Lock className="h-4 w-4" strokeWidth={1.8} />}
              disabled={
                !milestone || isLoading || mutatingLifecycle || patchMilestone.isPending || !canManageMilestone
              }
              onClick={() => setCloseConfirmOpen(true)}
            >
              {t("studentRepo.tasks.milestoneDetail.closeAction")}
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              icon={<RotateCcw className="h-4 w-4" strokeWidth={1.8} />}
              disabled={
                !milestone ||
                isLoading ||
                mutatingLifecycle ||
                patchMilestone.isPending ||
                !canManageMilestone
              }
              onClick={runReopenMilestone}
            >
              {t("studentRepo.tasks.milestoneDetail.reopenAction")}
            </Button>
          )}
        </div>
      </div>

      {isLoading || !milestone ? (
        <p className="text-sm text-muted dark:text-dark-muted">
          {t("studentRepo.tasks.milestoneDetail.loading")}
        </p>
      ) : (
        <>
          <div className="rounded-3xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-5 shadow-xs dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <MilestoneIcon
                    className="h-5 w-5 text-muted dark:text-dark-muted"
                    strokeWidth={1.6}
                  />
                  <h1 className="text-xl font-semibold tracking-tight text-primary dark:text-dark-primary">
                    {milestone.title ||
                      t("studentRepo.tasks.milestones.untitled")}
                  </h1>
                  <StatusBadge
                    label={t(
                      status === "closed"
                        ? "studentRepo.tasks.milestones.closed"
                        : "studentRepo.tasks.milestones.open",
                    )}
                    tone={
                      status === "closed"
                        ? "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-500/20 dark:bg-zinc-500/10 dark:text-zinc-300"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                    }
                  />
                </div>
                <p className="mt-1 text-xs text-muted dark:text-dark-muted">
                  #{milestone.number ?? milestoneNumber}
                </p>
                {milestone.description ? (
                  <p className="mt-3 text-sm leading-6 text-secondary dark:text-dark-secondary">
                    {milestone.description}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-1 flex items-center justify-between text-[11px] text-muted dark:text-dark-muted">
                <span>{t("studentRepo.tasks.milestones.progress")}</span>
                <span>{completion}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-light-app-tertiary dark:bg-dark-app-tertiary">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <RepoOverviewStatCard
                icon={ListChecks}
                label={t("studentRepo.tasks.milestoneDetail.stats.total")}
                value={String(derivedTotalTasks)}
                palette={REPO_OVERVIEW_STAT_PALETTES[0]}
              />
              <RepoOverviewStatCard
                icon={Flag}
                label={t("studentRepo.tasks.milestoneDetail.stats.open")}
                value={String(taskCounts.open)}
                palette={REPO_OVERVIEW_STAT_PALETTES[1]}
              />
              <RepoOverviewStatCard
                icon={Gauge}
                label={t("studentRepo.tasks.milestoneDetail.stats.progress")}
                value={String(taskCounts.progress)}
                palette={REPO_OVERVIEW_STAT_PALETTES[2]}
              />
              <RepoOverviewStatCard
                icon={CheckCircle2}
                label={t("studentRepo.tasks.milestoneDetail.stats.completed")}
                value={String(effectiveCompleted)}
                palette={REPO_OVERVIEW_STAT_PALETTES[3]}
              />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <DetailRow
                icon={CalendarDays}
                label={t("studentRepo.tasks.detail.dueLabel")}
                value={dueDate || t("studentRepo.tasks.detail.none")}
              />
              <DetailRow
                icon={Gauge}
                label={t(
                  "studentRepo.tasks.milestoneDetail.timeRemaining",
                  "Time remaining",
                )}
                value={
                  status === "closed"
                    ? t("studentRepo.tasks.milestones.closed")
                    : timeRemaining
                }
              />
              {canViewGrading ? (
                <>
                  <DetailRow
                    icon={Flag}
                    label={t("studentRepo.tasks.createMilestone.fields.maxScore")}
                    value={
                      milestone.maxScore != null
                        ? String(milestone.maxScore)
                        : t("studentRepo.tasks.detail.none")
                    }
                  />
                  <DetailRow
                    icon={CheckCircle2}
                    label={t(
                      "studentRepo.tasks.createMilestone.fields.passingScore",
                    )}
                    value={
                      milestone.passingScore != null
                        ? String(milestone.passingScore)
                        : t("studentRepo.tasks.detail.none")
                    }
                  />
                </>
              ) : null}
            </div>
          </div>

          <SettingsSectionCard
            icon={ListChecks}
            title={t("studentRepo.tasks.milestoneDetail.tasksInMilestone")}
            description={t("studentRepo.tasks.issues.subtitle")}
            contentClassName="space-y-3"
          >
            {!allMilestoneTasks.length ? (
              <p className="text-sm text-muted dark:text-dark-muted">
                {t("studentRepo.tasks.empty")}
              </p>
            ) : (
              <ul className="space-y-2">
                {allMilestoneTasks.map((task) => {
                  const st =
                    task?.completed === true ||
                    task?.isCompleted === true ||
                    task?.completedAt ||
                    task?.completed_at
                      ? "completed"
                      : normalizeTaskStatus(
                          task?.status ?? task?.state ?? task?.taskStatus,
                        );
                  return (
                    <li key={task.id ?? task.number}>
                      <Link
                        to={
                          repoBasePath
                            ? `${repoBasePath}/tasks/issue/${encodeURIComponent(String(task.number))}`
                            : `../../issue/${encodeURIComponent(String(task.number))}`
                        }
                        relative={repoBasePath ? undefined : "path"}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-(--color-light-card-border) bg-light-app-tertiary px-4 py-3 transition-colors hover:border-(--color-light-input-border-focus) hover:bg-white dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:hover:border-(--color-dark-input-border-focus) dark:hover:bg-dark-card-hover"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge
                              label={t(`studentRepo.tasks.status.${st}`)}
                              tone={taskStatusTone(st)}
                            />
                            <span className="truncate text-sm font-medium text-primary dark:text-dark-primary">
                              {task.title ||
                                t("studentRepo.tasks.unnamed", {
                                  index: task.number ?? "—",
                                })}
                            </span>
                            <span className="text-xs text-muted dark:text-dark-muted">
                              #{task.number}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted dark:text-dark-muted rtl:rotate-180" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </SettingsSectionCard>
        </>
      )}

      <GlobalModal
        open={editOpen}
        setOpen={setEditOpen}
        isClose
        title={t("studentRepo.tasks.milestoneDetail.editTitle")}
        subtitle={t("studentRepo.tasks.createMilestone.subtitle")}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setEditOpen(false)}
              disabled={patchMilestone.isPending}
            >
              {t("studentRepo.pulls.actions.cancel")}
            </Button>
            <Button
              onClick={submitPatch}
              loading={patchMilestone.isPending}
              disabled={!draft.title.trim()}
            >
              {t("studentRepo.tasks.milestoneDetail.saveButton")}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field
            register={{}}
            label={t("studentRepo.tasks.createMilestone.fields.title")}
            value={draft.title}
            onChange={(e) =>
              setDraft((p) => ({ ...p, title: e.target.value }))
            }
          />
          <Field
            register={{}}
            label={t("studentRepo.tasks.createMilestone.fields.description")}
            value={draft.description}
            onChange={(e) =>
              setDraft((p) => ({ ...p, description: e.target.value }))
            }
          />
          <Field
            register={{}}
            type="date"
            label={t("studentRepo.tasks.createMilestone.fields.dueDate")}
            value={draft.dueDate}
            onChange={(e) =>
              setDraft((p) => ({ ...p, dueDate: e.target.value }))
            }
          />
          <p className="text-xs text-secondary dark:text-dark-secondary">
            {t("studentRepo.tasks.milestoneDetail.statusNote")}
          </p>
          <div
            className={cx(
              "grid gap-4",
              canEditGradingForms ? "md:grid-cols-3" : "md:grid-cols-1",
            )}
          >
            {canEditGradingForms ? (
              <>
                <Field
                  register={{}}
                  type="number"
                  label={t("studentRepo.tasks.createMilestone.fields.maxScore")}
                  value={draft.maxScore}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, maxScore: e.target.value }))
                  }
                />
                <Field
                  register={{}}
                  type="number"
                  label={t(
                    "studentRepo.tasks.createMilestone.fields.passingScore",
                  )}
                  value={draft.passingScore}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, passingScore: e.target.value }))
                  }
                />
              </>
            ) : null}
            <Field
              register={{}}
              type="number"
              label={t(
                "studentRepo.tasks.createMilestone.fields.requiredTasks",
              )}
              value={draft.requiredTasks}
              onChange={(e) =>
                setDraft((p) => ({ ...p, requiredTasks: e.target.value }))
              }
            />
          </div>
          {canEditGradingForms ? (
            <Field
              register={{}}
              label={t("studentRepo.tasks.createMilestone.fields.rubric")}
              value={draft.rubric}
              onChange={(e) =>
                setDraft((p) => ({ ...p, rubric: e.target.value }))
              }
            />
          ) : null}
        </div>
      </GlobalModal>

      <GlobalModal
        open={closeConfirmOpen}
        setOpen={setCloseConfirmOpen}
        isClose
        title={t("studentRepo.tasks.milestoneDetail.closeConfirmTitle")}
        subtitle={t("studentRepo.tasks.milestoneDetail.closeConfirmSubtitle")}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setCloseConfirmOpen(false)}
              disabled={closeMilestoneMut.isPending}
            >
              {t("studentRepo.pulls.actions.cancel")}
            </Button>
            <Button
              variant="danger"
              loading={closeMilestoneMut.isPending}
              onClick={runCloseMilestone}
            >
              {t("studentRepo.tasks.milestoneDetail.closeAction")}
            </Button>
          </>
        }
      />
    </div>
  );
}
