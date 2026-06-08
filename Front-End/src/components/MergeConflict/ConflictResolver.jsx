import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useVcMergeConflicts,
  useVcResolveMergeConflict,
} from "../../services/useApi";
import Button from "../Button";
import DocumentViewerLoading from "../vcShared/DocumentViewerLoading";
import ConflictMarkerViewer from "./ConflictMarkerViewer";

function conflictPath(conflict) {
  return (
    conflict?.filePath ??
    conflict?.filename ??
    conflict?.path ??
    ""
  );
}

function conflictSegments(conflict) {
  return (Array.isArray(conflict?.segments) ? conflict.segments : []).filter(
    (segment) => String(segment?.type ?? "").toUpperCase() === "CONFLICT",
  );
}

function defaultBlockChoice(segment) {
  return {
    resolution: "SOURCE",
    customContent: String(segment?.sourceChunk ?? ""),
  };
}

function normalizedBlockChoice(segment, choice) {
  const current = choice ?? defaultBlockChoice(segment);
  return {
    resolution: String(current?.resolution ?? "SOURCE").toUpperCase(),
    customContent:
      current?.customContent != null
        ? String(current.customContent)
        : String(segment?.sourceChunk ?? ""),
  };
}

/**
 * @param {{ owner: string, repo: string, prNumber: number|string, onResolved?: () => void }} props
 */
