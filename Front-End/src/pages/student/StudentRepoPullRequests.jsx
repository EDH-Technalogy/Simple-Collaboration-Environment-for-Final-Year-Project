import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  GitBranch,
  GitCompareArrows,
  GitMerge,
  GitPullRequest,
  Loader2,
  Search,
  XCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  useNavigate,
  useOutletContext,
  useSearchParams,
} from "react-router-dom";
import { gooeyToast } from "goey-toast";
import Button from "../../components/Button";
import ConflictResolver from "../../components/MergeConflict/ConflictResolver";
import MergedPullRequestHistoryDiff from "../../components/PullRequest/MergedPullRequestHistoryDiff";
import PRFilesDiff from "../../components/PullRequest/PRFilesDiff";
import RepoOverviewStatCard from "../../components/repo/RepoOverviewStatCard";
import { REPO_OVERVIEW_STAT_PALETTES } from "../../components/repo/repoOverviewStatPalettes";
import Select from "../../components/Select";
import SettingsSectionCard from "../../components/SettingsSectionCard";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../lib/utils";
import {
  repoViewerUsername,
  taskVcSubmissionPullNumber,
  usernamesLikelySame,
} from "../../lib/vcAcademicVisibility";
import {
  useVcMergePullRequest,
  useVcMergeConflicts,
  useVcCreatePullRequest,
  useVcRepoPullRequests,
  useVcRepoTasks,
  useVcRepositoryRefs,
  useSessionProfile,
} from "../../services/useApi";

function prTitle(pr) {
  return pr.title ?? pr.name ?? pr.subject ?? `#${pr.id ?? pr.number ?? ""}`;
}

function prStatusValue(pr) {
  const raw = pr?.status ?? pr?.state ?? "OPENED";
  return String(raw ?? "OPENED")
    .trim()
    .toUpperCase();
}

