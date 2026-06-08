import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { saveAs } from "file-saver";
import { renderAsync as renderDocxAsync } from "docx-preview";
import { Download } from "lucide-react";
import Button from "../Button";
import DocumentViewerLoading from "../vcShared/DocumentViewerLoading";
import DocumentNoteOverlay from "./DocumentNoteOverlay";
import {
  extractDocxHtml,
  extractDocxPlainText,
} from "../../services/documentRenderingService";
import {
  getFileExtension,
  isImageExtension,
  isLikelyTextExtension,
  tryDecodeUtf8,
} from "../../utils/binaryFileHandlers";

function isZipMagic(bytes) {
  return bytes?.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}

/**
 * Renders gateway file bytes across common MIME shapes. Embed this in admin / teacher / student routes.
 *
 * DOCX files use a read-only document renderer so repository content displays directly from the fetched bytes.
 *
 * @param {{ fileBytes: Uint8Array, filePath: string, fileType: string }} props
 */
export default function OverviewMode({
  owner,
  repo,
  branch = "main",
  fileBytes,
  filePath,
  fileType,
  embedded = false,
}) {
  const { t } = useTranslation();

  const [plainDocxLoading, setPlainDocxLoading] = useState(false);
  const [plainDocx, setPlainDocx] = useState("");
  const [docxHtml, setDocxHtml] = useState("");

  const ext = fileType || getFileExtension(filePath);

  const blobUrl = useMemo(() => {
    if (!fileBytes?.length) return null;
    return URL.createObjectURL(new Blob([fileBytes]));
  }, [fileBytes]);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  useEffect(() => {
    let cancelled = false;
    async function extract() {
      if (
        (ext === "docx" || ext === "doc") &&
        fileBytes?.length &&
        isZipMagic(fileBytes)
      ) {
        setPlainDocxLoading(true);
        try {
          const [html, text] = await Promise.all([
            extractDocxHtml(fileBytes),
            extractDocxPlainText(fileBytes),
          ]);
          if (!cancelled) {
            setDocxHtml(html ?? "");
            setPlainDocx(text ?? "");
          }
        } catch {
          if (!cancelled) {
            setDocxHtml("");
            setPlainDocx("");
          }
        } finally {
          if (!cancelled) setPlainDocxLoading(false);
        }
      } else if (!cancelled) {
        setDocxHtml("");
        setPlainDocx("");
      }
    }
    extract();
    return () => {
      cancelled = true;
    };
  }, [ext, fileBytes]);

  const onDownload = () => {
    if (!fileBytes?.length) return;
    const name = String(filePath).split("/").pop() || "download.bin";
    saveAs(new Blob([fileBytes]), name);
  };

  if (!fileBytes?.length) return null;

  const textMaybe = tryDecodeUtf8(fileBytes);

  if (ext === "pdf") {
    return (
      <div
        className={
          embedded
            ? "overflow-hidden"
            : "overflow-hidden rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)"
        }
      >
        <iframe
          title={filePath}
          src={blobUrl ?? undefined}
          className={
            embedded
              ? "h-[560px] w-full rounded-none"
              : "h-[560px] w-full rounded-2xl"
          }
        />
      </div>
    );
  }

  if (isImageExtension(ext)) {
    return (
      <div
        className={
          embedded
            ? "flex justify-center p-4"
            : "flex justify-center rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)"
        }
      >
        {blobUrl ? (
          <img
            src={blobUrl}
            alt={filePath}
            className={
              embedded
                ? "max-h-[560px] w-auto max-w-full rounded-none border border-light-divider object-contain dark:border-dark-divider"
                : "max-h-[560px] w-auto max-w-full rounded-xl border border-light-divider object-contain dark:border-dark-divider"
            }
          />
        ) : null}
      </div>
    );
  }

  if (ext === "docx" || ext === "doc") {
    return (
      <ReadonlyDocxPreview
        owner={owner}
        repo={repo}
        branch={branch}
        embedded={embedded}
        fileBytes={fileBytes}
        filePath={filePath}
        onDownload={onDownload}
        fallbackLoading={plainDocxLoading}
        fallbackHtml={docxHtml}
        fallbackText={plainDocx}
      />
    );
  }

  if (ext === "xlsx" || ext === "xls" || ext === "csv") {
    return (
      <div
        className={
          embedded
            ? "space-y-3 p-4"
            : "space-y-3 rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)"
        }
      >
        <p className="text-sm text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
          {t("documentViewer.overview.sheetFallback")}
        </p>
        <Button type="button" variant="secondary" onClick={onDownload}>
          {t("documentViewer.overview.download")}
        </Button>
      </div>
    );
  }

  if (isLikelyTextExtension(ext) && textMaybe != null) {
    return (
      <TextPreviewWithNotes
        owner={owner}
        repo={repo}
        branch={branch}
        filePath={filePath}
        embedded={embedded}
        text={textMaybe}
      />
    );
  }

  return (
    <div
      className={
        embedded
          ? "space-y-3 p-4"
          : "space-y-3 rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)"
      }
    >
      <p className="text-sm text-muted dark:text-dark-muted">
        {t("documentViewer.overview.binaryFallback")}
      </p>
      <Button type="button" variant="secondary" onClick={onDownload}>
        {t("documentViewer.overview.download")}
      </Button>
    </div>
  );
}

