import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  Ellipsis,
  File,
  Folder,
  GitBranch,
  Link2,
  Pencil,
  Search,
} from "lucide-react";
import { saveAs } from "file-saver";
import { gooeyToast } from "goey-toast";
import { useTranslation } from "react-i18next";
import { useNavigate, useOutletContext } from "react-router-dom";
import Avatar from "../Avatar";
import Button from "../Button";
import OverviewMode from "../DocumentViewer/OverviewMode";
import BlameMode from "../DocumentViewer/BlameMode";
import { useDocumentLoader } from "../DocumentViewer/useDocumentLoader";
import { extractDocxPlainText } from "../../services/documentRenderingService";
import Select from "../Select";
import { cn } from "../../lib/utils";
import { resolveProfilePhotoUrl } from "../../lib/profileMedia";
import {
  useVcRepositoryCommits,
  useVcRepositoryContents,
  useVcRepositoryRefs,
  useVcRepositoryTree,
} from "../../services/useApi";
import {
  getFileExtension,
  isKnownBinaryExtension,
  tryDecodeUtf8,
} from "../../utils/binaryFileHandlers";
import {
  fetchDocumentBlame,
  fetchFileBlame,
  downloadRepositoryArchive,
  fetchRepositoryBlobPayload,
  fetchRepositoryCommits,
} from "../../services/versionControlService";

function unwrapTreeNodes(payload) {
  if (payload == null) return [];
  if (Array.isArray(payload)) return payload;
  const n =
    payload.tree ??
    payload.nodes ??
    payload.entries ??
    payload.children ??
    payload.items ??
    payload.data ??
    [];
  return Array.isArray(n) ? n : [];
}

function nodeLabel(entry) {
  return (
    entry.name ??
    entry.path?.split?.("/").pop() ??
    entry.fileName ??
    entry.filename ??
    entry.key ??
    String(entry.sha ?? "")
  );
}

function nodeDir(entry) {
  return Boolean(
    entry.type === "directory" ||
    entry.type === "dir" ||
    entry.type === "tree" ||
    entry.isDirectory,
  );
}

function joinPath(prefix, name) {
  const p = String(prefix ?? "").replace(/^\/+|\/+$/g, "");
  const n = String(name ?? "").replace(/^\/+/, "");
  if (!p) return n;
  if (!n) return p;
  return `${p}/${n}`;
}

function extractTextFromContentsResponse(data) {
  if (!data || typeof data !== "object") return null;
  if (data.encoding === "base64" && typeof data.content === "string") {
    try {
      const bin = atob(String(data.content).replace(/\s/g, ""));
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
      return tryDecodeUtf8(bytes);
    } catch {
      return null;
    }
  }
  if (typeof data.content === "string") return data.content;
  return null;
}

function extractBytesFromContentsResponse(data, { allowTextEncoding = true } = {}) {
  if (!data || typeof data !== "object") return null;
  if (data.encoding === "base64" && typeof data.content === "string") {
    try {
      const bin = atob(String(data.content).replace(/\s/g, ""));
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
      return bytes;
    } catch {
      return null;
    }
  }
  if (allowTextEncoding && typeof data.content === "string") {
    return new TextEncoder().encode(data.content);
  }
  return null;
}