function prAuthorName(pr) {
  const author = pr?.author;
  if (!author || typeof author !== "object") return "—";
  const full = [author.firstName, author.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return full || author.username || author.email || author.id || "—";
}

function prAuthorId(pr) {
  return String(pr?.author?.id ?? pr?.authorId ?? "").trim();
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

function prCreatedAt(pr) {
  return String(pr?.created_at ?? pr?.createdAt ?? "").trim();
}

function prCreatedAtMs(pr) {
  const raw = prCreatedAt(pr);
  const value = raw ? Date.parse(raw) : Number.NaN;
  return Number.isFinite(value) ? value : 0;
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function prSourceHash(pr) {
  return String(pr?.source_hash ?? pr?.sourceHash ?? "").trim();
}

function prTargetHash(pr) {
  return String(pr?.target_hash ?? pr?.targetHash ?? "").trim();
}

function prMergeHash(pr) {
  return String(
    pr?.merge_hash ??
      pr?.mergeHash ??
      pr?.merge_commit_sha ??
      pr?.mergeCommitSha ??
      pr?.mergeCommit ??
      "",
  ).trim();
}

function isLikelySha(value) {
  const text = String(value ?? "").trim();
  return /^[a-f0-9]{7,40}$/i.test(text);
}

function normalizeBranchLabel(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  if (/^refs\/heads\//i.test(text)) {
    return text.replace(/^refs\/heads\//i, "").trim();
  }
  if (/^ref:\s*refs\/heads\//i.test(text)) {
    return text.replace(/^ref:\s*refs\/heads\//i, "").trim();
  }
  return text;
}

function shortSha(value) {
  const text = String(value ?? "").trim();
  if (!isLikelySha(text)) return text;
  return text.slice(0, 8);
}

function branchCandidates(pr, kind) {
  const source = kind === "source";
  return [
    source ? pr?.source_branch : pr?.target_branch,
    source ? pr?.sourceBranch : pr?.targetBranch,
    source ? pr?.source_hash : pr?.target_hash,
    source ? pr?.sourceHash : pr?.targetHash,
    source ? pr?.sourceRef : pr?.targetRef,
    source ? pr?.head : pr?.base,
    source ? pr?.headBranch : pr?.baseBranch,
    source ? pr?.compareBranch : pr?.baseBranchName,
  ]
    .map(normalizeBranchLabel)
    .filter(Boolean);
}

function readableSourceBranch(pr) {
  const candidates = branchCandidates(pr, "source");
  const readable = candidates.find((value) => !isLikelySha(value));
  if (readable) return readable;
  return "";
}

function readableTargetBranch(pr) {
  const candidates = branchCandidates(pr, "target");
  const readable = candidates.find((value) => !isLikelySha(value));
  if (readable) return readable;
  return "";
}

function formatAbsoluteTime(raw, locale) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return d.toISOString();
  }
}

function formatRelativeTime(raw, locale) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "—";
  const diffMs = d.getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const units = [
    [1000 * 60 * 60 * 24 * 365, "year"],
    [1000 * 60 * 60 * 24 * 30, "month"],
    [1000 * 60 * 60 * 24 * 7, "week"],
    [1000 * 60 * 60 * 24, "day"],
    [1000 * 60 * 60, "hour"],
    [1000 * 60, "minute"],
  ];
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  for (const [ms, unit] of units) {
    if (abs >= ms || unit === "minute") {
      return rtf.format(Math.round(diffMs / ms), unit);
    }
  }
  return "just now";
}

function prStatusMeta(pr) {
  const status = prStatusValue(pr);
  switch (status) {
    case "MERGED":
    case "MERGE":
      return {
        labelKey: "studentRepo.pulls.status.merged",
        label: "Merged",
        className:
          "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/12 dark:text-purple-300",
        icon: GitMerge,
      };
    case "CLOSED":
      return {
        labelKey: "studentRepo.pulls.status.closed",
        label: "Closed",
        className:
          "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/12 dark:text-red-300",
        icon: XCircle,
      };
    case "DRAFT":
      return {
        labelKey: "studentRepo.pulls.status.draft",
        label: "Draft",
        className:
          "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-500/20 dark:bg-slate-500/12 dark:text-slate-300",
        icon: CircleDot,
      };
    case "READY_FOR_REVIEW":
      return {
        labelKey: "studentRepo.pulls.status.ready",
        label: "Ready for review",
        className:
          "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/12 dark:text-sky-300",
        icon: CheckCircle2,
      };
    case "CONFLICTING":
    case "CONFLICTED":
      return {
        labelKey: "studentRepo.pulls.status.conflicting",
        label: "Conflicting",
        className:
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/12 dark:text-amber-300",
        icon: AlertTriangle,
      };
    case "OPENED":
    default:
      return {
        labelKey: "studentRepo.pulls.status.open",
        label: "Open",
        className:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/12 dark:text-emerald-300",
        icon: GitPullRequest,
      };
  }
}

function prMergeMessage(pr) {
  const status = prStatusValue(pr);
  if (status === "MERGED" || status === "MERGE") {
    return {
      tone: "merged",
      labelKey: "studentRepo.pulls.mergeState.merged",
      label: "This pull request has already been merged into the base branch.",
    };
  }
  if (status === "CLOSED") {
    return {
      tone: "closed",
      labelKey: "studentRepo.pulls.mergeState.closed",
      label: "This pull request was closed without merging.",
    };
  }
  if (status === "DRAFT") {
    return {
      tone: "draft",
      labelKey: "studentRepo.pulls.mergeState.draft",
      label:
        "This pull request is still in draft and is not ready to merge yet.",
    };
  }
  if (status === "CONFLICTING" || status === "CONFLICTED") {
    return {
      tone: "conflict",
      labelKey: "studentRepo.pulls.mergeState.conflicting",
      label:
        "This branch has conflicts that must be resolved before it can be merged.",
    };
  }
  if (status === "READY_FOR_REVIEW") {
    return {
      tone: "ready",
      labelKey: "studentRepo.pulls.mergeState.ready",
      label:
        "This pull request is ready for review and can be merged when you approve it.",
    };
  }
  return {
    tone: "mergeable",
    labelKey: "studentRepo.pulls.mergeState.mergeable",
    label:
      "This branch has no conflicts with the base branch and is ready to merge.",
  };
}

function mergeMessageClass(tone) {
  switch (tone) {
    case "merged":
      return "border-purple-200 bg-purple-50 text-purple-800 dark:border-purple-500/20 dark:bg-purple-500/12 dark:text-purple-200";
    case "closed":
      return "border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-500/20 dark:bg-slate-500/12 dark:text-slate-200";
    case "draft":
      return "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/20 dark:bg-sky-500/12 dark:text-sky-200";
    case "conflict":
      return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/12 dark:text-amber-200";
    case "ready":
      return "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/12 dark:text-blue-200";
    case "mergeable":
    default:
      return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/12 dark:text-emerald-200";
  }
}

const PR_STATUS_FILTER_OPTIONS = [
  { value: "all", labelKey: "studentRepo.pulls.filters.allStatuses" },
  { value: "open", labelKey: "studentRepo.pulls.status.open" },
  { value: "conflicting", labelKey: "studentRepo.pulls.status.conflicting" },
  { value: "merged", labelKey: "studentRepo.pulls.status.merged" },
  { value: "closed", labelKey: "studentRepo.pulls.status.closed" },
  { value: "draft", labelKey: "studentRepo.pulls.status.draft" },
];

function matchesPrStatusFilter(pr, filter) {
  const status = prStatusValue(pr);
  switch (filter) {
    case "open":
      return ["OPENED", "READY_FOR_REVIEW"].includes(status);
    case "conflicting":
      return ["CONFLICTING", "CONFLICTED"].includes(status);
    case "merged":
      return status === "MERGED" || status === "MERGE";
    case "closed":
      return status === "CLOSED";
    case "draft":
      return status === "DRAFT";
    case "all":
    default:
      return true;
  }
}

function pullRequestSearchText(pr) {
  return [
    prTitle(pr),
    prAuthorName(pr),
    readableSourceBranch(pr),
    readableTargetBranch(pr),
    pr?.description,
    pr?.summary,
    pr?.body,
    prStatusMeta(pr).label,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function isMergedStatus(status) {
  return status === "MERGED" || status === "MERGE";
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

function profileUsername(profile) {
  return (
    repoViewerUsername(profile) ||
    String(profile?.userName ?? profile?.username ?? profile?.login ?? "").trim()
  );
}

function buildSubmittedTaskByPullRequestId(tasks) {
  const map = new Map();
  (Array.isArray(tasks) ? tasks : []).forEach((task) => {
    const prNumber = taskVcSubmissionPullNumber(task);
    if (prNumber != null) {
      map.set(String(prNumber).trim(), task);
    }
  });
  return map;
}

function refsHeadBranch(payload) {
  const head =
    typeof payload?.HEAD === "string"
      ? payload.HEAD.trim()
      : typeof payload?.head === "string"
        ? payload.head.trim()
        : "";
  if (/^refs\/heads\//i.test(head)) return head.replace(/^refs\/heads\//i, "");
  const sym = /^ref:\s*refs\/heads\/(.+)$/i.exec(head);
  if (sym) return String(sym[1]).trim();
  if (/^[a-z0-9_.-]+$/i.test(head) && !head.includes("/")) return head;
  return "";
}

function branchOptionsFromRefsPayload(payload) {
  const refs = payload?.refs;
  const map =
    refs && typeof refs === "object" && !Array.isArray(refs)
      ? refs
      : (payload?.Branches ?? payload?.branches ?? {});
  const opts = [];
  for (const k of Object.keys(map)) {
    const match = /^refs\/heads\/(.+)$/i.exec(String(k));
    if (match) opts.push({ value: match[1], label: match[1] });
  }
  opts.sort((a, b) => a.label.localeCompare(b.label));
  return opts;
}

function PullRequestConflictPanel({ owner, repo, prId, active, onResolved }) {
  const { t } = useTranslation();
  const { data: conflicts = [], isLoading } = useVcMergeConflicts(
    owner,
    repo,
    prId,
    {
      enabled: active,
      notifyOnError: false,
    },
  );

  if (!active) return null;

  return (
    <>
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/12 dark:text-amber-200">
        {t("studentRepo.pulls.conflicts.detected")}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 rounded-lg border border-(--color-light-card-border) bg-light-app-tertiary px-3 py-2 text-xs text-muted dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-muted">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {t("studentRepo.pulls.conflicts.loading")}
        </div>
      ) : null}

      {!isLoading && conflicts.length ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-primary dark:text-dark-primary">
            {t("studentRepo.pulls.conflicts.files")}
          </p>
          {conflicts.map((conflict, conflictIndex) => (
            <div
              key={`${prId}-conflict-${conflict.path ?? conflict.filePath ?? conflictIndex}`}
              className="rounded-lg border border-(--color-light-card-border) bg-light-app-tertiary px-3 py-2 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary"
            >
              <p className="text-xs font-semibold text-primary dark:text-dark-primary">
                {conflict.path ||
                  conflict.filePath ||
                  t("studentRepo.pulls.conflicts.item", {
                    index: conflictIndex + 1,
                  })}
              </p>
              <p className="mt-1 text-[11px] text-muted dark:text-dark-muted">
                {conflict.binary
                  ? t("studentRepo.pulls.conflicts.binary")
                  : t("studentRepo.pulls.conflicts.text")}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <ConflictResolver
        owner={owner}
        repo={repo}
        prNumber={prId}
        onResolved={onResolved}
      />
    </>
  );
}

function PullRequestCard({
  pr,
  owner,
  repo,
  locale,
  activePrId,
  setActivePrId,
  mergePr,
  mergingPrId,
  canMerge,
  onMerge,
  refetch,
}) {
  const { t } = useTranslation();
  const [mergePreviewOpen, setMergePreviewOpen] = useState(false);
  const prId = String(pr.id ?? pr.number ?? pr.uuid ?? "");
  const active = activePrId === prId;
  const sourceBranch = readableSourceBranch(pr);
  const targetBranch = readableTargetBranch(pr);
  const createdAt = prCreatedAt(pr);
  const sourceHash = prSourceHash(pr);
  const targetHash = prTargetHash(pr);
  const mergeHash = prMergeHash(pr);
  const baseStatus = prStatusValue(pr);
  const isOpenish = ["OPENED", "READY_FOR_REVIEW"].includes(baseStatus);
  const { data: liveConflicts = [], isLoading: conflictsLoading } =
    useVcMergeConflicts(owner, repo, prId, {
      enabled: Boolean(owner && repo && prId && isOpenish),
      notifyOnError: false,
      retry: false,
    });
  const hasLiveConflicts =
    Array.isArray(liveConflicts) && liveConflicts.length > 0;
  const effectiveStatus =
    hasLiveConflicts &&
    !["CONFLICTING", "CONFLICTED", "MERGED", "MERGE", "CLOSED"].includes(
      baseStatus,
    )
      ? "CONFLICTING"
      : baseStatus;
  const derivedPr = { ...pr, status: effectiveStatus };
  const statusMeta = prStatusMeta(derivedPr);
  const mergeMessage = prMergeMessage(derivedPr);
  const StatusIcon = statusMeta.icon;
  const description = pr.description ?? pr.summary ?? pr.body ?? "";
  const isConflicting = ["CONFLICTING", "CONFLICTED"].includes(effectiveStatus);
  const mergeBusy = mergingPrId === prId;
  const mergedResultHash =
    isMergedStatus(effectiveStatus) && mergeHash ? mergeHash : sourceHash;

  return (
    <article
      key={prId}
      className="rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) px-4 py-4 text-left transition-all hover:border-(--color-light-input-border-focus) hover:bg-white dark:border-(--color-dark-card-border) dark:bg-dark-card-bg dark:hover:border-(--color-dark-input-border-focus) dark:hover:bg-dark-card-hover"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                statusMeta.className,
              )}
            >
              <StatusIcon className="h-3.5 w-3.5" strokeWidth={1.8} />
              {t(statusMeta.labelKey ?? statusMeta.label)}
            </span>
            <p className="min-w-0 truncate text-sm font-semibold text-primary dark:text-dark-primary">
              {prTitle(pr)}
            </p>
            {prId ? (
              <span className="rounded-full border border-(--color-light-card-border) px-2 py-0.5 text-[10px] font-medium text-muted dark:border-(--color-dark-card-border) dark:text-dark-muted">
                #{prId}
              </span>
            ) : null}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="rounded-full border border-(--color-light-card-border) bg-(--color-light-card-bg) px-2 py-0.5 font-medium text-secondary dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:text-dark-secondary">
              {sourceBranch || t("studentRepo.pulls.card.sourceBranch")}
            </span>
            <span className="text-muted dark:text-dark-muted">→</span>
            <span className="rounded-full border border-(--color-light-card-border) bg-(--color-light-card-bg) px-2 py-0.5 font-medium text-secondary dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:text-dark-secondary">
              {targetBranch || t("studentRepo.pulls.card.targetBranch")}
            </span>
          </div>
        </div>

        <div className="text-right text-[11px] text-muted dark:text-dark-muted">
          <p>{formatRelativeTime(createdAt, locale)}</p>
          <p className="mt-1">{formatAbsoluteTime(createdAt, locale)}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-secondary dark:text-dark-secondary">
        <span>{t("studentRepo.pulls.card.by", { author: prAuthorName(pr) })}</span>
        <span className="rounded-full border border-(--color-light-card-border) px-2 py-0.5 text-[11px] dark:border-(--color-dark-card-border)">
          {t("studentRepo.pulls.card.head", { sha: shortSha(sourceHash) || "—" })}
        </span>
        <span className="rounded-full border border-(--color-light-card-border) px-2 py-0.5 text-[11px] dark:border-(--color-dark-card-border)">
          {t("studentRepo.pulls.card.base", { sha: shortSha(targetHash) || "—" })}
        </span>
        {isConflicting ? (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700 dark:bg-amber-500/12 dark:text-amber-300">
            {t("studentRepo.pulls.card.needsConflictResolution")}
          </span>
        ) : null}
        {conflictsLoading && isOpenish ? (
          <span className="rounded-full bg-slate-50 px-2 py-0.5 font-medium text-slate-600 dark:bg-slate-500/12 dark:text-slate-300">
            {t("studentRepo.pulls.card.checkingConflicts")}
          </span>
        ) : null}
      </div>

      {description ? (
        <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-secondary dark:text-dark-secondary">
          {description}
        </p>
      ) : null}

      <div
        className={cn(
          "mt-4 rounded-lg border px-3 py-2 text-xs font-medium",
          mergeMessageClass(mergeMessage.tone),
        )}
      >
        {t(mergeMessage.labelKey ?? mergeMessage.label)}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {canMerge && isOpenish && !isConflicting ? (
          <Button
            type="button"
            loading={mergeBusy && mergePr.isPending}
            disabled={mergePr.isPending && !mergeBusy}
            onClick={() => {
              setActivePrId(prId);
              setMergePreviewOpen(true);
            }}
          >
            {t("studentRepo.pulls.card.merge")}
          </Button>
        ) : null}
        {canMerge && isConflicting ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => setActivePrId(prId)}
          >
            {t("studentRepo.pulls.card.resolveConflicts")}
          </Button>
        ) : null}
        {canMerge && isOpenish && !isConflicting ? (
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-300">
            {t("studentRepo.pulls.card.readyToMerge")}
          </span>
        ) : null}
        <button
          type="button"
          className="rounded-md border border-(--color-light-card-border) px-2.5 py-1 text-[11px] font-medium text-secondary transition-colors hover:bg-(--color-light-card-hover) hover:text-primary dark:border-(--color-dark-card-border) dark:text-dark-secondary dark:hover:bg-(--color-dark-card-hover) dark:hover:text-dark-primary"
          onClick={() =>
            setActivePrId((current) => (current === prId ? "" : prId))
          }
        >
          {active
            ? t("studentRepo.pulls.card.hideDetails")
            : t("studentRepo.pulls.card.showDetails")}
        </button>
      </div>

      {active ? (
        <div className="mt-4 space-y-3 rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-3 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-(--color-light-card-border) bg-light-app-tertiary px-3 py-2 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted dark:text-dark-muted">
                {t("studentRepo.pulls.card.compare")}
              </p>
              <p className="mt-1 text-sm font-semibold text-primary dark:text-dark-primary">
                {sourceBranch || t("studentRepo.pulls.card.sourceBranch")} →{" "}
                {targetBranch || t("studentRepo.pulls.card.targetBranch")}
              </p>
            </div>
            <div className="rounded-lg border border-(--color-light-card-border) bg-light-app-tertiary px-3 py-2 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted dark:text-dark-muted">
                {t("studentRepo.pulls.card.status")}
              </p>
              <p className="mt-1 text-sm font-semibold text-primary dark:text-dark-primary">
                {t(statusMeta.labelKey ?? statusMeta.label)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted dark:text-dark-muted">
            <GitBranch className="h-3.5 w-3.5" strokeWidth={1.8} />
            <span>{t("studentRepo.pulls.card.sourceHash", { sha: shortSha(sourceHash) || "—" })}</span>
            <span>•</span>
            <span>{t("studentRepo.pulls.card.targetHash", { sha: shortSha(targetHash) || "—" })}</span>
          </div>

          {canMerge && (isConflicting || hasLiveConflicts) ? (
            <PullRequestConflictPanel
              owner={owner}
              repo={repo}
              prId={prId}
              active={active}
              onResolved={async () => {
                await refetch();
              }}
            />
          ) : null}

          {!mergePreviewOpen ? (
            <div className="space-y-3 rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary p-3 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
              <p className="text-sm font-semibold text-primary dark:text-dark-primary">
                {t("studentRepo.pulls.card.changedFiles", "Changed files")}
              </p>
              {isMergedStatus(effectiveStatus) ? (
                <MergedPullRequestHistoryDiff
                  owner={owner}
                  repo={repo}
                  sourceHash={mergedResultHash}
                  targetHash={targetHash}
                />
              ) : (
                <PRFilesDiff
                  owner={owner}
                  repo={repo}
                  prNumber={prId}
                  pullRequest={derivedPr}
                />
              )}
            </div>
          ) : null}

          {canMerge && mergePreviewOpen && isOpenish && !isConflicting ? (
            <div className="space-y-3 rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary p-3 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-primary dark:text-dark-primary">
                    {t("studentRepo.pulls.mergePreview.title")}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-secondary dark:text-dark-secondary">
                    {t("studentRepo.pulls.mergePreview.description")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setMergePreviewOpen(false)}
                    disabled={mergeBusy && mergePr.isPending}
                  >
                    {t("studentRepo.pulls.actions.cancel")}
                  </Button>
                  <Button
                    type="button"
                    loading={mergeBusy && mergePr.isPending}
                    disabled={mergePr.isPending && !mergeBusy}
                    onClick={() => onMerge(pr)}
                  >
                    {t("studentRepo.pulls.mergePreview.confirm")}
                  </Button>
                </div>
              </div>
              <PRFilesDiff
                owner={owner}
                repo={repo}
                prNumber={prId}
                pullRequest={derivedPr}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export default function StudentRepoPullRequests() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, isStudent } = useAuth();
  const { owner, repo, repoBase, repositoryMeta } = useOutletContext() ?? {};
  const locale = i18n.language || undefined;
  const [params, setParams] = useSearchParams();
  const createMode = params.get("create") === "1";
  const defaultBranch =
    repositoryMeta?.default_branch ??
    repositoryMeta?.defaultBranch ??
    repositoryMeta?.defaultBranchName ??
    "main";

  const {
    data = [],
    isLoading,
    refetch,
  } = useVcRepoPullRequests(owner, repo, {
    notifyOnError: false,
  });
  const { data: sessionUser } = useSessionProfile({
    notifyOnError: false,
  });
  const { data: tasks = [] } = useVcRepoTasks(
    owner,
    repo,
    {},
    {
      notifyOnError: false,
    },
  );
  const { data: refsPayload } = useVcRepositoryRefs(owner, repo, {
    notifyOnError: false,
    enabled: Boolean(owner && repo),
  });
  const createPr = useVcCreatePullRequest({
    showErrorToast: false,
  });
  const mergePr = useVcMergePullRequest({
    showErrorToast: true,
  });

  const branchOpts = useMemo(
    () => branchOptionsFromRefsPayload(refsPayload ?? {}),
    [refsPayload],
  );
  const headBranch = refsHeadBranch(refsPayload ?? {});

  const [baseRef, setBaseRef] = useState(
    params.get("base") || String(defaultBranch || "main"),
  );
  const [headRef, setHeadRef] = useState(
    params.get("head") || headBranch || "",
  );
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [activePrId, setActivePrId] = useState(params.get("pr") || "");
  const [mergingPrId, setMergingPrId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const statusFilterOptions = useMemo(
    () =>
      PR_STATUS_FILTER_OPTIONS.map((option) => ({
        value: option.value,
        label: t(option.labelKey),
      })),
    [t],
  );
  const currentUsername = profileUsername(user);
  const sessionUsername = profileUsername(sessionUser);
  const viewerUsername = currentUsername || sessionUsername;
  const isStudentUser =
    typeof isStudent === "function" ? isStudent() : false;
  const submittedTaskByPullRequestId = useMemo(
    () => buildSubmittedTaskByPullRequestId(tasks),
    [tasks],
  );

  useEffect(() => {
    if (!branchOpts.length) return;
    if (!branchOpts.some((row) => row.value === baseRef)) {
      setBaseRef(String(defaultBranch || branchOpts[0]?.value || "main"));
    }
    if (!headRef && headBranch) {
      setHeadRef(headBranch);
    } else if (headRef && !branchOpts.some((row) => row.value === headRef)) {
      setHeadRef(String(headBranch || branchOpts[0]?.value || ""));
    }
  }, [baseRef, branchOpts, defaultBranch, headBranch, headRef]);

  useEffect(() => {
    if (!createMode) return;
    const next = new URLSearchParams(params);
    if (baseRef) next.set("base", baseRef);
    if (headRef) next.set("head", headRef);
    setParams(next, { replace: true });
  }, [baseRef, createMode, headRef, params, setParams]);

  useEffect(() => {
    if (createMode) return;
    const prParam = params.get("pr") || "";
    setActivePrId(prParam);
  }, [createMode, params]);

  useEffect(() => {
    if (!createMode) return;
    if (title.trim()) return;
    if (!headRef || !baseRef) return;
    setTitle(`Merge ${headRef} into ${baseRef}`);
  }, [baseRef, createMode, headRef, title]);

  const prSummary = useMemo(() => {
    return (data ?? []).reduce(
      (acc, pr) => {
        const status = prStatusValue(pr);
        acc.total += 1;
        if (["OPENED", "READY_FOR_REVIEW"].includes(status)) acc.open += 1;
        if (["CONFLICTING", "CONFLICTED"].includes(status))
          acc.conflicting += 1;
        if (status === "MERGED" || status === "MERGE") acc.merged += 1;
        if (status === "CLOSED") acc.closed += 1;
        if (status === "DRAFT") acc.draft += 1;
        return acc;
      },
      { total: 0, open: 0, conflicting: 0, merged: 0, closed: 0, draft: 0 },
    );
  }, [data]);

  const summaryTiles = useMemo(
    () => [
      {
        key: "total",
        icon: GitPullRequest,
        label: t("studentRepo.pulls.cards.total"),
        value: prSummary.total,
        hint: t("studentRepo.pulls.cards.totalHint"),
        paletteIndex: 0,
      },
      {
        key: "open",
        icon: CheckCircle2,
        label: t("studentRepo.pulls.cards.open"),
        value: prSummary.open,
        hint: t("studentRepo.pulls.cards.openHint"),
        paletteIndex: 1,
      },
      {
        key: "conflicting",
        icon: AlertTriangle,
        label: t("studentRepo.pulls.cards.conflicting"),
        value: prSummary.conflicting,
        hint: t("studentRepo.pulls.cards.conflictingHint"),
        paletteIndex: 2,
      },
      {
        key: "merged",
        icon: GitMerge,
        label: t("studentRepo.pulls.cards.merged"),
        value: prSummary.merged,
        hint: t("studentRepo.pulls.cards.mergedHint"),
        paletteIndex: 3,
      },
      {
        key: "closedDraft",
        icon: CircleDot,
        label: t("studentRepo.pulls.cards.closedDraft"),
        value: prSummary.closed + prSummary.draft,
        hint: t("studentRepo.pulls.cards.closedDraftHint"),
        paletteIndex: 0,
      },
    ],
    [prSummary, t],
  );

  const visiblePullRequests = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    return (data ?? []).filter((pr) => {
      if (!matchesPrStatusFilter(pr, statusFilter)) return false;
      if (!needle) return true;
      return pullRequestSearchText(pr).includes(needle);
    });
  }, [data, searchTerm, statusFilter]);

  const canSubmit =
    createMode &&
    isStudentUser &&
    owner &&
    repo &&
    baseRef &&
    headRef &&
    baseRef !== headRef &&
    title.trim().length > 0 &&
    String(sessionUser?.id ?? "").trim().length > 0 &&
    !createPr.isPending;

  function submittedTaskForPullRequest(prOrId) {
    const ids =
      prOrId && typeof prOrId === "object"
        ? pullRequestIdentityValues(prOrId)
        : [String(prOrId ?? "").trim()].filter(Boolean);
    for (const id of ids) {
      const task = submittedTaskByPullRequestId.get(id);
      if (task) return task;
    }
    return null;
  }

  function canMergePullRequest(prOrId) {
    if (!viewerUsername) return false;
    const task = submittedTaskForPullRequest(prOrId);
    if (!task) return false;
    return usernamesLikelySame(viewerUsername, taskAssignerUsername(task));
  }

  async function findCreatedPullRequest() {
    const expectedTitle = title.trim();
    const expectedSource = String(headRef ?? "").trim();
    const expectedTarget = String(baseRef ?? "").trim();
    const expectedAuthorId = String(sessionUser?.id ?? "").trim();

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const refreshed = await refetch();
      const rows = Array.isArray(refreshed?.data) ? refreshed.data : data;
      const fallback = [...(rows ?? [])]
        .filter((pr) => {
          const titleMatches = prTitle(pr) === expectedTitle;
          const sourceMatches = readableSourceBranch(pr) === expectedSource;
          const targetMatches = readableTargetBranch(pr) === expectedTarget;
          const authorMatches =
            (expectedAuthorId && prAuthorId(pr) === expectedAuthorId) ||
            prAuthorName(pr) === prAuthorName({ author: sessionUser });
          return (
            titleMatches && sourceMatches && targetMatches && authorMatches
          );
        })
        .sort((a, b) => prCreatedAtMs(b) - prCreatedAtMs(a))[0];

      if (fallback) {
        return fallback;
      }

      if (attempt < 2) {
        await wait(500);
      }
    }

    return null;
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;
    try {
      const created = await createPr.mutateAsync({
        owner,
        repo,
        title: title.trim(),
        description: body.trim() || title.trim(),
        sourceBranch: headRef,
        targetBranch: baseRef,
        author: String(sessionUser?.id ?? "").trim(),
      });
      await refetch();
      const prId =
        created?.number ?? created?.id ?? created?.pullRequestId ?? "";
      const next = new URLSearchParams();
      if (prId) next.set("pr", String(prId));
      navigate(
        `${repoBase}/pull-requests${next.toString() ? `?${next.toString()}` : ""}`,
        { replace: true },
      );
    } catch (error) {
      const fallback = await findCreatedPullRequest();
      if (fallback) {
        gooeyToast.success(t("studentRepo.pulls.toast.created"));
        const prId =
          fallback?.number ?? fallback?.id ?? fallback?.pullRequestId ?? "";
        const next = new URLSearchParams();
        if (prId) next.set("pr", String(prId));
        navigate(
          `${repoBase}/pull-requests${next.toString() ? `?${next.toString()}` : ""}`,
          { replace: true },
        );
        return;
      }

      gooeyToast.error(
        String(error?.message ?? t("studentRepo.pulls.toast.createFailed")),
      );
    }
  }

  async function onMerge(prOrId) {
    const prId =
      prOrId && typeof prOrId === "object"
        ? String(prOrId.id ?? prOrId.number ?? prOrId.uuid ?? "")
        : String(prOrId ?? "");
    if (!owner || !repo || !prId) return;
    if (!canMergePullRequest(prOrId)) return;
    setMergingPrId(prId);
    try {
      await mergePr.mutateAsync({
        owner,
        repo,
        prNumber: prId,
      });
      const next = new URLSearchParams(params);
      next.set("pr", String(prId));
      setParams(next, { replace: true });
    } catch {
      // error already normalized
    } finally {
      setMergingPrId("");
    }
  }

  return (
    <div className="space-y-5">
      <SettingsSectionCard
        title={t("studentRepo.pulls.title")}
        description={t("studentRepo.pulls.subtitle")}
        icon={GitPullRequest}
        action={
          createMode ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(`${repoBase}/pull-requests`)}
            >
              {t("studentRepo.pulls.actions.cancel")}
            </Button>
          ) : isStudentUser ? (
            <Button
              type="button"
              onClick={() =>
                navigate(
                  `${repoBase}/pull-requests?create=1&base=${encodeURIComponent(
                    defaultBranch,
                  )}&head=${encodeURIComponent(headBranch || "")}`,
                )
              }
            >
              {t("studentRepo.pulls.actions.new")}
            </Button>
          ) : null
        }
      >
        {createMode ? (
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <Select
                label={t("studentRepo.pulls.form.baseBranch")}
                value={baseRef}
                onChange={setBaseRef}
                options={branchOpts}
                placeholder={t("studentRepo.pulls.form.baseBranchPlaceholder")}
              />
              <Select
                label={t("studentRepo.pulls.form.compareBranch")}
                value={headRef}
                onChange={setHeadRef}
                options={branchOpts}
                placeholder={t("studentRepo.pulls.form.compareBranchPlaceholder")}
              />
            </div>

            <div className="grid gap-4">
              <div className="rounded-2xl border border-(--color-light-card-border) bg-light-app-tertiary px-4 py-4 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
                <div className="flex flex-wrap items-center gap-2 text-sm text-primary dark:text-dark-primary">
                  <GitCompareArrows
                    className="h-4 w-4"
                    strokeWidth={1.8}
                    aria-hidden
                  />
                  <span className="rounded-full border border-(--color-light-card-border) bg-(--color-light-card-bg) px-2.5 py-1 font-semibold dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
                    {headRef || t("studentRepo.pulls.form.compareFallback")}
                  </span>
                  <span className="text-muted dark:text-dark-muted">{t("studentRepo.pulls.form.into")}</span>
                  <span className="rounded-full border border-(--color-light-card-border) bg-(--color-light-card-bg) px-2.5 py-1 font-semibold dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
                    {baseRef || t("studentRepo.pulls.form.baseFallback")}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-secondary dark:text-dark-secondary">
                  {t("studentRepo.pulls.form.summaryHint")}
                </p>
                {baseRef && headRef && baseRef === headRef ? (
                  <p className="mt-3 text-xs font-medium text-(--color-light-error-text) dark:text-(--color-dark-error-text)">
                    {t("studentRepo.pulls.form.branchConflict")}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-primary dark:text-dark-primary">
                  {t("studentRepo.pulls.form.title")}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="h-10 w-full rounded-xl border border-(--color-light-input-border) bg-(--color-light-input-bg) px-3 text-sm text-(--color-light-text-primary) outline-none transition-colors focus:border-(--color-light-input-border-focus) focus:ring-2 focus:ring-blue-500/15 dark:border-dark-input-border dark:bg-(--color-dark-input-bg) dark:text-(--color-dark-text-primary) dark:focus:border-(--color-dark-input-border-focus) dark:focus:ring-blue-400/15"
                  placeholder={t("studentRepo.pulls.form.titlePlaceholder")}
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-primary dark:text-dark-primary">
                  {t("studentRepo.pulls.form.description")}
                </label>
                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  rows={6}
                  className="w-full rounded-xl border border-(--color-light-input-border) bg-(--color-light-input-bg) px-3 py-2 text-sm text-(--color-light-text-primary) outline-none transition-colors focus:border-(--color-light-input-border-focus) focus:ring-2 focus:ring-blue-500/15 dark:border-dark-input-border dark:bg-(--color-dark-input-bg) dark:text-(--color-dark-text-primary) dark:focus:border-(--color-dark-input-border-focus) dark:focus:ring-blue-400/15"
                  placeholder={t("studentRepo.pulls.form.descriptionPlaceholder")}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(`${repoBase}/pull-requests`)}
              >
                {t("studentRepo.pulls.actions.cancel")}
              </Button>
              <Button
                type="submit"
                loading={createPr.isPending}
                disabled={!canSubmit}
              >
                {t("studentRepo.pulls.actions.create")}
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
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

            {isLoading ? (
              <p className="text-sm text-muted dark:text-dark-muted">
                {t("studentRepo.pulls.loading")}
              </p>
            ) : !data.length ? (
              <p className="text-sm text-muted dark:text-dark-muted">
                {t("studentRepo.pulls.empty")}
              </p>
            ) : (
              <div className="space-y-6 pt-2">
                <div className="flex flex-col gap-4 rounded-2xl border border-(--color-light-card-border) bg-light-app-tertiary px-4 py-4 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary lg:flex-row lg:items-end lg:justify-between">
                  <div className="flex min-w-0 items-center gap-3 rounded-xl border border-(--color-light-input-border) bg-(--color-light-input-bg) px-3 dark:border-dark-input-border dark:bg-(--color-dark-input-bg) lg:w-full lg:max-w-xl">
                    <Search
                      className="h-4 w-4 shrink-0 text-muted dark:text-dark-muted"
                      strokeWidth={1.8}
                    />
                    <input
                      type="search"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      className="h-11 w-full bg-transparent text-sm text-(--color-light-text-primary) outline-none placeholder:text-(--color-light-text-muted) dark:text-(--color-dark-text-primary) dark:placeholder:text-dark-text-muted"
                      placeholder={t("studentRepo.pulls.filters.searchPlaceholder")}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[260px_auto] lg:flex lg:items-end lg:gap-3">
                    <Select
                      label={t("studentRepo.pulls.filters.status")}
                      value={statusFilter}
                      onChange={setStatusFilter}
                      options={statusFilterOptions}
                      placeholder={t("studentRepo.pulls.filters.statusPlaceholder")}
                    />
                    <div className="flex items-end">
                      <div className="rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) px-3 py-2 text-xs text-secondary dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:text-dark-secondary">
                        {t("studentRepo.pulls.filters.showing", {
                          visible: visiblePullRequests.length,
                          total: prSummary.total,
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {!visiblePullRequests.length ? (
                  <div className="rounded-2xl border border-dashed border-(--color-light-card-border) bg-light-app-tertiary px-5 py-8 text-center dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
                    <p className="text-sm font-semibold text-primary dark:text-dark-primary">
                      {t("studentRepo.pulls.filters.emptyTitle")}
                    </p>
                    <p className="mt-2 text-xs text-secondary dark:text-dark-secondary">
                      {t("studentRepo.pulls.filters.emptyHint")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {visiblePullRequests.map((pr) => (
                      <PullRequestCard
                        key={String(
                          pr.id ?? pr.number ?? pr.uuid ?? prTitle(pr),
                        )}
                        pr={pr}
                        owner={owner}
                        repo={repo}
                        locale={locale}
                        activePrId={activePrId}
                        setActivePrId={setActivePrId}
                        mergePr={mergePr}
                        mergingPrId={mergingPrId}
                        canMerge={canMergePullRequest(pr)}
                        onMerge={onMerge}
                        refetch={refetch}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </SettingsSectionCard>
    </div>
  );
}
