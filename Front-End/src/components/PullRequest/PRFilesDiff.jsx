import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDiffData } from "../../hooks/useDiffData";
import DocumentViewerLoading from "../vcShared/DocumentViewerLoading";
import DocumentViewerFileTypeIcon from "../vcShared/DocumentViewerFileTypeIcon";
import FileDiffPanel from "./FileDiffPanel";

function prRefValue(pr, keys) {
  for (const key of keys) {
    const raw = pr?.[key];
    const value =
      raw != null && typeof raw === "object"
        ? raw.sha ?? raw.hash ?? raw.commitSha ?? raw.name
        : raw;
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return "";
}

function PRFilesDiffBody({ owner, repo, prNumber, pullRequest }) {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useDiffData(
    owner,
    repo,
    prNumber,
    { enabled: Boolean(owner && repo && prNumber != null && prNumber !== "") },
  );

  const files = Array.isArray(data) ? data : [];

  const [activeIndex, setActiveIndex] = useState(0);

  const safeIndex = useMemo(() => {
    return files.length ? Math.min(activeIndex, files.length - 1) : 0;
  }, [files.length, activeIndex]);

  const activeMeta = files[safeIndex];

  if (!owner || !repo || prNumber === "" || prNumber == null) {
    return (
      <div className="rounded-2xl border border-light-divider bg-(--color-light-card-bg) p-6 text-sm text-muted dark:border-dark-divider dark:bg-(--color-dark-card-bg) dark:text-dark-muted">
        {t("pullRequests.manifest.missing")}
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(280px,36%)_minmax(0,1fr)]">
      <div className="overflow-hidden rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
        <header className="flex items-center justify-between border-b border-light-divider px-5 py-3 dark:border-dark-divider">
          <h3 className="text-sm font-semibold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
            {t("pullRequests.manifest.title")}
          </h3>
          <button
            type="button"
            className="text-[11px] font-semibold text-(--color-light-text-muted) underline-offset-4 hover:text-(--color-light-text-secondary) hover:underline dark:text-(--color-dark-text-muted)"
            onClick={() => refetch()}
          >
            {t("pullRequests.manifest.retry")}
          </button>
        </header>
        {isLoading ?
          <DocumentViewerLoading className="border-0" />
        : isError ?
          <p className="p-6 text-xs text-(--color-light-error-text) dark:text-(--color-dark-error-text)">
            {t("pullRequests.manifest.error")}
          </p>
        : files.length === 0 ?
          <p className="p-6 text-sm text-muted dark:text-dark-muted">
            {t("pullRequests.manifest.empty")}
          </p>
        : <ul className="divide-y divide-light-divider dark:divide-dark-divider">
            {files.map((row, idx) => {
              const label =
                row?.filename ??
                row?.path ??
                row?.file?.path ??
                t("pullRequests.manifest.unknown");
              const badge = row?.status ?? row?.changeType ?? "—";
              const active = idx === safeIndex;
              return (
                <li key={`${idx}-${label}`}>
                  <button
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${active ? "bg-(--color-light-input-bg) dark:bg-(--color-dark-input-bg)" : "hover:bg-(--color-light-input-bg)/60 dark:hover:bg-(--color-dark-input-bg)/50"}`}
                  >
                    <DocumentViewerFileTypeIcon path={label} />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="truncate text-xs font-semibold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
                        {label}
                      </p>
                      <span className="rounded-full border border-light-divider bg-(--color-light-input-bg) px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide dark:border-dark-divider dark:bg-(--color-dark-input-bg)">
                        {badge}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        }
      </div>

      <FileDiffPanel
        owner={owner}
        repo={repo}
        prNumber={prNumber}
        fileIndex={safeIndex}
        status={activeMeta?.status ?? activeMeta?.changeType}
        fallbackMeta={activeMeta}
        fallbackBaseRef={prRefValue(pullRequest, [
          "target_hash",
          "targetHash",
          "baseSha",
          "baseCommit",
          "base",
        ])}
        fallbackHeadRef={prRefValue(pullRequest, [
          "source_hash",
          "sourceHash",
          "headSha",
          "headCommit",
          "head",
        ])}
        filePath={
          activeMeta?.filename ??
          activeMeta?.path ??
          activeMeta?.file?.path
        }
      />
    </div>
  );
}

/**
 * Manifest + diff pairing for `{owner}/{repo}#{pullNumber}` overlays.
 */
export default function PRFilesDiff(props) {
  const resetKey = `${props.owner}-${props.repo}-${props.prNumber}`;
  return <PRFilesDiffBody key={resetKey} {...props} />;
}