function TextPreviewWithNotes({ owner, repo, branch, filePath, embedded, text }) {
  const shellRef = useRef(null);
  const contentRef = useRef(null);

  return (
    <div
      ref={shellRef}
      className={
        embedded
          ? "relative max-h-[560px] overflow-auto rounded-none bg-white p-4 text-slate-900 dark:bg-white dark:text-slate-900"
          : "relative max-h-[560px] overflow-auto rounded-2xl border border-(--color-light-card-border) bg-white p-4 text-slate-900 dark:border-(--color-dark-card-border) dark:bg-white dark:text-slate-900"
      }
    >
      <div
        ref={contentRef}
        className="vc-a4-page vc-a4-text-page"
      >
        <pre className="m-0 whitespace-pre-wrap break-words text-xs leading-6 text-slate-900">
          <code>{text}</code>
        </pre>
      </div>
      <DocumentNoteOverlay
        owner={owner}
        repo={repo}
        branch={branch}
        filePath={filePath}
        shellRef={shellRef}
        contentRef={contentRef}
      />
    </div>
  );
}

function ReadonlyDocxPreview({
  owner,
  repo,
  branch,
  embedded,
  fileBytes,
  filePath,
  onDownload,
  fallbackLoading,
  fallbackHtml,
  fallbackText,
}) {
  const { t } = useTranslation();
  const scrollShellRef = useRef(null);
  const previewHostRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function render() {
      const host = previewHostRef.current;
      if (!host || !fileBytes?.length) return;

      setLoading(true);
      setLoadError("");
      host.innerHTML = "";

      try {
        const blob = new Blob([fileBytes], {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        await renderDocxAsync(blob, host, undefined, {
          className: "docx-preview-host",
          ignoreWidth: false,
          ignoreHeight: false,
          breakPages: true,
          experimental: true,
          inWrapper: true,
          useBase64URL: true,
          renderChanges: false,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
          renderComments: true,
        });

        if (!cancelled) {
          setLoading(false);
          if (!host.textContent?.trim() && !host.querySelector(".docx")) {
            setLoadError("Document renderer returned an empty preview.");
          }
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(String(error?.message ?? "Failed to render document."));
          setLoading(false);
        }
      }
    }

    render();

    return () => {
      cancelled = true;
      if (previewHostRef.current) {
        previewHostRef.current.innerHTML = "";
      }
    };
  }, [fileBytes, filePath]);

  return (
    <div
      className={
        embedded
          ? "space-y-3 p-0"
          : "space-y-3 rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4">
        <div>
          <p className="text-xs text-muted dark:text-dark-muted">
            Document preview
          </p>
          <p className="mt-1 text-sm font-semibold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
            {filePath}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={onDownload}>
            <span className="inline-flex items-center gap-2">
              <Download size={15} />
              Download docx
            </span>
          </Button>
        </div>
      </div>

      {loading ? <DocumentViewerLoading /> : null}

      {!loadError ? (
        <div className="px-4 pb-4">
          <div
            ref={scrollShellRef}
            className={
              embedded
                ? "docx-render-shell vc-a4-docx-shell relative max-h-[560px] overflow-auto rounded-none border border-light-divider bg-white p-4 text-slate-900 dark:border-dark-divider dark:bg-white dark:text-slate-900"
                : "docx-render-shell vc-a4-docx-shell relative max-h-[720px] overflow-auto rounded-lg border border-light-divider bg-white p-4 text-slate-900 shadow-inner dark:border-dark-divider dark:bg-white dark:text-slate-900"
            }
          >
            <div ref={previewHostRef} />
            <DocumentNoteOverlay
              owner={owner}
              repo={repo}
              branch={branch}
              filePath={filePath}
              shellRef={scrollShellRef}
              contentRef={previewHostRef}
              enabled={!loading && !loadError}
            />
          </div>
        </div>
      ) : fallbackLoading ? (
        <DocumentViewerLoading />
      ) : (
        <div className="px-4 pb-4">
          <p className="mb-3 text-xs text-muted dark:text-dark-muted">
            {t("documentViewer.overview.docxFallbackHint")}
          </p>
          <p className="mb-3 text-xs text-amber-700 dark:text-amber-300">
            {loadError}
          </p>
          <div className="max-h-[520px] overflow-auto rounded-xl border border-light-divider bg-white p-3 text-slate-900 dark:border-dark-divider dark:bg-white dark:text-slate-900">
            {fallbackHtml ? (
              <div
                className="vc-docx-preview prose prose-sm max-w-none text-slate-900 [&_p]:my-0 [&_p+P]:mt-3 [&_table]:mt-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-light-divider [&_td]:px-3 [&_td]:py-2 dark:[&_td]:border-dark-divider [&_.vc-docx-empty]:opacity-40 [&_.vc-docx-strike]:line-through [&_.vc-docx-underline]:underline"
                dangerouslySetInnerHTML={{ __html: fallbackHtml }}
              />
            ) : (
              <pre className="whitespace-pre-wrap text-xs text-slate-900">
                {fallbackText || t("documentViewer.overview.emptyPreview")}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
