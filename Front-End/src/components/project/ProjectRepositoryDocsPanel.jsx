import { useQuery } from "@tanstack/react-query";
import { html } from "diff2html/lib-esm/diff2html.js";
import {
  ChevronRight,
  CheckCircle2,
  File,
  FileCheck2,
  Folder,
  GitCompare,
  History,
  ListTree,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import "diff2html/bundles/css/diff2html.min.css";
import "../../styles/syncfusion-vc-bundle.css";
import Button from "../Button";
import Checkbox from "../Checkbox";
import DocumentViewerContainer from "../DocumentViewer/DocumentViewerContainer";
import Field from "../Field";
import TableToolbar from "../TableToolbar";
import DocumentViewerLoading from "../vcShared/DocumentViewerLoading";
import { cn } from "../../lib/utils";
import { generateUnifiedDiff } from "../../services/diffService";
import {
  fetchRepositoryCompare,
  fetchRepositoryFileUtf8ForDiff,
} from "../../services/versionControlService";
import {
  useVcRepository,
  useVcRepositoryCommits,
  useVcRepositoryContents,
  useVcRepositoryTree,
} from "../../services/useApi";
import { tryDecodeUtf8 } from "../../utils/binaryFileHandlers";

const SURFACE_CARD =
  "rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)";
const SURFACE_INSET =
  "rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary";

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

function nodeBlob(entry) {
  return Boolean(
    entry.type === "blob" ||
      entry.type === "file" ||
      (!nodeDir(entry) && !entry.children),
  );
}

function joinPath(prefix, name) {
  const p = String(prefix ?? "").replace(/^\/+|\/+$/g, "");
  const n = String(name ?? "").replace(/^\/+/, "");
  if (!p) return n;
  if (!n) return p;
  return `${p}/${n}`;
}

function escapeHtmlBasic(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function plainToReaderHtml(text) {
  const raw = text ?? "";
  const blocks = raw.split(/\n\n+/).filter((b) => b.length > 0);
  const body =
    blocks.length ?
      blocks
        .map((block) =>
          `<p>${escapeHtmlBasic(block).replace(/\n/g, "<br/>")}</p>`,
        )
        .join("")
    : `<p>${escapeHtmlBasic(raw)}</p>`;
  return body;
}

function isLikelyMarkdownOrText(filename) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return ["md", "txt", "markdown", "rst", "tex"].includes(ext);
}

function compareFilePath(row) {
  return (
    row.path ??
    row.filename ??
    row.file ??
    row.name ??
    ""
  ).trim();
}

function compareFileStatus(row) {
  return (
    row.status ??
    row.state ??
    row.changeType ??
    ""
  ).trim();
}

function extractTextFromContentsResponse(data) {
  if (!data || typeof data !== "object") return null;
  if (data.encoding === "base64" && typeof data.content === "string") {
    try {
      const bin = atob(String(data.content).replace(/\s/g, ""));
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return tryDecodeUtf8(bytes);
    } catch {
      return null;
    }
  }
  if (typeof data.content === "string") return data.content;
  return null;
}

/** Side-by-side / unified compare for selected path between refs. */
function RepositoryCompareDiff({
  unified,
  viewMode,
  onViewModeChange,
  loading,
  errorKey,
  noneKey,
}) {
  const hostRef = useRef(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!hostRef.current || !unified) return;
    const format =
      viewMode === "split" ? "side-by-side" : "line-by-line";
    const out = html(unified, {
      drawFileList: false,
      matching: "lines",
      outputFormat: format,
    });
    hostRef.current.innerHTML = out ?? "";
  }, [unified, viewMode]);

  return (
    <div className="rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
      <div className="flex flex-wrap items-center justify-end gap-2 border-b border-light-divider px-3 py-2 dark:border-dark-divider">
        <Button
          type="button"
          variant={viewMode === "split" ? "primary" : "secondary"}
          onClick={() => onViewModeChange("split")}
          className="h-8"
        >
          {t("pullRequests.diff.split")}
        </Button>
        <Button
          type="button"
          variant={viewMode === "unified" ? "primary" : "secondary"}
          onClick={() => onViewModeChange("unified")}
          className="h-8"
        >
          {t("pullRequests.diff.unified")}
        </Button>
      </div>
      <div className="p-2">
        {loading ?
          <DocumentViewerLoading className="min-h-40" />
        : errorKey ?
          <div className="rounded-xl border border-(--color-light-error-border) bg-(--color-light-error-bg) p-3 text-xs text-(--color-light-error-text) dark:border-(--color-dark-error-border) dark:bg-(--color-dark-error-bg) dark:text-(--color-dark-error-text)">
            {t(errorKey)}
          </div>
        : unified ?
          <div
            ref={hostRef}
            className="max-h-[min(70vh,720px)] overflow-auto [&_.d2h-files-diff]:rounded-xl [&_.d2h-files-diff]:border [&_.d2h-files-diff]:border-light-divider dark:[&_.d2h-files-diff]:border-dark-divider [&_.d2h-file-wrapper]:overflow-hidden [&_.d2h-file-wrapper]:rounded-xl"
          />
        : <div className="px-3 py-4 text-sm text-muted dark:text-dark-muted">
            {t(noneKey)}
          </div>}
      </div>
    </div>
  );
}

