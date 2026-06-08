import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { saveAs } from "file-saver";
import { html } from "diff2html/lib-esm/diff2html.js";
import "diff2html/bundles/css/diff2html.min.css";
import {
  fetchPullRequestFileDiff,
  fetchRepositoryBlobPayload,
  fetchRepositoryFileUtf8ForDiff,
} from "../../services/versionControlService";
import { generateUnifiedDiff } from "../../services/diffService";
import { extractDocxPlainText } from "../../services/documentRenderingService";
import Button from "../Button";
import OverviewMode from "../DocumentViewer/OverviewMode";
import DocumentViewerLoading from "../vcShared/DocumentViewerLoading";
import {
  getFileExtension,
  isKnownBinaryExtension,
  tryDecodeUtf8,
} from "../../utils/binaryFileHandlers";

function isDocumentDiffExtension(ext) {
  return ext === "docx" || ext === "doc" || ext === "pdf";
}

function firstString(...values) {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return "";
}

function isAddedStatus(value) {
  return ["added", "a", "create", "created", "create mode"].includes(
    String(value ?? "").trim().toLowerCase(),
  );
}

function isDeletedStatus(value) {
  return ["deleted", "d", "remove", "removed", "deleted file"].includes(
    String(value ?? "").trim().toLowerCase(),
  );
}

async function extractDocumentTextFromBlob(owner, repo, sha, ext) {
  const cleanSha = String(sha ?? "").trim();
  if (!cleanSha) return "";
  const bytes = await fetchRepositoryBlobPayload(owner, repo, cleanSha);
  if ((ext === "docx" || ext === "doc") && bytes?.length) {
    return extractDocxPlainText(bytes);
  }
  return "";
}

/**
 * @param {{
 *   owner: string,
 *   repo: string,
 *   prNumber: string|number,
 *   fileIndex: number,
 *   filePath?: string,
 *   status?: string,
 *   fallbackMeta?: Record<string, unknown>,
 *   fallbackBaseRef?: string,
 *   fallbackHeadRef?: string,
 * }} props
 */
