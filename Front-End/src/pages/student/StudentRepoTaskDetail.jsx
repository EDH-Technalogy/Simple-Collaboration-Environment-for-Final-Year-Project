import { createElement, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useOutletContext, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Flag,
  Milestone as MilestoneIcon,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "../../components/Button";
import Field from "../../components/Field";
import GlobalModal from "../../components/GlobalModal";
import MergedPullRequestHistoryDiff from "../../components/PullRequest/MergedPullRequestHistoryDiff";
import PRFilesDiff from "../../components/PullRequest/PRFilesDiff";
import SearchableSelect from "../../components/SearchableSelect";
import { useAuth } from "../../context/AuthContext";
import {
  canEditIssueOrMilestoneGradingForms,
  canManageVcTaskAssignment,
  canPerformVcTaskPullSubmissionReview,
  canSubmitAssignedVcTaskWork,
  canViewRepoIssueGradingContext,
  repoViewerUsername,
  taskVcSubmissionPullNumber,
  usernamesLikelySame,
} from "../../lib/vcAcademicVisibility";
import {
  useVcAssignRepoTask,
  useVcEligibleRepoTaskPullRequests,
  useVcRepoContributors,
  useVcRepoMilestones,
  useVcRepoPullRequests,
  useVcRepoTaskByNumber,
  useVcReviewRepoTask,
  useVcSubmitRepoTask,
} from "../../services/useApi";

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

function asArray(value) {
  return Array.isArray(value) ? value : [];
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
    return t("studentRepo.tasks.taskDetail.timerExpired", "Due now");
  }
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const days = Math.floor(diff / day);
  const hours = Math.floor((diff % day) / hour);
  const minutes = Math.floor((diff % hour) / minute);
  if (days > 0) {
    return t("studentRepo.tasks.taskDetail.timerDays", {
      defaultValue: "{{days}}d {{hours}}h left",
      days,
      hours,
    });
  }
  if (hours > 0) {
    return t("studentRepo.tasks.taskDetail.timerHours", {
      defaultValue: "{{hours}}h {{minutes}}m left",
      hours,
      minutes,
    });
  }
  return t("studentRepo.tasks.taskDetail.timerMinutes", {
    defaultValue: "{{minutes}}m left",
    minutes: Math.max(1, minutes),
  });
}

function normalizeTaskStatus(value) {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return "open";
  if (raw === "in_progress" || raw === "in-progress") return "progress";
  if (raw === "in_review" || raw === "in-review") return "review";
  return raw;
}

function normalizePriority(value) {
  return String(value ?? "medium").trim().toLowerCase() || "medium";
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
  const display =
    typeof value === "string" || typeof value === "number" ? (
      String(value)
    ) : (
      value
    );
  return (
    <div className="flex items-start gap-3 rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary px-3 py-3 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
      <div className="mt-0.5 text-muted dark:text-dark-muted">
        {createElement(icon, { className: "h-4 w-4", strokeWidth: 1.8 })}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted dark:text-dark-muted">
          {label}
        </p>
        <p className="mt-1 wrap-break-word text-sm text-primary dark:text-dark-primary">
          {display}
        </p>
      </div>
    </div>
  );
}

