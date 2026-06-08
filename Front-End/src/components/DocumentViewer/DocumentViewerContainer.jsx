import "../../styles/syncfusion-vc-bundle.css";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "../Button";
import DocumentViewerErrorBoundary from "../vcShared/DocumentViewerErrorBoundary";
import DocumentViewerLoading from "../vcShared/DocumentViewerLoading";
import {
  fetchDocumentBlame,
  fetchFileBlame,
  fetchRepositoryCommits,
} from "../../services/versionControlService";
import { getFileExtension } from "../../utils/binaryFileHandlers";
import BlameMode from "./BlameMode";
import OverviewMode from "./OverviewMode";
import { useDocumentLoader } from "./useDocumentLoader";

/**
 * Embed anywhere (admin / teacher / student shells) via `<DocumentViewerContainer ... />`.
 *
 * When `blobSha` is set, file bytes come from the MinIO-backed object route (binary-safe).
 * Otherwise falls back to `REPO_FILE_AT_REF` when the gateway implements it.
 */
export default function DocumentViewerContainer({
  owner,
  repo,
  filePath,
  branch = "main",
  blobSha = null,
}) {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState(
    /** @type {"overview" | "blame"} */ ("overview"),
  );
  const [blameLines, setBlameLines] = useState([]);
  const [blameBusy, setBlameBusy] = useState(false);
  const [blameErr, setBlameErr] = useState(null);
  const [fallbackMeta, setFallbackMeta] = useState(null);
  const ext =
    typeof filePath === "string" ? getFileExtension(filePath) : "";
  const supportsDocumentBlame = ext === "docx" || ext === "pdf";

  const { bytes, loading, error, reload } = useDocumentLoader({
    owner,
    repo,
    filePath,
    branch,
    blobSha,
    enabled:
      Boolean(owner && repo && typeof filePath === "string" && filePath.trim() !== ""),
  });

  useEffect(() => {
    let cancelled = false;
    async function hydrateBlame() {
      setBlameErr(null);
      if (viewMode !== "blame" || !bytes) {
        setBlameLines([]);
        setFallbackMeta(null);
        return;
      }
      setBlameBusy(true);
      try {
        const documentBlame = supportsDocumentBlame
          ? await fetchDocumentBlame(owner, repo, filePath, branch)
          : null;
        if (supportsDocumentBlame && !documentBlame?.segments?.length) {
          try {
            const commits = await fetchRepositoryCommits(owner, repo, {
              path: filePath,
              ref: branch,
              limit: 1,
            });
            const latest = Array.isArray(commits) ? commits[0] : null;
            if (!cancelled) {
              setFallbackMeta(
                latest
                  ? {
                      commitSha: latest.sha ?? latest.id ?? latest.commitSha ?? "",
                      author:
                        latest.author ??
                        latest.authorName ??
                        latest.userName ??
                        "",
                      message:
                        latest.message ??
                        latest.subject ??
                        latest.commitMessage ??
                        "",
                      timestamp:
                        latest.timestamp ??
                        latest.date ??
                        latest.committedDate ??
                        "",
                    }
                  : null,
              );
            }
          } catch {
            if (!cancelled) setFallbackMeta(null);
          }
        } else if (!cancelled) {
          setFallbackMeta(null);
        }
        const rows = supportsDocumentBlame
          ? (documentBlame?.segments ?? [])
          : await fetchFileBlame(owner, repo, filePath, branch);
        if (!cancelled)
          setBlameLines(Array.isArray(rows) ? rows : []);
      } catch (e) {
        if (!cancelled) {
          setBlameErr(String(e.message ?? ""));
          setBlameLines([]);
        }
      } finally {
        if (!cancelled) setBlameBusy(false);
      }
    }
    hydrateBlame();
    return () => {
      cancelled = true;
    };
  }, [viewMode, owner, repo, filePath, branch, bytes, supportsDocumentBlame]);

  if (!owner || !repo || !String(filePath ?? "").trim()) {
    return (
      <div className="rounded-2xl border border-light-divider bg-(--color-light-card-bg) p-6 text-sm text-muted dark:border-dark-divider dark:bg-(--color-dark-card-bg) dark:text-dark-muted">
        {t("documentViewer.missing")}
      </div>
    );
  }

  return (
    <DocumentViewerErrorBoundary>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2 rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-2 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
            <Button
              type="button"
              variant={viewMode === "overview" ? "primary" : "secondary"}
              onClick={() => setViewMode("overview")}
            >
              {t("documentViewer.modes.overview")}
            </Button>
            <Button
              type="button"
              variant={viewMode === "blame" ? "primary" : "secondary"}
              onClick={() => setViewMode("blame")}
            >
              {t("documentViewer.modes.blame")}
            </Button>
          </div>
          <button
            type="button"
            className="text-[11px] font-semibold text-(--color-light-text-muted) underline-offset-4 hover:text-light-text-secondary hover:underline dark:text-dark-text-muted"
            onClick={() => reload()}
          >
            {t("documentViewer.reload")}
          </button>
        </div>

        {loading ?
          <DocumentViewerLoading />
        : error ?
          <div className="rounded-2xl border border-light-error-border bg-light-error-bg p-6 text-xs text-light-error-text dark:border-dark-error-border dark:bg-dark-error-bg dark:text-dark-error-text">
            {error}
          </div>
        : viewMode === "overview" ?
          bytes ?
            <OverviewMode
              owner={owner}
              repo={repo}
              branch={branch}
              fileBytes={bytes}
              filePath={filePath}
              fileType={ext}
            />
          : null

        : viewMode === "blame" ?
          <>
            {blameBusy ?
              <DocumentViewerLoading />
            : blameErr ?
              <div className="rounded-2xl border border-light-error-border bg-light-error-bg p-6 text-xs text-light-error-text dark:border-dark-error-border dark:bg-dark-error-bg dark:text-dark-error-text">
                {blameErr}
              </div>
            : bytes ?
              <BlameMode
                blameData={blameLines}
                fileBytes={bytes}
                filePath={filePath}
                fallbackMeta={fallbackMeta}
              />
            : null}
          </>
        : null}
      </div>
    </DocumentViewerErrorBoundary>
  );
}
