import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { saveAs } from "file-saver";
import OverviewMode from "../DocumentViewer/OverviewMode";
import Button from "../Button";
import { fetchRepositoryBlobPayload } from "../../services/versionControlService";
import { getFileExtension } from "../../utils/binaryFileHandlers";

function blockChoiceFor(segment, blockChoices) {
  return (
    blockChoices?.[segment.id] ?? {
      resolution: "SOURCE",
      customContent: String(segment?.sourceChunk ?? ""),
    }
  );
}

function resolvedPreview(segment, choice) {
  const resolution = String(choice?.resolution ?? "SOURCE").toUpperCase();
  if (resolution === "TARGET") return String(segment?.targetChunk ?? "");
  if (resolution === "BOTH") {
    return [segment?.targetChunk, segment?.sourceChunk].filter(Boolean).join("\n");
  }
  if (resolution === "CUSTOM") return String(choice?.customContent ?? "");
  return String(segment?.sourceChunk ?? "");
}

export default function ConflictMarkerViewer({
  owner,
  repo,
  conflict,
  blockChoices,
  onPickResolution,
  onEditCustom,
}) {
  const { t } = useTranslation();
  const segments = Array.isArray(conflict?.segments) ? conflict.segments : [];

  if (conflict?.binary) {
    return (
      <BinaryConflictViewer
        owner={owner}
        repo={repo}
        conflict={conflict}
        blockChoices={blockChoices}
        onPickResolution={onPickResolution}
      />
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
      {segments.map((segment, index) => {
        if (String(segment?.type ?? "").toUpperCase() === "PLAIN") {
          return (
            <pre
              key={segment?.id ?? `plain-${index}`}
              className="overflow-auto whitespace-pre-wrap rounded-xl border border-light-divider bg-(--color-light-input-bg) p-3 font-mono text-[11px] text-(--color-light-text-primary) dark:border-dark-divider dark:bg-(--color-dark-input-bg) dark:text-(--color-dark-text-primary)"
            >
              {segment?.content || " "}
            </pre>
          );
        }

        const choice = blockChoiceFor(segment, blockChoices);
        const preview = resolvedPreview(segment, choice);
        const resolution = String(choice?.resolution ?? "SOURCE").toUpperCase();

        return (
          <article
            key={segment?.id ?? `conflict-${index}`}
            className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-500/20 dark:bg-amber-500/10"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">
                  Conflict block {index + 1}
                </span>
                <span className="text-muted dark:text-dark-muted">
                  source {segment?.sourceStartLine ?? "—"}-{segment?.sourceEndLine ?? "—"}
                </span>
                <span className="text-muted dark:text-dark-muted">
                  target {segment?.targetStartLine ?? "—"}-{segment?.targetEndLine ?? "—"}
                </span>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <div className="space-y-2">
                <h4 className="text-[11px] font-semibold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
                  {t("mergeConflict.source")}
                </h4>
                <pre className="max-h-52 overflow-auto whitespace-pre-wrap rounded-xl border border-light-divider bg-(--color-light-input-bg) p-3 font-mono text-[11px] text-(--color-light-text-primary) dark:border-dark-divider dark:bg-(--color-dark-input-bg) dark:text-(--color-dark-text-primary)">
                  {segment?.sourceChunk || t("mergeConflict.empty")}
                </pre>
              </div>
              <div className="space-y-2">
                <h4 className="text-[11px] font-semibold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
                  {t("mergeConflict.target")}
                </h4>
                <pre className="max-h-52 overflow-auto whitespace-pre-wrap rounded-xl border border-light-divider bg-(--color-light-input-bg) p-3 font-mono text-[11px] text-(--color-light-text-primary) dark:border-dark-divider dark:bg-(--color-dark-input-bg) dark:text-(--color-dark-text-primary)">
                  {segment?.targetChunk || t("mergeConflict.empty")}
                </pre>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                ["SOURCE", t("mergeConflict.strategy.source")],
                ["TARGET", t("mergeConflict.strategy.target")],
                ["BOTH", t("mergeConflict.strategy.both")],
                ["CUSTOM", t("mergeConflict.strategy.custom")],
              ].map(([value, label]) => (
                <Button
                  key={value}
                  type="button"
                  variant={resolution === value ? "primary" : "secondary"}
                  onClick={() => onPickResolution?.(segment, value)}
                >
                  {label}
                </Button>
              ))}
            </div>

            {resolution === "CUSTOM" ? (
              <textarea
                rows={10}
                value={String(choice?.customContent ?? "")}
                onChange={(event) =>
                  onEditCustom?.(segment, event.target.value)
                }
                spellCheck={false}
                className="w-full resize-y rounded-xl border border-(--color-light-input-border) bg-(--color-light-input-bg) px-3.5 py-2 font-mono text-xs text-(--color-light-text-primary) outline-none transition-colors focus:border-(--color-light-input-border-focus) focus:ring-2 focus:ring-blue-500/15 dark:border-dark-input-border dark:bg-(--color-dark-input-bg) dark:text-(--color-dark-text-primary) dark:focus:border-(--color-dark-input-border-focus) dark:focus:ring-blue-400/15"
              />
            ) : null}

            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
                Resolved preview
              </h4>
              <pre className="max-h-52 overflow-auto whitespace-pre-wrap rounded-xl border border-emerald-200 bg-emerald-50 p-3 font-mono text-[11px] text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100">
                {preview || " "}
              </pre>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function BinaryConflictViewer({
  owner,
  repo,
  conflict,
  blockChoices,
  onPickResolution,
}) {
  const { t } = useTranslation();
  const [activeSide, setActiveSide] = useState(
    conflict?.targetHash ? "target" : "source",
  );
  const [preview, setPreview] = useState({ loading: false, bytes: null, error: "" });

  const segment = useMemo(
    () =>
      (Array.isArray(conflict?.segments) ? conflict.segments : []).find(
        (item) => String(item?.type ?? "").toUpperCase() === "CONFLICT",
      ) ?? null,
    [conflict],
  );
  const choice =
    (segment?.id && blockChoices?.[segment.id]) ?? {
      resolution: "SOURCE",
    };
  const selectedResolution = String(choice?.resolution ?? "SOURCE").toUpperCase();

  const revisions = [
    {
      key: "source",
      label: t("mergeConflict.source"),
      hash: String(conflict?.sourceHash ?? "").trim(),
      resolution: "SOURCE",
    },
    {
      key: "target",
      label: t("mergeConflict.target"),
      hash: String(conflict?.targetHash ?? "").trim(),
      resolution: "TARGET",
    },
  ].filter((item) => item.hash);

  useEffect(() => {
    if (!revisions.some((item) => item.key === activeSide)) {
      setActiveSide(revisions[0]?.key ?? "source");
    }
  }, [activeSide, revisions]);

  useEffect(() => {
    let cancelled = false;
    const current = revisions.find((item) => item.key === activeSide);
    if (!owner || !repo || !current?.hash) {
      setPreview({ loading: false, bytes: null, error: "" });
      return undefined;
    }

    setPreview({ loading: true, bytes: null, error: "" });
    (async () => {
      try {
        const bytes = await fetchRepositoryBlobPayload(owner, repo, current.hash);
        if (!cancelled) setPreview({ loading: false, bytes, error: "" });
      } catch (error) {
        if (!cancelled) {
          setPreview({
            loading: false,
            bytes: null,
            error: String(error?.message ?? "Could not load binary preview."),
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeSide, owner, repo, revisions]);

  function downloadRevision(revision) {
    if (!preview.bytes?.length || activeSide !== revision.key) return;
    const suffix = revision.key === "source" ? "source" : "target";
    const ext = getFileExtension(conflict?.path ?? "");
    const base = String(conflict?.path ?? "download").split("/").pop() || "download";
    const name = ext ? `${base}.${suffix}`.replace(`.${ext}.${suffix}`, `-${suffix}.${ext}`) : `${base}-${suffix}`;
    saveAs(new Blob([preview.bytes]), name);
  }

  return (
    <div className="space-y-3 rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">
          Binary conflict
        </span>
        <span className="text-[11px] text-muted dark:text-dark-muted">
          This file cannot be merged line by line. Choose which revision to keep.
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {revisions.map((revision) => (
          <Button
            key={revision.key}
            type="button"
            variant={activeSide === revision.key ? "primary" : "secondary"}
            onClick={() => setActiveSide(revision.key)}
          >
            {revision.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {revisions.map((revision) => (
          <Button
            key={revision.resolution}
            type="button"
            variant={selectedResolution === revision.resolution ? "primary" : "secondary"}
            onClick={() => segment && onPickResolution?.(segment, revision.resolution)}
          >
            Keep {revision.label.toLowerCase()}
          </Button>
        ))}
      </div>

      <div className="rounded-xl border border-light-divider bg-(--color-light-input-bg) p-3 dark:border-dark-divider dark:bg-(--color-dark-input-bg)">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
              {(revisions.find((item) => item.key === activeSide)?.label) || "Revision"} preview
            </p>
            <p className="text-[11px] text-muted dark:text-dark-muted">
              {revisions.find((item) => item.key === activeSide)?.hash || "—"}
            </p>
          </div>
          {preview.bytes?.length ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => downloadRevision(revisions.find((item) => item.key === activeSide))}
            >
              {t("documentViewer.overview.download")}
            </Button>
          ) : null}
        </div>

        {preview.loading ? (
          <p className="text-sm text-muted dark:text-dark-muted">Loading revision…</p>
        ) : preview.error ? (
          <p className="text-sm text-(--color-light-error-text) dark:text-(--color-dark-error-text)">
            {preview.error}
          </p>
        ) : preview.bytes?.length ? (
          <OverviewMode
            owner={owner}
            repo={repo}
            branch={activeSide}
            embedded
            fileBytes={preview.bytes}
            filePath={conflict?.path ?? ""}
            fileType=""
          />
        ) : (
          <p className="text-sm text-muted dark:text-dark-muted">No preview available for this revision.</p>
        )}
      </div>
    </div>
  );
}