export default function ConflictResolver({ owner, repo, prNumber, onResolved }) {
  const { t } = useTranslation();

  const [activePath, setActivePath] = useState("");
  const [blockChoicesByPath, setBlockChoicesByPath] = useState({});
  const [error, setError] = useState(null);
  const {
    data: conflicts = [],
    isLoading,
    isFetching,
    error: conflictsError,
    refetch,
  } = useVcMergeConflicts(owner, repo, prNumber, {
    notifyOnError: false,
  });
  const resolveConflict = useVcResolveMergeConflict({
    showErrorToast: false,
  });

  const current =
    conflicts.find((item) => conflictPath(item) === activePath) ?? conflicts[0] ?? null;

  useEffect(() => {
    if (conflictsError) {
      setError(String(conflictsError?.message ?? t("mergeConflict.loadFailed")));
      return;
    }
    setError(null);
  }, [conflictsError, t]);

  useEffect(() => {
    if (!conflicts.length) {
      setActivePath("");
      setBlockChoicesByPath({});
      return;
    }
    setActivePath((currentPath) => currentPath || conflictPath(conflicts[0]));
    setBlockChoicesByPath((currentMap) => {
      const next = { ...currentMap };
      conflicts.forEach((conflict) => {
        const path = conflictPath(conflict);
        if (!path) return;
        if (!next[path]) next[path] = {};
        conflictSegments(conflict).forEach((segment) => {
          if (!next[path][segment.id]) {
            next[path][segment.id] = defaultBlockChoice(segment);
          }
        });
      });
      return next;
    });
  }, [conflicts]);

  function pickBlockResolution(segment, resolution) {
    if (!current || !segment?.id) return;
    const path = conflictPath(current);
    setBlockChoicesByPath((currentMap) => {
      const nextForPath = {
        ...(currentMap[path] ?? {}),
        [segment.id]: {
          ...normalizedBlockChoice(segment, currentMap[path]?.[segment.id]),
          resolution: String(resolution).toUpperCase(),
        },
      };
      if (String(resolution).toUpperCase() !== "CUSTOM") {
        nextForPath[segment.id].customContent = String(segment?.sourceChunk ?? "");
      }
      return {
        ...currentMap,
        [path]: nextForPath,
      };
    });
  }

  function editBlockCustom(segment, customContent) {
    if (!current || !segment?.id) return;
    const path = conflictPath(current);
    setBlockChoicesByPath((currentMap) => ({
      ...currentMap,
      [path]: {
        ...(currentMap[path] ?? {}),
        [segment.id]: {
          resolution: "CUSTOM",
          customContent,
        },
      },
    }));
  }

  function fileReadyCount(conflict) {
    const path = conflictPath(conflict);
    const fileChoices = blockChoicesByPath[path] ?? {};
    return conflictSegments(conflict).filter((segment) => {
      const choice = normalizedBlockChoice(segment, fileChoices[segment.id]);
      return (
        choice.resolution !== "CUSTOM" ||
        String(choice.customContent ?? "").length > 0
      );
    }).length;
  }

  function fileResolvedLabel(conflict) {
    const total = conflictSegments(conflict).length;
    const ready = fileReadyCount(conflict);
    return `${ready}/${total} ready`;
  }

  async function emitResolution() {
    if (!conflicts.length) return;

    setError(null);
    try {
      const files = conflicts.map((conflict) => {
        const path = conflictPath(conflict);
        const fileChoices = blockChoicesByPath[path] ?? {};
        return {
          path,
          blocks: conflictSegments(conflict).map((segment) => {
            const choice = normalizedBlockChoice(segment, fileChoices[segment.id]);
            return {
              blockId: segment.id,
              resolution: choice.resolution,
              ...(choice.resolution === "CUSTOM"
                ? {
                    customContent: choice.customContent,
                  }
                : {}),
            };
          }),
        };
      });

      await resolveConflict.mutateAsync({
        owner,
        repo,
        prNumber,
        body: {
          files,
        },
      });

      const result = await refetch();
      const list = Array.isArray(result?.data) ? result.data : [];
      if (!list.length && typeof onResolved === "function") onResolved();
    } catch (e) {
      setError(String(e?.message ?? t("mergeConflict.resolveFailed")));
    }
  }

  if (!owner || !repo || prNumber === "" || prNumber == null) {
    return (
      <div className="rounded-2xl border border-light-divider bg-(--color-light-card-bg) p-6 text-sm text-muted dark:border-dark-divider dark:bg-(--color-dark-card-bg) dark:text-dark-muted">
        {t("mergeConflict.invalid")}
      </div>
    );
  }

  if (isLoading) return <DocumentViewerLoading />;

  if (!conflicts.length) {
    if (error) {
      return (
        <div className="space-y-3 rounded-2xl border border-(--color-light-error-border) bg-(--color-light-error-bg) p-4 text-sm text-(--color-light-error-text) dark:border-(--color-dark-error-border) dark:bg-(--color-dark-error-bg) dark:text-(--color-dark-error-text)">
          <p>{error}</p>
          <Button type="button" variant="secondary" onClick={() => refetch()}>
            {t("mergeConflict.reload")}
          </Button>
        </div>
      );
    }
    return (
      <div className="rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-8 text-center text-sm font-semibold text-(--color-light-text-primary) dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:text-(--color-dark-text-primary)">
        {t("mergeConflict.allClear")}
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-5 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
      <header className="space-y-1">
        <h3 className="text-lg font-semibold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
          {t("mergeConflict.title")}
        </h3>
        <p className="text-xs text-muted dark:text-dark-muted">
          {t("mergeConflict.progress", {
            current: Math.max(
              1,
              conflicts.findIndex((item) => conflictPath(item) === conflictPath(current)) + 1,
            ),
            total: conflicts.length,
          })}
        </p>
        <p className="text-[11px] font-semibold text-(--color-light-text-secondary) dark:text-(--color-dark-text-secondary)">
          {conflictPath(current) || t("mergeConflict.naFile")}
        </p>
      </header>

      {error ?
        <p className="rounded-xl border border-(--color-light-error-border) bg-(--color-light-error-bg) px-4 py-2 text-xs text-(--color-light-error-text) dark:border-(--color-dark-error-border) dark:bg-(--color-dark-error-bg) dark:text-(--color-dark-error-text)">
          {error}
        </p>
      : null}

      {current ?
        <>
          {conflicts.length > 1 ? (
            <div className="flex flex-wrap gap-2">
              {conflicts.map((conflict, index) => {
                const path = conflictPath(conflict);
                const isActive = path === conflictPath(current);
                return (
                  <button
                    key={path || index}
                    type="button"
                    onClick={() => setActivePath(path)}
                    className={[
                      "rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
                      isActive
                        ? "border-(--color-light-input-border-focus) bg-blue-50 text-blue-700 dark:border-(--color-dark-input-border-focus) dark:bg-blue-500/12 dark:text-blue-300"
                        : "border-(--color-light-card-border) bg-(--color-light-card-bg) text-secondary hover:text-primary dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:text-dark-secondary dark:hover:text-dark-primary",
                    ].join(" ")}
                  >
                    {path || `Conflict ${index + 1}`} · {fileResolvedLabel(conflict)}
                  </button>
                );
              })}
            </div>
          ) : null}

          <ConflictMarkerViewer
            owner={owner}
            repo={repo}
            conflict={current}
            blockChoices={blockChoicesByPath[conflictPath(current)] ?? {}}
            onPickResolution={pickBlockResolution}
            onEditCustom={editBlockCustom}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="primary"
              loading={resolveConflict.isPending}
              disabled={resolveConflict.isPending || isFetching}
              onClick={() => emitResolution()}
            >
              Resolve conflicts and merge
            </Button>
            <span className="text-[11px] text-muted dark:text-dark-muted">
              Each conflict block is resolved inline, then all block decisions are submitted together for the merge.
            </span>
          </div>
        </>
      : null}
    </div>
  );
}