export default function DiffViewer({
  owner,
  repo,
  prNumber,
  fileIndex,
  filePath,
  status,
  fallbackMeta,
  fallbackBaseRef,
  fallbackHeadRef,
}) {
  const { t } = useTranslation();
  const hostRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [errorKey, setErrorKey] = useState(null);
  const [unified, setUnified] = useState("");
  const [binaryMeta, setBinaryMeta] = useState(null);
  const [viewMode, setViewMode] = useState(
    /** @type {"split" | "unified"} */ ("split"),
  );

  useEffect(() => {
    let cancelled = false;

    async function buildFallbackDiff() {
      const path = firstString(
        fallbackMeta?.filename,
        fallbackMeta?.path,
        fallbackMeta?.file?.path,
        fallbackMeta?.filePath,
        filePath,
        "change.txt",
      );
      const ext = getFileExtension(path);
      const st = String(
        status ?? fallbackMeta?.status ?? fallbackMeta?.changeType ?? "",
      ).toLowerCase();
      const oldBlobSha = firstString(
        fallbackMeta?.baseSha,
        fallbackMeta?.oldSha,
        fallbackMeta?.fromSha,
        fallbackMeta?.previousBlobSha,
        fallbackMeta?.oldBlobSha,
        fallbackMeta?.baseBlobSha,
      );
      const newBlobSha = firstString(
        fallbackMeta?.headSha,
        fallbackMeta?.newSha,
        fallbackMeta?.toSha,
        fallbackMeta?.blobSha,
        fallbackMeta?.newBlobSha,
        fallbackMeta?.headBlobSha,
      );

      const documentFile = isDocumentDiffExtension(ext);
      const binary = !documentFile && isKnownBinaryExtension(ext);
      const hasFallbackSource = Boolean(
        oldBlobSha ||
          newBlobSha ||
          (fallbackBaseRef && !isAddedStatus(st)) ||
          (fallbackHeadRef && !isDeletedStatus(st)),
      );
      if (!hasFallbackSource) return false;

      if (binary) {
        setBinaryMeta({
          path,
          fileType: ext,
          hasTextPayload: false,
          status: st,
          baseSha: oldBlobSha,
          headSha: newBlobSha,
        });
        return true;
      }

      let oldContent = "";
      let newContent = "";

      if (!isAddedStatus(st)) {
        oldContent =
          oldBlobSha && documentFile ?
            await extractDocumentTextFromBlob(owner, repo, oldBlobSha, ext)
          : oldBlobSha ?
            tryDecodeUtf8(
              await fetchRepositoryBlobPayload(owner, repo, oldBlobSha),
            )
          : fallbackBaseRef ?
            await fetchRepositoryFileUtf8ForDiff(owner, repo, path, fallbackBaseRef)
          : "";
      }

      if (!isDeletedStatus(st)) {
        newContent =
          newBlobSha && documentFile ?
            await extractDocumentTextFromBlob(owner, repo, newBlobSha, ext)
          : newBlobSha ?
            tryDecodeUtf8(
              await fetchRepositoryBlobPayload(owner, repo, newBlobSha),
            )
          : fallbackHeadRef ?
            await fetchRepositoryFileUtf8ForDiff(owner, repo, path, fallbackHeadRef)
          : "";
      }

      if (oldContent == null || newContent == null) {
        setBinaryMeta({
          path,
          fileType: ext,
          hasTextPayload: false,
          status: st,
          baseSha: oldBlobSha,
          headSha: newBlobSha,
        });
        return true;
      }

      setUnified(generateUnifiedDiff(oldContent, newContent, path) ?? "");
      return true;
    }

    async function run() {
      setLoading(true);
      setErrorKey(null);
      setUnified("");
      setBinaryMeta(null);
      try {
        const data = await fetchPullRequestFileDiff(
          owner,
          repo,
          prNumber,
          fileIndex,
        );
        const path =
          String(data.filePath ?? data.filename ?? filePath ?? "change.txt");
        const ext = getFileExtension(path);
        const baseSha = String(data?.baseSha ?? data?.oldSha ?? data?.fromSha ?? "").trim();
        const headSha = String(data?.headSha ?? data?.newSha ?? data?.toSha ?? "").trim();
        const hasTextPayload =
          data.oldContent != null ||
          data.baseContent != null ||
          data.newContent != null ||
          data.headContent != null;
        const documentWithTextPayload =
          isDocumentDiffExtension(ext) && hasTextPayload;
        const binary =
          !documentWithTextPayload &&
          (isKnownBinaryExtension(ext) ||
            Boolean(data?.binary ?? data?.isBinary ?? data?.binaryFile));

        const st = String(status ?? data.status ?? "").toLowerCase();

        let oldContent =
          data.oldContent != null ?
            String(data.oldContent)
          : String(data.baseContent ?? "");

        let newContent =
          data.newContent != null ?
            String(data.newContent)
          : String(data.headContent ?? "");

        if (isDocumentDiffExtension(ext) && (!oldContent.trim() || !newContent.trim())) {
          const [fallbackOld, fallbackNew] = await Promise.all([
            oldContent.trim() || ["added", "a", "create", "created", "create mode"].includes(st)
              ? Promise.resolve(oldContent)
              : extractDocumentTextFromBlob(owner, repo, baseSha, ext),
            newContent.trim() || ["deleted", "d", "remove", "removed", "deleted file"].includes(st)
              ? Promise.resolve(newContent)
              : extractDocumentTextFromBlob(owner, repo, headSha, ext),
          ]);
          oldContent = fallbackOld ?? "";
          newContent = fallbackNew ?? "";
        }

        if (binary && !oldContent.trim() && !newContent.trim()) {
          if (!cancelled) {
            setBinaryMeta({
              path,
              fileType: ext,
              hasTextPayload,
              status: st,
              baseSha,
              headSha,
            });
          }
          return;
        }

        if (isAddedStatus(st)) {
          oldContent = "";
        } else if (isDeletedStatus(st)) {
          newContent = "";
        }

        const patch = generateUnifiedDiff(oldContent, newContent, path);
        if (!cancelled) setUnified(patch ?? "");
      } catch {
        try {
          const recovered = await buildFallbackDiff();
          if (!recovered && !cancelled) setErrorKey("pullRequests.diff.failed");
        } catch {
          if (!cancelled) setErrorKey("pullRequests.diff.failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [
    owner,
    repo,
    prNumber,
    fileIndex,
    filePath,
    status,
    fallbackMeta,
    fallbackBaseRef,
    fallbackHeadRef,
  ]);

  useEffect(() => {
    if (!hostRef.current || !unified) return;
    const format = viewMode === "split" ? "side-by-side" : "line-by-line";
    const out = html(unified, {
      drawFileList: false,
      matching: "lines",
      outputFormat: format,
    });
    hostRef.current.innerHTML = out ?? "";
  }, [unified, viewMode]);

  return (
    <div className="vc-diff-viewer rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-light-divider px-4 py-3 dark:border-dark-divider">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
          {status ?
            <span className="rounded-full border border-light-divider bg-(--color-light-input-bg) px-3 py-0.5 font-mono uppercase tracking-wide dark:border-dark-divider dark:bg-(--color-dark-input-bg)">
              {status}
            </span>
          : null}
          <span className="truncate font-normal text-muted dark:text-dark-muted">
            {filePath}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {!binaryMeta ? (
            <>
              <Button
                type="button"
                variant={viewMode === "split" ? "primary" : "secondary"}
                onClick={() => setViewMode("split")}
              >
                {t("pullRequests.diff.split")}
              </Button>
              <Button
                type="button"
                variant={viewMode === "unified" ? "primary" : "secondary"}
                onClick={() => setViewMode("unified")}
              >
                {t("pullRequests.diff.unified")}
              </Button>
            </>
          ) : null}
        </div>
      </div>
      <div className="p-2">
        {loading ?
          <DocumentViewerLoading className="min-h-48" />
        : errorKey ?
          <div className="rounded-xl border border-(--color-light-error-border) bg-(--color-light-error-bg) p-4 text-xs text-(--color-light-error-text) dark:border-(--color-dark-error-border) dark:bg-(--color-dark-error-bg) dark:text-(--color-dark-error-text)">
            {t(errorKey)}
          </div>
        : binaryMeta ? (
          <BinaryDiffPanel owner={owner} repo={repo} meta={binaryMeta} />
        ) : unified ?
          <div
            ref={hostRef}
            className="overflow-auto [&_.d2h-files-diff]:rounded-xl [&_.d2h-files-diff]:border [&_.d2h-files-diff]:border-light-divider dark:[&_.d2h-files-diff]:border-dark-divider [&_.d2h-file-wrapper]:overflow-hidden [&_.d2h-file-wrapper]:rounded-xl"
          />
        : <div className="text-sm text-muted dark:text-dark-muted">
            {t("pullRequests.diff.none")}
          </div>}
      </div>
    </div>
  );
}

function BinaryDiffPanel({ owner, repo, meta }) {
  const { t } = useTranslation();
  const [activeRevision, setActiveRevision] = useState(meta?.headSha ? "head" : "base");
  const [state, setState] = useState({ loading: false, bytes: null, error: "" });

  const fileType = getFileExtension(meta?.path ?? "") || meta?.fileType || "";
  const isDocumentFile = fileType === "docx" || fileType === "doc" || fileType === "pdf";
  const revisions = useMemo(
    () =>
      [
        { key: "base", label: "Previous version", sha: String(meta?.baseSha ?? "").trim() },
        { key: "head", label: "Current version", sha: String(meta?.headSha ?? "").trim() },
      ].filter((item) => item.sha),
    [meta?.baseSha, meta?.headSha],
  );
  const activeRevisionKey = revisions.some((item) => item.key === activeRevision)
    ? activeRevision
    : revisions[0]?.key ?? "head";

  useEffect(() => {
    let cancelled = false;
    const current = revisions.find((item) => item.key === activeRevisionKey);
    if (!owner || !repo || !current?.sha) {
      return undefined;
    }

    window.queueMicrotask(() => {
      if (!cancelled) setState({ loading: true, bytes: null, error: "" });
    });
    (async () => {
      try {
        const bytes = await fetchRepositoryBlobPayload(owner, repo, current.sha);
        if (!cancelled) setState({ loading: false, bytes, error: "" });
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

  function downloadCurrent() {
    if (!state.bytes?.length) return;
    const ext = getFileExtension(meta?.path ?? "");
    const stem = String(meta?.path ?? "download").split("/").pop() || "download";
    const suffix = activeRevisionKey === "base" ? "previous" : "current";
    const name = ext
      ? stem.replace(new RegExp(`\\.${ext}$`, "i"), `-${suffix}.${ext}`)
      : `${stem}-${suffix}`;
    saveAs(new Blob([state.bytes]), name);
  }

  return (
    <div className="space-y-3 rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
      <p className="text-sm text-muted dark:text-dark-muted">
        {isDocumentFile
          ? "Document file changed. Text diff is unavailable, so each revision is shown as a preview."
          : "Binary file changed. Text diff is unavailable for this file type."}
      </p>
      <div className="flex flex-wrap gap-2">
        {revisions.map((revision) => (
          <Button
            key={revision.key}
            type="button"
            variant={activeRevisionKey === revision.key ? "primary" : "secondary"}
            onClick={() => setActiveRevision(revision.key)}
          >
            {revision.label}
          </Button>
        ))}
        <Button type="button" variant="secondary" onClick={downloadCurrent} disabled={!state.bytes?.length}>
          {t("documentViewer.overview.download")}
        </Button>
      </div>
      {state.loading ? (
        <DocumentViewerLoading className="min-h-32 border-0" />
      ) : state.error ? (
        <div className="rounded-xl border border-(--color-light-error-border) bg-(--color-light-error-bg) p-4 text-xs text-(--color-light-error-text) dark:border-(--color-dark-error-border) dark:bg-(--color-dark-error-bg) dark:text-(--color-dark-error-text)">
          {state.error}
        </div>
      ) : state.bytes?.length ? (
        <OverviewMode
          owner={owner}
          repo={repo}
          branch={activeRevisionKey}
          embedded
          fileBytes={state.bytes}
          filePath={meta?.path ?? ""}
          fileType=""
        />
      ) : (
        <div className="text-sm text-muted dark:text-dark-muted">No binary preview available.</div>
      )}
    </div>
  );
}