/**
 * Git-like documentation browser backed by VC gateway routes from `apiEndpoint.md` §5.6:
 * tree, file bytes + blame viewer, commits, range compare + diff preview.
 *
 * Uses Syncfusion Rich Text Editor read-only surface for readable text/markdown previews.
 *
 * @param {{ owner?: string; repo?: string; finalFileName?: string; onUseAsFinalFile?: (payload: { path: string; ref: string }) => void; savingFinalFile?: boolean }} props
 */
export default function ProjectRepositoryDocsPanel({
  owner,
  repo,
  finalFileName = "",
  onUseAsFinalFile,
  savingFinalFile = false,
}) {
  const { t } = useTranslation();

  const { data: repoMeta } = useVcRepository(owner, repo, {
    notifyOnError: false,
    enabled: Boolean(owner && repo),
  });

  const defaultRef =
    repoMeta?.default_branch ??
    repoMeta?.defaultBranch ??
    repoMeta?.defaultBranchName ??
    "main";

  const [ref, setRef] = useState(String(defaultRef));
  useEffect(() => {
    setRef(String(defaultRef));
  }, [defaultRef]);

  const [workspaceTab, setWorkspaceTab] = useState(
    /** @type {"browse" | "history" | "compare"} */ ("browse"),
  );
  const [treePath, setTreePath] = useState("");
  const [selectedFilePath, setSelectedFilePath] = useState("");

  const [readerMode, setReaderMode] = useState(false);

  const [commitsForPathOnly, setCommitsForPathOnly] = useState(false);

  const [compareHead, setCompareHead] = useState("");
  const [compareBase, setCompareBase] = useState("");
  const [compareSpec, setCompareSpec] = useState({
    kick: 0,
    base: "",
    head: "",
  });
  const [compareSelectedPath, setCompareSelectedPath] = useState("");
  const [diffViewMode, setDiffViewMode] = useState(
    /** @type {"split" | "unified"} */ ("split"),
  );

  useEffect(() => {
    setTreePath("");
    setSelectedFilePath("");
    setCompareSelectedPath("");
    setCompareSpec({ kick: 0, base: "", head: "" });
  }, [owner, repo]);

  const treeParams = useMemo(() => ({ ref, path: treePath }), [ref, treePath]);
  const treeQ = useVcRepositoryTree(owner, repo, treeParams, {
    notifyOnError: false,
    enabled: Boolean(owner && repo && workspaceTab === "browse"),
  });

  const rawTree = unwrapTreeNodes(treeQ.data);
  const treeRows = useMemo(() => {
    const copy = [...rawTree];
    copy.sort((a, b) => {
      const da = nodeDir(a) ? 0 : 1;
      const db = nodeDir(b) ? 0 : 1;
      if (da !== db) return da - db;
      return nodeLabel(a).localeCompare(nodeLabel(b));
    });
    return copy;
  }, [rawTree]);

  const commitsScopePath =
    commitsForPathOnly && selectedFilePath ? selectedFilePath : "";

  const commitsQ = useVcRepositoryCommits(
    owner,
    repo,
    {
      path: commitsScopePath,
      ref,
      limit: 50,
    },
    {
      notifyOnError: false,
      enabled: Boolean(owner && repo && workspaceTab === "history"),
    },
  );

  const commits = useMemo(() => {
    const data = commitsQ.data;
    return Array.isArray(data) ? data : [];
  }, [commitsQ.data]);

  const compareEnabled =
    workspaceTab === "compare" &&
    Boolean(owner && repo) &&
    compareSpec.kick > 0 &&
    Boolean(compareSpec.base && compareSpec.head);

  const compareQ = useQuery({
    queryKey: [
      "vc",
      "compare-panel",
      owner,
      repo,
      compareSpec.base,
      compareSpec.head,
      compareSpec.kick,
    ],
    queryFn: () =>
      fetchRepositoryCompare(owner, repo, compareSpec.base, compareSpec.head),
    enabled: compareEnabled,
  });

  const compareFiles = useMemo(() => {
    const data = compareQ.data ?? {};
    const files = data.files ?? data.Files;
    return Array.isArray(files) ? files : [];
  }, [compareQ.data]);

  const [diffUnified, setDiffUnified] = useState("");
  const [diffLoading, setDiffLoading] = useState(false);
  const [diffError, setDiffError] = useState(false);

  useEffect(() => {
    if (
      !compareSelectedPath ||
      !compareSpec.base ||
      !compareSpec.head ||
      !owner ||
      !repo
    ) {
      setDiffUnified("");
      return;
    }
    let cancelled = false;
    (async () => {
      setDiffLoading(true);
      setDiffError(false);
      setDiffUnified("");
      try {
        const [a, b] = await Promise.all([
          fetchRepositoryFileUtf8ForDiff(
            owner,
            repo,
            compareSelectedPath,
            compareSpec.base,
          ),
          fetchRepositoryFileUtf8ForDiff(
            owner,
            repo,
            compareSelectedPath,
            compareSpec.head,
          ),
        ]);
        if (cancelled) return;
        if (a == null || b == null) {
          setDiffError(true);
          return;
        }
        const patch = generateUnifiedDiff(
          a ?? "",
          b ?? "",
          compareSelectedPath || "file",
        );
        setDiffUnified(patch ?? "");
      } catch {
        if (!cancelled) setDiffError(true);
      } finally {
        if (!cancelled) setDiffLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [compareSelectedPath, compareSpec.base, compareSpec.head, owner, repo]);

  const readerQuery = useVcRepositoryContents(
    owner,
    repo,
    selectedFilePath,
    { ref },
    {
      notifyOnError: false,
      enabled:
        Boolean(
          owner &&
            repo &&
            readerMode &&
            selectedFilePath &&
            isLikelyMarkdownOrText(selectedFilePath),
        ) && workspaceTab === "browse",
    },
  );

  const readerPlain = useMemo(() => {
    if (!readerQuery.data) return "";
    const text =
      readerQuery.data && typeof readerQuery.data === "object"
        ? extractTextFromContentsResponse(readerQuery.data)
        : null;
    return text ?? "";
  }, [readerQuery.data]);

  const readerHtml =
    readerMode && readerPlain ? plainToReaderHtml(readerPlain) : "";
  const selectedIsFinalFile =
    Boolean(selectedFilePath) && selectedFilePath === finalFileName;

  function runCompareSubmit() {
    const b = compareBase.trim();
    const h = compareHead.trim();
    if (!b || !h) return;
    setCompareSelectedPath("");
    setCompareSpec((prev) => ({
      kick: prev.kick + 1,
      base: b,
      head: h,
    }));
  }

  function onTreeEntryClick(entry) {
    const name = nodeLabel(entry);
    const dir = nodeDir(entry);
    const full =
      typeof entry.path === "string" && entry.path.trim() ?
        entry.path.trim().replace(/^\/+/, "")
      : joinPath(treePath, name);

    if (dir) {
      setTreePath(full);
      return;
    }
    if (nodeBlob(entry)) {
      setSelectedFilePath(full);
    }
  }

  const crumbSegments = treePath ?
    [{ label: t("adminProjectWorkspace.documents.rootCrumb"), path: "" }]
      .concat(
        treePath
          .split("/")
          .filter(Boolean)
          .map((segment, idx, arr) => ({
            label: segment,
            path: arr.slice(0, idx + 1).join("/"),
          })),
      )
  : [{ label: t("adminProjectWorkspace.documents.rootCrumb"), path: "" }];

  if (!owner?.trim() || !repo?.trim()) {
    return (
      <div className={`${SURFACE_CARD} p-4 md:p-5`}>
        <p className="text-sm font-semibold text-primary dark:text-dark-primary">
          {t("adminProjectWorkspace.documents.noRepoTitle")}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted dark:text-dark-muted">
          {t("adminProjectWorkspace.documents.noRepoHint")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <section className={`${SURFACE_CARD} overflow-hidden p-0`}>
        <TableToolbar className="rounded-none! border-0 border-b border-(--color-light-card-border) bg-(--color-light-card-bg)! dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)!">
          <TableToolbar.Row justify="start">
            <TableToolbar.ViewTabs
              value={workspaceTab}
              onValueChange={(v) => setWorkspaceTab(v)}
              tabs={[
                {
                  id: "browse",
                  label: t("adminProjectWorkspace.documents.tabBrowse"),
                  icon: (
                    <ListTree
                      className="size-3.5 shrink-0"
                      strokeWidth={2}
                      aria-hidden
                    />
                  ),
                },
                {
                  id: "history",
                  label: t("adminProjectWorkspace.documents.tabHistory"),
                  icon: (
                    <History
                      className="size-3.5 shrink-0"
                      strokeWidth={2}
                      aria-hidden
                    />
                  ),
                },
                {
                  id: "compare",
                  label: t("adminProjectWorkspace.documents.tabCompare"),
                  icon: (
                    <GitCompare
                      className="size-3.5 shrink-0"
                      strokeWidth={2}
                      aria-hidden
                    />
                  ),
                },
              ]}
            />
          </TableToolbar.Row>
        </TableToolbar>
        <div className="border-b border-(--color-light-card-border) px-4 py-3 dark:border-(--color-dark-card-border) md:flex md:flex-wrap md:items-end md:gap-4 md:px-5">
          <div className="min-w-[180px] max-w-[20rem]">
            <Field label={t("adminProjectWorkspace.documents.refLabel")} id="proj-docs-ref">
              <input
                id="proj-docs-ref"
                type="text"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                placeholder={t("adminProjectWorkspace.documents.refPlaceholder")}
                className="h-8 w-full rounded-xl border border-(--color-light-input-border) bg-(--color-light-input-bg) px-3.5 py-1.5 text-xs text-(--color-light-text-primary) outline-none placeholder:text-(--color-light-input-placeholder) focus:border-(--color-light-input-border-focus) focus:ring-2 focus:ring-blue-500/15 dark:border-dark-input-border dark:bg-(--color-dark-input-bg) dark:text-(--color-dark-text-primary) dark:placeholder:text-(--color-dark-input-placeholder) dark:focus:border-(--color-dark-input-border-focus) dark:focus:ring-blue-400/15"
              />
            </Field>
          </div>
          {workspaceTab === "browse" && selectedFilePath ?
            <div className="mt-3 flex flex-wrap items-center gap-2 md:mt-0">
              <span className="text-[11px] font-semibold text-muted dark:text-dark-muted">
                {t("adminProjectWorkspace.documents.previewMode")}
              </span>
              <div className="flex flex-wrap gap-2 rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-1 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
                <Button
                  type="button"
                  variant={!readerMode ? "primary" : "secondary"}
                  className="h-8 px-3 text-xs"
                  onClick={() => setReaderMode(false)}
                >
                  {t("adminProjectWorkspace.documents.modeRepository")}
                </Button>
                <Button
                  type="button"
                  variant={readerMode ? "primary" : "secondary"}
                  className="h-8 px-3 text-xs"
                  disabled={!isLikelyMarkdownOrText(selectedFilePath)}
                  onClick={() => setReaderMode(true)}
                  title={
                    !isLikelyMarkdownOrText(selectedFilePath)
                      ? t("adminProjectWorkspace.documents.readerDisabledHint")
                      : undefined
                  }
                >
                  {t("adminProjectWorkspace.documents.modeSyncfusionReader")}
                </Button>
              </div>
              {onUseAsFinalFile ? (
                <Button
                  type="button"
                  variant={selectedIsFinalFile ? "secondary" : "primary"}
                  className="h-8 gap-2 px-3 text-xs"
                  disabled={savingFinalFile || selectedIsFinalFile}
                  icon={
                    selectedIsFinalFile ? (
                      <CheckCircle2 className="size-3.5" aria-hidden />
                    ) : (
                      <FileCheck2 className="size-3.5" aria-hidden />
                    )
                  }
                  onClick={() =>
                    onUseAsFinalFile({
                      path: selectedFilePath,
                      ref,
                    })
                  }
                >
                  {selectedIsFinalFile ? "Final result file" : "Set as final result"}
                </Button>
              ) : null}
            </div>
          : null}
        </div>

        {workspaceTab === "browse" ?
          <div className="grid gap-4 p-4 md:grid-cols-[minmax(0,340px)_minmax(0,1fr)] md:p-5">
            <div className="flex min-h-[280px] flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-semibold text-muted dark:text-dark-muted">
                  {t("adminProjectWorkspace.documents.treeHeading")}
                </p>
              </div>
              <nav
                className="flex flex-wrap items-center gap-1 text-xs text-muted dark:text-dark-muted"
                aria-label={t("adminProjectWorkspace.documents.breadcrumbsAria")}
              >
                {crumbSegments.map((c, idx) => (
                  <span key={`${c.path}-${idx}`} className="inline-flex items-center gap-1">
                    {idx ? (
                      <ChevronRight className="size-3 shrink-0" aria-hidden />
                    ) : null}
                    <button
                      type="button"
                      className={
                        c.path === treePath ?
                          "font-semibold text-primary dark:text-dark-primary"
                        : "underline-offset-4 hover:text-primary hover:underline dark:hover:text-dark-primary"
                      }
                      onClick={() => {
                        setTreePath(c.path);
                        setSelectedFilePath("");
                      }}
                    >
                      {c.label}
                    </button>
                  </span>
                ))}
              </nav>
              <div className={`${SURFACE_INSET} flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2`}>
                {treeQ.isLoading ?
                  <p className="px-2 py-3 text-xs text-muted dark:text-dark-muted">
                    {t("adminProjectWorkspace.documents.treeLoading")}
                  </p>
                : treeRows.length ?
                  treeRows.map((entry) => {
                    const lbl = nodeLabel(entry);
                    const dir = nodeDir(entry);
                    return (
                      <button
                        key={`${lbl}-${entry.sha ?? entry.path ?? ""}`}
                        type="button"
                        onClick={() => onTreeEntryClick(entry)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs transition-colors",
                          "text-(--color-light-text-primary) hover:bg-light-app-secondary dark:text-(--color-dark-text-primary) dark:hover:bg-dark-app-secondary",
                        )}
                      >
                        {dir ?
                          <Folder
                            className="size-4 shrink-0 text-(--color-light-text-muted) dark:text-(--color-dark-text-muted)"
                            strokeWidth={2}
                            aria-hidden
                          />
                        : <File
                            className="size-4 shrink-0 text-(--color-light-text-muted) dark:text-(--color-dark-text-muted)"
                            strokeWidth={2}
                            aria-hidden
                          />}
                        <span className="min-w-0 flex-1 truncate font-mono">
                          {lbl}
                        </span>
                      </button>
                    );
                  })
                : <p className="px-2 py-3 text-xs text-muted dark:text-dark-muted">
                    {t("adminProjectWorkspace.documents.treeEmpty")}
                  </p>}
              </div>
            </div>

            <div className="min-h-[280px]">
              {!selectedFilePath ?
                <div className={`${SURFACE_INSET} flex h-full items-center justify-center p-6`}>
                  <p className="text-center text-sm text-muted dark:text-dark-muted">
                    {t("adminProjectWorkspace.documents.selectFile")}
                  </p>
                </div>
              : readerMode && isLikelyMarkdownOrText(selectedFilePath) ?
                <div className="flex flex-col gap-3 rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
                  <p className="text-[11px] font-semibold text-muted dark:text-dark-muted">
                    {t("adminProjectWorkspace.documents.syncfusionBanner")}
                  </p>
                  {readerQuery.isLoading ?
                    <DocumentViewerLoading className="min-h-52" />
                  : readerPlain ?
                    <div
                      className="max-h-[min(60vh,520px)] overflow-auto rounded-xl border border-(--color-light-card-border) bg-(--color-light-input-bg) p-4 text-sm leading-relaxed text-(--color-light-text-primary) dark:border-(--color-dark-card-border) dark:bg-(--color-dark-input-bg) dark:text-(--color-dark-text-primary) [&_p:last-child]:mb-0 [&_p]:mb-3"
                      dangerouslySetInnerHTML={{ __html: readerHtml }}
                    />
                  : <p className="text-sm text-muted dark:text-dark-muted">
                      {t("adminProjectWorkspace.documents.readerEmpty")}
                    </p>}
                </div>
              : <DocumentViewerContainer
                  owner={owner}
                  repo={repo}
                  filePath={selectedFilePath}
                  branch={ref}
                />}
            </div>
          </div>
        : workspaceTab === "history" ?
          <div className="space-y-4 p-4 md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-base font-semibold text-primary dark:text-dark-primary">
                {t("adminProjectWorkspace.documents.historyTitle")}
              </p>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={commitsForPathOnly}
                  disabled={!selectedFilePath}
                  onChange={(e) =>
                    setCommitsForPathOnly(e.target.checked)
                  }
                  label={t("adminProjectWorkspace.documents.filterByFile")}
                  id="docs-commits-scope"
                />
              </div>
            </div>
            {!commitsScopePath ?
              <p className="text-xs text-muted dark:text-dark-muted">
                {t("adminProjectWorkspace.documents.historyAllHint")}
              </p>
            : <p className="rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary px-3 py-2 text-xs text-secondary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-secondary">
                {t("adminProjectWorkspace.documents.historyPathHint")}{" "}
                <span className="font-mono font-semibold text-primary dark:text-dark-primary">
                  {commitsScopePath}
                </span>
              </p>
            }
            {commitsQ.isLoading ?
              <DocumentViewerLoading className="min-h-48" />
            : commits.length ?
              <ul className="max-h-[min(70vh,560px)] space-y-2 overflow-y-auto">
                {commits.map((row, idx) => {
                  const sha =
                    row.sha ??
                    row.id ??
                    row.commitSha ??
                    row.oid ??
                    `row-${idx}`;
                  const msg =
                    row.message ??
                    row.commitMessage ??
                    row.subject ??
                    "—";
                  const author =
                    row.author ??
                    row.authorName ??
                    row.committer ??
                    "";
                  return (
                    <li
                      key={String(sha)}
                      className={`${SURFACE_INSET} px-4 py-3`}
                    >
                      <p className="font-mono text-[11px] font-semibold text-muted dark:text-dark-muted">
                        {String(sha).slice(0, 12)}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-primary dark:text-dark-primary">
                        {String(msg)}
                      </p>
                      {author ?
                        <p className="mt-1 text-xs text-muted dark:text-dark-muted">
                          {String(author)}
                        </p>
                      : null}
                    </li>
                  );
                })}
              </ul>
            : <p className="text-sm text-muted dark:text-dark-muted">
                {t("adminProjectWorkspace.documents.historyEmpty")}
              </p>}
          </div>
        : <div className="space-y-4 p-4 md:p-5">
            <div className="flex flex-wrap items-start gap-4">
              <div className="min-w-[140px] max-w-[12rem] flex-1">
                <Field
                  label={t("adminProjectWorkspace.documents.compareBase")}
                  id="compare-base-ref"
                >
                  <input
                    id="compare-base-ref"
                    type="text"
                    value={compareBase}
                    onChange={(e) => setCompareBase(e.target.value)}
                    autoComplete="off"
                    className="h-8 w-full rounded-xl border border-(--color-light-input-border) bg-(--color-light-input-bg) px-3.5 py-1.5 text-xs text-(--color-light-text-primary) outline-none placeholder:text-(--color-light-input-placeholder) focus:border-(--color-light-input-border-focus) focus:ring-2 focus:ring-blue-500/15 dark:border-dark-input-border dark:bg-(--color-dark-input-bg) dark:text-(--color-dark-text-primary) dark:placeholder:text-(--color-dark-input-placeholder) dark:focus:border-(--color-dark-input-border-focus) dark:focus:ring-blue-400/15"
                  />
                </Field>
              </div>
              <div className="min-w-[140px] max-w-[12rem] flex-1">
                <Field
                  label={t("adminProjectWorkspace.documents.compareHead")}
                  id="compare-head-ref"
                >
                  <input
                    id="compare-head-ref"
                    type="text"
                    value={compareHead}
                    onChange={(e) => setCompareHead(e.target.value)}
                    autoComplete="off"
                    className="h-8 w-full rounded-xl border border-(--color-light-input-border) bg-(--color-light-input-bg) px-3.5 py-1.5 text-xs text-(--color-light-text-primary) outline-none placeholder:text-(--color-light-input-placeholder) focus:border-(--color-light-input-border-focus) focus:ring-2 focus:ring-blue-500/15 dark:border-dark-input-border dark:bg-(--color-dark-input-bg) dark:text-(--color-dark-text-primary) dark:placeholder:text-(--color-dark-input-placeholder) dark:focus:border-(--color-dark-input-border-focus) dark:focus:ring-blue-400/15"
                  />
                </Field>
              </div>
              <div className="flex items-end pb-0.5">
                <Button
                  type="button"
                  variant="primary"
                  className="h-8 gap-2"
                  onClick={runCompareSubmit}
                >
                  {t("adminProjectWorkspace.documents.compareLoad")}
                </Button>
              </div>
            </div>
            {compareQ.isLoading ?
              <DocumentViewerLoading className="min-h-48" />
            : compareSpec.kick === 0 ?
              <p className="text-sm text-muted dark:text-dark-muted">
                {t("adminProjectWorkspace.documents.compareInstructions")}
              </p>
            : compareQ.isError ?
              <p className="text-sm text-(--color-light-error-text) dark:text-(--color-dark-error-text)">
                {t("adminProjectWorkspace.documents.compareFailed")}
              </p>
            : compareFiles.length ?
              <>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted dark:text-dark-muted">
                  {t("adminProjectWorkspace.documents.compareFiles")}
                </p>
                <ul className="max-h-52 space-y-1 overflow-y-auto rounded-xl border border-(--color-light-card-border) p-2 dark:border-(--color-dark-card-border)">
                  {compareFiles.map((fileRow, ix) => {
                    const fp = compareFilePath(fileRow);
                    if (!fp) return null;
                    const sel = fp === compareSelectedPath;
                    return (
                      <li key={`${fp}-${ix}`}>
                        <button
                          type="button"
                          onClick={() => setCompareSelectedPath(fp)}
                          className={cn(
                            "flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-xs transition-colors",
                            sel ?
                              "bg-light-app-secondary font-semibold text-primary dark:bg-dark-app-secondary dark:text-dark-primary"
                            : "hover:bg-light-app-secondary/70 dark:hover:bg-dark-app-secondary/70",
                          )}
                        >
                          <span className="min-w-0 flex-1 truncate font-mono">
                            {fp}
                          </span>
                          {compareFileStatus(fileRow) ?
                            <span className="shrink-0 rounded-md border border-(--color-light-card-border) px-1.5 py-0.5 text-[10px] uppercase text-muted dark:border-(--color-dark-card-border) dark:text-dark-muted">
                              {compareFileStatus(fileRow)}
                            </span>
                          : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {!compareSelectedPath ?
                  <p className="text-xs text-muted dark:text-dark-muted">
                    {t("adminProjectWorkspace.documents.comparePickFile")}
                  </p>
                : <RepositoryCompareDiff
                    unified={diffUnified}
                    viewMode={diffViewMode}
                    onViewModeChange={setDiffViewMode}
                    loading={diffLoading}
                    errorKey={
                      diffError ? "adminProjectWorkspace.documents.diffBinary" : null
                    }
                    noneKey={
                      diffError ?
                        "adminProjectWorkspace.documents.diffBinary"
                      : "pullRequests.diff.none"
                    }
                  />}
              </>
            : <p className="text-sm text-muted dark:text-dark-muted">
                {t("adminProjectWorkspace.documents.compareEmpty")}
              </p>}
          </div>
        }
      </section>
      <div className="rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary px-4 py-3 text-xs leading-relaxed text-secondary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-secondary">
        <p className="font-semibold text-primary dark:text-dark-primary">
          {t("adminProjectWorkspace.documents.apiFootnoteTitle")}
        </p>
        <p className="mt-2 text-muted dark:text-dark-muted">
          {t("adminProjectWorkspace.documents.apiFootnoteBody")}
        </p>
      </div>
    </div>
  );
}
