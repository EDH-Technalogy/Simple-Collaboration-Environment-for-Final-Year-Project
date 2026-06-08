import React from "react";
import { useTranslation } from "react-i18next";
import DiffViewer from "./DiffViewer";

/**
 * Right-hand column for `PRFilesDiff` — keeps `{DiffViewer}` wired to the active entry.
 */
export default function FileDiffPanel({
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

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold text-muted dark:text-dark-muted">
        {t("pullRequests.manifest.selectedHint")}
      </p>
      <DiffViewer
        owner={owner}
        repo={repo}
        prNumber={prNumber}
        fileIndex={fileIndex}
        filePath={filePath}
        status={status}
        fallbackMeta={fallbackMeta}
        fallbackBaseRef={fallbackBaseRef}
        fallbackHeadRef={fallbackHeadRef}
      />
    </div>
  );
}
