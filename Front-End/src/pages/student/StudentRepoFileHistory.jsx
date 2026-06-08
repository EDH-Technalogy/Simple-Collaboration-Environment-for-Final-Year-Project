import { diffLines } from "diff";
import { useEffect, useMemo, useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { saveAs } from "file-saver";
import { cn } from "../../lib/utils";
import OverviewMode from "../../components/DocumentViewer/OverviewMode";
import { useVcRepositoryCommits } from "../../services/useApi";
import {
  fetchCommitDetails,
  fetchDocumentBlame,
  fetchRepositoryBlobPayload,
  fetchRepositoryCommitDiff,
  fetchRepositoryCompare,
} from "../../services/versionControlService";
import {
  getFileExtension,
  isKnownBinaryExtension,
  tryDecodeUtf8,
} from "../../utils/binaryFileHandlers";

function commitRowSha(row) {
  const raw = row?.sha ?? row?.id ?? row?.commitSha ?? row?.commit ?? "";
  return typeof raw === "string" ? raw.trim() : "";
}

function commitRowMessage(row) {
  const raw = row?.message ?? row?.subject ?? row?.commitMessage ?? "";
  return typeof raw === "string" ? raw.trim() : "";
}

function commitRowAuthor(row) {
  const raw =
    row?.author ??
    row?.authorName ??
    row?.committer ??
    row?.userName ??
    row?.username ??
    "";
  return typeof raw === "string" ? raw.trim() : "";
}

function commitRowTimestamp(row) {
  const raw =
    row?.timestamp ??
    row?.date ??
    row?.committedDate ??
    row?.createdAt ??
    row?.created_at ??
    "";
  return typeof raw === "string" ? raw : "";
}

function commitRowParentSha(row) {
  const direct =
    row?.parentSha ??
    row?.parent_sha ??
    row?.parent ??
    row?.baseSha ??
    row?.base_sha ??
    "";
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  const parents = row?.parents;
  if (Array.isArray(parents) && parents.length) {
    const first = parents[0];
    if (typeof first === "string") return first.trim();
    const nested = first?.sha ?? first?.id ?? first?.commitSha ?? "";
    return typeof nested === "string" ? nested.trim() : "";
  }
  return "";
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

async function fetchBlobUtf8BySha(owner, repo, blobSha) {
  const sha = String(blobSha ?? "").trim();
  if (!sha) return "";
  const bytes = await fetchRepositoryBlobPayload(owner, repo, sha);
  return tryDecodeUtf8(bytes);
}

async function withTimeout(promise, ms, message) {
  let timerId = null;
  const timeout = new Promise((_, reject) => {
    timerId = setTimeout(() => reject(new Error(message)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timerId) clearTimeout(timerId);
  }
}

function normalizeDiffRows(oldText, newText) {
  const parts = diffLines(oldText ?? "", newText ?? "");
  const rows = [];
  let oldLine = 1;
  let newLine = 1;
  parts.forEach((part) => {
    const rawLines = String(part.value ?? "").split("\n");
    const lines = rawLines.at(-1) === "" ? rawLines.slice(0, -1) : rawLines;
    lines.forEach((line) => {
      if (part.added) {
        rows.push({ type: "added", oldLine: null, newLine, content: line });
        newLine += 1;
      } else if (part.removed) {
        rows.push({ type: "removed", oldLine, newLine: null, content: line });
        oldLine += 1;
      } else {
        rows.push({ type: "context", oldLine, newLine, content: line });
        oldLine += 1;
        newLine += 1;
      }
    });
  });
  return rows;
}

function normalizePatchRows(patchText) {
  const patch = String(patchText ?? "");
  if (!patch.trim()) return [];

  const lines = patch.split("\n");
  const rows = [];
  let oldLine = 0;
  let newLine = 0;

  for (const line of lines) {
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
      line.startsWith("+++ ")
    ) {
      continue;
    }
    if (line.startsWith("\\ No newline")) continue;

    if (line.startsWith("+")) {
      rows.push({
        type: "added",
        oldLine: null,
        newLine,
        content: line.slice(1),
      });
      newLine += 1;
      continue;
    }
    if (line.startsWith("-")) {
      rows.push({
        type: "removed",
        oldLine,
        newLine: null,
        content: line.slice(1),
      });
      oldLine += 1;
      continue;
    }

    const content = line.startsWith(" ") ? line.slice(1) : line;
    rows.push({
      type: "context",
      oldLine,
      newLine,
      content,
    });
    oldLine += 1;
    newLine += 1;
  }

  return rows;
}

function normalizePatchFilePath(raw) {
  const text = String(raw ?? "").trim();
  return text.replace(/^a\//, "").replace(/^b\//, "");
}

function splitUnifiedDiffByFile(diffText) {
  const text = String(diffText ?? "");
  if (!text.trim()) return new Map();

  const sections = text.split(/^diff --git /m).filter(Boolean);
  const map = new Map();

  sections.forEach((section) => {
    const chunk = section.startsWith("a/") ? `diff --git ${section}` : section;
    const lines = chunk.split("\n");
    let path = "";
    for (const line of lines) {
      if (line.startsWith("+++ ")) {
        path = normalizePatchFilePath(line.slice(4));
        if (path === "/dev/null") path = "";
      } else if (!path && line.startsWith("--- ")) {
        const candidate = normalizePatchFilePath(line.slice(4));
        if (candidate !== "/dev/null") path = candidate;
      }
    }
    if (!path) {
      const header = /^diff --git a\/(.+?) b\/(.+)$/.exec(lines[0] ?? "");
      path = normalizePatchFilePath(header?.[2] ?? header?.[1] ?? "");
    }
    if (path) map.set(path, chunk);
  });

  return map;
}

function fileChangeCount(row, kind) {
  const raw =
    kind === "add"
      ? row?.additions ?? row?.linesAdded ?? row?.lines_added ?? row?.insertions
      : row?.deletions ?? row?.linesDeleted ?? row?.lines_deleted ?? row?.removals;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function fileBlobSha(row, kind) {
  const raw =
    kind === "base"
      ? row?.baseSha ??
        row?.base_sha ??
        row?.oldSha ??
        row?.old_sha ??
        row?.fromSha ??
        row?.from_sha ??
        row?.previousSha
      : row?.headSha ??
        row?.head_sha ??
        row?.newSha ??
        row?.new_sha ??
        row?.toSha ??
        row?.to_sha ??
        row?.currentSha;
  return String(raw ?? "").trim();
}

function filePatchText(row) {
  const raw =
    row?.patch ??
    row?.diff ??
    row?.unifiedDiff ??
    row?.patchText ??
    row?.patch_text ??
    row?.diffText ??
    row?.diff_text ??
    "";
  return String(raw ?? "").trim();
}

function fileIsBinary(row) {
  const direct = row?.binary ?? row?.isBinary ?? row?.binaryFile ?? row?.binary_file;
  if (typeof direct === "boolean") return direct;
  const path = String(row?.path ?? row?.filePath ?? row?.filename ?? row?.name ?? "").trim();
  return isKnownBinaryExtension(getFileExtension(path));
}

function isDocumentDiffFile(path) {
  const ext = getFileExtension(path);
  return ext === "docx" || ext === "pdf";
}

function documentBlameText(payload) {
  const segments = Array.isArray(payload?.segments) ? payload.segments : [];
  return segments
    .map((segment) => String(segment?.text ?? "").trim())
    .filter(Boolean)
    .join("\n\n");
}

async function fetchDocumentTextAtRef(owner, repo, path, ref) {
  if (!ref) return "";
  const payload = await fetchDocumentBlame(owner, repo, path, ref);
  return documentBlameText(payload);
}

function isAddedStatus(status) {
  const raw = String(status ?? "").toLowerCase();
  return raw === "added" || raw === "add" || raw === "created";
}

function isDeletedStatus(status) {
  const raw = String(status ?? "").toLowerCase();
  return raw === "deleted" || raw === "removed" || raw === "delete";
}

function normalizeCommitDetailFiles(raw) {
  const files =
    raw?.files ??
    raw?.changedFiles ??
    raw?.changed_files ??
    raw?.diffs ??
    raw?.entries ??
    [];
  return Array.isArray(files) ? files : [];
}

function normalizeCompareFiles(raw) {
  const files = raw?.files ?? raw?.changedFiles ?? raw?.changed_files ?? [];
  return Array.isArray(files) ? files : [];
}

function summarizeRows(rows) {
  const list = Array.isArray(rows) ? rows : [];
  return list.reduce(
    (acc, row) => {
      if (row?.type === "added") acc.additions += 1;
      if (row?.type === "removed") acc.deletions += 1;
      return acc;
    },
    { additions: 0, deletions: 0 },
  );
}

export default function StudentRepoFileHistory() {
  const { t, i18n } = useTranslation();
  const { owner, repo } = useOutletContext() ?? {};
  const locale = i18n.language || undefined;
  const [params, setParams] = useSearchParams();
  const ref = params.get("ref") || "main";
  const filePath = params.get("path") || "";
  const [selectedCommit, setSelectedCommit] = useState("");
  const [compareData, setCompareData] = useState(null);
  const [compareBusy, setCompareBusy] = useState(false);
  const [compareErr, setCompareErr] = useState("");
  const [commitDetailData, setCommitDetailData] = useState(null);
  const [commitDiffPatches, setCommitDiffPatches] = useState(new Map());

  const commitsQ = useVcRepositoryCommits(
    owner,
    repo,
    {
      path: filePath,
      ref,
      limit: 50,
    },
    {
      enabled: Boolean(owner && repo && ref),
      notifyOnError: false,
    },
  );

  const commits = useMemo(
    () => (Array.isArray(commitsQ.data) ? commitsQ.data : []),
    [commitsQ.data],
  );

  useEffect(() => {
    if (!commits.length) {
      setSelectedCommit("");
      return;
    }
    if (commits.some((row) => commitRowSha(row) === selectedCommit)) return;
    setSelectedCommit(commitRowSha(commits[0]) || "");
  }, [commits, selectedCommit]);

  const selectedCommitRow =
    commits.find((row) => commitRowSha(row) === selectedCommit) ?? null;
  const selectedCommitMeta = useMemo(
    () => ({
      sha: selectedCommit || commitRowSha(selectedCommitRow) || "",
      message:
        commitRowMessage(commitDetailData) ||
        commitRowMessage(selectedCommitRow) ||
        "",
      author:
        commitRowAuthor(commitDetailData) ||
        commitRowAuthor(selectedCommitRow) ||
        "",
      timestamp:
        commitRowTimestamp(commitDetailData) ||
        commitRowTimestamp(selectedCommitRow) ||
        "",
      parentSha:
        commitRowParentSha(commitDetailData) ||
        commitRowParentSha(selectedCommitRow) ||
        "",
    }),
    [commitDetailData, selectedCommit, selectedCommitRow],
  );
  const selectedParentSha =
    selectedCommitMeta.parentSha || "";

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!owner || !repo || !selectedCommitRow) {
        setCompareData(null);
        setCompareErr("");
        return;
      }
      if (!selectedParentSha) {
        setCompareData({ files: [] });
        setCompareErr("");
        return;
      }
      setCompareBusy(true);
      setCompareErr("");
      try {
        const data = await fetchRepositoryCompare(
          owner,
          repo,
          selectedParentSha,
          selectedCommit,
        );
        if (!cancelled) setCompareData(data ?? { files: [] });
      } catch (error) {
        if (!cancelled) {
          setCompareData(null);
          setCompareErr(String(error?.message ?? "Could not load commit changes."));
        }
      } finally {
        if (!cancelled) setCompareBusy(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [owner, repo, selectedCommit, selectedCommitRow, selectedParentSha]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!owner || !repo || !selectedCommit) {
        setCommitDetailData(null);
        return;
      }
      try {
        const data = await fetchCommitDetails(owner, repo, selectedCommit);
        if (!cancelled) setCommitDetailData(data ?? null);
      } catch {
        if (!cancelled) setCommitDetailData(null);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [owner, repo, selectedCommit]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!owner || !repo || !selectedCommitRow) {
        setCommitDiffPatches(new Map());
        return;
      }
      if (!selectedParentSha) {
        setCommitDiffPatches(new Map());
        return;
      }
      try {
        const raw = await fetchRepositoryCommitDiff(
          owner,
          repo,
          selectedParentSha,
          selectedCommit,
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
        setCommitDiffPatches(splitUnifiedDiffByFile(text));
      } catch {
        if (!cancelled) setCommitDiffPatches(new Map());
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [owner, repo, selectedCommit, selectedCommitRow, selectedParentSha]);

  const files = useMemo(() => {
    const compareList = normalizeCompareFiles(compareData);
    const detailList = normalizeCommitDetailFiles(commitDetailData);
    const byPath = new Map();

    [...compareList, ...detailList].forEach((row, index) => {
      const path = String(
        row?.path ?? row?.filePath ?? row?.filename ?? row?.name ?? `file-${index}`,
      );
      const prev = byPath.get(path) ?? {};
      byPath.set(path, {
        key: `${selectedCommit || "commit"}:${path}`,
        path,
        status: String(row?.status ?? prev.status ?? "modified"),
        binary: fileIsBinary(row) || prev.binary || false,
        baseSha: fileBlobSha(row, "base") || prev.baseSha || "",
        headSha: fileBlobSha(row, "head") || prev.headSha || "",
        patch:
          filePatchText(row) ||
          prev.patch ||
          commitDiffPatches.get(path) ||
          "",
        additions: fileChangeCount(row, "add") ?? prev.additions ?? null,
        deletions: fileChangeCount(row, "delete") ?? prev.deletions ?? null,
      });
    });

    for (const [path, patch] of commitDiffPatches.entries()) {
      const prev = byPath.get(path) ?? {};
      const patchRows = normalizePatchRows(patch);
      const patchSummary = summarizeRows(patchRows);
      byPath.set(path, {
        key: `${selectedCommit || "commit"}:${path}`,
        path,
        status: prev.status || "modified",
        binary: prev.binary || false,
        baseSha: prev.baseSha || "",
        headSha: prev.headSha || "",
        patch: prev.patch || patch,
        additions: prev.additions ?? patchSummary.additions,
        deletions: prev.deletions ?? patchSummary.deletions,
      });
    }

    return Array.from(byPath.values());
  }, [commitDetailData, commitDiffPatches, compareData, selectedCommit]);

  const [expandedFile, setExpandedFile] = useState("");
  const [diffCache, setDiffCache] = useState({});

  useEffect(() => {
    setDiffCache({});
  }, [selectedCommit]);

  const selectedCommitSummary = useMemo(() => {
    const additions = files.reduce((sum, file) => sum + (file.additions ?? 0), 0);
    const deletions = files.reduce((sum, file) => sum + (file.deletions ?? 0), 0);
    return {
      filesChanged: files.length,
      additions,
      deletions,
    };
  }, [files]);

  useEffect(() => {
    if (!files.length) {
      setExpandedFile("");
      return;
    }
    if (files.some((file) => file.key === expandedFile)) return;
    setExpandedFile(files[0].key);
  }, [files, expandedFile]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const file = files.find((item) => item.key === expandedFile);
      if (!file) return;
      const existing = diffCache[file.key];
      if (existing?.loading || existing?.rows?.length || existing?.error) return;
      setDiffCache((current) => ({
        ...current,
        [file.key]: { loading: true, rows: [], error: "" },
      }));
      try {
        if (file.binary) {
          if (isDocumentDiffFile(file.path)) {
            if (!selectedCommit) {
              if (cancelled) return;
              setDiffCache((current) => ({
                ...current,
                [file.key]: {
                  loading: false,
                  rows: [],
                  error: "No commit ref returned for document diff.",
                },
              }));
              return;
            }

            const beforeRef =
              isAddedStatus(file.status) ? "" : selectedParentSha;
            const afterRef =
              isDeletedStatus(file.status) ? "" : selectedCommit;

            const [beforeText, afterText] = await Promise.all([
              beforeRef
                ? withTimeout(
                    fetchDocumentTextAtRef(owner, repo, file.path, beforeRef),
                    15000,
                    "Timed out extracting previous document version.",
                  )
                : Promise.resolve(""),
              afterRef
                ? withTimeout(
                    fetchDocumentTextAtRef(owner, repo, file.path, afterRef),
                    15000,
                    "Timed out extracting current document version.",
                  )
                : Promise.resolve(""),
            ]);

            if (cancelled) return;
            const rows = normalizeDiffRows(beforeText ?? "", afterText ?? "");
            setDiffCache((current) => ({
              ...current,
              [file.key]: {
                loading: false,
                rows,
                error: rows.length
                  ? ""
                  : "No extracted document block changes found for this file.",
              },
            }));
            return;
          }

          if (cancelled) return;
          setDiffCache((current) => ({
            ...current,
            [file.key]: {
              loading: false,
              rows: [],
              error: "",
            },
          }));
          return;
        }
        if (file.patch) {
          const patchRows = normalizePatchRows(file.patch);
          if (cancelled) return;
          setDiffCache((current) => ({
            ...current,
            [file.key]: {
              loading: false,
              rows: patchRows,
              error: patchRows.length ? "" : "No line diff found in patch payload.",
            },
          }));
          return;
        }
        if (!file.baseSha && !file.headSha) {
          if (cancelled) return;
          setDiffCache((current) => ({
            ...current,
            [file.key]: {
              loading: false,
              rows: [],
              error: "No diff payload returned for this file.",
            },
          }));
          return;
        }
        const [beforeText, afterText] = await Promise.all([
          file.status === "added"
            ? Promise.resolve("")
            : withTimeout(
                fetchBlobUtf8BySha(owner, repo, file.baseSha),
                12000,
                "Timed out loading previous file version.",
              ),
          file.status === "deleted"
            ? Promise.resolve("")
            : withTimeout(
                fetchBlobUtf8BySha(owner, repo, file.headSha),
                12000,
                "Timed out loading current file version.",
              ),
        ]);
        if (cancelled) return;
        const rows = normalizeDiffRows(beforeText ?? "", afterText ?? "");
        setDiffCache((current) => ({
          ...current,
          [file.key]: {
            loading: false,
            rows,
            error: rows.length ? "" : "No visible line changes found for this file.",
          },
        }));
      } catch (error) {
        if (cancelled) return;
        setDiffCache((current) => ({
          ...current,
          [file.key]: {
            loading: false,
            rows: [],
            error: String(error?.message ?? "Could not load file diff."),
          },
        }));
      }
    }
    run();
    return () => {};
  }, [
    expandedFile,
    files,
    owner,
    repo,
    selectedCommit,
    selectedParentSha,
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-primary dark:text-dark-primary">
            {t("studentRepo.browser.historyHeading")}
          </h2>
          <p className="mt-1 text-sm text-secondary dark:text-dark-secondary">
            {filePath ? `File: ${filePath}` : "Repository-wide history"}
          </p>
        </div>
        <button
          type="button"
          className="rounded-md border border-(--color-light-card-border) px-3 py-2 text-sm font-semibold text-secondary transition-colors hover:bg-(--color-light-card-hover) hover:text-primary dark:border-(--color-dark-card-border) dark:text-dark-secondary dark:hover:bg-(--color-dark-card-hover) dark:hover:text-dark-primary"
          onClick={() => {
            const next = new URLSearchParams(params);
            next.delete("path");
            setParams(next, { replace: true });
          }}
        >
          All file commits
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
          <div className="border-b border-(--color-light-card-border) px-4 py-3 dark:border-(--color-dark-card-border)">
            <p className="text-sm font-semibold text-primary dark:text-dark-primary">
              Commits
            </p>
          </div>
          <div className="max-h-[70vh] overflow-y-auto">
            {commitsQ.isLoading ? (
              <p className="px-4 py-4 text-sm text-muted dark:text-dark-muted">
                {t("studentRepo.browser.historyLoading")}
              </p>
            ) : !commits.length ? (
              <p className="px-4 py-4 text-sm text-muted dark:text-dark-muted">
                {t("studentRepo.browser.historyEmpty")}
              </p>
            ) : (
              commits.map((row, index) => {
                const sha = commitRowSha(row) || `commit-${index}`;
                const active = sha === selectedCommit;
                return (
                  <button
                    key={`${sha}-${index}`}
                    type="button"
                    onClick={() => setSelectedCommit(sha)}
                    className={cn(
                      "w-full border-b border-(--color-light-card-border) px-4 py-3 text-left transition-colors dark:border-(--color-dark-card-border)",
                      active
                        ? "bg-(--color-light-card-hover) dark:bg-(--color-dark-card-hover)"
                        : "hover:bg-(--color-light-card-hover) dark:hover:bg-(--color-dark-card-hover)",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px] text-muted dark:text-dark-muted">
                      <span className="font-mono">{sha.slice(0, 12)}</span>
                      <span>{formatRelativeTime(commitRowTimestamp(row), locale)}</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-primary dark:text-dark-primary">
                      {commitRowMessage(row) || "—"}
                    </p>
                    <p className="mt-1 text-xs text-secondary dark:text-dark-secondary">
                      {commitRowAuthor(row) || "—"}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
            <div className="border-b border-(--color-light-card-border) px-4 py-3 dark:border-(--color-dark-card-border)">
              <p className="text-sm font-semibold text-primary dark:text-dark-primary">
                Commit Details
              </p>
            </div>
            {!selectedCommitRow ? (
              <p className="px-4 py-4 text-sm text-muted dark:text-dark-muted">
                Select a commit.
              </p>
            ) : (
              <div className="px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted dark:text-dark-muted">
                  <span className="font-mono">{selectedCommitMeta.sha.slice(0, 12)}</span>
                  <span>{formatAbsoluteTime(selectedCommitMeta.timestamp, locale)}</span>
                </div>
                <h3 className="mt-2 text-lg font-semibold text-primary dark:text-dark-primary">
                  {selectedCommitMeta.message || "—"}
                </h3>
                <p className="mt-1 text-sm text-secondary dark:text-dark-secondary">
                  {selectedCommitMeta.author || "—"}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="rounded-full border border-(--color-light-card-border) px-2 py-1 text-muted dark:border-(--color-dark-card-border) dark:text-dark-muted">
                    {selectedCommitSummary.filesChanged} file{selectedCommitSummary.filesChanged === 1 ? "" : "s"} changed
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2 py-1 font-medium text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-300">
                    +{selectedCommitSummary.additions}
                  </span>
                  <span className="rounded-full bg-red-50 px-2 py-1 font-medium text-red-700 dark:bg-red-500/12 dark:text-red-300">
                    -{selectedCommitSummary.deletions}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
            <div className="border-b border-(--color-light-card-border) px-4 py-3 dark:border-(--color-dark-card-border)">
              <p className="text-sm font-semibold text-primary dark:text-dark-primary">
                Changed Files
              </p>
            </div>
            {compareBusy ? (
              <p className="px-4 py-4 text-sm text-muted dark:text-dark-muted">
                Loading files…
              </p>
            ) : compareErr ? (
              <p className="px-4 py-4 text-sm text-light-error-text dark:text-dark-error-text">
                {compareErr}
              </p>
            ) : !files.length ? (
              <p className="px-4 py-4 text-sm text-muted dark:text-dark-muted">
                No changed files returned for this commit.
              </p>
            ) : (
              <div className="space-y-3 p-4">
                {files.map((file) => {
                  const diffState = diffCache[file.key] ?? { loading: false, rows: [], error: "" };
                  const rowSummary = summarizeRows(diffState.rows);
                  const additions = file.additions ?? rowSummary.additions;
                  const deletions = file.deletions ?? rowSummary.deletions;
                  return (
                    <section
                      key={file.key}
                      className="overflow-hidden rounded-lg border border-(--color-light-card-border) dark:border-(--color-dark-card-border)"
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
                          <p className="text-sm font-semibold text-primary dark:text-dark-primary">
                            {file.path}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                            <span className="uppercase tracking-wide text-muted dark:text-dark-muted">
                              {file.status}
                            </span>
                            {file.binary ? (
                              <span className="rounded-full border border-(--color-light-card-border) px-2 py-0.5 font-medium text-muted dark:border-(--color-dark-card-border) dark:text-dark-muted">
                                {isDocumentDiffFile(file.path)
                                  ? "Document"
                                  : "Binary"}
                              </span>
                            ) : null}
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-300">
                              +{additions ?? 0}
                            </span>
                            <span className="rounded-full bg-red-50 px-2 py-0.5 font-medium text-red-700 dark:bg-red-500/12 dark:text-red-300">
                              -{deletions ?? 0}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-muted dark:text-dark-muted">
                          {expandedFile === file.key ? "Hide" : "Show"}
                        </span>
                      </button>
                      {expandedFile === file.key ? (
                        file.binary && !isDocumentDiffFile(file.path) ? (
                          <BinaryHistoryPanel owner={owner} repo={repo} file={file} />
                        ) :
                        diffState.loading ? (
                          <p className="px-4 py-4 text-sm text-muted dark:text-dark-muted">
                            Loading changes…
                          </p>
                        ) : diffState.error ? (
                          <p className="px-4 py-4 text-sm text-light-error-text dark:text-dark-error-text">
                            {diffState.error}
                          </p>
                        ) : (
                          <div className="overflow-auto border-t border-(--color-light-card-border) dark:border-(--color-dark-card-border)">
                            <div className="grid grid-cols-[48px_48px_24px_minmax(0,1fr)] bg-light-app-tertiary px-0 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted dark:bg-dark-app-tertiary dark:text-dark-muted">
                              <span className="px-2 text-right">Old</span>
                              <span className="px-2 text-right">New</span>
                              <span className="px-1 text-center"></span>
                              <span className="px-2">Content</span>
                            </div>
                            {diffState.rows.map((diffRow, index) => {
                              const isAdded = diffRow.type === "added";
                              const isRemoved = diffRow.type === "removed";
                              return (
                                <div
                                  key={`${file.key}-${index}`}
                                  className={cn(
                                    "grid grid-cols-[48px_48px_24px_minmax(0,1fr)] border-t border-(--color-light-card-border) font-mono text-[10px] leading-6 dark:border-(--color-dark-card-border)",
                                    isAdded
                                      ? "bg-green-500/12 text-green-800 dark:text-green-200"
                                      : isRemoved
                                        ? "bg-red-500/12 text-red-800 dark:text-red-200"
                                        : "text-secondary dark:text-dark-secondary",
                                  )}
                                >
                                  <span className="px-2 text-right opacity-70">
                                    {diffRow.oldLine ?? ""}
                                  </span>
                                  <span className="px-2 text-right opacity-70">
                                    {diffRow.newLine ?? ""}
                                  </span>
                                  <span className="px-1 text-center">
                                    {isAdded ? "+" : isRemoved ? "-" : " "}
                                  </span>
                                  <pre className="m-0 px-2">
                                    <code>{diffRow.content || " "}</code>
                                  </pre>
                                </div>
                              );
                            })}
                          </div>
                        )
                        ) : null}
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function BinaryHistoryPanel({ owner, repo, file }) {
  const [activeRevision, setActiveRevision] = useState(
    file?.status === "deleted" ? "base" : "head",
  );
  const [state, setState] = useState({ loading: false, bytes: null, error: "" });
  const documentFile = isDocumentDiffFile(file?.path);

  const revisions = useMemo(
    () =>
      [
        {
          key: "base",
          label: "Previous version",
          sha: String(file?.baseSha ?? "").trim(),
        },
        {
          key: "head",
          label: "Current version",
          sha: String(file?.headSha ?? "").trim(),
        },
      ].filter((item) => item.sha),
    [file?.baseSha, file?.headSha],
  );
  const activeRevisionKey = revisions.some((item) => item.key === activeRevision)
    ? activeRevision
    : (revisions[0]?.key ?? "head");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const current = revisions.find((item) => item.key === activeRevisionKey);
      if (!owner || !repo || !current?.sha) {
        if (!cancelled) setState({ loading: false, bytes: null, error: "" });
        return;
      }

      setState({ loading: true, bytes: null, error: "" });
      try {
        const bytes = await fetchRepositoryBlobPayload(owner, repo, current.sha);
        if (!cancelled) {
          setState({ loading: false, bytes, error: "" });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            loading: false,
            bytes: null,
            error: String(error?.message ?? "Could not load binary revision."),
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeRevisionKey, owner, repo, revisions]);

  function downloadActive() {
    if (!state.bytes?.length) return;
    const ext = getFileExtension(file?.path ?? "");
    const stem = String(file?.path ?? "download").split("/").pop() || "download";
    const suffix = activeRevisionKey === "base" ? "previous" : "current";
    const name = ext
      ? stem.replace(new RegExp(`\\.${ext}$`, "i"), `-${suffix}.${ext}`)
      : `${stem}-${suffix}`;
    saveAs(new Blob([state.bytes]), name);
  }

  return (
    <div className="space-y-3 border-t border-(--color-light-card-border) p-4 dark:border-(--color-dark-card-border)">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-primary dark:text-dark-primary">
            {documentFile ? "Document file change" : "Binary file change"}
          </p>
          <p className="mt-1 text-xs text-muted dark:text-dark-muted">
            {documentFile
              ? "Textual diff is not available for this document type. You can inspect and download each revision."
              : "Textual diff is not available for this file type. You can inspect and download each revision."}
          </p>
        </div>
        <button
          type="button"
          className="rounded-md border border-(--color-light-card-border) px-3 py-1.5 text-sm font-medium text-secondary transition-colors hover:bg-(--color-light-card-hover) hover:text-primary dark:border-(--color-dark-card-border) dark:text-dark-secondary dark:hover:bg-(--color-dark-card-hover) dark:hover:text-dark-primary"
          onClick={downloadActive}
          disabled={!state.bytes?.length}
        >
          Download shown revision
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {revisions.map((revision) => (
          <button
            key={revision.key}
            type="button"
            className={cn(
              "rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
              activeRevisionKey === revision.key
                ? "border-(--color-light-input-border-focus) bg-blue-50 text-blue-700 dark:border-(--color-dark-input-border-focus) dark:bg-blue-500/12 dark:text-blue-300"
                : "border-(--color-light-card-border) text-secondary hover:text-primary dark:border-(--color-dark-card-border) dark:text-dark-secondary dark:hover:text-dark-primary",
            )}
            onClick={() => setActiveRevision(revision.key)}
          >
            {revision.label}
          </button>
        ))}
      </div>

      {state.loading ? (
        <p className="text-sm text-muted dark:text-dark-muted">Loading revision…</p>
      ) : state.error ? (
        <p className="text-sm text-(--color-light-error-text) dark:text-(--color-dark-error-text)">
          {state.error}
        </p>
      ) : state.bytes?.length ? (
        <OverviewMode
          owner={owner}
          repo={repo}
          branch={activeRevisionKey || "main"}
          embedded
          fileBytes={state.bytes}
          filePath={file?.path ?? ""}
          fileType=""
        />
      ) : (
        <p className="text-sm text-muted dark:text-dark-muted">No binary preview available.</p>
      )}
    </div>
  );
}
