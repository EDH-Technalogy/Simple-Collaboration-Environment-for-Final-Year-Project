import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../../lib/utils";
import {
  fetchCommitDetails,
  fetchRepositoryCommitDiff,
} from "../../services/versionControlService";

function isLikelySha(value) {
  const text = String(value ?? "").trim();
  return /^[a-f0-9]{7,40}$/i.test(text);
}

function shortSha(value) {
  const text = String(value ?? "").trim();
  if (!isLikelySha(text)) return text;
  return text.slice(0, 8);
}

function splitUnifiedDiffByFile(diffText) {
  const text = String(diffText ?? "");
  if (!text.trim()) return [];
  const parts = text.split(/(?=^diff --git\s)/m).filter((part) => part.trim());
  return parts.map((patch, index) => {
    const fileMatch =
      /^diff --git a\/(.+?) b\/(.+)$/m.exec(patch) ||
      /^\+\+\+ b\/(.+)$/m.exec(patch) ||
      /^--- a\/(.+)$/m.exec(patch);
    const path =
      fileMatch?.[2] ?? fileMatch?.[1] ?? `changed-file-${index + 1}`;
    return {
      key: `${path}-${index}`,
      path,
      rows: normalizePatchRows(patch),
    };
  });
}

function normalizePatchRows(patchText) {
  const patch = String(patchText ?? "");
  if (!patch.trim()) return [];

  const rows = [];
  let oldLine = 0;
  let newLine = 0;
  for (const line of patch.split("\n")) {
    if (line.startsWith("@@")) {
      const match = /@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
      if (match) {
        oldLine = Number(match[1]);
        newLine = Number(match[2]);
      }
      continue;
    }
    if (
      line.startsWith("diff ") ||
      line.startsWith("index ") ||
      line.startsWith("--- ") ||
      line.startsWith("+++ ") ||
      line.startsWith("\\ No newline")
    ) {
      continue;
    }
    if (line.startsWith("+")) {
      rows.push({ type: "added", oldLine: null, newLine, content: line.slice(1) });
      newLine += 1;
      continue;
    }
    if (line.startsWith("-")) {
      rows.push({ type: "removed", oldLine, newLine: null, content: line.slice(1) });
      oldLine += 1;
      continue;
    }
    if (!oldLine && !newLine) continue;
    rows.push({
      type: "context",
      oldLine,
      newLine,
      content: line.startsWith(" ") ? line.slice(1) : line,
    });
    oldLine += 1;
    newLine += 1;
  }
  return rows;
}

function summarizeRows(rows) {
  return rows.reduce(
    (acc, row) => {
      if (row.type === "added") acc.additions += 1;
      if (row.type === "removed") acc.deletions += 1;
      return acc;
    },
    { additions: 0, deletions: 0 },
  );
}

function commitParentSha(row) {
  const direct =
    row?.parentSha ??
    row?.parent_sha ??
    row?.parent ??
    row?.baseSha ??
    row?.base_sha ??
    row?.commit?.parentSha ??
    row?.commit?.parent_sha ??
    "";
  if (typeof direct === "string" && direct.trim()) return direct.trim();

  const parents = row?.parents ?? row?.commit?.parents;
  if (Array.isArray(parents) && parents.length) {
    const first = parents[0];
    if (typeof first === "string") return first.trim();
    const nested = first?.sha ?? first?.id ?? first?.commitSha ?? "";
    return typeof nested === "string" ? nested.trim() : "";
  }
  return "";
}

function sameRef(a, b) {
  const left = String(a ?? "").trim().toLowerCase();
  const right = String(b ?? "").trim().toLowerCase();
  return Boolean(left && right && left === right);
}

function diffRowClass(type) {
  if (type === "added") {
    return "border-emerald-100 bg-emerald-50 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/35 dark:text-emerald-100";
  }
  if (type === "removed") {
    return "border-rose-100 bg-rose-50 text-rose-950 dark:border-rose-900/60 dark:bg-rose-950/35 dark:text-rose-100";
  }
  return "border-(--color-light-card-border) bg-(--color-light-card-bg) text-secondary dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:text-dark-secondary";
}

function diffMarkerClass(type) {
  if (type === "added") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-100";
  }
  if (type === "removed") {
    return "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-100";
  }
  return "bg-light-app-tertiary text-muted dark:bg-dark-app-tertiary dark:text-dark-muted";
}