function formatBytes(size) {
  const num = Number(size ?? 0);
  if (!Number.isFinite(num) || num <= 0) return "0 B";
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(2)} KB`;
  return `${(num / (1024 * 1024)).toFixed(2)} MB`;
}

function entryCommitMessage(entry) {
  const msg =
    entry.last_commit_message ??
    entry.last_commit_msg ??
    entry.lastCommitMessage ??
    entry.commit_message ??
    entry.commitMessage ??
    entry.message ??
    entry.commit?.message ??
    "";
  return typeof msg === "string" ? msg.trim() : "";
}

function entryCommittedDate(entry) {
  const raw =
    entry.last_commit_date ??
    entry.lastCommitDate ??
    entry.commit?.created ??
    entry.commit?.timestamp ??
    entry.commit?.date ??
    entry.last_modified ??
    entry.lastModified ??
    entry.updated_at ??
    entry.updatedAt ??
    "";
  return typeof raw === "string" && raw ? raw : "";
}

function entryCommitSha(entry) {
  const raw =
    entry.last_commit_sha ??
    entry.lastCommitSha ??
    entry.commit_sha ??
    entry.commitSha ??
    entry.commit?.sha ??
    entry.commit?.id ??
    entry.commit_id ??
    entry.sha ??
    "";
  return typeof raw === "string" ? raw.trim() : "";
}

function entryCommitAuthor(entry) {
  const raw =
    entry.last_commit_author ??
    entry.lastCommitAuthor ??
    entry.commit_author ??
    entry.commitAuthor ??
    entry.author ??
    entry.authorName ??
    entry.commit?.author ??
    entry.commit?.userName ??
    entry.commit?.authorName ??
    "";
  return typeof raw === "string" ? raw.trim() : "";
}

function entryCommitMeta(entry) {
  if (!entry || typeof entry !== "object") return null;
  const message = entryCommitMessage(entry);
  const timestamp = entryCommittedDate(entry);
  const sha = entryCommitSha(entry);
  const author = entryCommitAuthor(entry);
  if (!message && !timestamp && !sha && !author) return null;
  return {
    message,
    timestamp,
    sha,
    author,
  };
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

function formatRelativeDay(raw, locale) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "—";
  const now = new Date();
  const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const diffDays = Math.round(
    (startOfDay.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24),
  );
  const absDays = Math.abs(diffDays);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (absDays <= 6) return rtf.format(diffDays, "day");
  if (absDays <= 30) return rtf.format(Math.round(diffDays / 7), "week");
  if (absDays <= 365) return rtf.format(Math.round(diffDays / 30), "month");
  return rtf.format(Math.round(diffDays / 365), "year");
}

function formatBlameRelativeDate(raw, locale) {
  const dayText = formatRelativeDay(raw, locale);
  if (dayText && dayText !== "—") return dayText;
  return formatRelativeTime(raw, locale);
}

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

function blameLineNumber(row) {
  const n = Number(
    row?.lineNumber ?? row?.line ?? row?.line_no ?? row?.lineNo ?? row?.lineIdx,
  );
  if (!Number.isFinite(n)) return -1;
  return Math.max(1, n);
}

function blameCommitSha(row) {
  const raw = row?.commit ?? row?.commitSha ?? row?.sha ?? row?.revision ?? "";
  return typeof raw === "string" ? raw.trim() : "";
}

function blameCommitMessage(row) {
  const raw = row?.commitMessage ?? row?.message ?? row?.subject ?? "";
  return typeof raw === "string" ? raw.trim() : "";
}

function blameCommitAuthor(row) {
  const raw =
    row?.author ??
    row?.authorName ??
    row?.userName ??
    row?.username ??
    row?.committer ??
    "";
  return typeof raw === "string" ? raw.trim() : "";
}

function blameCommitTimestamp(row) {
  const raw =
    row?.timestamp ?? row?.date ?? row?.time ?? row?.committedDate ?? "";
  return typeof raw === "string" ? raw : "";
}

function blameCommitAvatarUrl(row) {
  return resolveProfilePhotoUrl(row);
}

function blameCommitAdditions(row) {
  const raw =
    row?.additions ??
    row?.linesAdded ??
    row?.lines_added ??
    row?.insertions ??
    row?.stats?.additions ??
    row?.commitStats?.additions ??
    null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function blameCommitDeletions(row) {
  const raw =
    row?.deletions ??
    row?.linesDeleted ??
    row?.lines_deleted ??
    row?.removals ??
    row?.stats?.deletions ??
    row?.commitStats?.deletions ??
    null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function blameLineContent(row) {
  const raw =
    row?.code ??
    row?.content ??
    row?.text ??
    row?.lineContent ??
    row?.lineText ??
    row?.sourceLine ??
    null;
  return typeof raw === "string" ? raw : null;
}

function groupBlameSegments(blameRows, fallbackLines) {
  const lineCount = Array.isArray(fallbackLines) ? fallbackLines.length : 0;
  if (!lineCount) return [];

  const blameByLine = new Map();
  (Array.isArray(blameRows) ? blameRows : []).forEach((row) => {
    const lineNumber = blameLineNumber(row);
    if (lineNumber > 0) {
      blameByLine.set(lineNumber, row);
    }
  });

  const segments = [];
  let currentSegment = null;

  for (let index = 0; index < lineCount; index += 1) {
    const lineNumber = index + 1;
    const blameRow = blameByLine.get(lineNumber) ?? null;
    const sha = blameCommitSha(blameRow);
    const author = blameCommitAuthor(blameRow);
    const message = blameCommitMessage(blameRow);
    const timestamp = blameCommitTimestamp(blameRow);
    const avatarUrl = blameCommitAvatarUrl(blameRow);
    const additions = blameCommitAdditions(blameRow);
    const deletions = blameCommitDeletions(blameRow);
    const content = blameLineContent(blameRow) ?? fallbackLines[index] ?? "";

    const shouldStartNewSegment =
      !currentSegment ||
      currentSegment.sha !== sha ||
      currentSegment.author !== author ||
      currentSegment.message !== message ||
      currentSegment.timestamp !== timestamp;

    if (shouldStartNewSegment) {
      currentSegment = {
        key: `${sha || "unknown"}-${lineNumber}`,
        sha,
        author,
        message,
        timestamp,
        avatarUrl,
        additions,
        deletions,
        startLine: lineNumber,
        lines: [],
      };
      segments.push(currentSegment);
    } else {
      if (!currentSegment.avatarUrl && avatarUrl)
        currentSegment.avatarUrl = avatarUrl;
      if (currentSegment.additions == null && additions != null)
        currentSegment.additions = additions;
      if (currentSegment.deletions == null && deletions != null)
        currentSegment.deletions = deletions;
    }

    currentSegment.lines.push({
      lineNumber,
      code: content,
    });
  }

  return segments;
}

function initialsFromName(value) {
  const parts = String(value ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase?.() ?? "")
    .join("");
}

function truncateMiddle(value, max = 72) {
  const text = String(value ?? "");
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function isBinarySelection(filePath, fileBytes, fileText) {
  const ext = getFileExtension(filePath);
  if (isKnownBinaryExtension(ext)) return true;
  if (!fileBytes?.length) return false;
  if (typeof fileText === "string") return false;
  return tryDecodeUtf8(fileBytes) == null;
}

function supportsDocumentBlame(filePath) {
  const ext = getFileExtension(filePath);
  return ext === "docx" || ext === "pdf";
}

function documentBlameCommitSha(row) {
  const raw = row?.commitSha ?? row?.sha ?? "";
  return typeof raw === "string" ? raw.trim() : "";
}

function documentBlameCommitMessage(row) {
  const raw = row?.message ?? row?.commitMessage ?? "";
  return typeof raw === "string" ? raw.trim() : "";
}

function documentBlameCommitAuthor(row) {
  const raw = row?.author ?? row?.authorName ?? row?.userName ?? "";
  return typeof raw === "string" ? raw.trim() : "";
}

function documentBlameCommitTimestamp(row) {
  const raw = row?.timestamp ?? row?.date ?? "";
  return typeof raw === "string" ? raw : "";
}

function buildDocumentOwnershipSegments(documentRows) {
  const rows = Array.isArray(documentRows) ? documentRows : [];
  const result = [];
  let current = null;
  let lineNumber = 1;

  rows.forEach((row, rowIndex) => {
    const sha = documentBlameCommitSha(row);
    const author = documentBlameCommitAuthor(row);
    const message = documentBlameCommitMessage(row);
    const timestamp = documentBlameCommitTimestamp(row);
    const text = typeof row?.text === "string" ? row.text : "";
    const lines = text.split(/\r?\n/);
    if (!lines.length) lines.push("");

    const shouldStart =
      !current ||
      current.sha !== sha ||
      current.author !== author ||
      current.message !== message ||
      current.timestamp !== timestamp;

    if (shouldStart) {
      current = {
        key: `${sha || "unknown"}-${rowIndex}-${lineNumber}`,
        sha,
        author,
        message,
        timestamp,
        page: row?.page ?? null,
        kind: row?.kind ?? "segment",
        lines: [],
      };
      result.push(current);
    }

    lines.forEach((line) => {
      current.lines.push({
        lineNumber,
        code: line || " ",
      });
      lineNumber += 1;
    });
  });

  return result;
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
    const m = /^refs\/heads\/(.+)$/i.exec(String(k));
    if (m) opts.push({ value: m[1], label: m[1] });
  }
  opts.sort((a, b) => a.label.localeCompare(b.label));
  return opts;
}

function commitMetaCacheKey(ref, path) {
  return `${String(ref ?? "").trim()}::${String(path ?? "").trim()}`;
}

function summarizeBranchDelta(branchName, defaultBranch, aheadBy, behindBy) {
  const ahead = Math.max(0, Number(aheadBy) || 0);
  const behind = Math.max(0, Number(behindBy) || 0);
  if (!branchName || branchName === defaultBranch) return "";
  if (!ahead && !behind)
    return `${branchName} is up to date with ${defaultBranch}`;
  if (ahead && behind)
    return `${branchName} is ${ahead} commit${ahead === 1 ? "" : "s"} ahead and ${behind} commit${behind === 1 ? "" : "s"} behind ${defaultBranch}`;
  if (ahead)
    return `${branchName} is ${ahead} commit${ahead === 1 ? "" : "s"} ahead of ${defaultBranch}`;
  return `${branchName} is ${behind} commit${behind === 1 ? "" : "s"} behind ${defaultBranch}`;
}

function buildPullRequestUrl(repoBase, baseRef, headRef) {
  const search = new URLSearchParams({
    base: String(baseRef ?? "").trim(),
    head: String(headRef ?? "").trim(),
    create: "1",
  });
  return `${repoBase}/pull-requests?${search.toString()}`;
}

function darkButtonClass({ green = false, disabled = false } = {}) {
  return cn(
    "inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition-colors",
    green
      ? "btn-primary border-transparent"
      : "border-(--color-light-card-border) bg-(--color-light-card-bg) text-secondary hover:border-(--color-light-input-border) hover:bg-(--color-light-card-hover) hover:text-primary dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:text-dark-secondary dark:hover:border-(--color-dark-input-border-focus) dark:hover:bg-(--color-dark-card-hover) dark:hover:text-dark-primary",
    disabled && "cursor-not-allowed opacity-55",
  );
}

function iconGhostButtonClass({ compact = false } = {}) {
  return cn(
    "inline-flex items-center justify-center rounded-md border border-white/16 bg-white/[0.03] text-white/72 transition-colors hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-45",
    compact ? "h-8 w-8" : "h-9 w-9",
  );
}

function sidebarRow({ icon: Icon, label, value, href = "" }) {
  const content = href ? (
    <a
      href={href}
      className="break-all text-(--color-chart-blue-primary) hover:underline dark:text-(--color-chart-blue-secondary)"
    >
      {value}
    </a>
  ) : (
    <span>{value}</span>
  );

  return (
    <li className="flex items-start gap-3 text-sm text-secondary dark:text-dark-secondary">
      <Icon
        className="mt-0.5 h-4 w-4 shrink-0 text-muted dark:text-dark-muted"
        strokeWidth={1.7}
        aria-hidden
      />
      <span className="min-w-0 break-words">
        <span className="me-1 text-muted dark:text-dark-muted">{label}</span>
        {content}
      </span>
    </li>
  );
}

export default function GithubRepoCodeBrowser({ owner, repo, repositoryMeta }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const outletContext = useOutletContext() ?? {};
  const o = typeof owner === "string" ? owner.trim() : "";
  const r = typeof repo === "string" ? repo.trim() : "";
  const repoBase =
    typeof outletContext.repoBase === "string" ? outletContext.repoBase : "";
  const locale = i18n.language || undefined;
  const metaDefaultBranch =
    repositoryMeta?.default_branch ??
    repositoryMeta?.defaultBranch ??
    repositoryMeta?.defaultBranchName ??
    "main";

  const { data: refsPayload } = useVcRepositoryRefs(o, r, {
    enabled: Boolean(o && r),
    notifyOnError: false,
  });

  const branchOpts = useMemo(
    () => branchOptionsFromRefsPayload(refsPayload ?? {}),
    [refsPayload],
  );
  const headBranch = refsHeadBranch(refsPayload ?? {});

  const [ref, setRef] = useState(String(metaDefaultBranch || "main"));
  useEffect(() => {
    if (branchOpts.some((x) => x.value === ref)) return;
    const next = branchOpts.some((x) => x.value === headBranch)
      ? headBranch
      : (branchOpts[0]?.value ?? metaDefaultBranch ?? "main");
    setRef(String(next));
  }, [branchOpts, headBranch, metaDefaultBranch, ref]);

  const [treePath, setTreePath] = useState("");
  const [selected, setSelected] = useState(
    /** @type {null | { path: string, sha?: string }} */ (null),
  );
  const [fallbackCommitMetaByPath, setFallbackCommitMetaByPath] = useState({});
  const [folderLatestCommit, setFolderLatestCommit] = useState(null);
  const [branchStatus, setBranchStatus] = useState({
    loading: false,
    aheadBy: 0,
    behindBy: 0,
    comparedTo: String(metaDefaultBranch || "main"),
  });
  const [fileFilter, setFileFilter] = useState("");
  const [cloneMenuOpen, setCloneMenuOpen] = useState(false);
  const [archiveProgress, setArchiveProgress] = useState(null);
  const [activeView, setActiveView] = useState(
    /** @type {"code" | "blame" | "raw"} */ ("code"),
  );
  const treeParams = useMemo(() => ({ ref, path: treePath }), [ref, treePath]);
  const treeQuery = useVcRepositoryTree(o, r, treeParams, {
    enabled: Boolean(o && r && ref),
    notifyOnError: false,
  });
  const rawList = unwrapTreeNodes(treeQuery.data);

  const pathForEntry = useCallback(
    (entry, nameOverride) => {
      const nm = nameOverride ?? nodeLabel(entry);
      return typeof entry.path === "string" && entry.path.trim()
        ? entry.path.trim().replace(/^\/+/, "")
        : joinPath(treePath, nm);
    },
    [treePath],
  );

  const rows = useMemo(() => {
    const list = [...rawList];
    list.sort((a, b) => {
      const da = nodeDir(a) ? 0 : 1;
      const db = nodeDir(b) ? 0 : 1;
      if (da !== db) return da - db;
      return nodeLabel(a).localeCompare(nodeLabel(b), i18n.language);
    });

    const f = fileFilter.trim().toLowerCase();
    if (!f) return list;
    const fullPaths = list.map((e) => pathForEntry(e));
    return list.filter((entry, ix) => fullPaths[ix].toLowerCase().includes(f));
  }, [rawList, fileFilter, i18n.language, pathForEntry]);

  const crumbs = useMemo(() => {
    const root = [{ label: t("studentRepo.browser.rootSegment"), path: "" }];
    if (!treePath) return root;
    const segs = treePath.split("/").filter(Boolean);
    return root.concat(
      segs.map((segment, idx) => ({
        label: segment,
        path: segs.slice(0, idx + 1).join("/"),
      })),
    );
  }, [t, treePath]);

  const headlineCommit = useMemo(() => {
    const pick = [...rawList].find((e) => entryCommitMessage(e));
    if (!pick) return null;
    const ph = pick.commit?.id ?? pick.sha ?? pick.commit_id ?? "";
    return {
      message: entryCommitMessage(pick),
      date: entryCommittedDate(pick),
      sha: typeof ph === "string" ? ph.slice(0, 7) : "",
    };
  }, [rawList]);

  const cloneUrl =
    typeof repositoryMeta?.cloneUrl === "string"
      ? repositoryMeta.cloneUrl.trim()
      : typeof repositoryMeta?.clone_url === "string"
        ? repositoryMeta.clone_url.trim()
        : "";
  const commitTotal =
    repositoryMeta?.commits_count ??
    repositoryMeta?.commit_count ??
    repositoryMeta?.CommitsCount ??
    null;
  const branchCount =
    repositoryMeta?.branches_count ?? repositoryMeta?.branchCount ?? null;
  const tagCount =
    repositoryMeta?.tags_count ?? repositoryMeta?.releases_count ?? null;
  const topics = Array.isArray(repositoryMeta?.topics)
    ? repositoryMeta.topics.filter(Boolean)
    : [];
  const aboutText =
    repositoryMeta?.description || t("studentRepo.about.emptyAbout");
  const homepage =
    repositoryMeta?.homepage ??
    repositoryMeta?.website ??
    repositoryMeta?.html_url ??
    "";
  async function copyClone() {
    if (!cloneUrl) {
      gooeyToast.info(t("studentRepo.code.cloneUnavailable"));
      return;
    }
    try {
      await navigator.clipboard.writeText(cloneUrl);
      gooeyToast.success(t("studentRepo.code.cloneCopied"));
    } catch {
      gooeyToast.error(t("studentRepo.code.cloneCopyFailed"));
    }
  }

  async function downloadArchive() {
    if (!o || !r) return;
    setCloneMenuOpen(false);
    setArchiveProgress({ loaded: 0, total: 0, percent: 0, elapsedMs: 0 });
    try {
      await downloadRepositoryArchive(o, r, {
        ref,
        onProgress: setArchiveProgress,
      });
      gooeyToast.success(t("studentRepo.browser.downloadReady"));
    } catch {
      gooeyToast.error(t("studentRepo.browser.downloadFailed"));
    } finally {
      window.setTimeout(() => setArchiveProgress(null), 1200);
    }
  }

  const commitsQ = useVcRepositoryCommits(
    o,
    r,
    {
      path: selected?.path ?? "",
      ref,
      limit: 50,
    },
    {
      enabled: Boolean(
        o && r && ref && selected?.path && !String(selected.path).endsWith("/"),
      ),
      notifyOnError: false,
    },
  );
  const historyRows = Array.isArray(commitsQ.data) ? commitsQ.data : [];

  const selectedContentsQ = useVcRepositoryContents(
    o,
    r,
    selected?.path ?? "",
    { ref },
    {
      enabled: Boolean(o && r && ref && selected?.path),
      notifyOnError: false,
    },
  );

  const selectedBlobQ = useDocumentLoader({
    owner: o,
    repo: r,
    filePath: selected?.path ?? "",
    branch: ref,
    blobSha: selected?.sha ?? null,
    enabled: Boolean(o && r && ref && selected?.path),
  });

  const selectedExt = getFileExtension(selected?.path ?? "");
  const selectedKnownBinary = isKnownBinaryExtension(selectedExt);
  const selectedBytes = useMemo(() => {
    if (selectedBlobQ.bytes?.length) return selectedBlobQ.bytes;
    return extractBytesFromContentsResponse(selectedContentsQ.data, {
      allowTextEncoding: !selectedKnownBinary,
    });
  }, [selectedBlobQ.bytes, selectedContentsQ.data, selectedKnownBinary]);
  const selectedText = useMemo(() => {
    const fromBytes = selectedBytes?.length
      ? tryDecodeUtf8(selectedBytes)
      : null;
    if (typeof fromBytes === "string") return fromBytes;
    if (selectedKnownBinary) return null;
    return extractTextFromContentsResponse(selectedContentsQ.data);
  }, [selectedBytes, selectedContentsQ.data, selectedKnownBinary]);
  const selectedIsBinary = useMemo(
    () => isBinarySelection(selected?.path ?? "", selectedBytes, selectedText),
    [selected?.path, selectedBytes, selectedText],
  );
  const selectedBinaryLoading =
    selectedKnownBinary && selectedBlobQ.loading && !selectedBlobQ.bytes?.length;

  const fileMeta = useMemo(() => {
    const text = String(selectedText ?? "");
    const lines = text ? text.split(/\r?\n/).length : 0;
    const loc = text
      ? text
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean).length
      : 0;
    const bytes =
      selectedContentsQ.data?.size ??
      selectedBytes?.length ??
      selectedContentsQ.data?.content?.length ??
      new TextEncoder().encode(text).length;
    return { lines, loc, bytes };
  }, [selectedBytes, selectedContentsQ.data, selectedText]);

  const selectedPath = selected?.path ?? "";
  const selectedEntry = selectedPath
    ? (rows.find((entry) => pathForEntry(entry) === selectedPath) ?? null)
    : null;
  const selectedLatestCommit = historyRows[0] ?? null;

  const branchSelectOptions = useMemo(() => {
    if (branchOpts.length) return branchOpts;
    return [{ value: String(ref), label: String(ref) }];
  }, [branchOpts, ref]);

  const resolvedHeadlineCommit = useMemo(() => {
    if (headlineCommit) return headlineCommit;
    if (!folderLatestCommit) return null;
    return {
      message: commitRowMessage(folderLatestCommit),
      date: commitRowTimestamp(folderLatestCommit),
      sha: commitRowSha(folderLatestCommit).slice(0, 7),
      author: commitRowAuthor(folderLatestCommit),
    };
  }, [folderLatestCommit, headlineCommit]);

  const lastActivityRaw =
    repositoryMeta?.updatedAt ??
    repositoryMeta?.updated_at ??
    repositoryMeta?.pushedAt ??
    repositoryMeta?.pushed_at ??
    resolvedHeadlineCommit?.date ??
    "";

  const selectedHeaderCommit = {
    message:
      commitRowMessage(selectedLatestCommit) ||
      entryCommitMessage(selectedEntry ?? {}) ||
      resolvedHeadlineCommit?.message ||
      "",
    sha:
      commitRowSha(selectedLatestCommit) ||
      entryCommitSha(selectedEntry ?? {}) ||
      resolvedHeadlineCommit?.sha ||
      "",
    author:
      commitRowAuthor(selectedLatestCommit) ||
      entryCommitAuthor(selectedEntry ?? {}) ||
      "",
    timestamp:
      commitRowTimestamp(selectedLatestCommit) ||
      entryCommittedDate(selectedEntry ?? {}) ||
      resolvedHeadlineCommit?.date ||
      "",
  };

  useEffect(() => {
    setFallbackCommitMetaByPath({});
    setFolderLatestCommit(null);
  }, [ref]);

  useEffect(() => {
    let cancelled = false;
    if (!o || !r || !ref || selected?.path) {
      setFolderLatestCommit(null);
      return undefined;
    }

    async function loadFolderLatestCommit() {
      try {
        const commits = await fetchRepositoryCommits(o, r, {
          ref,
          limit: 1,
          ...(treePath ? { path: treePath } : {}),
        });
        const fallbackCommits =
          !Array.isArray(commits) || !commits.length
            ? await fetchRepositoryCommits(o, r, { ref, limit: 1 })
            : commits;
        if (cancelled) return;
        setFolderLatestCommit(
          Array.isArray(fallbackCommits) ? (fallbackCommits[0] ?? null) : null,
        );
      } catch {
        if (!cancelled) setFolderLatestCommit(null);
      }
    }

    loadFolderLatestCommit();
    return () => {
      cancelled = true;
    };
  }, [o, r, ref, selected?.path, treePath]);

  useEffect(() => {
    let cancelled = false;
    const pendingEntries = rows
      .map((entry) => {
        const fullPath = pathForEntry(entry);
        const existing = entryCommitMeta(entry);
        const cached =
          fallbackCommitMetaByPath[commitMetaCacheKey(ref, fullPath)];
        return {
          entry,
          path: fullPath,
          shouldFetch: !existing && !cached && Boolean(fullPath),
        };
      })
      .filter((item) => item.shouldFetch)
      .slice(0, 60);

    if (!o || !r || !ref || !pendingEntries.length) return undefined;

    async function loadRowCommitMeta() {
      const results = await Promise.all(
        pendingEntries.map(async ({ entry, path }) => {
          try {
            const commits = await fetchRepositoryCommits(o, r, {
              ref,
              limit: 1,
              ...(nodeDir(entry) ? {} : { path }),
            });
            const latest = Array.isArray(commits) ? (commits[0] ?? null) : null;
            if (!latest) return null;
            return {
              path,
              meta: {
                message: commitRowMessage(latest),
                timestamp: commitRowTimestamp(latest),
                sha: commitRowSha(latest),
                author: commitRowAuthor(latest),
              },
            };
          } catch {
            return null;
          }
        }),
      );

      if (cancelled) return;
      const next = {};
      results.forEach((item) => {
        if (!item?.path || !item.meta) return;
        if (
          !item.meta.message &&
          !item.meta.timestamp &&
          !item.meta.sha &&
          !item.meta.author
        ) {
          return;
        }
        next[commitMetaCacheKey(ref, item.path)] = item.meta;
      });
      if (!Object.keys(next).length) return;
      setFallbackCommitMetaByPath((current) => ({ ...current, ...next }));
    }

    loadRowCommitMeta();
    return () => {
      cancelled = true;
    };
  }, [fallbackCommitMetaByPath, o, pathForEntry, r, ref, rows]);

  useEffect(() => {
    let cancelled = false;
    const baseRef = String(metaDefaultBranch || "main");
    if (!o || !r || !ref || !baseRef || ref === baseRef) {
      setBranchStatus({
        loading: false,
        aheadBy: 0,
        behindBy: 0,
        comparedTo: baseRef,
      });
      return undefined;
    }

    async function loadBranchStatus() {
      setBranchStatus((current) => ({
        ...current,
        loading: true,
        comparedTo: baseRef,
      }));
      try {
        const [selectedCommits, baseCommits] = await Promise.all([
          fetchRepositoryCommits(o, r, { ref, limit: 200 }),
          fetchRepositoryCommits(o, r, { ref: baseRef, limit: 200 }),
        ]);
        if (cancelled) return;
        const selectedShas = new Set(
          (Array.isArray(selectedCommits) ? selectedCommits : [])
            .map((row) => commitRowSha(row))
            .filter(Boolean),
        );
        const baseShas = new Set(
          (Array.isArray(baseCommits) ? baseCommits : [])
            .map((row) => commitRowSha(row))
            .filter(Boolean),
        );
        let aheadBy = 0;
        let behindBy = 0;
        selectedShas.forEach((sha) => {
          if (!baseShas.has(sha)) aheadBy += 1;
        });
        baseShas.forEach((sha) => {
          if (!selectedShas.has(sha)) behindBy += 1;
        });
        setBranchStatus({
          loading: false,
          aheadBy,
          behindBy,
          comparedTo: baseRef,
        });
      } catch {
        if (!cancelled) {
          setBranchStatus({
            loading: false,
            aheadBy: 0,
            behindBy: 0,
            comparedTo: baseRef,
          });
        }
      }
    }

    loadBranchStatus();
    return () => {
      cancelled = true;
    };
  }, [metaDefaultBranch, o, r, ref]);

  const openHistoryPage = useCallback(() => {
    if (!repoBase || !selected?.path) return;
    const search = new URLSearchParams({
      path: selected.path,
      ref,
    });
    navigate(`${repoBase}/history?${search.toString()}`);
  }, [navigate, ref, repoBase, selected?.path]);

  function onPickEntry(entry) {
    const full = pathForEntry(entry);
    if (nodeDir(entry)) {
      setTreePath(full);
      setSelected(null);
      setActiveView("code");
      return;
    }
    const sha =
      typeof entry.sha === "string"
        ? entry.sha.trim()
        : typeof entry.objectId === "string"
          ? entry.objectId.trim()
          : typeof entry.id === "string" && /^[a-f0-9]{7,}$/i.test(entry.id)
            ? entry.id.trim()
            : "";
    setSelected({ path: full, sha: sha || undefined });
    setActiveView("code");
  }

  const aboutRows = [
    {
      key: "activity",
      icon: Activity,
      label: t("studentRepo.about.activity"),
      value: formatRelativeTime(lastActivityRaw, locale),
    },
    {
      key: "custom-properties",
      icon: Link2,
      label: t("studentRepo.about.customProperties"),
      value: topics.length
        ? String(topics.length)
        : t("studentRepo.about.none"),
    },
  ];

  return (
    <div className="space-y-5 text-secondary dark:text-dark-secondary">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <div className="w-full min-w-[10rem] max-w-[220px] sm:w-52">
            <Select
              value={ref}
              onChange={setRef}
              className="[&_.inline-flex]:h-8 [&_.inline-flex]:rounded-md [&_.inline-flex]:border-(--color-light-card-border) [&_.inline-flex]:bg-(--color-light-card-bg) [&_.inline-flex]:text-primary dark:[&_.inline-flex]:border-(--color-dark-card-border) dark:[&_.inline-flex]:bg-(--color-dark-card-bg) dark:[&_.inline-flex]:text-dark-primary"
              options={branchSelectOptions}
              placeholder={t("studentRepo.browser.branchPlaceholder")}
            />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-secondary dark:text-dark-secondary">
            <span className="inline-flex items-center gap-2">
              <GitBranch
                className="h-4 w-4 text-muted dark:text-dark-muted"
                strokeWidth={1.7}
                aria-hidden
              />
              {t("studentRepo.browser.branches", {
                count:
                  branchCount != null
                    ? String(branchCount)
                    : String(branchOpts.length || 0),
              })}
            </span>
            <span className="inline-flex items-center gap-2 text-muted dark:text-dark-muted">
              <TagIcon />
              {t("studentRepo.browser.tags", {
                count: tagCount != null ? String(tagCount) : "0",
              })}
            </span>
            {headBranch && ref === headBranch ? (
              <span className="inline-flex items-center rounded-full border border-(--color-light-card-border) bg-light-app-tertiary px-2 py-1 text-[11px] font-medium text-primary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-primary">
                HEAD
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
          <label htmlFor="repo-file-find" className="sr-only">
            {t("studentRepo.browser.findFileAria")}
          </label>
          <div className="relative min-w-[16rem] flex-1 xl:max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted dark:text-dark-muted"
              strokeWidth={1.7}
              aria-hidden
            />
            <input
              id="repo-file-find"
              type="search"
              value={fileFilter}
              onChange={(e) => setFileFilter(e.target.value)}
              placeholder={t("studentRepo.browser.findFilePlaceholder")}
              className="h-8 w-full rounded-md border border-(--color-light-input-border) bg-(--color-light-input-bg) pl-9 pr-3 text-sm text-(--color-light-text-primary) outline-none transition-colors placeholder:text-(--color-light-input-placeholder) focus:border-(--color-light-input-border-focus) focus:ring-2 focus:ring-blue-500/15 dark:border-dark-input-border dark:bg-(--color-dark-input-bg) dark:text-(--color-dark-text-primary) dark:placeholder:text-(--color-dark-input-placeholder) dark:focus:border-(--color-dark-input-border-focus) dark:focus:ring-blue-400/15"
              autoComplete="off"
            />
          </div>
          {/* <button
            type="button"
            className={darkButtonClass({ disabled: true })}
            disabled
          >
            {t("studentRepo.browser.addFileDisabled")}
            <ChevronDown className="h-4 w-4" strokeWidth={1.7} aria-hidden />
          </button> */}
          <div className="relative">
            <button
              type="button"
              className={darkButtonClass({ green: true, disabled: !cloneUrl })}
              disabled={!cloneUrl}
              onClick={() => setCloneMenuOpen((open) => !open)}
              aria-expanded={cloneMenuOpen}
            >
              <CodeIcon />
              {t("studentRepo.browser.code")}
              <ChevronDown className="h-4 w-4" strokeWidth={1.7} aria-hidden />
            </button>
            {cloneMenuOpen ? (
              <div className="absolute right-0 top-full z-30 mt-2 w-64 overflow-hidden rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-2 shadow-lg dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-primary transition-colors hover:bg-light-app-tertiary dark:text-dark-primary dark:hover:bg-dark-app-tertiary"
                  onClick={async () => {
                    setCloneMenuOpen(false);
                    await copyClone();
                  }}
                >
                  <Copy className="size-4" strokeWidth={1.7} aria-hidden />
                  {t("studentRepo.browser.copyCloneUrl")}
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-primary transition-colors hover:bg-light-app-tertiary dark:text-dark-primary dark:hover:bg-dark-app-tertiary"
                  onClick={downloadArchive}
                >
                  <Download className="size-4" strokeWidth={1.7} aria-hidden />
                  {t("studentRepo.browser.downloadZip")}
                </button>
                <p className="mt-1 truncate rounded-lg bg-light-app-tertiary px-3 py-2 font-mono text-[10px] text-muted dark:bg-dark-app-tertiary dark:text-dark-muted">
                  {cloneUrl}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {archiveProgress ? (
        <div className="rounded-lg border border-(--color-light-card-border) bg-(--color-light-card-bg) px-3 py-2 text-xs dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
          <div className="flex items-center justify-between gap-3 text-muted dark:text-dark-muted">
            <span>{t("studentRepo.browser.downloadProgress")}</span>
            <span>
              {archiveProgress.percent != null
                ? `${archiveProgress.percent}%`
                : formatBytes(archiveProgress.loaded)}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-light-app-tertiary dark:bg-dark-app-tertiary">
            <div
              className="h-full rounded-full bg-light-btn-primary-bg transition-all dark:bg-dark-primary"
              style={{
                width: `${Math.max(8, archiveProgress.percent ?? 35)}%`,
              }}
            />
          </div>
          <p className="mt-1 text-[11px] text-muted dark:text-dark-muted">
            {t("studentRepo.browser.downloadElapsed", {
              seconds: Math.max(
                1,
                Math.round((archiveProgress.elapsedMs ?? 0) / 1000),
              ),
            })}
          </p>
        </div>
      ) : null}

      {ref !== metaDefaultBranch ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-(--color-light-card-border) bg-(--color-light-card-bg) px-3 py-2 text-xs dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
          <span className="font-medium text-primary dark:text-dark-primary">
            {branchStatus.loading
              ? "Checking branch status…"
              : summarizeBranchDelta(
                  ref,
                  branchStatus.comparedTo || metaDefaultBranch,
                  branchStatus.aheadBy,
                  branchStatus.behindBy,
                )}
          </span>
          {!branchStatus.loading && branchStatus.aheadBy > 0 ? (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-300">
              +{branchStatus.aheadBy} ahead
            </span>
          ) : null}
          {!branchStatus.loading && branchStatus.behindBy > 0 ? (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700 dark:bg-amber-500/12 dark:text-amber-300">
              -{branchStatus.behindBy} behind
            </span>
          ) : null}
          {!branchStatus.loading && branchStatus.aheadBy > 0 && repoBase ? (
            <button
              type="button"
              className="ml-auto inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/12 dark:text-emerald-300 dark:hover:bg-emerald-500/18"
              onClick={() =>
                navigate(
                  buildPullRequestUrl(
                    repoBase,
                    branchStatus.comparedTo || metaDefaultBranch,
                    ref,
                  ),
                )
              }
            >
              Create pull request
            </button>
          ) : null}
        </div>
      ) : null}

      <div
        className={cn(
          "grid gap-6",
          selected?.path
            ? "xl:grid-cols-[300px_minmax(0,1fr)]"
            : "lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]",
        )}
      >
        <section
          className={cn(
            "min-w-0 space-y-4",
            selected?.path ? "xl:col-span-2" : "",
          )}
        >
          {selected?.path ? (
            <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
              <aside className="min-w-0">
                <div className="overflow-hidden rounded-md border border-(--color-light-card-border) bg-(--color-light-card-bg) dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
                  <div className="border-b border-(--color-light-card-border) px-3 py-2.5 dark:border-(--color-dark-card-border)">
                    <p className="text-base font-semibold text-primary dark:text-dark-primary">
                      {t("studentRepo.tabs.code")}
                    </p>
                  </div>
                  <nav
                    className="border-b border-(--color-light-card-border) px-3 py-1.5 text-[11px] font-medium text-muted dark:border-(--color-dark-card-border) dark:text-dark-muted"
                    aria-label={t("studentRepo.browser.treePathAria")}
                  >
                    <div className="flex flex-wrap items-center gap-1">
                      {crumbs.map((c, idx) => (
                        <span
                          key={`${c.path}-${idx}`}
                          className="inline-flex items-center gap-1"
                        >
                          {idx ? (
                            <ChevronRight
                              className="size-3 shrink-0 opacity-70"
                              aria-hidden
                            />
                          ) : null}
                          <button
                            type="button"
                            className={cn(
                              "rounded px-1 py-0.5 transition-colors hover:bg-(--color-light-card-hover) hover:text-primary dark:hover:bg-(--color-dark-card-hover) dark:hover:text-dark-primary",
                              c.path === treePath
                                ? "font-semibold text-primary dark:text-dark-primary"
                                : "",
                            )}
                            onClick={() => {
                              setTreePath(c.path);
                              setSelected(null);
                              setActiveView("code");
                            }}
                          >
                            {c.label}
                          </button>
                        </span>
                      ))}
                    </div>
                  </nav>

                  <div className="max-h-[70vh] overflow-y-auto">
                    {treeQuery.isLoading && !rawList.length ? (
                      <div className="px-3 py-4 text-xs text-muted dark:text-dark-muted">
                        {t("studentRepo.browser.treeLoading")}
                      </div>
                    ) : null}

                    {!treeQuery.isLoading && !rawList.length ? (
                      <div className="px-3 py-4 text-xs text-muted dark:text-dark-muted">
                        {t("studentRepo.browser.treeEmpty")}
                      </div>
                    ) : null}

                    {rows.map((entry, i) => {
                      const nm = nodeLabel(entry) || `entry-${i}`;
                      const dir = nodeDir(entry);
                      const full = pathForEntry(entry, nm);
                      const fallbackMeta =
                        fallbackCommitMetaByPath[
                          commitMetaCacheKey(ref, full)
                        ] ?? null;
                      const msg =
                        entryCommitMessage(entry) ||
                        fallbackMeta?.message ||
                        "—";
                      const whenRaw =
                        entryCommittedDate(entry) ||
                        fallbackMeta?.timestamp ||
                        "";
                      const sel = selected?.path === full;
                      return (
                        <button
                          key={`${full}-${i}`}
                          type="button"
                          onClick={() =>
                            onPickEntry({ ...entry, path: entry.path })
                          }
                          className={cn(
                            "grid w-full grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_92px] items-center gap-2 border-b border-(--color-light-card-border) px-3 py-2 text-left transition-colors last:border-b-0 dark:border-(--color-dark-card-border)",
                            sel
                              ? "bg-(--color-light-card-hover) dark:bg-(--color-dark-card-hover)"
                              : "hover:bg-(--color-light-card-hover) dark:hover:bg-(--color-dark-card-hover)",
                          )}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            {dir ? (
                              <Folder
                                className="size-4 shrink-0 text-(--color-chart-warning)"
                                strokeWidth={1.9}
                                aria-hidden
                              />
                            ) : (
                              <File
                                className="size-4 shrink-0 text-muted dark:text-dark-muted"
                                strokeWidth={1.9}
                                aria-hidden
                              />
                            )}
                            <span className="min-w-0 truncate text-xs font-medium text-primary dark:text-dark-primary">
                              {nm}
                            </span>
                          </div>
                          <span className="truncate text-[11px] text-secondary dark:text-dark-secondary">
                            {msg}
                          </span>
                          <span className="text-right text-[11px] text-muted dark:text-dark-muted">
                            {formatRelativeTime(whenRaw, locale)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </aside>

              <section className="min-w-0 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <button
                    type="button"
                    className="text-(--color-chart-blue-primary) hover:underline dark:text-(--color-chart-blue-secondary)"
                    onClick={() => {
                      setSelected(null);
                      setActiveView("code");
                    }}
                  >
                    {r}
                  </button>
                  <span className="text-muted dark:text-dark-muted">/</span>
                  <span className="truncate text-primary dark:text-dark-primary">
                    {selected.path}
                  </span>
                </div>

                <div className="overflow-hidden rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) text-primary shadow-lg dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:text-dark-primary">
                  <div className="flex flex-wrap items-center gap-2 border-b border-light-divider px-3 py-2.5 text-xs dark:border-dark-divider">
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-(--color-light-card-border) bg-light-app-tertiary text-[10px] font-medium uppercase text-primary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-primary">
                      {initialsFromName(selectedHeaderCommit.author || o)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-medium text-primary dark:text-dark-primary">
                          {selectedHeaderCommit.author ||
                            (o ?? "").split?.(/[/@]/)[0] ||
                            o}
                        </span>
                        <span
                          className="min-w-0 truncate text-[11px] text-secondary dark:text-dark-secondary"
                          title={selectedHeaderCommit.message || "—"}
                        >
                          {selectedHeaderCommit.message || "—"}
                        </span>
                      </div>
                    </div>
                    <div className="ms-auto flex flex-wrap items-center gap-2 text-[10px] text-muted dark:text-dark-muted">
                      <span className="font-mono text-[10px]">
                        {selectedHeaderCommit.sha.slice(0, 7) || "—"}
                      </span>
                      <span className="rounded-full border border-(--color-light-card-border) px-1.5 py-0.5 text-[10px] dark:border-(--color-dark-card-border)">
                        {formatRelativeDay(
                          selectedHeaderCommit.timestamp,
                          locale,
                        )}
                      </span>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-secondary transition-colors hover:text-primary dark:text-dark-secondary dark:hover:text-dark-primary"
                        onClick={openHistoryPage}
                      >
                        <HistoryIcon />
                        {t("studentRepo.browser.history")}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 border-b border-light-divider bg-light-app-tertiary px-3 py-1.5 dark:border-dark-divider dark:bg-dark-app-tertiary">
                    <div className="flex items-center rounded-lg border border-(--color-light-card-border) bg-(--color-light-card-bg) p-0.5 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
                      <button
                        type="button"
                        className={cn(
                          "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                          activeView === "code"
                            ? "bg-(--color-light-card-hover) text-primary dark:bg-(--color-dark-card-hover) dark:text-dark-primary"
                            : "text-secondary hover:text-primary dark:text-dark-secondary dark:hover:text-dark-primary",
                        )}
                        onClick={() => {
                          setActiveView("code");
                        }}
                      >
                        {t("studentRepo.browser.currentVersion")}
                      </button>
                      <button
                        type="button"
                        className={cn(
                          "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                          activeView === "blame"
                            ? "bg-(--color-light-card-hover) text-primary dark:bg-(--color-dark-card-hover) dark:text-dark-primary"
                            : "text-secondary hover:text-primary dark:text-dark-secondary dark:hover:text-dark-primary",
                        )}
                        onClick={() => {
                          setActiveView("blame");
                        }}
                      >
                        Blame
                      </button>
                    </div>

                    <div className="text-[10px] text-muted dark:text-dark-muted">
                      {fileMeta.lines} lines ({fileMeta.loc} loc) •{" "}
                      {formatBytes(fileMeta.bytes)}
                    </div>

                    <div className="ms-auto flex items-center gap-2">
                      {activeView === "blame" ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-full border border-(--color-light-card-border) px-2 py-0.5 text-[10px] text-secondary transition-colors hover:bg-(--color-light-card-hover) hover:text-primary dark:border-(--color-dark-card-border) dark:text-dark-secondary dark:hover:bg-(--color-dark-card-hover) dark:hover:text-dark-primary"
                          onClick={openHistoryPage}
                        >
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-(--color-light-card-border) bg-light-app-tertiary text-[9px] font-medium dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
                            {initialsFromName(selectedHeaderCommit.author || o)}
                          </span>
                          Contributors
                          <span className="inline-flex min-w-5 items-center justify-center rounded-full border border-(--color-light-card-border) px-1 text-[9px] dark:border-(--color-dark-card-border)">
                            {selectedHeaderCommit.author ? 1 : 0}
                          </span>
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className={cn(
                          "rounded-md border border-(--color-light-card-border) px-2 py-1 text-[10px] font-medium transition-colors dark:border-(--color-dark-card-border)",
                          activeView === "raw"
                            ? "bg-(--color-light-card-hover) text-primary dark:bg-(--color-dark-card-hover) dark:text-dark-primary"
                            : "bg-transparent text-secondary hover:bg-(--color-light-card-hover) hover:text-primary dark:text-dark-secondary dark:hover:bg-(--color-dark-card-hover) dark:hover:text-dark-primary",
                        )}
                        onClick={() => {
                          setActiveView("raw");
                        }}
                      >
                        {t("studentRepo.browser.raw")}
                      </button>
                      <button
                        type="button"
                        className={iconGhostButtonClass({ compact: true })}
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(selected.path);
                            gooeyToast.success(
                              t("studentRepo.code.cloneCopied"),
                            );
                          } catch {
                            gooeyToast.error(
                              t("studentRepo.code.cloneCopyFailed"),
                            );
                          }
                        }}
                      >
                        <Copy
                          className="h-4 w-4"
                          strokeWidth={1.7}
                          aria-hidden
                        />
                      </button>
                      <button
                        type="button"
                        className={iconGhostButtonClass({ compact: true })}
                        disabled={!selected?.sha}
                        onClick={async () => {
                          gooeyToast.info(
                            t("studentRepo.browser.downloadHint"),
                          );
                          try {
                            if (!selected?.sha || !selected?.path) return;
                            const bytes = await fetchRepositoryBlobPayload(
                              o,
                              r,
                              selected.sha.trim(),
                            );
                            const nm =
                              selected.path.split("/").filter(Boolean).pop() ||
                              "download.bin";
                            saveAs(new Blob([bytes]), nm);
                          } catch {
                            gooeyToast.error(
                              t("studentRepo.browser.downloadFailed"),
                            );
                          }
                        }}
                      >
                        <Download
                          className="h-4 w-4"
                          strokeWidth={1.7}
                          aria-hidden
                        />
                      </button>
                      <button
                        type="button"
                        className={iconGhostButtonClass({ compact: true })}
                        disabled
                      >
                        <Pencil
                          className="h-4 w-4"
                          strokeWidth={1.7}
                          aria-hidden
                        />
                      </button>
                      <button
                        type="button"
                        className={iconGhostButtonClass({ compact: true })}
                      >
                        <Ellipsis
                          className="h-4 w-4"
                          strokeWidth={1.7}
                          aria-hidden
                        />
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#0d1117] p-0">
                    {!selected.sha ? (
                      <div className="p-4">
                        <p className="text-xs text-white/60">
                          {t("studentRepo.browser.noBlobShaBody")}
                        </p>
                      </div>
                    ) : activeView === "raw" ? (
                      <RawSnippetPanel
                        owner={o}
                        repo={r}
                        blobSha={selected.sha}
                      />
                    ) : selectedBinaryLoading ? (
                      <div className="p-4">
                        <p className="text-xs text-white/60">
                          Loading binary file…
                        </p>
                      </div>
                    ) : activeView === "blame" ? (
                      <RepositoryBlamePanel
                        owner={o}
                        repo={r}
                        filePath={selected.path}
                        branch={ref}
                        fileText={selectedText}
                        fileBytes={selectedBytes}
                        isBinary={selectedIsBinary}
                        historyRows={historyRows}
                        locale={locale}
                        onOpenHistory={openHistoryPage}
                      />
                    ) : (
                      <RepositoryCodePanel
                        owner={o}
                        repo={r}
                        filePath={selected.path}
                        fileBytes={selectedBytes}
                        fileText={selectedText}
                        fileMeta={fileMeta}
                        fileLoadError={selectedBlobQ.error}
                        headerCommit={selectedHeaderCommit}
                        branch={ref}
                        isBinary={selectedIsBinary}
                        onOpenHistory={openHistoryPage}
                      />
                    )}
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border border-(--color-light-card-border) bg-(--color-light-card-bg) dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
              {resolvedHeadlineCommit ? (
                <div className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-(--color-light-card-border) bg-light-app-tertiary text-xs font-semibold uppercase text-primary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-primary">
                    {(o ?? "").slice(0, 2)}
                  </span>
                  <span className="font-semibold text-primary dark:text-dark-primary">
                    {(o ?? "").split?.(/[/@]/)[0] ?? o}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-secondary dark:text-dark-secondary">
                    {resolvedHeadlineCommit.message || "—"}
                  </span>
                  <span className="font-mono text-xs text-muted dark:text-dark-muted">
                    {resolvedHeadlineCommit.sha || "—"}
                  </span>
                  <span className="text-sm text-muted dark:text-dark-muted">
                    {formatRelativeTime(resolvedHeadlineCommit.date, locale)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary dark:text-dark-primary">
                    <HistoryIcon />
                    {t("studentRepo.code.commitTotal", {
                      count: commitTotal ?? 0,
                    })}
                  </span>
                </div>
              ) : (
                <p className="px-4 py-3 text-sm text-muted dark:text-dark-muted">
                  {!treeQuery.isLoading
                    ? t("studentRepo.browser.commitRibbonEmpty")
                    : t("studentRepo.browser.commitRibbonLoading")}
                </p>
              )}

              <nav
                className="border-t border-(--color-light-card-border) px-4 py-2 text-xs font-medium text-muted dark:border-(--color-dark-card-border) dark:text-dark-muted"
                aria-label={t("studentRepo.browser.treePathAria")}
              >
                <div className="flex flex-wrap items-center gap-1">
                  {crumbs.map((c, idx) => (
                    <span
                      key={`${c.path}-${idx}`}
                      className="inline-flex items-center gap-1"
                    >
                      {idx ? (
                        <ChevronRight
                          className="size-3 shrink-0 opacity-70"
                          aria-hidden
                        />
                      ) : null}
                      <button
                        type="button"
                        className={cn(
                          "rounded px-1 py-0.5 transition-colors hover:bg-(--color-light-card-hover) hover:text-primary dark:hover:bg-(--color-dark-card-hover) dark:hover:text-dark-primary",
                          c.path === treePath
                            ? "font-semibold text-primary dark:text-dark-primary"
                            : "",
                        )}
                        onClick={() => {
                          setTreePath(c.path);
                          setSelected(null);
                          setActiveView("code");
                        }}
                      >
                        {c.label}
                      </button>
                    </span>
                  ))}
                </div>
              </nav>

              {!treeQuery.isLoading && rawList.length === 0 ? (
                <div className="border-t border-(--color-light-card-border) px-4 py-6 text-sm text-muted dark:border-(--color-dark-card-border) dark:text-dark-muted">
                  {t("studentRepo.browser.treeEmpty")}
                </div>
              ) : null}

              {treeQuery.isLoading && !rawList.length ? (
                <div className="border-t border-(--color-light-card-border) px-4 py-6 text-sm text-muted dark:border-(--color-dark-card-border) dark:text-dark-muted">
                  {t("studentRepo.browser.treeLoading")}
                </div>
              ) : null}

              {!!rawList.length && (
                <div className="border-t border-(--color-light-card-border) dark:border-(--color-dark-card-border)">
                  {rows.map((entry, i) => {
                    const nm = nodeLabel(entry) || `entry-${i}`;
                    const dir = nodeDir(entry);
                    const full = pathForEntry(entry, nm);
                    const fallbackMeta =
                      fallbackCommitMetaByPath[commitMetaCacheKey(ref, full)] ??
                      null;
                    const msg =
                      entryCommitMessage(entry) || fallbackMeta?.message || "—";
                    const whenRaw =
                      entryCommittedDate(entry) ||
                      fallbackMeta?.timestamp ||
                      "";
                    return (
                      <button
                        key={`${full}-${i}`}
                        type="button"
                        onClick={() =>
                          onPickEntry({ ...entry, path: entry.path })
                        }
                        className="grid w-full grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_110px] items-center gap-3 border-b border-(--color-light-card-border) px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-(--color-light-card-hover) dark:border-(--color-dark-card-border) dark:hover:bg-(--color-dark-card-hover)"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          {dir ? (
                            <Folder
                              className="size-4 shrink-0 text-(--color-chart-warning"
                              strokeWidth={1.9}
                              aria-hidden
                            />
                          ) : (
                            <File
                              className="size-4 shrink-0 text-muted dark:text-dark-muted"
                              strokeWidth={1.9}
                              aria-hidden
                            />
                          )}
                          <span className="min-w-0 truncate text-sm font-semibold text-primary dark:text-dark-primary">
                            {nm}
                          </span>
                        </div>
                        <span className="truncate text-sm text-secondary dark:text-dark-secondary">
                          {msg}
                        </span>
                        <span className="text-right text-sm text-muted dark:text-dark-muted">
                          {formatRelativeTime(whenRaw, locale)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>

        {!selected?.path ? (
          <aside className="min-w-0" aria-label={t("studentRepo.sidebar.aria")}>
            <div className="space-y-6">
              <section className="border-b border-(--color-light-card-border) pb-6 dark:border-(--color-dark-card-border)">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-2xl font-semibold text-primary dark:text-dark-primary">
                    {t("studentRepo.about.title")}
                  </h2>
                  <button
                    type="button"
                    className="text-muted transition-colors hover:text-primary dark:text-dark-muted dark:hover:text-dark-primary"
                  >
                    <Ellipsis
                      className="h-5 w-5"
                      strokeWidth={1.7}
                      aria-hidden
                    />
                  </button>
                </div>
                <p className="text-sm leading-6 text-secondary dark:text-dark-secondary">
                  {aboutText}
                </p>
                {homepage ? (
                  <a
                    href={String(homepage)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-sm text-(--color-chart-blue-primary) hover:underline dark:text-(--color-chart-blue-secondary)"
                  >
                    <Link2 className="h-4 w-4" strokeWidth={1.7} aria-hidden />
                    {String(homepage)}
                  </a>
                ) : null}
                <ul className="mt-5 space-y-4">
                  {aboutRows.map((item) => (
                    <li key={item.key}>{sidebarRow(item)}</li>
                  ))}
                </ul>
              </section>

              <section className="border-b border-(--color-light-card-border) pb-6 dark:border-(--color-dark-card-border)">
                <h3 className="text-xl font-semibold text-primary dark:text-dark-primary">
                  {t("studentRepo.releases.title")}
                </h3>
                <p className="mt-4 text-sm text-muted dark:text-dark-muted">
                  {t("studentRepo.releases.empty")}
                </p>
                <button
                  type="button"
                  className="mt-2 text-sm font-medium text-(--color-chart-blue-primary) hover:underline dark:text-(--color-chart-blue-secondary)"
                >
                  {t("studentRepo.releases.create")}
                </button>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-primary dark:text-dark-primary">
                  {t("studentRepo.packages.title")}
                </h3>
                <p className="mt-4 text-sm text-muted dark:text-dark-muted">
                  {t("studentRepo.packages.empty")}
                </p>
              </section>
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

function TagIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-4 w-4 text-muted dark:text-dark-muted"
      fill="none"
      aria-hidden
    >
      <path
        d="M2.75 4.25h4.1l5.15 5.15-2.6 2.6L4.25 6.85v-4.1Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="5.2" cy="5.2" r="0.9" fill="currentColor" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden>
      <path
        d="m5.5 4.5-3 3 3 3M10.5 4.5l3 3-3 3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-4 w-4 text-muted dark:text-dark-muted"
      fill="none"
      aria-hidden
    >
      <path
        d="M2.75 8a5.25 5.25 0 1 0 1.57-3.74L2.75 5.75M2.75 2.75v3h3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RepositoryCodePanel({
  owner,
  repo,
  filePath,
  fileBytes,
  fileText,
  fileMeta,
  fileLoadError,
  headerCommit,
  branch,
  isBinary,
  onOpenHistory,
}) {
  if (isBinary) {
    return (
      <RepositoryBinaryCodePanel
        owner={owner}
        repo={repo}
        filePath={filePath}
        fileBytes={fileBytes}
        fileMeta={fileMeta}
        fileLoadError={fileLoadError}
        headerCommit={headerCommit}
        branch={branch}
        onOpenHistory={onOpenHistory}
      />
    );
  }

  if (fileBytes?.length) {
    return (
      <OverviewMode
        owner={owner}
        repo={repo}
        branch={branch}
        fileBytes={fileBytes}
        filePath={filePath}
        fileType=""
        embedded
      />
    );
  }
  return (
    <div className="rounded-md border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 text-sm text-muted dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:text-dark-muted">
      Preview is unavailable for this file response. Use `Raw` or `Download`.
    </div>
  );
}

function RepositoryBlamePanel({
  owner,
  repo,
  filePath,
  branch,
  fileText,
  fileBytes,
  isBinary,
  historyRows,
  locale,
  onOpenHistory,
}) {
  const { t } = useTranslation();
  const [blameRows, setBlameRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hoveredGroup, setHoveredGroup] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!owner || !repo || !filePath || fileText == null || isBinary) {
        setBlameRows([]);
        setError("");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const rows = await fetchFileBlame(owner, repo, filePath, branch);
        if (!cancelled) setBlameRows(Array.isArray(rows) ? rows : []);
      } catch (err) {
        if (!cancelled) {
          setBlameRows([]);
          setError(String(err?.message ?? t("documentViewer.blame.binary")));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [branch, filePath, fileText, isBinary, owner, repo, t]);

  if (isBinary) {
    return (
      <RepositoryBinaryBlamePanel
        owner={owner}
        repo={repo}
        filePath={filePath}
        branch={branch}
        fileBytes={fileBytes}
        historyRows={historyRows}
        locale={locale}
        onOpenHistory={onOpenHistory}
      />
    );
  }

  const fileLines = useMemo(
    () => (typeof fileText === "string" ? fileText.split(/\r?\n/) : []),
    [fileText],
  );

  const segments = useMemo(
    () => groupBlameSegments(blameRows, fileLines),
    [blameRows, fileLines],
  );

  const contributors = useMemo(() => {
    const map = new Map();
    segments.forEach((segment) => {
      const key = segment.author || segment.avatarUrl || "";
      if (!key || map.has(key)) return;
      map.set(key, {
        name: segment.author || "",
        avatarUrl: segment.avatarUrl || null,
      });
    });
    return Array.from(map.values());
  }, [segments]);

  const [minTs, maxTs] = useMemo(() => {
    const stamps = segments
      .map((segment) => new Date(segment.timestamp).getTime())
      .filter((value) => Number.isFinite(value));
    if (!stamps.length) return [0, 0];
    return [Math.min(...stamps), Math.max(...stamps)];
  }, [segments]);

  const contributorCount = contributors.length || 0;

  if (fileText == null) {
    return (
      <div className="rounded-md border border-(--color-light-card-border) bg-white p-4 text-sm text-muted dark:border-dark-default  dark:bg-dark-card-bg dark:text-dark-text-muted">
        {t("documentViewer.blame.binary")}
      </div>
    );
  }

  if (loading) {
    return (
      <p className="px-4 py-4 text-xs text-muted dark:text-dark-muted">
        {t("studentRepo.browser.historyLoading")}
      </p>
    );
  }

  if (error) {
    return (
      <div className="m-4 rounded-md border border-light-error-border bg-color-light-error-bg p-4 text-sm text--light-error-text dark:border--dark-error-border dark:bg-color-dark-error-bg dark:text-color-dark-error-tex">
        {error}
      </div>
    );
  }

  return (
    <div className="overflow-hidden border-t border-light-divider bg-white  dark:border-dark-divider dark:bg-(--color-dark-card-bg) dark:text-dark-primary">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-light-divider px-3 py-2.5 dark:border-dark-divider">
        <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-muted dark:text-dark-muted">
          <span>Older</span>
          <div className="flex items-center gap-1">
            {Array.from({ length: 10 }).map((_, index) => {
              const ratio = index / 9;
              return (
                <span
                  key={index}
                  className="h-2.5 w-2.5 rounded-[2px]"
                  style={{
                    backgroundColor: `hsla(34, 88%, ${22 + ratio * 40}%, .95)`,
                  }}
                />
              );
            })}
          </div>
          <span>Newer</span>
        </div>

        <div className="flex items-center gap-3">
          {contributors.slice(0, 1).map((person) => (
            <Avatar
              key={`${person.name}-${person.avatarUrl || "fallback"}`}
              src={person.avatarUrl}
              alt={person.name}
              initials={initialsFromName(person.name)}
              className="rounded-full border border-(--color-light-card-border) shadow-sm dark:border-(--color-dark-card-border)"
              sizeClass="inline-flex h-6 w-6 items-center justify-center overflow-hidden rounded-full"
            />
          ))}
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-(--color-light-card-border) px-2.5 py-1 text-[11px] text-secondary transition-colors hover:bg-(--color-light-card-hover) hover:text-primary dark:border-(--color-dark-card-border) dark:text-dark-secondary dark:hover:bg-(--color-dark-card-hover) dark:hover:text-dark-primary"
            onClick={onOpenHistory}
          >
            Contributors
            <span className="inline-flex min-w-6  items-center justify-center rounded-full border border-(--color-light-card-border) px-1.5 text-[10px] dark:border-(--color-dark-card-border)">
              {contributorCount}
            </span>
          </button>
        </div>
      </div>

      <div className="border-b border-light-divider px-3 py-2 dark:border-dark-divider">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted dark:text-dark-muted">
          Line Ownership
        </p>
      </div>

      <div className="overflow-x-auto">
        {!segments.length ? (
          <p className="px-4 py-4 text-xs text-muted dark:text-dark-muted">
            {t("studentRepo.browser.historyEmpty")}
          </p>
        ) : (
          segments.map((segment) => {
            const ts = new Date(segment.timestamp).getTime();
            const ratio =
              Number.isFinite(ts) && maxTs > minTs
                ? (ts - minTs) / (maxTs - minTs)
                : 0.45;
            const bg = `hsla(34, 88%, ${56 + ratio * 18}%, ${hoveredGroup === segment.key ? 0.22 : 0.12})`;
            const accent = `hsla(29, 92%, ${28 + ratio * 42}%, .96)`;
            return (
              <div
                key={segment.key}
                className="grid min-w-190 border-b border-default md:grid-cols-[minmax(220px,28%)_minmax(0,1fr)] dark:border-dark-default"
                onMouseEnter={() => setHoveredGroup(segment.key)}
                onMouseLeave={() => setHoveredGroup("")}
              >
                <div
                  className="border-r border-default px-0 dark:border-dark-default"
                  style={{ backgroundColor: bg }}
                >
                  <div className="grid h-full grid-cols-[4px_minmax(0,1fr)]">
                    <span style={{ backgroundColor: accent }} />
                    <div className="p-3">
                      <div className="group relative min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex shrink-0 rounded-full border border-(--color-light-card-border) bg-light-app-tertiary px-2 py-0.5 text-[10px] font-medium text-primary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-primary">
                            {formatBlameRelativeDate(segment.timestamp, locale)}
                          </span>
                          <Avatar
                            src={segment.avatarUrl}
                            alt={segment.author}
                            initials={initialsFromName(segment.author)}
                            className="shrink-0 rounded-full border border-(--color-light-card-border) shadow-sm dark:border-(--color-dark-card-border)"
                            sizeClass="inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-full"
                          />
                          <button
                            type="button"
                            className="min-w-0 flex-1 truncate text-left text-[11px] text-secondary transition-colors hover:text-primary dark:text-dark-secondary dark:hover:text-dark-primary"
                            onClick={onOpenHistory}
                          >
                            {truncateMiddle(segment.message || "—", 34)}
                          </button>
                        </div>
                        <div className="mt-1 truncate text-[10px] text-muted dark:text-dark-muted">
                          {segment.author || "—"}
                        </div>
                        <div className="pointer-events-none absolute left-0 top-full z-20 mt-1 hidden w-64 rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) px-2.5 py-2 text-left text-[10px] leading-4 text-secondary shadow-lg group-hover:block dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:text-dark-secondary">
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-medium text-primary dark:text-dark-primary">
                              {segment.message || "—"}
                            </p>
                            <span className="shrink-0 rounded-full border border-(--color-light-card-border) px-1.5 py-0.5 text-[9px] text-muted dark:border-(--color-dark-card-border) dark:text-dark-muted">
                              {segment.lines.length} line
                              {segment.lines.length === 1 ? "" : "s"}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-medium text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-300">
                              +{segment.additions ?? "—"}
                            </span>
                            <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-medium text-red-700 dark:bg-red-500/12 dark:text-red-300">
                              -{segment.deletions ?? "—"}
                            </span>
                          </div>
                          <p className="mt-2 text-muted dark:text-dark-muted">
                            {segment.author || "—"} •{" "}
                            {formatAbsoluteTime(segment.timestamp, locale)}
                          </p>
                        </div>
                        <div className="mt-1 text-[10px] text-muted dark:text-dark-muted">
                          {segment.lines.length} line
                          {segment.lines.length === 1 ? "" : "s"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="min-w-0">
                  {segment.lines.map((line) => (
                    <div
                      key={`${segment.key}-${line.lineNumber}`}
                      className={cn(
                        "grid grid-cols-[48px_minmax(0,1fr)] border-b border-light-divider font-mono text-[10px] leading-5 last:border-b-0 dark:border-dark-divider",
                        hoveredGroup === segment.key
                          ? "bg-(--color-light-card-hover) dark:bg-(--color-dark-card-hover)"
                          : "",
                      )}
                    >
                      <div className="select-none px-2.5 text-right text-muted dark:text-dark-muted">
                        {line.lineNumber}
                      </div>
                      <pre className="m-0 px-3 py-0 text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
                        <code>{line.code || " "}</code>
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function RepositoryBinaryCodePanel({
  owner,
  repo,
  filePath,
  fileBytes,
  fileMeta,
  fileLoadError,
  branch,
  onOpenHistory,
}) {
  const ext = getFileExtension(filePath) || "binary";

  if (!fileBytes?.length) {
    return (
      <div className="rounded-md border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 text-sm text-muted dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:text-dark-muted">
        {fileLoadError ||
          "Preview is unavailable for this binary file response. Use Download to save the original bytes."}
      </div>
    );
  }

  return (
    <div className="space-y-4  border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="rounded-full bg-sky-50 px-2 py-0.5 font-semibold uppercase tracking-wide text-sky-700 dark:bg-sky-500/12 dark:text-sky-300">
              Binary preview
            </span>
            <span className="rounded-full border border-(--color-light-card-border) px-2 py-0.5 font-medium text-muted dark:border-(--color-dark-card-border) dark:text-dark-muted">
              .{ext}
            </span>
            <span className="rounded-full border border-(--color-light-card-border) px-2 py-0.5 font-medium text-muted dark:border-(--color-dark-card-border) dark:text-dark-muted">
              {formatBytes(fileMeta?.bytes)}
            </span>
            <span className="rounded-full border border-(--color-light-card-border) px-2 py-0.5 font-medium text-muted dark:border-(--color-dark-card-border) dark:text-dark-muted">
              ref {branch}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-primary dark:text-dark-primary">
              {filePath}
            </p>
            <p className="mt-1 text-xs text-secondary dark:text-dark-secondary">
              This preview tracks the original binary document instead of
              converting it into a text buffer.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-md border border-(--color-light-card-border) px-3 py-1.5 text-xs font-medium text-secondary transition-colors hover:bg-(--color-light-card-hover) hover:text-primary dark:border-(--color-dark-card-border) dark:text-dark-secondary dark:hover:bg-(--color-dark-card-hover) dark:hover:text-dark-primary"
            onClick={onOpenHistory}
          >
            Open history
          </button>
        </div>
      </div>

      <OverviewMode
        owner={owner}
        repo={repo}
        branch={branch}
        fileBytes={fileBytes}
        filePath={filePath}
        fileType=""
        embedded
      />
    </div>
  );
}

function RepositoryBinaryBlamePanel({
  owner,
  repo,
  filePath,
  branch,
  fileBytes,
  historyRows,
  locale,
  onOpenHistory,
}) {
  const [selectedRevision, setSelectedRevision] = useState("");
  const [documentBlame, setDocumentBlame] = useState(null);
  const [documentBlameLoading, setDocumentBlameLoading] = useState(false);
  const [documentBlameError, setDocumentBlameError] = useState("");
  const [documentBlameUnavailable, setDocumentBlameUnavailable] =
    useState(false);
  const [hoveredSegment, setHoveredSegment] = useState("");
  const docBlameCapable = supportsDocumentBlame(filePath);

  useEffect(() => {
    const firstSha = commitRowSha(historyRows?.[0]);
    setSelectedRevision(
      (current) => current || firstSha || String(branch ?? ""),
    );
  }, [branch, historyRows]);

  const resolvedRef = selectedRevision || String(branch ?? "");
  const selectedRevisionContentsQ = useVcRepositoryContents(
    owner,
    repo,
    filePath,
    { ref: resolvedRef },
    {
      enabled: Boolean(owner && repo && filePath && resolvedRef),
      notifyOnError: false,
    },
  );
  const selectedRevisionBlobSha =
    typeof selectedRevisionContentsQ.data?.sha === "string"
      ? selectedRevisionContentsQ.data.sha.trim()
      : null;
  const previewQ = useDocumentLoader({
    owner,
    repo,
    filePath,
    branch: resolvedRef,
    blobSha: selectedRevisionBlobSha,
    enabled: Boolean(owner && repo && filePath && resolvedRef),
  });

  useEffect(() => {
    let cancelled = false;
    async function loadDocumentBlame() {
      if (!docBlameCapable || !owner || !repo || !filePath || !resolvedRef) {
        setDocumentBlame(null);
        setDocumentBlameError("");
        setDocumentBlameUnavailable(false);
        setDocumentBlameLoading(false);
        return;
      }

      setDocumentBlameLoading(true);
      setDocumentBlameError("");
      setDocumentBlameUnavailable(false);
      try {
        const data = await fetchDocumentBlame(owner, repo, filePath, resolvedRef);
        if (!cancelled) {
          if (data == null) {
            setDocumentBlame(null);
            setDocumentBlameUnavailable(true);
            return;
          }
          setDocumentBlame(data);
        }
      } catch (err) {
        if (!cancelled) {
          setDocumentBlame(null);
          setDocumentBlameError(String(err?.message ?? "Failed to load document blame."));
        }
      } finally {
        if (!cancelled) setDocumentBlameLoading(false);
      }
    }

    loadDocumentBlame();
    return () => {
      cancelled = true;
    };
  }, [docBlameCapable, filePath, owner, repo, resolvedRef]);

  const selectedCommit =
    (Array.isArray(historyRows)
      ? historyRows.find((row) => commitRowSha(row) === selectedRevision)
      : null) ??
    historyRows?.[0] ??
    null;

  const blameSegments = Array.isArray(documentBlame?.segments)
    ? documentBlame.segments
    : [];
  const [fallbackDocumentText, setFallbackDocumentText] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadFallbackDocumentText() {
      if (
        !docBlameCapable ||
        !documentBlameUnavailable ||
        getFileExtension(filePath) !== "docx"
      ) {
        setFallbackDocumentText("");
        return;
      }

      const bytes = previewQ.bytes?.length ? previewQ.bytes : fileBytes;
      if (!bytes?.length) {
        setFallbackDocumentText("");
        return;
      }

      try {
        const text = await extractDocxPlainText(bytes);
        if (!cancelled) setFallbackDocumentText(String(text ?? ""));
      } catch {
        if (!cancelled) setFallbackDocumentText("");
      }
    }

    loadFallbackDocumentText();
    return () => {
      cancelled = true;
    };
  }, [
    docBlameCapable,
    documentBlameUnavailable,
    fileBytes,
    filePath,
    previewQ.bytes,
  ]);

  const fallbackDocumentBlameRows = useMemo(() => {
    if (!fallbackDocumentText) return [];
    return [
      {
        id: "fallback-document",
        kind: "document",
        text: fallbackDocumentText,
        orderIndex: 0,
        commitSha: commitRowSha(selectedCommit),
        shortSha: commitRowSha(selectedCommit).slice(0, 8),
        author: commitRowAuthor(selectedCommit),
        message: commitRowMessage(selectedCommit),
        timestamp: commitRowTimestamp(selectedCommit),
      },
    ];
  }, [fallbackDocumentText, selectedCommit]);

  if (docBlameCapable && !documentBlameUnavailable) {
    const blameRowsForViewer = blameSegments;
    return (
      <div className="overflow-hidden border border-(--color-light-card-border) bg-(--color-light-card-bg) dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
        {documentBlameLoading ? (
          <p className="px-4 py-4 text-sm text-muted dark:text-dark-muted">
            Loading document blame…
          </p>
        ) : documentBlameError ? (
          <div className="m-4 rounded-md border border-(--color-light-error-border) bg-(--color-light-error-bg) p-4 text-sm text-(--color-light-error-text) dark:border-(--color-dark-error-border) dark:bg-(--color-dark-error-bg) dark:text-(--color-dark-error-text)">
            {documentBlameError}
          </div>
        ) : !blameRowsForViewer.length ? (
          <div className="space-y-4 p-4">
            <p className="text-sm text-muted dark:text-dark-muted">
              No document blame segments were returned for this revision.
            </p>
          </div>
        ) : (
          <BlameMode
            blameData={blameRowsForViewer}
            fileBytes={previewQ.bytes?.length ? previewQ.bytes : fileBytes}
            filePath={filePath}
            fallbackMeta={
              selectedCommit
                ? {
                    commitSha: commitRowSha(selectedCommit),
                    author: commitRowAuthor(selectedCommit),
                    message: commitRowMessage(selectedCommit),
                    timestamp: commitRowTimestamp(selectedCommit),
                  }
                : null
            }
          />
        )}
      </div>
    );
  }

  if (docBlameCapable && documentBlameUnavailable && fallbackDocumentBlameRows.length) {
    return (
      <div className="overflow-hidden border border-(--color-light-card-border) bg-(--color-light-card-bg) dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
        <BlameMode
          blameData={fallbackDocumentBlameRows}
          fileBytes={previewQ.bytes?.length ? previewQ.bytes : fileBytes}
          filePath={filePath}
          fallbackMeta={
            selectedCommit
              ? {
                  commitSha: commitRowSha(selectedCommit),
                  author: commitRowAuthor(selectedCommit),
                  message: commitRowMessage(selectedCommit),
                  timestamp: commitRowTimestamp(selectedCommit),
                }
              : null
          }
        />
      </div>
    );
  }

  if (docBlameCapable && documentBlameUnavailable) {
    return (
      <div className="space-y-4 border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          Document blame data is unavailable for this revision, so the original
          document is shown without converting it into extracted text.
        </div>
        {previewQ.bytes?.length || fileBytes?.length ? (
          <OverviewMode
            owner={owner}
            repo={repo}
            branch={resolvedRef}
            fileBytes={previewQ.bytes?.length ? previewQ.bytes : fileBytes}
            filePath={filePath}
            fileType=""
            embedded
          />
        ) : (
          <p className="text-sm text-muted dark:text-dark-muted">
            No document preview returned for this revision.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden  border border-(--color-light-card-border) bg-(--color-light-card-bg) dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--color-light-card-border) px-4 py-3 dark:border-(--color-dark-card-border)">
        <div>
          <p className="text-sm font-semibold text-primary dark:text-dark-primary">
            Binary revision tracking
          </p>
          <p className="mt-1 text-xs text-secondary dark:text-dark-secondary">
            Line blame is not meaningful for this file type, so this panel
            tracks revision ownership per commit instead.
          </p>
        </div>
        <button
          type="button"
          className="rounded-md border border-(--color-light-card-border) px-3 py-1.5 text-xs font-medium text-secondary transition-colors hover:bg-(--color-light-card-hover) hover:text-primary dark:border-(--color-dark-card-border) dark:text-dark-secondary dark:hover:bg-(--color-dark-card-hover) dark:hover:text-dark-primary"
          onClick={onOpenHistory}
        >
          Open full history
        </button>
      </div>

      <div className="grid gap-0 xl:grid-cols-[340px_minmax(0,1fr)]">
        <div className="border-b border-(--color-light-card-border) dark:border-(--color-dark-card-border) xl:border-b-0 xl:border-r">
          <div className="border-b border-(--color-light-card-border) px-4 py-3 dark:border-(--color-dark-card-border)">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted dark:text-dark-muted">
              Revision timeline
            </p>
          </div>
          <div className="max-h-[560px] overflow-y-auto">
            {!historyRows?.length ? (
              <p className="px-4 py-4 text-sm text-muted dark:text-dark-muted">
                No revision history returned for this file.
              </p>
            ) : (
              historyRows.map((row, index) => {
                const sha = commitRowSha(row) || `revision-${index}`;
                const active = sha === selectedRevision;
                return (
                  <button
                    key={`${sha}-${index}`}
                    type="button"
                    onClick={() => setSelectedRevision(sha)}
                    className={cn(
                      "w-full border-b border-(--color-light-card-border) px-4 py-3 text-left transition-colors last:border-b-0 dark:border-(--color-dark-card-border)",
                      active
                        ? "bg-(--color-light-card-hover) dark:bg-(--color-dark-card-hover)"
                        : "hover:bg-(--color-light-card-hover) dark:hover:bg-(--color-dark-card-hover)",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px] text-muted dark:text-dark-muted">
                      <span className="font-mono">{sha.slice(0, 12)}</span>
                      <span>
                        {formatRelativeTime(commitRowTimestamp(row), locale)}
                      </span>
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
        </div>

        <div className="space-y-4 p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-(--color-light-card-border) bg-light-app-tertiary px-3 py-2 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted dark:text-dark-muted">
                Selected commit
              </p>
              <p className="mt-1 text-sm font-semibold text-primary dark:text-dark-primary">
                {(selectedCommit &&
                  commitRowSha(selectedCommit).slice(0, 12)) ||
                  String(branch ?? "—")}
              </p>
            </div>
            <div className="rounded-lg border border-(--color-light-card-border) bg-light-app-tertiary px-3 py-2 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted dark:text-dark-muted">
                Author
              </p>
              <p className="mt-1 text-sm font-semibold text-primary dark:text-dark-primary">
                {(selectedCommit && commitRowAuthor(selectedCommit)) || "—"}
              </p>
            </div>
            <div className="rounded-lg border border-(--color-light-card-border) bg-light-app-tertiary px-3 py-2 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted dark:text-dark-muted">
                Updated
              </p>
              <p className="mt-1 text-sm font-semibold text-primary dark:text-dark-primary">
                {(selectedCommit &&
                  formatAbsoluteTime(
                    commitRowTimestamp(selectedCommit),
                    locale,
                  )) ||
                  "—"}
              </p>
            </div>
          </div>

          {selectedCommit ? (
            <div className="rounded-lg border border-(--color-light-card-border) bg-light-app-tertiary px-3 py-2 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted dark:text-dark-muted">
                Commit message
              </p>
              <p className="mt-1 text-sm font-semibold text-primary dark:text-dark-primary">
                {commitRowMessage(selectedCommit) || "—"}
              </p>
            </div>
          ) : null}

          {previewQ.loading ? (
            <p className="text-sm text-muted dark:text-dark-muted">
              Loading binary revision…
            </p>
          ) : previewQ.error ? (
            <div className="rounded-md border border-(--color-light-error-border) bg-(--color-light-error-bg) p-4 text-sm text-(--color-light-error-text) dark:border-(--color-dark-error-border) dark:bg-(--color-dark-error-bg) dark:text-(--color-dark-error-text)">
              {previewQ.error}
            </div>
          ) : previewQ.bytes?.length ? (
            <OverviewMode
              owner={owner}
              repo={repo}
              branch={resolvedRef}
              fileBytes={previewQ.bytes}
              filePath={filePath}
              fileType=""
              embedded
            />
          ) : fileBytes?.length ? (
            <OverviewMode
              owner={owner}
              repo={repo}
              branch={branch}
              fileBytes={fileBytes}
              filePath={filePath}
              fileType=""
              embedded
            />
          ) : (
            <p className="text-sm text-muted dark:text-dark-muted">
              No preview returned for this binary revision.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function RawSnippetPanel({ owner, repo, blobSha }) {
  const { t } = useTranslation();
  const [text, setText] = useState(
    /** @type {null | string | "binary"} */ (null),
  );
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const bytes = await fetchRepositoryBlobPayload(
          owner,
          repo,
          blobSha.trim(),
        );
        const maybe = tryDecodeUtf8(bytes);
        if (!cancelled) setText(maybe == null ? "binary" : maybe);
      } catch (e) {
        if (!cancelled)
          setErr(String(e?.message ?? t("studentRepo.browser.rawLoadFailed")));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [blobSha, owner, repo, t]);

  if (loading) {
    return (
      <p className="text-xs text-muted dark:text-dark-muted">
        {t("studentRepo.browser.rawLoading")}
      </p>
    );
  }
  if (err) {
    return (
      <div className="rounded-md border border-(--color-light-error-border) bg-(--color-light-error-bg) p-4 text-xs text-(--color-light-error-text) dark:border-(--color-dark-error-border) dark:bg-(--color-dark-error-bg) dark:text-(--color-dark-error-text)">
        {err}
      </div>
    );
  }
  if (text === "binary") {
    return (
      <p className="text-sm text-muted dark:text-dark-muted">
        {t("studentRepo.browser.rawBinary")}
      </p>
    );
  }

  return (
    <pre className="max-h-[min(60vh,640px)] overflow-auto rounded-md border border-(--color-light-card-border) bg-(--color-light-input-bg) p-4 font-mono text-xs text-(--color-light-text-primary) dark:border-(--color-dark-card-border) dark:bg-(--color-dark-input-bg) dark:text-(--color-dark-text-primary)">
      <code>{text ?? ""}</code>
    </pre>
  );
}