function splitCommaList(raw) {
  return String(raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function pullRequestOptionLabel(pr, t) {
  const title =
    String(pr?.title ?? "").trim() ||
    t("studentRepo.pulls.card.untitled");
  const sourceBranch = String(pr?.sourceBranch ?? "").trim();
  return sourceBranch ? `${title} (${sourceBranch})` : title;
}

function pullRequestIdentityValues(pr) {
  return [
    pr?.id,
    pr?.number,
    pr?.pullRequestId,
    pr?.pull_request_id,
    pr?.hash,
    pr?.uuid,
  ]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);
}

function pullRequestStatusValue(pr) {
  return String(pr?.status ?? pr?.state ?? "OPENED")
    .trim()
    .toUpperCase();
}

function isMergedPullRequest(pr) {
  const status = pullRequestStatusValue(pr);
  return status === "MERGED" || status === "MERGE";
}

function pullRequestSourceHash(pr) {
  return String(pr?.source_hash ?? pr?.sourceHash ?? "").trim();
}

function pullRequestTargetHash(pr) {
  return String(pr?.target_hash ?? pr?.targetHash ?? "").trim();
}

function pullRequestMergeHash(pr) {
  return String(
    pr?.merge_hash ??
      pr?.mergeHash ??
      pr?.merge_commit_sha ??
      pr?.mergeCommitSha ??
      pr?.mergeCommit ??
      "",
  ).trim();
}

function reviewEntriesFromTask(task) {
  const candidates = [
    task?.reviews,
    task?.reviewHistory,
    task?.review_history,
    task?.reviewCommentsHistory,
    task?.review_comments_history,
  ];
  const list = candidates.find(Array.isArray) ?? [];
  return list
    .map((item, index) => {
      if (typeof item === "string") {
        return { id: index, comments: item };
      }
      return {
        id: item?.id ?? item?.reviewId ?? index,
        reviewer: item?.reviewedBy ?? item?.reviewer ?? item?.createdBy,
        comments:
          item?.reviewComments ??
          item?.comments ??
          item?.feedback ??
          item?.message ??
          "",
        score: item?.score ?? item?.earnedScore,
        createdAt: item?.createdAt ?? item?.reviewedAt ?? item?.completedAt,
      };
    })
    .filter((item) => String(item.comments ?? "").trim());
}

/**
 * Assignee picker: options come from GET /repos/{owner}/{repo}/contributors (full list);
 * SearchableSelect filters that list on the client only.
 */
function IssueAssignCollaboratorCard({
  initialAssigneeUsername,
  assigneeOptions,
  contributorsFetching,
  currentUsername,
  isAssignPending,
  onAssign,
  loadError,
  onRetryLoad,
  t,
}) {
  const [selected, setSelected] = useState(() =>
    String(initialAssigneeUsername ?? "").trim(),
  );

  return (
    <div className="rounded-2xl border border-(--color-light-card-border) bg-light-app-tertiary p-4 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
      <p className="text-sm font-medium text-primary dark:text-dark-primary">
        {t("studentRepo.tasks.taskDetail.assignHeading")}
      </p>
      <Field label={t("studentRepo.tasks.taskDetail.assignSelectLabel")}>
        <SearchableSelect
          value={selected.trim() ? selected.trim() : null}
          onChange={(next) => setSelected(next != null ? String(next) : "")}
          options={assigneeOptions}
          placeholder={t(
            "studentRepo.tasks.taskDetail.assignSelectPlaceholder",
          )}
          searchPlaceholder={t(
            "studentRepo.tasks.taskDetail.assignSearchPlaceholder",
          )}
          clearable
          loading={contributorsFetching}
          disabled={Boolean(loadError)}
        />
      </Field>
      {loadError ? (
        <div className="mt-2 space-y-2">
          <p className="text-xs leading-relaxed text-light-error-text dark:text-dark-error-text">
            {loadError}
          </p>
          {onRetryLoad ? (
            <Button
              type="button"
              variant="tertiary"
              disabled={contributorsFetching}
              onClick={onRetryLoad}
            >
              {t("studentRepo.tasks.taskDetail.contributorsRetry")}
            </Button>
          ) : null}
        </div>
      ) : assigneeOptions.length === 0 && !contributorsFetching ? (
        <p className="mt-2 text-xs text-muted dark:text-dark-muted">
          {t("studentRepo.tasks.taskDetail.assignContributorsEmpty")}
        </p>
      ) : (
        <p className="mt-2 text-xs text-secondary dark:text-dark-secondary">
          {t("studentRepo.tasks.taskDetail.assignContributorsHint")}
        </p>
      )}
      <Button
        className="mt-3"
        type="button"
        variant="secondary"
        loading={isAssignPending}
        disabled={
          !currentUsername ||
          !selected.trim() ||
          isAssignPending ||
          Boolean(loadError) ||
          assigneeOptions.length === 0
        }
        title={
          !currentUsername
            ? t("studentRepo.tasks.taskDetail.assignNeedsAuth")
            : undefined
        }
        onClick={async () => {
          if (!currentUsername || !selected.trim()) return;
          await onAssign(selected.trim());
        }}
      >
        {t("studentRepo.tasks.taskDetail.assignSubmit")}
      </Button>
    </div>
  );
}

export default function StudentRepoTaskDetail() {
  const { t, i18n } = useTranslation();
  const outletCtx = useOutletContext() ?? {};
  const {
    taskNumber: taskNumberParam,
    owner: ownerParam,
    repo: repoParam,
  } = useParams();
  const owner = outletCtx.owner ?? decodeRouteSegment(ownerParam);
  const repo = outletCtx.repo ?? decodeRouteSegment(repoParam);
  const repoBase = outletCtx.repoBase ?? "";
  const { user, isStudent, isTeacher, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const canEditGradingForms = canEditIssueOrMilestoneGradingForms({
    isStudent,
    isTeacher,
    isAdmin,
  });

  const viewerHandle = repoViewerUsername(user);

  const [submitOpen, setSubmitOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewChangesOpen, setReviewChangesOpen] = useState(false);
  const [changesReviewedKey, setChangesReviewedKey] = useState(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [submitDraft, setSubmitDraft] = useState({
    pullRequestId: "",
    description: "",
  });
  const [reviewDraft, setReviewDraft] = useState({
    feedback: "",
    score: "",
    approved: false,
    checkedRequirements: "",
  });

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const taskNumber = taskNumberParam;
  const {
    data: task,
    isLoading,
    isError,
    refetch,
  } = useVcRepoTaskByNumber(owner, repo, taskNumber, {
    notifyOnError: true,
  });

  const { data: milestones = [] } = useVcRepoMilestones(
    owner,
    repo,
    { state: "all" },
    { notifyOnError: false },
  );

  const { data: pullRequests = [] } = useVcRepoPullRequests(owner, repo, {
    enabled: Boolean(owner && repo),
    notifyOnError: false,
  });

  const milestoneMap = useMemo(() => {
    const map = new Map();
    milestones.forEach((item) => {
      if (item?.number != null) map.set(item.number, item);
    });
    return map;
  }, [milestones]);

  const invalidateTaskScope = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["vc", "repos", "task", owner, repo, taskNumber],
      }),
      queryClient.invalidateQueries({
        queryKey: ["vc", "repos", "tasks", owner, repo],
      }),
      queryClient.invalidateQueries({
        queryKey: ["vc", "repos", "task-dashboard", owner, repo],
      }),
      queryClient.invalidateQueries({
        queryKey: ["vc", "repos", "milestones", owner, repo],
      }),
      queryClient.invalidateQueries({
        queryKey: ["vc", "repos", "statistics", owner, repo],
      }),
      queryClient.invalidateQueries({
        queryKey: ["vc", "repos", "tasks", owner, repo, taskNumber, "eligible-pulls"],
      }),
    ]);
  };

  const assignMutation = useVcAssignRepoTask({
    onSuccess: async () => {
      await invalidateTaskScope();
    },
  });

  const submitMutation = useVcSubmitRepoTask({
    onSuccess: async () => {
      await invalidateTaskScope();
      setSubmitOpen(false);
      setSubmitDraft({
        pullRequestId: "",
        description: "",
      });
    },
  });

  const reviewMutation = useVcReviewRepoTask({
    onSuccess: async () => {
      await invalidateTaskScope();
      setReviewOpen(false);
      setReviewDraft({
        feedback: "",
        score: "",
        approved: false,
        checkedRequirements: "",
      });
    },
  });

  const detailMilestone =
    task?.milestoneNumber != null
      ? milestoneMap.get(task.milestoneNumber)
      : null;
  const detailStatus = normalizeTaskStatus(task?.status);
  const detailPriority = normalizePriority(task?.priority);
  const dueDate = formatDate(task?.dueDate, i18n.language);
  const dueMs = dueDateMs(task?.dueDate);
  const timeRemaining = formatTimeRemaining(dueMs, nowMs, t);
  const completedDate = formatDate(task?.completedAt, i18n.language);
  const checklist = asArray(task?.requirementsChecklist);
  const labels = asArray(task?.labels);
  const assigneeName =
    task?.assignedTo?.userName ?? task?.assignedTo?.username ?? "";

  const {
    data: contributors = [],
    isFetching: contributorsFetching,
    isError: contributorsLoadError,
    refetch: refetchContributors,
  } = useVcRepoContributors(owner, repo, {
    enabled: Boolean(owner && repo),
    notifyOnError: false,
    retry: 2,
  });


  /** Full contributor payloads from the API; search is applied in SearchableSelect only. */
  const assigneeOptions = useMemo(() => {
    const byKey = new Map();
    contributors.forEach((c) => {
      const handle = String(c.username ?? "").trim();
      if (!handle) return;
      const key = handle.toLowerCase();
      if (!byKey.has(key))
        byKey.set(key, {
          username: handle,
          email: c.email ?? "",
          firstName: c.firstName ?? "",
          lastName: c.lastName ?? "",
        });
    });
    const current = String(assigneeName ?? "").trim();
    if (
      current &&
      !byKey.has(current.toLowerCase())
    ) {
      byKey.set(current.toLowerCase(), {
        username: current,
        email: "",
        firstName: "",
        lastName: "",
      });
    }
    return [...byKey.values()]
      .map((c) => {
        const full = [c.firstName, c.lastName].filter(Boolean).join(" ").trim();
        const handle = c.username;
        const label =
          full && handle ? `${full} (@${handle})` : handle || full || "—";
        const searchBlob = `${handle} ${full} ${c.email}`.trim().toLowerCase();
        return {
          value: handle,
          label,
          searchText: searchBlob,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [assigneeName, contributors]);

  const assigneeTrim = String(assigneeName ?? "").trim();
  const storedPrNumber = task ? taskVcSubmissionPullNumber(task) : null;
  const submittedChangesKey = `${String(taskNumber ?? "")}:${String(storedPrNumber ?? "")}`;
  const changesReviewed = changesReviewedKey === submittedChangesKey;
  const submittedPullRequest = useMemo(() => {
    if (storedPrNumber == null) return null;
    const wanted = String(storedPrNumber).trim();
    return (
      pullRequests.find((pr) =>
        pullRequestIdentityValues(pr).some((value) => value === wanted),
      ) ?? null
    );
  }, [pullRequests, storedPrNumber]);
  const submittedPrMerged = isMergedPullRequest(submittedPullRequest);
  const submittedPrTargetHash = pullRequestTargetHash(submittedPullRequest);
  const submittedPrResultHash =
    submittedPrMerged && pullRequestMergeHash(submittedPullRequest)
      ? pullRequestMergeHash(submittedPullRequest)
      : pullRequestSourceHash(submittedPullRequest);
  const reviewEntries = useMemo(() => reviewEntriesFromTask(task), [task]);

  const canManageAssign =
    Boolean(task) &&
    canManageVcTaskAssignment(user, task, { isTeacher, isAdmin });
  const canSubmitWork =
    Boolean(task) && canSubmitAssignedVcTaskWork(user, task);
  const canReviewPrSubmission =
    Boolean(task) &&
    canPerformVcTaskPullSubmissionReview(user, task, {
      isTeacher,
      isAdmin,
    });

  const {
    data: eligiblePullRequests = [],
    isFetching: eligiblePullRequestsFetching,
    isError: eligiblePullRequestsLoadError,
    refetch: refetchEligiblePullRequests,
  } = useVcEligibleRepoTaskPullRequests(owner, repo, taskNumber, {
    enabled: Boolean(owner && repo && taskNumber && canSubmitWork && submitOpen),
    notifyOnError: false,
    retry: 2,
  });

  const reviewerRole =
    (typeof isTeacher === "function" && isTeacher()) ||
    (typeof isAdmin === "function" && isAdmin());

  const submitBlockedExplainer =
    task && !canSubmitWork
      ? !assigneeTrim
        ? t("studentRepo.tasks.taskDetail.submitBlockedNeedsAssignment")
        : assigneeTrim && !usernamesLikelySame(viewerHandle, assigneeTrim)
            ? t("studentRepo.tasks.taskDetail.submitBlockedWrongUser")
            : null
      : null;

  const showSubmitExplainer =
    Boolean(submitBlockedExplainer) &&
    ((typeof isStudent === "function" && isStudent()) ||
      (assigneeTrim && usernamesLikelySame(viewerHandle, assigneeTrim)));

  const reviewBlockedExplainer =
    task && reviewerRole && !canReviewPrSubmission
      ? assigneeTrim &&
        viewerHandle &&
        usernamesLikelySame(viewerHandle, assigneeTrim)
        ? t("studentRepo.tasks.taskDetail.reviewBlockedAssignee")
        : null
      : null;

  const showReviewExplainer = Boolean(reviewBlockedExplainer);
  const reviewRequiresChanges = Boolean(canReviewPrSubmission && storedPrNumber != null);
  const canInspectSubmittedChanges = Boolean(
    storedPrNumber != null &&
      (canReviewPrSubmission ||
        canViewRepoIssueGradingContext(isStudent, user, task?.createdBy) ||
        usernamesLikelySame(viewerHandle, assigneeTrim)),
  );

  const eligiblePullRequestOptions = useMemo(
    () =>
      eligiblePullRequests.map((pullRequest) => {
        const label = pullRequestOptionLabel(pullRequest, t);
        const searchText = [
          pullRequest?.title,
          pullRequest?.sourceBranch,
          pullRequest?.targetBranch,
          pullRequest?.id,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return {
          value: String(pullRequest.id ?? ""),
          label,
          searchText,
        };
      }),
    [eligiblePullRequests, t],
  );

  const submitHasMinimalPayload = Boolean(submitDraft.pullRequestId.trim());

  const opCols = [
    canManageAssign,
    canSubmitWork || showSubmitExplainer,
    canReviewPrSubmission || showReviewExplainer,
  ].filter(Boolean).length;
  const opsGridCls =
    opCols >= 3
      ? "lg:grid-cols-3"
      : opCols === 2
        ? "md:grid-cols-2"
        : "";

  async function runSubmit() {
    if (!canSubmitWork) return;
    await submitMutation.mutateAsync({
      owner,
      repo,
      taskNumber,
      pullRequestId: submitDraft.pullRequestId.trim() || undefined,
      description: submitDraft.description.trim() || undefined,
    });
  }

  async function runReview() {
    const scoreNum = Number(reviewDraft.score);
    const includeScore =
      canEditGradingForms &&
      reviewDraft.score.trim() !== "" &&
      Number.isFinite(scoreNum);
    const submissionPr =
      storedPrNumber ?? (task ? taskVcSubmissionPullNumber(task) : null);
    await reviewMutation.mutateAsync({
      owner,
      repo,
      taskNumber,
      feedback: reviewDraft.feedback.trim() || undefined,
      ...(includeScore ? { score: scoreNum } : {}),
      approved: Boolean(reviewDraft.approved),
      checkedRequirements: splitCommaList(reviewDraft.checkedRequirements),
      ...(submissionPr != null ? { pullRequestId: submissionPr } : {}),
    });
  }

  const canViewGrading = task
    ? canViewRepoIssueGradingContext(isStudent, user, task.createdBy)
    : false;
  const earnedScore = task?.earnedScore ?? task?.score ?? null;
  const maxScore = task?.maxScore ?? task?.maximumScore ?? null;
  const scorePercent =
    maxScore != null && Number(maxScore) > 0 && earnedScore != null
      ? Math.max(0, Math.min(100, Math.round((Number(earnedScore) / Number(maxScore)) * 100)))
      : null;

  if (!owner || !repo || taskNumber == null || taskNumber === "") {
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
          {t("studentRepo.tasks.taskDetail.back")}
        </Link>
        <p className="text-sm text-light-error-text dark:text-dark-error-text">
          {t("studentRepo.tasks.taskDetail.loadError")}
        </p>
        <Button type="button" variant="secondary" onClick={() => refetch()}>
          {t("studentRepo.tasks.taskDetail.retry")}
        </Button>
      </div>
    );
  }

  if (!isLoading && task == null) {
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
          {t("studentRepo.tasks.taskDetail.back")}
        </Link>
      </div>

      {isLoading || !task ? (
        <p className="text-sm text-muted dark:text-dark-muted">
          {t("studentRepo.tasks.taskDetail.loading")}
        </p>
      ) : (
        <>
          <div className="rounded-3xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-5 shadow-xs dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                label={t(`studentRepo.tasks.status.${detailStatus}`)}
                tone={taskStatusTone(detailStatus)}
              />
              <span className="text-xs text-muted dark:text-dark-muted">
                {t("studentRepo.tasks.taskDetail.issueTitle", {
                  number: task.number ?? taskNumber,
                })}
              </span>
            </div>
            <h1 className="mt-3 text-xl font-semibold tracking-tight text-primary dark:text-dark-primary">
              {task.title ||
                t("studentRepo.tasks.unnamed", {
                  index: task.number ?? "—",
                })}
            </h1>
            {task.description ? (
              <p className="mt-3 text-sm leading-6 text-secondary dark:text-dark-secondary">
                {task.description}
              </p>
            ) : null}

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <DetailRow
                icon={UserRound}
                label={t("studentRepo.tasks.detail.assigneeLabel")}
                value={
                  assigneeName
                    ? t("studentRepo.tasks.detail.assignee", {
                        user: assigneeName,
                      })
                    : t("studentRepo.tasks.detail.unassigned")
                }
              />
              <DetailRow
                icon={MilestoneIcon}
                label={t("studentRepo.tasks.detail.milestoneLabel")}
                value={
                  detailMilestone ? (
                    <Link
                      to={
                        repoBase
                          ? `${repoBase}/tasks/milestone/${encodeURIComponent(String(task.milestoneNumber))}`
                          : `../../milestone/${encodeURIComponent(String(task.milestoneNumber))}`
                      }
                      relative={repoBase ? undefined : "path"}
                      className="font-medium text-(--color-chart-blue-primary) underline-offset-2 hover:underline dark:text-(--color-chart-blue-secondary)"
                    >
                      {detailMilestone.title ||
                        t("studentRepo.tasks.milestones.untitled")}
                    </Link>
                  ) : (
                    t("studentRepo.tasks.detail.none")
                  )
                }
              />
              <DetailRow
                icon={CalendarDays}
                label={t("studentRepo.tasks.detail.dueLabel")}
                value={dueDate || t("studentRepo.tasks.detail.none")}
              />
              <DetailRow
                icon={CalendarDays}
                label={t(
                  "studentRepo.tasks.taskDetail.timeRemaining",
                  "Time remaining",
                )}
                value={
                  detailStatus === "completed"
                    ? t("studentRepo.tasks.status.completed")
                    : timeRemaining
                }
              />
              <DetailRow
                icon={Flag}
                label={t("studentRepo.tasks.detail.priorityLabel")}
                value={t(`studentRepo.tasks.priority.${detailPriority}`)}
              />
              <DetailRow
                icon={ClipboardList}
                label={t("studentRepo.tasks.detail.createdByLabel")}
                value={
                  task.createdBy
                    ? t("studentRepo.tasks.detail.createdBy", {
                        user: task.createdBy,
                      })
                    : t("studentRepo.tasks.detail.none")
                }
              />
            </div>

            {canViewGrading ? (
              <div className="mt-5 rounded-2xl border border-(--color-light-card-border) bg-light-app-tertiary p-4 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted dark:text-dark-muted">
                      {t("studentRepo.tasks.detail.scoreLabel")}
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-primary dark:text-dark-primary">
                      {maxScore != null
                        ? t("studentRepo.tasks.detail.scoreValue", {
                            earned: earnedScore ?? 0,
                            total: maxScore,
                          })
                        : t("studentRepo.tasks.detail.none")}
                    </p>
                  </div>
                  {scorePercent != null ? (
                    <span className="rounded-full border border-(--color-light-card-border) bg-(--color-light-card-bg) px-3 py-1 text-xs font-semibold text-secondary dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:text-dark-secondary">
                      {scorePercent}%
                    </span>
                  ) : null}
                </div>
                {scorePercent != null ? (
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-(--color-light-card-bg) dark:bg-(--color-dark-card-bg)">
                    <div
                      className="h-full rounded-full bg-(--color-chart-blue-primary) dark:bg-(--color-chart-blue-secondary)"
                      style={{ width: `${scorePercent}%` }}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}

            {labels.length ? (
              <div className="mt-5">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted dark:text-dark-muted">
                  {t("studentRepo.tasks.detail.labelsLabel")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {labels.map((label) => (
                    <span
                      key={`${task.id ?? task.number}-${label}`}
                      className="rounded-full border border-(--color-light-card-border) bg-light-app-tertiary px-2.5 py-1 text-[11px] font-medium text-secondary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-secondary"
                    >
                      {String(label)}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {checklist.length ? (
              <div className="mt-5">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted dark:text-dark-muted">
                  {t("studentRepo.tasks.detail.checklistLabel")}
                </p>
                <ul className="space-y-2">
                  {checklist.map((item, index) => (
                    <li
                      key={`${task.id ?? task.number}-req-${index}`}
                      className="rounded-2xl border border-(--color-light-card-border) bg-light-app-tertiary px-3 py-3 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={cx(
                            "mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px]",
                            item?.completed
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                              : "border-(--color-light-card-border) bg-white text-muted dark:border-(--color-dark-card-border) dark:bg-dark-card-bg dark:text-dark-muted",
                          )}
                        >
                          {item?.completed ? "✓" : index + 1}
                        </span>
                        <div>
                          <p className="text-sm text-primary dark:text-dark-primary">
                            {item?.requirement ||
                              t("studentRepo.tasks.detail.requirementFallback", {
                                index: index + 1,
                              })}
                          </p>
                          {item?.comment ? (
                            <p className="mt-1 text-xs text-secondary dark:text-dark-secondary">
                              {item.comment}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {((canViewGrading && (task.reviewComments || task.reviewedBy)) ||
              task.submissionBranch ||
              task.submissionUrl ||
              storedPrNumber != null ||
              completedDate) ? (
              <div className="mt-6 space-y-3 border-t border-(--color-light-card-border) pt-5 dark:border-(--color-dark-card-border)">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted dark:text-dark-muted">
                  {t("studentRepo.tasks.detail.reviewPanel")}
                </p>
                {storedPrNumber != null ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-(--color-light-card-border) bg-light-app-tertiary px-4 py-3 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
                    <DetailRow
                      icon={ClipboardList}
                      label={t("studentRepo.tasks.detail.submissionPullIdLabel")}
                      value={String(storedPrNumber)}
                    />
                    {canInspectSubmittedChanges ? (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setReviewChangesOpen(true)}
                      >
                        {t(
                          "studentRepo.tasks.taskDetail.viewCurrentPullChanges",
                          "View current PR changes",
                        )}
                      </Button>
                    ) : null}
                  </div>
                ) : null}
                {canViewGrading && task.reviewedBy ? (
                  <DetailRow
                    icon={CheckCircle2}
                    label={t("studentRepo.tasks.detail.reviewedByLabel")}
                    value={task.reviewedBy}
                  />
                ) : null}
                {canViewGrading && task.reviewComments ? (
                  <DetailRow
                    icon={ClipboardList}
                    label={t("studentRepo.tasks.detail.reviewCommentsLabel")}
                    value={task.reviewComments}
                  />
                ) : null}
                {canViewGrading && reviewEntries.length ? (
                  <div className="md:col-span-2 rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary px-3 py-3 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 text-muted dark:text-dark-muted">
                        <ClipboardList className="h-4 w-4" strokeWidth={1.8} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted dark:text-dark-muted">
                          {t(
                            "studentRepo.tasks.detail.reviewHistoryLabel",
                            "Review comments",
                          )}
                        </p>
                        <div className="mt-2 space-y-2">
                          {reviewEntries.map((entry) => (
                            <div
                              key={entry.id}
                              className="rounded-lg border border-(--color-light-card-border) bg-(--color-light-card-bg) p-3 text-sm text-primary dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:text-dark-primary"
                            >
                              <p className="wrap-break-word">
                                {entry.comments}
                              </p>
                              <p className="mt-2 text-[11px] text-muted dark:text-dark-muted">
                                {[
                                  entry.reviewer
                                    ? t(
                                        "studentRepo.tasks.detail.reviewedByValue",
                                        {
                                          defaultValue: "Reviewed by {{user}}",
                                          user: entry.reviewer,
                                        },
                                      )
                                    : null,
                                  entry.score != null
                                    ? t(
                                        "studentRepo.tasks.detail.reviewScoreValue",
                                        {
                                          defaultValue: "Score {{score}}",
                                          score: entry.score,
                                        },
                                      )
                                    : null,
                                  formatDate(entry.createdAt, i18n.language),
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
                {task.submissionBranch ? (
                  <DetailRow
                    icon={MilestoneIcon}
                    label={t("studentRepo.tasks.detail.submissionBranchLabel")}
                    value={task.submissionBranch}
                  />
                ) : null}
                {task.submissionUrl ? (
                  <DetailRow
                    icon={CalendarDays}
                    label={t("studentRepo.tasks.detail.submissionUrlLabel")}
                    value={task.submissionUrl}
                  />
                ) : null}
                {completedDate ? (
                  <DetailRow
                    icon={CalendarDays}
                    label={t("studentRepo.tasks.detail.completedAtLabel")}
                    value={completedDate}
                  />
                ) : null}
              </div>
            ) : null}
          </div>

          {opCols > 0 ? (
            <div className="rounded-3xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-5 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted dark:text-dark-muted">
                {t("studentRepo.tasks.taskDetail.operations")}
              </p>
              <div className={cx("mt-4 grid gap-4", opsGridCls)}>
                {canManageAssign ? (
                  <IssueAssignCollaboratorCard
                    key={`${owner}/${repo}/${String(taskNumber)}-${String(assigneeName ?? "").trim().toLowerCase()}`}
                    initialAssigneeUsername={assigneeName}
                    assigneeOptions={assigneeOptions}
                    contributorsFetching={contributorsFetching}
                    currentUsername={viewerHandle}
                    isAssignPending={assignMutation.isPending}
                    loadError={
                      contributorsLoadError
                        ? t("studentRepo.tasks.taskDetail.contributorsLoadFailed")
                        : undefined
                    }
                    onRetryLoad={
                      contributorsLoadError ? () => refetchContributors() : undefined
                    }
                    t={t}
                    onAssign={async (assigneeUsername) => {
                      await assignMutation.mutateAsync({
                        owner,
                        repo,
                        taskNumber,
                        actorUsername: viewerHandle,
                        assigneeUsername,
                      });
                    }}
                  />
                ) : null}

                {canSubmitWork ? (
                  <div className="rounded-2xl border border-(--color-light-card-border) bg-light-app-tertiary p-4 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
                    <p className="text-sm font-medium text-primary dark:text-dark-primary">
                      {t("studentRepo.tasks.taskDetail.submitAction")}
                    </p>
                    <p className="mt-2 text-xs text-secondary dark:text-dark-secondary">
                      {t("studentRepo.tasks.taskDetail.submitHint")}
                    </p>
                    <Button
                      className="mt-3"
                      type="button"
                      icon={<Send className="h-4 w-4" />}
                      loading={submitMutation.isPending}
                      disabled={submitMutation.isPending}
                      onClick={() => setSubmitOpen(true)}
                    >
                      {t("studentRepo.tasks.taskDetail.submitAction")}
                    </Button>
                  </div>
                ) : showSubmitExplainer ? (
                  <div className="rounded-2xl border border-(--color-light-card-border) bg-light-app-tertiary p-4 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
                    <p className="text-sm font-medium text-primary dark:text-dark-primary">
                      {t("studentRepo.tasks.taskDetail.submitAction")}
                    </p>
                    <p className="mt-2 text-xs text-secondary dark:text-dark-secondary">
                      {submitBlockedExplainer}
                    </p>
                  </div>
                ) : null}

                {canReviewPrSubmission ? (
                  <div className="rounded-2xl border border-(--color-light-card-border) bg-light-app-tertiary p-4 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
                    <p className="text-sm font-medium text-primary dark:text-dark-primary">
                      {t("studentRepo.tasks.taskDetail.reviewAction")}
                    </p>
                    <p className="mt-2 text-xs text-secondary dark:text-dark-secondary">
                      {t("studentRepo.tasks.taskDetail.reviewHint")}
                    </p>
                    {storedPrNumber != null ? (
                      <Button
                        className="mt-3"
                        type="button"
                        variant={changesReviewed ? "secondary" : "primary"}
                        icon={<ShieldCheck className="h-4 w-4" />}
                        onClick={() => setReviewChangesOpen(true)}
                      >
                        {changesReviewed
                          ? t(
                              "studentRepo.tasks.taskDetail.reviewChangesAgain",
                              "Review changes again",
                            )
                          : t(
                              "studentRepo.tasks.taskDetail.reviewChangesAction",
                              "Review task changes",
                            )}
                      </Button>
                    ) : null}
                    <Button
                      className="mt-3"
                      type="button"
                      variant="secondary"
                      icon={<ShieldCheck className="h-4 w-4" />}
                      loading={reviewMutation.isPending}
                      disabled={
                        reviewMutation.isPending ||
                        (reviewRequiresChanges && !changesReviewed)
                      }
                      onClick={() => setReviewOpen(true)}
                    >
                      {t("studentRepo.tasks.taskDetail.reviewAction")}
                    </Button>
                    {reviewRequiresChanges && !changesReviewed ? (
                      <p className="mt-2 text-[11px] text-muted dark:text-dark-muted">
                        {t(
                          "studentRepo.tasks.taskDetail.reviewChangesRequired",
                          "Review the submitted pull request changes before completing this task review.",
                        )}
                      </p>
                    ) : null}
                  </div>
                ) : showReviewExplainer ? (
                  <div className="rounded-2xl border border-(--color-light-card-border) bg-light-app-tertiary p-4 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
                    <p className="text-sm font-medium text-primary dark:text-dark-primary">
                      {t("studentRepo.tasks.taskDetail.reviewAction")}
                    </p>
                    <p className="mt-2 text-xs text-secondary dark:text-dark-secondary">
                      {reviewBlockedExplainer}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </>
      )}

      <GlobalModal
        open={submitOpen && canSubmitWork}
        setOpen={setSubmitOpen}
        isClose
        title={t("studentRepo.tasks.taskDetail.submitModalTitle")}
        subtitle={t("studentRepo.tasks.taskDetail.submitModalSubtitle")}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setSubmitOpen(false)}
              disabled={submitMutation.isPending}
            >
              {t("studentRepo.pulls.actions.cancel")}
            </Button>
            <Button
              onClick={runSubmit}
              loading={submitMutation.isPending}
              disabled={
                submitMutation.isPending ||
                !submitHasMinimalPayload ||
                !canSubmitWork
              }
            >
              {t("studentRepo.tasks.taskDetail.submitConfirm")}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label={t("studentRepo.tasks.taskDetail.fieldPullRequestId")}>
            <SearchableSelect
              value={submitDraft.pullRequestId || null}
              onChange={(next) =>
                setSubmitDraft((p) => ({
                  ...p,
                  pullRequestId: next != null ? String(next) : "",
                }))
              }
              options={eligiblePullRequestOptions}
              placeholder={t(
                "studentRepo.tasks.taskDetail.fieldPullRequestIdPlaceholder",
              )}
              searchPlaceholder={t(
                "studentRepo.tasks.taskDetail.assignSearchPlaceholder",
              )}
              loading={eligiblePullRequestsFetching}
              clearable
              disabled={eligiblePullRequestsLoadError}
            />
          </Field>
          {eligiblePullRequestsLoadError ? (
            <div className="space-y-2">
              <p className="text-xs leading-relaxed text-light-error-text dark:text-dark-error-text">
                {t("studentRepo.tasks.taskDetail.loadError")}
              </p>
              <Button
                type="button"
                variant="tertiary"
                disabled={eligiblePullRequestsFetching}
                onClick={() => refetchEligiblePullRequests()}
              >
                {t("studentRepo.tasks.taskDetail.retry")}
              </Button>
            </div>
          ) : null}
          {!eligiblePullRequestsLoadError &&
          !eligiblePullRequestsFetching &&
          eligiblePullRequestOptions.length === 0 ? (
            <p className="text-xs text-muted dark:text-dark-muted">
              No eligible pull requests are available for this task.
            </p>
          ) : null}
          <p className="text-xs text-secondary dark:text-dark-secondary">
            {t("studentRepo.tasks.taskDetail.submitPrIdExplainer")}
          </p>
          <p className="text-xs">
            <Link
              to="../../pull-requests"
              relative="path"
              className="font-medium text-(--color-chart-blue-primary) underline-offset-2 hover:underline dark:text-(--color-chart-blue-secondary)"
            >
              {t("studentRepo.tasks.taskDetail.openPullRequestsLink")}
            </Link>
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted dark:text-dark-muted">
            {t("studentRepo.tasks.taskDetail.submitOptionalSection")}
          </p>
          <Field
            register={{}}
            label={t("studentRepo.tasks.taskDetail.fieldDescription")}
            value={submitDraft.description}
            onChange={(e) =>
              setSubmitDraft((p) => ({ ...p, description: e.target.value }))
            }
          />
        </div>
      </GlobalModal>

      <GlobalModal
        open={reviewChangesOpen}
        setOpen={setReviewChangesOpen}
        isClose
        title={t(
          "studentRepo.tasks.taskDetail.reviewChangesTitle",
          "Review submitted changes",
        )}
        subtitle={
          storedPrNumber != null
            ? t(
                "studentRepo.tasks.taskDetail.reviewChangesSubtitle",
                {
                  defaultValue:
                    "Inspect pull request #{{id}} before approving or requesting changes.",
                  id: storedPrNumber,
                },
              )
            : t(
                "studentRepo.tasks.taskDetail.reviewModalSubtitleNoPr",
              )
        }
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setReviewChangesOpen(false)}
            >
              {t("studentRepo.pulls.actions.cancel")}
            </Button>
            <Button
              onClick={() => {
                setChangesReviewedKey(submittedChangesKey);
                setReviewChangesOpen(false);
                setReviewOpen(true);
              }}
              disabled={storedPrNumber == null}
            >
              {t(
                "studentRepo.tasks.taskDetail.continueToReview",
                "Continue to task review",
              )}
            </Button>
          </>
        }
        className="max-w-6xl"
      >
        {storedPrNumber != null ? (
          submittedPrMerged ? (
            <MergedPullRequestHistoryDiff
              owner={owner}
              repo={repo}
              sourceHash={submittedPrResultHash}
              targetHash={submittedPrTargetHash}
            />
          ) : (
            <PRFilesDiff
              owner={owner}
              repo={repo}
              prNumber={storedPrNumber}
              pullRequest={submittedPullRequest}
            />
          )
        ) : (
          <p className="text-sm text-muted dark:text-dark-muted">
            {t("studentRepo.tasks.taskDetail.reviewModalSubtitleNoPr")}
          </p>
        )}
      </GlobalModal>

      <GlobalModal
        open={reviewOpen}
        setOpen={setReviewOpen}
        isClose
        title={t("studentRepo.tasks.taskDetail.reviewModalTitle")}
        subtitle={
          storedPrNumber != null
            ? t("studentRepo.tasks.taskDetail.reviewModalSubtitlePr", {
                id: storedPrNumber,
              })
            : t("studentRepo.tasks.taskDetail.reviewModalSubtitleNoPr")
        }
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setReviewOpen(false)}
              disabled={reviewMutation.isPending}
            >
              {t("studentRepo.pulls.actions.cancel")}
            </Button>
            <Button onClick={runReview} loading={reviewMutation.isPending}>
              {t("studentRepo.tasks.taskDetail.reviewConfirm")}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label={t("studentRepo.tasks.taskDetail.fieldFeedback")}>
            <textarea
              value={reviewDraft.feedback}
              onChange={(e) =>
                setReviewDraft((p) => ({ ...p, feedback: e.target.value }))
              }
              rows={5}
              className="min-h-28 w-full resize-y rounded-xl border border-(--color-light-input-border) bg-(--color-light-input-bg) px-3.5 py-2 text-sm text-(--color-light-text-primary) outline-none transition placeholder:text-(--color-light-input-placeholder) focus:border-(--color-light-input-border-focus) focus:ring-2 focus:ring-blue-500/15 dark:border-dark-input-border dark:bg-(--color-dark-input-bg) dark:text-(--color-dark-text-primary) dark:placeholder:text-(--color-dark-input-placeholder) dark:focus:border-(--color-dark-input-border-focus) dark:focus:ring-blue-400/15"
            />
          </Field>
          <Field label={t("studentRepo.tasks.taskDetail.fieldReviewDecision")}>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                {
                  value: false,
                  label: t("studentRepo.tasks.taskDetail.requestChanges"),
                  hint: t("studentRepo.tasks.taskDetail.requestChangesHint"),
                },
                {
                  value: true,
                  label: t("studentRepo.tasks.taskDetail.approveTask"),
                  hint: t("studentRepo.tasks.taskDetail.approveTaskHint"),
                },
              ].map((option) => {
                const active = reviewDraft.approved === option.value;
                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    onClick={() =>
                      setReviewDraft((p) => ({
                        ...p,
                        approved: option.value,
                      }))
                    }
                    className={cx(
                      "rounded-2xl border p-3 text-start transition-colors",
                      active
                        ? "border-(--color-light-input-border-focus) bg-blue-50 text-primary dark:border-(--color-dark-input-border-focus) dark:bg-blue-500/10 dark:text-dark-primary"
                        : "border-(--color-light-card-border) bg-light-app-tertiary text-secondary hover:border-(--color-light-input-border) dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-secondary dark:hover:border-(--color-dark-input-border-focus)",
                    )}
                  >
                    <span className="block text-sm font-semibold">
                      {option.label}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-muted dark:text-dark-muted">
                      {option.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </Field>
          {canEditGradingForms ? (
            <Field
              register={{}}
              type="number"
              label={t("studentRepo.tasks.taskDetail.fieldScore")}
              value={reviewDraft.score}
              onChange={(e) =>
                setReviewDraft((p) => ({ ...p, score: e.target.value }))
              }
            />
          ) : null}
          <Field
            register={{}}
            label={t("studentRepo.tasks.taskDetail.fieldCheckedReq")}
            value={reviewDraft.checkedRequirements}
            onChange={(e) =>
              setReviewDraft((p) => ({
                ...p,
                checkedRequirements: e.target.value,
              }))
            }
          />
          <p className="text-xs text-secondary dark:text-dark-secondary">
            {t("studentRepo.tasks.taskDetail.checkedReqHint")}
          </p>
        </div>
      </GlobalModal>
    </div>
  );
}