export default function MergedPullRequestHistoryDiff({
  owner,
  repo,
  sourceHash,
  targetHash,
  fallback = null,
}) {
  const { t } = useTranslation();
  const [state, setState] = useState({
    loading: false,
    error: "",
    files: [],
  });
  const [expandedFile, setExpandedFile] = useState("");
  const [range, setRange] = useState({
    baseHash: targetHash,
    headHash: sourceHash,
  });
  const canLoad = owner && repo && isLikelySha(sourceHash);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!canLoad) {
        setState({ loading: false, error: "", files: [] });
        setRange({ baseHash: targetHash, headHash: sourceHash });
        return;
      }
      setState({ loading: true, error: "", files: [] });
      try {
        const headHash = String(sourceHash ?? "").trim();
        let baseHash = String(targetHash ?? "").trim();
        if (!isLikelySha(baseHash) || sameRef(baseHash, headHash)) {
          const details = await fetchCommitDetails(owner, repo, headHash);
          baseHash = commitParentSha(details);
        }
        if (!isLikelySha(baseHash) || sameRef(baseHash, headHash)) {
          throw new Error(
            "Could not find the previous commit for this merged pull request.",
          );
        }
        const raw = await fetchRepositoryCommitDiff(
          owner,
          repo,
          baseHash,
          headHash,
        );
        if (cancelled) return;
        const text =
          typeof raw === "string"
            ? raw
            : typeof raw?.diff === "string"
              ? raw.diff
              : typeof raw?.patch === "string"
                ? raw.patch
                : "";
        setState({
          loading: false,
          error: "",
          files: splitUnifiedDiffByFile(text),
        });
        setRange({ baseHash, headHash });
      } catch (error) {
        if (!cancelled) {
          setState({
            loading: false,
            error: String(error?.message ?? "Could not load merged diff."),
            files: [],
          });
        }
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [canLoad, owner, repo, sourceHash, targetHash]);

  const expandedFileKey = state.files.some((file) => file.key === expandedFile)
    ? expandedFile
    : (state.files[0]?.key ?? "");

  const summary = useMemo(() => {
    return state.files.reduce(
      (acc, file) => {
        const rowSummary = summarizeRows(file.rows);
        acc.additions += rowSummary.additions;
        acc.deletions += rowSummary.deletions;
        return acc;
      },
      { additions: 0, deletions: 0 },
    );
  }, [state.files]);

  if (!canLoad) return fallback;

  return (
    <div className="space-y-3 rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary p-3 text-primary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-primary">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-primary dark:text-dark-primary">
            {t("studentRepo.pulls.card.mergedResult", "Merged result")}
          </p>
          <p className="mt-1 text-xs text-secondary dark:text-dark-secondary">
            {t("studentRepo.pulls.card.mergedRange", {
              defaultValue: "Showing changes from {{base}} to {{head}}.",
              base: shortSha(range.baseHash),
              head: shortSha(range.headHash),
            })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="rounded-full border border-(--color-light-card-border) px-2 py-1 text-muted dark:border-(--color-dark-card-border) dark:text-dark-muted">
            {state.files.length} file{state.files.length === 1 ? "" : "s"} changed
          </span>
          <span className="rounded-full bg-emerald-50 px-2 py-1 font-medium text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-300">
            +{summary.additions}
          </span>
          <span className="rounded-full bg-red-50 px-2 py-1 font-medium text-red-700 dark:bg-red-500/12 dark:text-red-300">
            -{summary.deletions}
          </span>
        </div>
      </div>

      {state.loading ? (
        <div className="flex items-center gap-2 rounded-lg border border-(--color-light-card-border) bg-(--color-light-card-bg) px-3 py-2 text-xs text-muted dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:text-dark-muted">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {t("studentRepo.pulls.card.loadingMergedDiff", "Loading merged changes...")}
        </div>
      ) : state.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/12 dark:text-red-300">
          {state.error}
        </p>
      ) : !state.files.length ? (
        <div className="space-y-3">
          <p className="rounded-lg border border-(--color-light-card-border) bg-(--color-light-card-bg) px-3 py-2 text-xs text-muted dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:text-dark-muted">
            {t("studentRepo.pulls.card.noMergedDiff", "No merged text diff was returned for this pull request.")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {state.files.map((file) => {
            const fileSummary = summarizeRows(file.rows);
            return (
              <section
                key={file.key}
                className="overflow-hidden rounded-lg border border-(--color-light-card-border) bg-(--color-light-card-bg) shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedFile((current) =>
                      current === file.key ? "" : file.key,
                    )
                  }
                  className="flex w-full items-center justify-between gap-3 bg-light-app-tertiary px-4 py-3 text-left transition-colors hover:bg-(--color-light-card-hover) dark:bg-dark-app-tertiary dark:hover:bg-(--color-dark-card-hover)"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-primary dark:text-dark-primary">
                      {file.path}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-300">
                        +{fileSummary.additions}
                      </span>
                      <span className="rounded-full bg-red-50 px-2 py-0.5 font-medium text-red-700 dark:bg-red-500/12 dark:text-red-300">
                        -{fileSummary.deletions}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-muted dark:text-dark-muted">
                    {expandedFileKey === file.key ? "Hide" : "Show"}
                  </span>
                </button>
                {expandedFileKey === file.key ? (
                  <div className="overflow-auto border-t border-(--color-light-card-border) bg-(--color-light-card-bg) dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
                    <div className="grid min-w-[640px] grid-cols-[56px_56px_32px_minmax(0,1fr)] border-b border-(--color-light-card-border) bg-light-app-tertiary px-0 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-muted">
                      <span className="px-2 text-right">Old</span>
                      <span className="px-2 text-right">New</span>
                      <span className="px-1 text-center"></span>
                      <span className="px-2">Content</span>
                    </div>
                    {file.rows.map((diffRow, index) => {
                      const isAdded = diffRow.type === "added";
                      const isRemoved = diffRow.type === "removed";
                      return (
                        <div
                          key={`${file.key}-${index}`}
                          className={cn(
                            "grid min-w-[640px] grid-cols-[56px_56px_32px_minmax(0,1fr)] border-b font-mono text-[11px] leading-6",
                            diffRowClass(diffRow.type),
                          )}
                        >
                          <span className="border-r border-current/10 px-2 text-right opacity-70">
                            {diffRow.oldLine ?? ""}
                          </span>
                          <span className="border-r border-current/10 px-2 text-right opacity-70">
                            {diffRow.newLine ?? ""}
                          </span>
                          <span
                            className={cn(
                              "border-r border-current/10 px-1 text-center font-semibold",
                              diffMarkerClass(diffRow.type),
                            )}
                          >
                            {isAdded ? "+" : isRemoved ? "-" : " "}
                          </span>
                          <pre className="m-0 whitespace-pre-wrap break-words px-2">
                            <code>{diffRow.content || " "}</code>
                          </pre>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
