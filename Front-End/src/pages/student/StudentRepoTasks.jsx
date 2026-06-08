import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  CirclePlus,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  Filter,
  Flag,
  Gauge,
  ListChecks,
  Milestone as MilestoneIcon,
  Plus,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { gooeyToast } from "goey-toast";
import {
  addCompleting,
  removeCompleting,
  getCompletingSet,
} from "../../lib/completingTasksStore";
import Button from "../../components/Button";
import Field from "../../components/Field";
import GlobalModal from "../../components/GlobalModal";
import SearchableSelect from "../../components/SearchableSelect";
import Select from "../../components/Select";
import RepoOverviewStatCard from "../../components/repo/RepoOverviewStatCard";
import { REPO_OVERVIEW_STAT_PALETTES } from "../../components/repo/repoOverviewStatPalettes";
import SettingsSectionCard from "../../components/SettingsSectionCard";
import { useAuth } from "../../context/AuthContext";
import {
  canEditIssueOrMilestoneGradingForms,
  repoViewerUsername,
  usernamesLikelySame,
} from "../../lib/vcAcademicVisibility";
import {
  useVcCreateRepoMilestone,
  useVcCreateRepoTask,
  useVcCompleteRepoTask,
  useVcRepoMilestones,
  useVcRepoTaskDashboard,
  useVcRepoTasks,
} from "../../services/useApi";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asNumber(raw) {
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
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

function progressValue(value) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
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

function draftInteger(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && Number.isInteger(n) ? n : Number.NaN;
}

function normalizeTaskStatus(value) {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
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

function containsIgnoreCase(source, needleLower) {
  return source != null && String(source).toLowerCase().includes(needleLower);
}

function taskAssigneeUsername(task) {
  const assigned = task?.assignedTo ?? task?.assigned_to ?? task?.assignee;
  if (assigned && typeof assigned === "object") {
    return String(
      assigned.userName ??
        assigned.username ??
        assigned.user_name ??
        assigned.login ??
        "",
    ).trim();
  }
  return String(
    assigned ?? task?.assigneeUsername ?? task?.assignedToUsername ?? "",
  ).trim();
}

function taskAssignerUsername(task) {
  const assignedBy =
    task?.assignedBy ??
    task?.assigned_by ??
    task?.assigner ??
    task?.createdBy ??
    task?.created_by;
  if (assignedBy && typeof assignedBy === "object") {
    return String(
      assignedBy.userName ??
        assignedBy.username ??
        assignedBy.user_name ??
        assignedBy.login ??
        "",
    ).trim();
  }
  return String(assignedBy ?? "").trim();
}

function taskBelongsToUser(task, username) {
  return usernamesLikelySame(taskAssigneeUsername(task), username);
}

function taskAssignedByUser(task, username) {
  return usernamesLikelySame(taskAssignerUsername(task), username);
}

function countTasksByStatus(list) {
  const counts = {
    total: list.length,
    open: 0,
    progress: 0,
    review: 0,
    completed: 0,
    cancelled: 0,
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

function taskMatchesMilestone(task, milestone) {
  const milestoneNumber = asNumber(
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

  const milestoneTitle = normalizedText(
    milestone?.title ?? milestone?.name ?? milestone?.milestoneTitle,
  );
  const taskMilestoneTitle = normalizedText(
    task?.milestoneTitle ??
      task?.milestone_title ??
      task?.milestoneName ??
      task?.milestone_name ??
      task?.milestone?.title ??
      task?.milestone?.name,
  );
  return Boolean(milestoneTitle && taskMilestoneTitle === milestoneTitle);
}

function withDerivedMilestoneProgress(milestone, tasks = []) {
  const embeddedTasks = embeddedMilestoneTasks(milestone);
  const counts = embeddedTasks.length
    ? countTasksByStatus(embeddedTasks)
    : countTasksByStatus(tasks.filter((task) => taskMatchesMilestone(task, milestone)));
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
  const totalTasks = Math.max(aggregateTotalTasks ?? 0, counts.total);
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
  const completedTasks = Math.max(aggregateCompletedTasks ?? 0, counts.completed);
  const openTasks =
    milestoneNumberValue(
      milestone,
      "openTasks",
      "open_tasks",
      "openCount",
      "open_count",
    ) ?? counts.open;
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
    ) ?? counts.progress;
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
    ) ?? counts.review;
  const cancelledTasks =
    milestoneNumberValue(
      milestone,
      "cancelledTasks",
      "cancelled_tasks",
      "canceledTasks",
      "canceled_tasks",
    ) ?? counts.cancelled;
  const derivedTotalTasks =
    totalTasks > 0
      ? totalTasks
      : completedTasks +
        openTasks +
        inProgressTasks +
        inReviewTasks +
        cancelledTasks;
  const requiredTasks = milestoneNumberValue(
    milestone,
    "requiredTasks",
    "required_tasks",
  );
  const apiCompletionPercentage = milestoneNumberValue(
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
  const computedCompletion =
    milestoneIsComplete(milestone)
      ? 100
      : apiCompletionPercentage != null && apiCompletionPercentage > 0
        ? progressValue(apiCompletionPercentage)
      : completionTarget > 0
        ? Math.round(
            (Math.min(completedTasks, completionTarget) / completionTarget) *
              100,
          )
        : null;
  const completionPercentage =
    computedCompletion != null
      ? computedCompletion
      : apiCompletionPercentage != null
        ? progressValue(apiCompletionPercentage)
        : 0;

  return {
    ...milestone,
    totalTasks: derivedTotalTasks,
    openTasks,
    inProgressTasks,
    inReviewTasks,
    completedTasks,
    completionPercentage,
  };
}

/** Client-side task search aligned with VC `TaskService` list filtering. */
function taskMatchesDeferredSearch(task, searchRaw) {
  const needle = String(searchRaw ?? "")
    .trim()
    .toLowerCase();
  if (!needle) return true;
  return (
    containsIgnoreCase(task?.title, needle) ||
    containsIgnoreCase(task?.description, needle) ||
    containsIgnoreCase(task?.createdBy, needle) ||
    containsIgnoreCase(task?.reviewedBy, needle) ||
    containsIgnoreCase(task?.reviewComments, needle) ||
    containsIgnoreCase(task?.submissionBranch, needle) ||
    containsIgnoreCase(task?.submissionCommit, needle) ||
    containsIgnoreCase(task?.submissionUrl, needle) ||
    (task?.assignedTo != null &&
      (containsIgnoreCase(
        task.assignedTo.userName ?? task.assignedTo.username,
        needle,
      ) ||
        containsIgnoreCase(task.assignedTo.firstName, needle) ||
        containsIgnoreCase(task.assignedTo.email, needle))) ||
    (Array.isArray(task?.labels) &&
      task.labels.some((lab) => containsIgnoreCase(String(lab), needle)))
  );
}

function filterRepoTasksForStudentView(list, filters) {
  const {
    deferredSearch,
    statusFilter,
    milestoneFilter,
    milestoneMap,
    scopeFilter,
    currentUsername,
  } = filters;

  return list.filter((task) => {
    if (scopeFilter === "mine" && currentUsername) {
      if (!taskBelongsToUser(task, currentUsername)) return false;
    }
    if (milestoneFilter !== "all") {
      const milestone = milestoneMap?.get(String(milestoneFilter));
      if (milestone) {
        if (!taskMatchesMilestone(task, milestone)) return false;
      } else {
        const m = Number(milestoneFilter);
        const taskNumber = taskMilestoneNumber(task);
        if (!Number.isFinite(m) || taskNumber !== m) return false;
      }
    }
    if (statusFilter !== "all") {
      const taskStatus =
        task?.completed === true ||
        task?.isCompleted === true ||
        task?.completedAt ||
        task?.completed_at
          ? "completed"
          : normalizeTaskStatus(task?.status ?? task?.state ?? task?.taskStatus);
      if (taskStatus !== statusFilter) return false;
    }
    if (!taskMatchesDeferredSearch(task, deferredSearch)) return false;
    return true;
  });
}

function normalizePriority(value) {
  return (
    String(value ?? "medium")
      .trim()
      .toLowerCase() || "medium"
  );
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

function priorityTone(priority) {
  switch (priority) {
    case "critical":
      return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300";
    case "high":
      return "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300";
    case "medium":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-500/20 dark:bg-slate-500/10 dark:text-slate-300";
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

function MilestoneCard({ milestone, locale, t, to, completingCount = 0 }) {
  const status = String(milestone?.status ?? "open").toLowerCase();
  const dueDate = formatDate(milestone?.dueDate, locale);
  const totalTasks = asNumber(milestone?.totalTasks) ?? 0;
  const completedTasks = asNumber(milestone?.completedTasks) ?? 0;
  const openTasks = asNumber(milestone?.openTasks) ?? 0;
  const requiredTasks = asNumber(milestone?.requiredTasks);
  const completionTarget =
    requiredTasks != null && requiredTasks > 0 ? requiredTasks : totalTasks;
  const apiCompletion = asNumber(
    milestone?.completionPercentage ??
      milestone?.completion_percentage ??
      milestone?.progressPercentage ??
      milestone?.progress_percentage ??
      milestone?.percentComplete ??
      milestone?.percent_complete ??
      milestone?.completion ??
      milestone?.progress,
  );
  let completion = 0;
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
      completedTasks + Number(completingCount || 0),
    );
    completion = Math.round((effectiveCompleted / completionTarget) * 100);
  } else if (apiCompletion != null) {
    completion = progressValue(apiCompletion);
  } else {
    completion = progressValue(milestone?.completionPercentage);
  }

  return (
    <Link
      to={to}
      relative="path"
      className={cx(
        "group block rounded-2xl border p-4 text-left transition-all",
        "border-(--color-light-card-border) bg-(--color-light-card-bg) hover:border-(--color-light-input-border-focus) hover:bg-white dark:border-(--color-dark-card-border) dark:bg-dark-card-bg dark:hover:border-(--color-dark-input-border-focus) dark:hover:bg-dark-card-hover",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-primary dark:text-dark-primary">
              {milestone?.title || t("studentRepo.tasks.milestones.untitled")}
            </span>
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
            {milestone?.description ? (
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-secondary dark:text-dark-secondary">
              {milestone.description}
            </p>
          ) : null}
        </div>
        <span className="rounded-full border border-(--color-light-card-border) px-2 py-1 text-[10px] font-semibold text-muted dark:border-(--color-dark-card-border) dark:text-dark-muted">
          #{milestone?.number ?? "—"}
        </span>
      </div>

      <div className="mt-4">
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

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-secondary dark:text-dark-secondary">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5 text-muted dark:text-dark-muted" />
          {dueDate || t("studentRepo.tasks.detail.none")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ListChecks className="h-3.5 w-3.5 text-muted dark:text-dark-muted" />
          {t("studentRepo.tasks.milestones.openTasks", { count: openTasks })}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-muted dark:text-dark-muted" />
          {t("studentRepo.tasks.milestones.completedTasks", {
            count: effectiveCompleted,
            total: completionTarget,
          })}
        </span>
      </div>
    </Link>
  );
}

function TaskListItem({
  task,
  milestoneMap,
  locale,
  t,
  to,
  onComplete,
  canComplete,
  isCompleting,
}) {
  const status = normalizeTaskStatus(task?.status);
  const priority = normalizePriority(task?.priority);
  const dueDate = formatDate(task?.dueDate, locale);
  const milestone = milestoneMap.get(task?.milestoneNumber);
  const title =
    task?.title ||
    t("studentRepo.tasks.unnamed", { index: task?.number ?? "—" });
  const commentsCount = asNumber(task?.commentsCount) ?? 0;

  return (
    <Link
      to={to}
      relative="path"
      className={cx(
        "block w-full rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) px-4 py-4 text-left transition-all hover:border-(--color-light-input-border-focus) hover:bg-white dark:border-(--color-dark-card-border) dark:bg-dark-card-bg dark:hover:border-(--color-dark-input-border-focus) dark:hover:bg-dark-card-hover",
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              label={t(`studentRepo.tasks.status.${status}`)}
              tone={taskStatusTone(status)}
            />
            <span className="text-sm font-semibold text-primary dark:text-dark-primary">
              {title}
            </span>
            <span className="text-xs text-muted dark:text-dark-muted">
              #{task?.number ?? "—"}
            </span>
          </div>

          {task?.description ? (
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-secondary dark:text-dark-secondary">
              {task.description}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-secondary dark:text-dark-secondary">
            <span>
              {t("studentRepo.tasks.detail.createdBy", {
                user: task?.createdBy || "—",
              })}
            </span>
            {task?.assignedTo?.userName ? (
              <span>
                {t("studentRepo.tasks.detail.assignee", {
                  user: task.assignedTo.userName,
                })}
              </span>
            ) : (
              <span>{t("studentRepo.tasks.detail.unassigned")}</span>
            )}
            {dueDate ? (
              <span>
                {t("studentRepo.tasks.detail.due", { date: dueDate })}
              </span>
            ) : null}
            <span>
              {t("studentRepo.tasks.detail.comments", { count: commentsCount })}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          {milestone ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-(--color-light-card-border) bg-light-app-tertiary px-2.5 py-1 text-[11px] font-medium text-secondary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-secondary">
              <MilestoneIcon className="h-3.5 w-3.5" />
              {milestone.title}
            </span>
          ) : null}
          <StatusBadge
            label={t(`studentRepo.tasks.priority.${priority}`)}
            tone={priorityTone(priority)}
          />
          {canComplete &&
          normalizeTaskStatus(task?.status) === "review" &&
          task?.linkedPrId ? (
            <Button
              type="button"
              variant="secondary"
              loading={Boolean(isCompleting)}
              disabled={Boolean(isCompleting)}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onComplete && onComplete(task?.number, task?.linkedPrId, task);
              }}
            >
              {t("studentRepo.tasks.actions.complete")}
            </Button>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

function FilterToolbar({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  milestoneFilter,
  setMilestoneFilter,
  scopeFilter,
  setScopeFilter,
  statusOptions,
  milestoneOptions,
  scopeOptions,
  t,
}) {
  return (
    <div className="rounded-2xl border border-(--color-light-card-border) bg-light-app-tertiary p-3 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,1.25fr)_minmax(180px,0.8fr)_minmax(220px,1fr)_minmax(180px,0.8fr)]">
        <Field
          register={{}}
          label={t("studentRepo.tasks.filters.searchLabel")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("studentRepo.tasks.filters.searchPlaceholder")}
        />

        <Select
          label={t("studentRepo.tasks.filters.statusLabel")}
          value={statusFilter}
          onChange={setStatusFilter}
          options={statusOptions}
          placeholder={t("studentRepo.tasks.filters.statusPlaceholder")}
        />

        <Field label={t("studentRepo.tasks.filters.milestoneLabel")}>
          <SearchableSelect
            value={milestoneFilter}
            onChange={setMilestoneFilter}
            options={milestoneOptions}
            placeholder={t("studentRepo.tasks.filters.milestonePlaceholder")}
            searchPlaceholder={t("studentRepo.tasks.filters.milestoneSearch")}
            clearable={false}
          />
        </Field>

        <Select
          label={t("studentRepo.tasks.filters.scopeLabel")}
          value={scopeFilter}
          onChange={setScopeFilter}
          options={scopeOptions}
          placeholder={t("studentRepo.tasks.filters.scopePlaceholder")}
        />
      </div>
    </div>
  );
}

const MODAL_TEXTAREA =
  "min-h-28 w-full resize-y rounded-xl border border-(--color-light-input-border) bg-(--color-light-input-bg) px-3.5 py-2 text-sm text-(--color-light-text-primary) outline-none transition placeholder:text-(--color-light-input-placeholder) focus:border-(--color-light-input-border-focus) focus:ring-2 focus:ring-blue-500/15 dark:border-dark-input-border dark:bg-(--color-dark-input-bg) dark:text-(--color-dark-text-primary) dark:placeholder:text-(--color-dark-input-placeholder) dark:focus:border-(--color-dark-input-border-focus) dark:focus:ring-blue-400/15";

function CreateFlowSection({ step, title, subtitle, children }) {
  return (
    <section className="rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 dark:border-(--color-dark-card-border) dark:bg-dark-card-bg">
      <div className="flex gap-3">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary text-xs font-bold text-primary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-primary"
          aria-hidden
        >
          {step}
        </span>
        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-primary dark:text-dark-primary">
              {title}
            </h3>
            {subtitle ? (
              <p className="mt-1 text-xs leading-5 text-secondary dark:text-dark-secondary">
                {subtitle}
              </p>
            ) : null}
          </div>
          {children}
        </div>
      </div>
    </section>
  );
}

function decodeRouteSegment(raw) {
  if (raw == null || raw === "") return "";
  try {
    return decodeURIComponent(String(raw));
  } catch {
    return String(raw);
  }
}

export default function StudentRepoTasks() {
  const { t, i18n } = useTranslation();
  const { user, isStudent, isTeacher, isAdmin } = useAuth();
  const canEditGradingForms = canEditIssueOrMilestoneGradingForms({
    isStudent,
    isTeacher,
    isAdmin,
  });
  const queryClient = useQueryClient();
  const outletCtx = useOutletContext() ?? {};
  const { owner: ownerParam, repo: repoParam } = useParams();
  const owner = outletCtx.owner ?? decodeRouteSegment(ownerParam);
  const repo = outletCtx.repo ?? decodeRouteSegment(repoParam);
  const repoBasePath = String(outletCtx.repoBase ?? "");
  const isAdminOrTeacherRoute =
    repoBasePath.startsWith("/admin/") ||
    repoBasePath === "/admin" ||
    repoBasePath.startsWith("/teacher/") ||
    repoBasePath === "/teacher";

  const [milestoneState, setMilestoneState] = useState("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [milestoneFilter, setMilestoneFilter] = useState("all");
  const [scopeFilter, setScopeFilter] = useState(() =>
    (typeof isTeacher === "function" && isTeacher()) ||
    (typeof isAdmin === "function" && isAdmin())
      ? "all"
      : "mine",
  );
  const [createMilestoneOpen, setCreateMilestoneOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [milestoneDraft, setMilestoneDraft] = useState({
    title: "",
    description: "",
    dueDate: "",
    maxScore: "",
    passingScore: "",
    requiredTasks: "",
  });
  const [milestoneErrors, setMilestoneErrors] = useState({});
  const [taskDraft, setTaskDraft] = useState({
    title: "",
    description: "",
    milestoneNumber: "none",
    priority: "medium",
    labels: [],
    dueDate: "",
    estimatedHours: "",
    maxScore: "",
  });
  const [taskErrors, setTaskErrors] = useState({});
  const [reviewDraft, setReviewDraft] = useState({
    open: false,
    taskNumber: null,
    pullRequestId: "",
    score: "",
    feedback: "",
    maxScore: null,
  });
  const deferredSearch = useDeferredValue(search);
  const [completing, setCompleting] = useState(() => new Set());

  const { data: dashboard, isFetching: dashboardLoading } =
    useVcRepoTaskDashboard(owner, repo, { notifyOnError: false });

  /** No query params: backend may not bind optional filters; open/closed tabs filter client-side. */
  const { data: milestones = [], isFetching: milestonesLoading } =
    useVcRepoMilestones(
      owner,
      repo,
      { state: "all" },
      { notifyOnError: false },
    );

  const currentUsername = repoViewerUsername(user);
  const isRepoOwner =
    currentUsername && usernamesLikelySame(currentUsername, owner);
  const canViewAllTasks =
    isAdminOrTeacherRoute ||
    isRepoOwner ||
    (typeof isTeacher === "function" && isTeacher()) ||
    (typeof isAdmin === "function" && isAdmin());
  const canManageRepoTasks =
    isRepoOwner ||
    (typeof isTeacher === "function" && isTeacher()) ||
    (typeof isAdmin === "function" && isAdmin());
  const effectiveScopeFilter = canViewAllTasks ? scopeFilter : "mine";

  useEffect(() => {
    if (!canViewAllTasks) {
      setScopeFilter("mine");
      return;
    }
    setScopeFilter("all");
  }, [canViewAllTasks]);

  const invalidateTaskDomain = async () => {
    await Promise.all([
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

  const completeTaskMutation = useVcCompleteRepoTask({
    onSuccess: async (_data, variables) => {
      gooeyToast.success(
        t("studentRepo.tasks.toasts.completeSuccess", {
          number: variables?.taskNumber,
        }),
      );
      await invalidateTaskDomain();
      setReviewDraft({
        open: false,
        taskNumber: null,
        pullRequestId: "",
        score: "",
        feedback: "",
        maxScore: null,
      });
    },
    onError: (err) => {
      console.error("Failed to complete task", err);
      gooeyToast.error(
        err?.message || t("studentRepo.tasks.toasts.completeError"),
      );
    },
  });

  function handleCompleteTask(taskNumber, pullRequestId, task) {
    setReviewDraft({
      open: true,
      taskNumber,
      pullRequestId: pullRequestId || "",
      score:
        task?.maxScore != null && Number.isFinite(Number(task.maxScore))
          ? String(task.maxScore)
          : "",
      feedback: "",
      maxScore: task?.maxScore ?? null,
    });
  }

  async function submitCompleteTaskReview() {
    const taskNumber = reviewDraft.taskNumber;
    if (taskNumber == null || taskNumber === "") return;
    const key = String(taskNumber);
    setCompleting((prev) => {
      const s = new Set(prev);
      s.add(key);
      return s;
    });
    addCompleting(key);
    try {
      await completeTaskMutation.mutateAsync({
        owner,
        repo,
        taskNumber,
        pullRequestId: reviewDraft.pullRequestId || null,
        score: intOrNull(reviewDraft.score),
        feedback: reviewDraft.feedback.trim() || null,
      });
    } finally {
      setCompleting((prev) => {
        const s = new Set(prev);
        s.delete(key);
        return s;
      });
      removeCompleting(key);
    }
  }

  const createMilestoneMutation = useVcCreateRepoMilestone({
    onSuccess: async () => {
      await invalidateTaskDomain();
      setCreateMilestoneOpen(false);
      setMilestoneDraft({
        title: "",
        description: "",
        dueDate: "",
        maxScore: "",
        passingScore: "",
        requiredTasks: "",
      });
      setMilestoneErrors({});
    },
  });

  const createTaskMutation = useVcCreateRepoTask({
    onSuccess: async () => {
      await invalidateTaskDomain();
      setCreateTaskOpen(false);
      setTaskDraft({
        title: "",
        description: "",
        milestoneNumber: "none",
        priority: "medium",
        labels: [],
        dueDate: "",
        estimatedHours: "",
        maxScore: "",
      });
      setTaskErrors({});
    },
  });

  const { data: allRepoTasks = [], isFetching: tasksLoading } = useVcRepoTasks(
    owner,
    repo,
    {},
    { notifyOnError: false },
  );

  const completingCounts = useMemo(() => {
    const map = new Map();
    const global = getCompletingSet();
    const lookups = global.size ? global : completing;
    for (const task of allRepoTasks) {
      if (!task) continue;
      if (!task?.milestoneNumber) continue;
      if (lookups.has(String(task.number))) {
        const m = Number(task.milestoneNumber);
        map.set(m, (map.get(m) || 0) + 1);
      }
    }
    return map;
  }, [allRepoTasks, completing]);

  const taskScopeForProgress = useMemo(() => {
    if (
      !canViewAllTasks &&
      effectiveScopeFilter === "mine" &&
      currentUsername
    ) {
      return allRepoTasks.filter((task) => taskBelongsToUser(task, currentUsername));
    }
    return allRepoTasks;
  }, [allRepoTasks, canViewAllTasks, currentUsername, effectiveScopeFilter]);

  const milestoneMap = useMemo(() => {
    const map = new Map();
    milestones
      .map((item) => withDerivedMilestoneProgress(item, allRepoTasks))
      .forEach((item) => {
        if (item?.number != null) {
          map.set(item.number, item);
          map.set(String(item.number), item);
        }
      });
    return map;
  }, [allRepoTasks, milestones]);

  const tasks = useMemo(
    () =>
      filterRepoTasksForStudentView(allRepoTasks, {
        deferredSearch,
        statusFilter,
        milestoneFilter,
        milestoneMap,
        scopeFilter: effectiveScopeFilter,
        currentUsername,
      }),
    [
      allRepoTasks,
      currentUsername,
      deferredSearch,
      effectiveScopeFilter,
      milestoneFilter,
      milestoneMap,
      statusFilter,
    ],
  );

  const milestoneCounts = useMemo(() => {
    const scopedMilestones = milestones.map((item) =>
      withDerivedMilestoneProgress(item, allRepoTasks),
    );
    const open = scopedMilestones.filter(
      (item) => String(item?.status ?? "open").toLowerCase() !== "closed",
    ).length;
    const closed = scopedMilestones.length - open;
    return { open, closed };
  }, [allRepoTasks, milestones]);

  const visibleMilestones = useMemo(
    () =>
      milestones
        .map((item) => withDerivedMilestoneProgress(item, allRepoTasks))
        .filter((item) => {
          if (milestoneState === "all") return true;
          return milestoneState === "closed"
            ? String(item?.status ?? "").toLowerCase() === "closed"
            : String(item?.status ?? "open").toLowerCase() !== "closed";
        }),
    [allRepoTasks, milestoneState, milestones],
  );

  const statusOptions = useMemo(
    () => [
      { value: "all", label: t("studentRepo.tasks.filters.statusAll") },
      { value: "open", label: t("studentRepo.tasks.status.open") },
      { value: "progress", label: t("studentRepo.tasks.status.progress") },
      { value: "review", label: t("studentRepo.tasks.status.review") },
      { value: "completed", label: t("studentRepo.tasks.status.completed") },
      { value: "cancelled", label: t("studentRepo.tasks.status.cancelled") },
    ],
    [t],
  );

  const milestoneOptions = useMemo(
    () => [
      { value: "all", label: t("studentRepo.tasks.filters.milestoneAll") },
      ...milestones.map((item) => ({
        value: String(item.number),
        label: `#${item.number} · ${item.title || t("studentRepo.tasks.milestones.untitled")}`,
      })),
    ],
    [milestones, t],
  );

  const milestoneCreateOptions = useMemo(
    () => [
      { value: "none", label: t("studentRepo.tasks.detail.none") },
      ...milestones.map((item) => ({
        value: String(item.number),
        label: `#${item.number} · ${item.title || t("studentRepo.tasks.milestones.untitled")}`,
      })),
    ],
    [milestones, t],
  );

  const scopeOptions = useMemo(() => {
    const mine = { value: "mine", label: t("studentRepo.tasks.filters.scopeMine") };
    if (!canViewAllTasks) return [mine];
    return [
      { value: "all", label: t("studentRepo.tasks.filters.scopeAll") },
      mine,
    ];
  }, [canViewAllTasks, t]);

  const priorityOptions = useMemo(
    () => [
      { value: "low", label: t("studentRepo.tasks.priority.low") },
      { value: "medium", label: t("studentRepo.tasks.priority.medium") },
      { value: "high", label: t("studentRepo.tasks.priority.high") },
      { value: "critical", label: t("studentRepo.tasks.priority.critical") },
    ],
    [t],
  );

  const labelOptions = useMemo(
    () =>
      ["BUG", "DOCUMENTATION", "DUPLICATE", "INVALID", "QUESTION"].map(
        (value) => ({
          value,
          label: value,
          searchText: value,
        }),
      ),
    [],
  );

  const summaryTiles = useMemo(() => {
    const scopedCounts = countTasksByStatus(taskScopeForProgress);
    const useBackendDashboard =
      !canViewAllTasks &&
      effectiveScopeFilter === "mine" &&
      asNumber(dashboard?.totalTasks) != null;
    const totalTasks = useBackendDashboard
      ? asNumber(dashboard?.totalTasks) ?? 0
      : scopedCounts.total;
    return [
      {
        key: "total",
        icon: ClipboardList,
        label: t("studentRepo.tasks.statTotal"),
        value: totalTasks,
        hint: t("studentRepo.tasks.summary.totalHint"),
        paletteIndex: 0,
      },
      {
        key: "open",
        icon: CircleDot,
        label: t("studentRepo.tasks.statOpen"),
        value: useBackendDashboard
          ? asNumber(dashboard?.openTasks) ?? 0
          : scopedCounts.open,
        hint: t("studentRepo.tasks.summary.openHint"),
        paletteIndex: 1,
      },
      {
        key: "progress",
        icon: Gauge,
        label: t("studentRepo.tasks.statInProgress"),
        value: useBackendDashboard
          ? asNumber(dashboard?.inProgressTasks) ?? 0
          : scopedCounts.progress,
        hint: t("studentRepo.tasks.summary.progressHint"),
        paletteIndex: 2,
      },
      {
        key: "review",
        icon: ListChecks,
        label: t("studentRepo.tasks.statInReview"),
        value: useBackendDashboard
          ? asNumber(dashboard?.inReviewTasks) ?? 0
          : scopedCounts.review,
        hint: t("studentRepo.tasks.summary.reviewHint"),
        paletteIndex: 3,
      },
      {
        key: "completed",
        icon: CheckCircle2,
        label: t("studentRepo.tasks.statCompleted"),
        value: useBackendDashboard
          ? asNumber(dashboard?.completedTasks) ?? 0
          : scopedCounts.completed,
        hint: t("studentRepo.tasks.summary.completedHint"),
        paletteIndex: 0,
      },
    ];
  }, [canViewAllTasks, dashboard, effectiveScopeFilter, taskScopeForProgress, t]);

  const isLoading = dashboardLoading || milestonesLoading || tasksLoading;

  /** Milestone picked in the task modal — used for `milestoneId` alongside `milestoneNumber`. */
  const draftTaskMilestone = useMemo(() => {
    if (taskDraft.milestoneNumber === "none") return null;
    return (
      milestones.find(
        (m) => String(m?.number) === String(taskDraft.milestoneNumber),
      ) ?? null
    );
  }, [milestones, taskDraft.milestoneNumber]);

  function invalidWholeNumberMessage(fieldLabel, min) {
    return min > 0
      ? t("studentRepo.tasks.validation.positiveWholeNumber", {
          field: fieldLabel,
          defaultValue: `${fieldLabel} must be a whole number greater than 0.`,
        })
      : t("studentRepo.tasks.validation.nonNegativeWholeNumber", {
          field: fieldLabel,
          defaultValue: `${fieldLabel} must be a whole number and cannot be negative.`,
        });
  }

  function validateDraftInteger(errors, source, key, fieldLabel, min) {
    const n = draftInteger(source[key]);
    if (Number.isNaN(n) || (n != null && n < min)) {
      errors[key] = invalidWholeNumberMessage(fieldLabel, min);
      return null;
    }
    return n;
  }

  function validateMilestoneDraft() {
    const errors = {};
    if (!milestoneDraft.title.trim()) {
      errors.title = t("studentRepo.tasks.validation.titleRequired", {
        defaultValue: "Title is required.",
      });
    }
    const maxScore = validateDraftInteger(
      errors,
      milestoneDraft,
      "maxScore",
      t("studentRepo.tasks.createMilestone.fields.maxScore"),
      0,
    );
    const passingScore = validateDraftInteger(
      errors,
      milestoneDraft,
      "passingScore",
      t("studentRepo.tasks.createMilestone.fields.passingScore"),
      0,
    );
    validateDraftInteger(
      errors,
      milestoneDraft,
      "requiredTasks",
      t("studentRepo.tasks.createMilestone.fields.requiredTasks"),
      1,
    );
    if (
      maxScore != null &&
      passingScore != null &&
      passingScore > maxScore
    ) {
      errors.passingScore = t(
        "studentRepo.tasks.validation.passingScoreMax",
        {
          defaultValue:
            "Passing score cannot be greater than maximum score.",
        },
      );
    }
    setMilestoneErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function validateTaskDraft() {
    const errors = {};
    if (!taskDraft.title.trim()) {
      errors.title = t("studentRepo.tasks.validation.titleRequired", {
        defaultValue: "Title is required.",
      });
    }
    validateDraftInteger(
      errors,
      taskDraft,
      "estimatedHours",
      t("studentRepo.tasks.createTask.fields.estimatedHours"),
      0,
    );
    validateDraftInteger(
      errors,
      taskDraft,
      "maxScore",
      t("studentRepo.tasks.createTask.fields.maxScore"),
      0,
    );
    setTaskErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function submitMilestone() {
    if (!canManageRepoTasks) return;
    if (!validateMilestoneDraft()) {
      gooeyToast.error(
        t("studentRepo.tasks.validation.fixErrors", {
          defaultValue: "Please fix the highlighted fields before submitting.",
        }),
      );
      return;
    }
    await createMilestoneMutation.mutateAsync({
      owner,
      repo,
      title: milestoneDraft.title.trim(),
      description: milestoneDraft.description.trim() || null,
      dueDate: isoFromDateInput(milestoneDraft.dueDate),
      maxScore: intOrNull(milestoneDraft.maxScore),
      passingScore: intOrNull(milestoneDraft.passingScore),
      requiredTasks: intOrNull(milestoneDraft.requiredTasks),
      ...(currentUsername ? { createdBy: currentUsername } : {}),
    });
  }

  async function submitTask() {
    if (!canManageRepoTasks) return;
    if (!validateTaskDraft()) {
      gooeyToast.error(
        t("studentRepo.tasks.validation.fixErrors", {
          defaultValue: "Please fix the highlighted fields before submitting.",
        }),
      );
      return;
    }
    await createTaskMutation.mutateAsync({
      owner,
      repo,
      username: currentUsername,
      title: taskDraft.title.trim(),
      description: taskDraft.description.trim() || null,
      milestoneNumber:
        taskDraft.milestoneNumber !== "none"
          ? intOrNull(taskDraft.milestoneNumber)
          : null,
      ...(draftTaskMilestone?.id ? { milestoneId: draftTaskMilestone.id } : {}),
      priority: String(taskDraft.priority || "medium").toUpperCase(),
      labels: asArray(taskDraft.labels).map((item) =>
        String(item).toUpperCase(),
      ),
      dueDate: isoFromDateInput(taskDraft.dueDate),
      estimatedHours: intOrNull(taskDraft.estimatedHours),
      maxScore: intOrNull(taskDraft.maxScore),
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {summaryTiles.map((card) => (
          <RepoOverviewStatCard
            key={card.key}
            icon={card.icon}
            label={card.label}
            value={card.value}
            hint={card.hint}
            palette={
              REPO_OVERVIEW_STAT_PALETTES[
                card.paletteIndex % REPO_OVERVIEW_STAT_PALETTES.length
              ]
            }
          />
        ))}
      </div>

      <SettingsSectionCard
        icon={MilestoneIcon}
        title={t("studentRepo.tasks.milestones.title")}
        description={t("studentRepo.tasks.milestones.subtitle")}
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="inline-flex rounded-full border border-(--color-light-card-border) bg-light-app-tertiary p-1 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
              {["all", "open", "closed"].map((value) => {
                const active = milestoneState === value;
                const count =
                  value === "all"
                    ? (milestoneCounts.open ?? 0) +
                      (milestoneCounts.closed ?? 0)
                    : milestoneCounts[value] ?? 0;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMilestoneState(value)}
                    className={cx(
                      "rounded-full px-4 py-2 text-xs font-semibold transition-colors",
                      active
                        ? "bg-white text-primary shadow-xs dark:bg-dark-card-bg dark:text-dark-primary"
                        : "text-muted hover:text-secondary dark:text-dark-muted dark:hover:text-dark-secondary",
                    )}
                  >
                    {value === "all"
                      ? t("studentRepo.tasks.filters.statusAll")
                      : t(`studentRepo.tasks.milestones.${value}`)}{" "}
                    ({count})
                  </button>
                );
              })}
            </div>
            <Button
              icon={<CirclePlus />}
              onClick={() => {
                setMilestoneErrors({});
                setCreateMilestoneOpen(true);
              }}
              disabled={!canManageRepoTasks}
            >
              {t("studentRepo.tasks.actions.newMilestone")}
            </Button>
          </div>
        }
        contentClassName="space-y-5"
      >
        {isLoading ? (
          <p className="text-sm text-muted dark:text-dark-muted">
            {t("studentRepo.tasks.loading")}
          </p>
        ) : visibleMilestones.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {visibleMilestones.map((milestone) => (
              <MilestoneCard
                key={milestone.id ?? milestone.number}
                milestone={milestone}
                locale={i18n.language}
                t={t}
                to={`milestone/${encodeURIComponent(String(milestone.number))}`}
                completingCount={completingCounts.get(Number(milestone.number)) || 0}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted dark:text-dark-muted">
            {t("studentRepo.tasks.milestones.empty")}
          </p>
        )}
      </SettingsSectionCard>

      <SettingsSectionCard
        icon={ClipboardList}
        title={t("studentRepo.tasks.issues.title")}
        description={t("studentRepo.tasks.issues.subtitle")}
        action={
          <Button
            icon={<CirclePlus />}
            onClick={() => {
              setTaskErrors({});
              setCreateTaskOpen(true);
            }}
            disabled={!currentUsername || !canManageRepoTasks}
            title={
              !currentUsername
                ? t("studentRepo.tasks.authRequiredUsername")
                : undefined
            }
          >
            {t("studentRepo.tasks.actions.newTask")}
          </Button>
        }
        contentClassName="space-y-5"
      >
        <FilterToolbar
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          milestoneFilter={milestoneFilter}
          setMilestoneFilter={setMilestoneFilter}
          scopeFilter={effectiveScopeFilter}
          setScopeFilter={setScopeFilter}
          statusOptions={statusOptions}
          milestoneOptions={milestoneOptions}
          scopeOptions={scopeOptions}
          t={t}
        />

        <div className="flex items-center gap-2 text-xs text-muted dark:text-dark-muted">
          <Filter className="h-3.5 w-3.5" />
          {t("studentRepo.tasks.filters.showing", { count: tasks.length })}
        </div>

        {!isLoading && !tasks.length ? (
          <div className="rounded-2xl border border-dashed border-(--color-light-card-border) bg-light-app-tertiary px-5 py-8 text-center dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
            <p className="text-sm font-medium text-primary dark:text-dark-primary">
              {t("studentRepo.tasks.empty")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskListItem
                key={task.id ?? task.number}
                task={task}
                milestoneMap={milestoneMap}
                locale={i18n.language}
                t={t}
                to={`issue/${encodeURIComponent(String(task.number))}`}
                onComplete={handleCompleteTask}
                canComplete={
                  currentUsername &&
                  taskAssignedByUser(task, currentUsername) &&
                  !taskBelongsToUser(task, currentUsername)
                }
                isCompleting={completing.has(String(task.number))}
              />
            ))}
          </div>
        )}
      </SettingsSectionCard>

      <GlobalModal
        open={reviewDraft.open}
        setOpen={(open) =>
          setReviewDraft((prev) => ({
            ...prev,
            open,
          }))
        }
        isClose
        title={t("studentRepo.tasks.taskDetail.reviewModalTitle")}
        subtitle={t("studentRepo.tasks.taskDetail.reviewHint")}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() =>
                setReviewDraft((prev) => ({
                  ...prev,
                  open: false,
                }))
              }
              disabled={completeTaskMutation.isPending}
            >
              {t("studentRepo.pulls.actions.cancel")}
            </Button>
            <Button
              onClick={submitCompleteTaskReview}
              loading={completeTaskMutation.isPending}
              disabled={reviewDraft.taskNumber == null}
            >
              {t("studentRepo.tasks.taskDetail.reviewConfirm")}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field
            register={{}}
            type="number"
            label={t("studentRepo.tasks.detail.scoreLabel")}
            value={reviewDraft.score}
            onChange={(e) =>
              setReviewDraft((prev) => ({
                ...prev,
                score: e.target.value,
              }))
            }
            placeholder={
              reviewDraft.maxScore != null ? String(reviewDraft.maxScore) : "100"
            }
          />
          <Field label={t("studentRepo.tasks.taskDetail.fieldDescription")}>
            <textarea
              value={reviewDraft.feedback}
              onChange={(e) =>
                setReviewDraft((prev) => ({
                  ...prev,
                  feedback: e.target.value,
                }))
              }
              rows={5}
              className={MODAL_TEXTAREA}
              placeholder={t("studentRepo.tasks.taskDetail.reviewHint")}
            />
          </Field>
        </div>
      </GlobalModal>

      <GlobalModal
        open={createMilestoneOpen}
        setOpen={(open) => {
          if (!open) setMilestoneErrors({});
          setCreateMilestoneOpen(open);
        }}
        isClose
        title={t("studentRepo.tasks.createMilestone.title")}
        subtitle={t("studentRepo.tasks.createMilestone.subtitle")}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setMilestoneErrors({});
                setCreateMilestoneOpen(false);
              }}
              disabled={createMilestoneMutation.isPending}
            >
              {t("studentRepo.pulls.actions.cancel")}
            </Button>
            <Button
              onClick={submitMilestone}
              loading={createMilestoneMutation.isPending}
              disabled={!milestoneDraft.title.trim()}
            >
              {t("studentRepo.tasks.createMilestone.submit")}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <CreateFlowSection
            step={1}
            title={t("studentRepo.tasks.createMilestone.sections.identity")}
            subtitle={t(
              "studentRepo.tasks.createMilestone.sections.identityHint",
            )}
          >
            <div className="grid gap-4 md:grid-cols-[minmax(0,1.35fr)_minmax(220px,0.65fr)]">
              <Field
                register={{}}
                label={t("studentRepo.tasks.createMilestone.fields.title")}
                value={milestoneDraft.title}
                error={milestoneErrors.title}
                onChange={(e) => {
                  setMilestoneErrors((prev) => ({ ...prev, title: undefined }));
                  setMilestoneDraft((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }));
                }}
                placeholder={t(
                  "studentRepo.tasks.createMilestone.placeholders.title",
                )}
              />
              <Field
                register={{}}
                type="date"
                label={t("studentRepo.tasks.createMilestone.fields.dueDate")}
                value={milestoneDraft.dueDate}
                onChange={(e) =>
                  setMilestoneDraft((prev) => ({
                    ...prev,
                    dueDate: e.target.value,
                  }))
                }
              />
            </div>
            <Field
              label={t("studentRepo.tasks.createMilestone.fields.description")}
            >
              <textarea
                value={milestoneDraft.description}
                onChange={(e) =>
                  setMilestoneDraft((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder={t(
                  "studentRepo.tasks.createMilestone.placeholders.description",
                )}
                rows={5}
                className={MODAL_TEXTAREA}
              />
            </Field>
          </CreateFlowSection>

          <CreateFlowSection
            step={2}
            title={t("studentRepo.tasks.createMilestone.sections.grading")}
            subtitle={t(
              "studentRepo.tasks.createMilestone.sections.gradingHint",
            )}
          >
            <div
              className={cx(
                "grid gap-4",
                canEditGradingForms ? "sm:grid-cols-3" : "sm:grid-cols-1",
              )}
            >
              {canEditGradingForms ? (
                <>
                  <Field
                    register={{}}
                    label={t(
                      "studentRepo.tasks.createMilestone.fields.maxScore",
                    )}
                    type="number"
                    min="0"
                    step="1"
                    value={milestoneDraft.maxScore}
                    error={milestoneErrors.maxScore}
                    onChange={(e) => {
                      setMilestoneErrors((prev) => ({
                        ...prev,
                        maxScore: undefined,
                        passingScore: undefined,
                      }));
                      setMilestoneDraft((prev) => ({
                        ...prev,
                        maxScore: e.target.value,
                      }));
                    }}
                    placeholder="100"
                  />
                  <Field
                    register={{}}
                    label={t(
                      "studentRepo.tasks.createMilestone.fields.passingScore",
                    )}
                    type="number"
                    min="0"
                    step="1"
                    value={milestoneDraft.passingScore}
                    error={milestoneErrors.passingScore}
                    onChange={(e) => {
                      setMilestoneErrors((prev) => ({
                        ...prev,
                        passingScore: undefined,
                      }));
                      setMilestoneDraft((prev) => ({
                        ...prev,
                        passingScore: e.target.value,
                      }));
                    }}
                    placeholder="60"
                  />
                </>
              ) : null}
              <Field
                register={{}}
                label={t(
                  "studentRepo.tasks.createMilestone.fields.requiredTasks",
                )}
                type="number"
                min="1"
                step="1"
                value={milestoneDraft.requiredTasks}
                error={milestoneErrors.requiredTasks}
                onChange={(e) => {
                  setMilestoneErrors((prev) => ({
                    ...prev,
                    requiredTasks: undefined,
                  }));
                  setMilestoneDraft((prev) => ({
                    ...prev,
                    requiredTasks: e.target.value,
                  }));
                }}
                placeholder="3"
              />
            </div>
          </CreateFlowSection>
        </div>
      </GlobalModal>

      <GlobalModal
        open={createTaskOpen}
        setOpen={(open) => {
          if (!open) setTaskErrors({});
          setCreateTaskOpen(open);
        }}
        isClose
        title={t("studentRepo.tasks.createTask.title")}
        subtitle={t("studentRepo.tasks.createTask.subtitle")}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setTaskErrors({});
                setCreateTaskOpen(false);
              }}
              disabled={createTaskMutation.isPending}
            >
              {t("studentRepo.pulls.actions.cancel")}
            </Button>
            <Button
              onClick={submitTask}
              loading={createTaskMutation.isPending}
              disabled={!taskDraft.title.trim() || !currentUsername}
            >
              {t("studentRepo.tasks.createTask.submit")}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <CreateFlowSection
            step={1}
            title={t("studentRepo.tasks.createTask.sections.identity")}
            subtitle={t("studentRepo.tasks.createTask.sections.identityHint")}
          >
            <Field
              register={{}}
              label={t("studentRepo.tasks.createTask.fields.title")}
              value={taskDraft.title}
              error={taskErrors.title}
              onChange={(e) => {
                setTaskErrors((prev) => ({ ...prev, title: undefined }));
                setTaskDraft((prev) => ({ ...prev, title: e.target.value }));
              }}
              placeholder={t("studentRepo.tasks.createTask.placeholders.title")}
            />
            <Field label={t("studentRepo.tasks.createTask.fields.description")}>
              <textarea
                value={taskDraft.description}
                onChange={(e) =>
                  setTaskDraft((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder={t(
                  "studentRepo.tasks.createTask.placeholders.description",
                )}
                rows={5}
                className={MODAL_TEXTAREA}
              />
            </Field>
          </CreateFlowSection>

          <CreateFlowSection
            step={2}
            title={t("studentRepo.tasks.createTask.sections.planning")}
            subtitle={t("studentRepo.tasks.createTask.sections.planningHint")}
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <Field label={t("studentRepo.tasks.createTask.fields.milestone")}>
                <SearchableSelect
                  value={taskDraft.milestoneNumber}
                  onChange={(value) =>
                    setTaskDraft((prev) => ({
                      ...prev,
                      milestoneNumber: value,
                    }))
                  }
                  options={milestoneCreateOptions}
                  placeholder={t(
                    "studentRepo.tasks.filters.milestonePlaceholder",
                  )}
                  searchPlaceholder={t(
                    "studentRepo.tasks.filters.milestoneSearch",
                  )}
                  clearable={false}
                />
              </Field>
              <Select
                label={t("studentRepo.tasks.createTask.fields.priority")}
                value={taskDraft.priority}
                onChange={(value) =>
                  setTaskDraft((prev) => ({ ...prev, priority: value }))
                }
                options={priorityOptions}
              />
            </div>
            <div
              className={cx(
                "grid gap-4",
                canEditGradingForms ? "sm:grid-cols-3" : "sm:grid-cols-2",
              )}
            >
              <Field
                register={{}}
                type="date"
                label={t("studentRepo.tasks.createTask.fields.dueDate")}
                value={taskDraft.dueDate}
                onChange={(e) =>
                  setTaskDraft((prev) => ({ ...prev, dueDate: e.target.value }))
                }
              />
              <Field
                register={{}}
                type="number"
                min="0"
                step="1"
                label={t("studentRepo.tasks.createTask.fields.estimatedHours")}
                value={taskDraft.estimatedHours}
                error={taskErrors.estimatedHours}
                onChange={(e) => {
                  setTaskErrors((prev) => ({
                    ...prev,
                    estimatedHours: undefined,
                  }));
                  setTaskDraft((prev) => ({
                    ...prev,
                    estimatedHours: e.target.value,
                  }));
                }}
                placeholder="8"
              />
              {canEditGradingForms ? (
                <Field
                  register={{}}
                  type="number"
                  min="0"
                  step="1"
                  label={t("studentRepo.tasks.createTask.fields.maxScore")}
                  value={taskDraft.maxScore}
                  error={taskErrors.maxScore}
                  onChange={(e) => {
                    setTaskErrors((prev) => ({
                      ...prev,
                      maxScore: undefined,
                    }));
                    setTaskDraft((prev) => ({
                      ...prev,
                      maxScore: e.target.value,
                    }));
                  }}
                  placeholder="20"
                />
              ) : null}
            </div>
          </CreateFlowSection>

          <CreateFlowSection
            step={3}
            title={t("studentRepo.tasks.createTask.sections.metadata")}
            subtitle={t("studentRepo.tasks.createTask.sections.metadataHint")}
          >
            <Field label={t("studentRepo.tasks.createTask.fields.labels")}>
              <SearchableSelect
                multiple
                value={taskDraft.labels}
                onChange={(value) =>
                  setTaskDraft((prev) => ({
                    ...prev,
                    labels: Array.isArray(value) ? value : [],
                  }))
                }
                options={labelOptions}
                placeholder={t(
                  "studentRepo.tasks.createTask.placeholders.labels",
                )}
                searchPlaceholder={t(
                  "studentRepo.tasks.createTask.placeholders.searchLabels",
                )}
              />
            </Field>
          </CreateFlowSection>

        </div>
      </GlobalModal>
    </div>
  );
}
