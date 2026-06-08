import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { renderAsync as renderDocxAsync } from "docx-preview";
import DocumentViewerLoading from "../vcShared/DocumentViewerLoading";
import OverviewMode from "./OverviewMode";
import {
  getFileExtension,
  tryDecodeUtf8,
} from "../../utils/binaryFileHandlers";

function hashHue(input) {
  let hash = 0;
  const s = String(input ?? "");
  for (let i = 0; i < s.length; i++)
    hash = (hash << 5) - hash + s.charCodeAt(i);
  return Math.abs(hash) % 360;
}

function isZipMagic(bytes) {
  return bytes?.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}

function lineIndexFrom(row) {
  const n = Number(
    row.lineNumber ?? row.line ?? row.line_no ?? row.lineNo ?? row.lineIdx,
  );
  if (!Number.isFinite(n)) return -1;
  return Math.max(0, n - 1);
}

function commitId(row) {
  return row?.commit ?? row?.commitSha ?? row?.sha ?? row?.revision ?? "";
}

function buildDocumentCommitGroups(rows) {
  const items = Array.isArray(rows) ? rows : [];
  const groups = [];
  let current = null;
  let lineNumber = 1;

  items.forEach((row, index) => {
    const commit = commitId(row);
    const author = row?.author ?? row?.userName ?? "";
    const message = row?.message ?? row?.commitMessage ?? row?.subject ?? "";
    const timestamp = row?.timestamp ?? row?.date ?? "";
    const kind = row?.kind ?? "segment";
    const text = typeof row?.text === "string" ? row.text : "";
    const lines = text.split(/\r?\n/);
    if (!lines.length) lines.push("");

    const shouldStart =
      !current ||
      current.commit !== commit ||
      current.author !== author ||
      current.message !== message ||
      current.timestamp !== timestamp;

    if (shouldStart) {
      current = {
        key: `${commit || "document"}-${index}-${lineNumber}`,
        commit,
        author,
        message,
        timestamp,
        kind,
        page: row?.page ?? null,
        lines: [],
      };
      groups.push(current);
    }

    lines.forEach((line) => {
      current.lines.push({
        lineNumber,
        code: line || "\u00a0",
      });
      lineNumber += 1;
    });
  });

  return groups;
}

function normalizeDocText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();
}

function shortCommit(row) {
  return String(commitId(row) ?? "").slice(0, 8);
}

function changeType(row) {
  return String(row?.changeType ?? row?.status ?? "unchanged").toLowerCase();
}

function changeLabel(row) {
  const type = changeType(row);
  if (type === "added") return "Added";
  if (type === "modified") return "Modified";
  return "Unchanged";
}

function changeBadgeClass(row) {
  const type = changeType(row);
  if (type === "added") {
    return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-300";
  }
  if (type === "modified") {
    return "bg-amber-50 text-amber-700 dark:bg-amber-500/12 dark:text-amber-300";
  }
  return "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-200";
}

function markerColor(row, selected = false) {
  const type = changeType(row);
  if (type === "added") return selected ? "rgb(5,150,105)" : "rgba(5,150,105,.74)";
  if (type === "modified") return selected ? "rgb(217,119,6)" : "rgba(217,119,6,.78)";
  return selected ? "rgb(234,88,12)" : "rgba(234,88,12,.72)";
}

function docxSegmentId(row, index) {
  return row?.id || `doc-row-${index}`;
}

function docxPopupPayload(row, index, t) {
  return {
    id: docxSegmentId(row, index),
    commit: commitId(row),
    shortSha: shortCommit(row),
    author: row?.author || row?.userName || t("documentViewer.na"),
    timestamp: row?.timestamp ?? row?.date,
    message:
      row?.message ||
      row?.commitMessage ||
      row?.subject ||
      t("documentViewer.na"),
    kind: row?.kind || "segment",
    changeType: changeType(row),
    changeLabel: changeLabel(row),
    previousText: row?.previousText || "",
    page: row?.page ?? null,
    top: 8,
  };
}

function sameDocxBlameGroup(a, b) {
  if (!sameCommitMeta(a?.row, b?.row)) return false;
  const prevKind = String(a?.row?.kind ?? "");
  const nextKind = String(b?.row?.kind ?? "");
  if (prevKind === "table-row" || nextKind === "table-row") {
    return prevKind === nextKind;
  }
  return changeType(a?.row) === changeType(b?.row);
}

function isSingleDocxBlameCommit(rows) {
  const items = Array.isArray(rows) ? rows : [];
  if (!items.length) return false;
  const first = items[0];
  return items.every((row) => sameCommitMeta(first, row));
}

function markerBounds(items) {
  const first = items[0]?.anchor;
  const last = items[items.length - 1]?.anchor || first;
  const top = Math.max(0, first?.offsetTop ?? 0);
  const bottom = Math.max(
    top + 24,
    (last?.offsetTop ?? top) + Math.max(24, last?.offsetHeight ?? 24),
  );
  return { top, height: Math.max(24, bottom - top) };
}

function blockText(block) {
  return normalizeDocText(block?.textContent);
}

function compatibleDocBlock(block, row) {
  const targetText = normalizeDocText(row?.text);
  const renderedText = blockText(block);
  if (!targetText || !renderedText) return false;
  return (
    renderedText === targetText ||
    renderedText.includes(targetText) ||
    targetText.includes(renderedText)
  );
}

function anchorForDocBlock(block) {
  if (!block) return null;
  return block.tagName?.toLowerCase?.() === "tr"
    ? block.querySelector("td, th") || block
    : block;
}

function findDocxBlockForRow(row, blocks, searchFrom) {
  const orderIndex = Number(row?.orderIndex);
  if (Number.isInteger(orderIndex) && orderIndex >= 0) {
    const orderedBlock = blocks[orderIndex];
    if (compatibleDocBlock(orderedBlock, row)) {
      return { block: orderedBlock, nextSearchFrom: orderIndex + 1 };
    }
  }

  for (let i = searchFrom; i < blocks.length; i += 1) {
    const block = blocks[i];
    if (compatibleDocBlock(block, row)) {
      return { block, nextSearchFrom: i + 1 };
    }
  }

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    if (compatibleDocBlock(block, row)) {
      return { block, nextSearchFrom: Math.max(searchFrom, i + 1) };
    }
  }

  return { block: null, nextSearchFrom: searchFrom };
}

function DocumentSegmentBlameList({
  groups,
  selectedCommit,
  onSelectCommit,
  hoveredSegmentId,
  onHoverSegment,
  formatTs,
  t,
}) {
  return (
    <div className="overflow-x-auto">
      {groups.map((row, index) => {
        const commit = row.commit;
        const selected = selectedCommit && commit === selectedCommit;
        const hovered = hoveredSegmentId === row.key;
        const hue = hashHue(commit || row.key || index);
        return (
          <div
            key={row.key || `${commit}-${index}`}
            className="grid border-b border-light-divider md:grid-cols-[minmax(180px,220px)_minmax(0,1fr)] dark:border-dark-divider"
            onMouseEnter={() => onHoverSegment(row.key || `${index}`)}
            onMouseLeave={() => onHoverSegment(null)}
          >
            <div
              className={`border-r border-light-divider px-3 py-3 dark:border-dark-divider ${
                selected
                  ? "ring-2 ring-inset ring-(--color-light-input-border-focus) dark:ring-(--color-dark-input-border-focus)"
                  : ""
              }`}
              style={{
                backgroundColor: hovered
                  ? `hsla(${hue}, 72%, 75%, .35)`
                  : `hsla(${hue}, 70%, 70%, .18)`,
              }}
              onClick={() => onSelectCommit(commit || null)}
            >
              <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted dark:text-dark-muted">
                <span className="rounded-full border border-light-divider px-2 py-0.5 font-mono dark:border-dark-divider">
                  {(row.shortSha || commit || "").slice(0, 8)}
                </span>
                <span className={`rounded-full px-2 py-0.5 font-medium ${changeBadgeClass(row)}`}>
                  {changeLabel(row)}
                </span>
              </div>
              <div className="mt-2 font-semibold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
                {row.author || t("documentViewer.na")}
              </div>
              <div className="mt-1 text-[11px] text-muted dark:text-dark-muted">
                {formatTs(row.timestamp)}
              </div>
              <div className="mt-1 text-[11px] text-muted dark:text-dark-muted">
                {row.message || t("documentViewer.na")}
              </div>
              {row.previousText ? (
                <div className="mt-2 line-clamp-2 text-[10px] text-muted dark:text-dark-muted">
                  Before: {row.previousText}
                </div>
              ) : null}
            </div>

            <div className="px-4 py-3">
              <div className="mb-2 text-[10px] uppercase tracking-[0.14em] text-muted dark:text-dark-muted">
                {row.kind || "segment"}
                {row.page != null ? ` • Page ${row.page}` : ""}
              </div>
              <div className="overflow-hidden rounded-xl border border-light-divider bg-white text-slate-900 dark:border-dark-divider dark:bg-white dark:text-slate-900">
                {row.lines.map((line) => (
                  <div
                    key={`${row.key}-${line.lineNumber}`}
                    className="grid grid-cols-[48px_minmax(0,1fr)] border-b border-light-divider font-mono text-[11px] leading-6 last:border-b-0 dark:border-dark-divider"
                  >
                    <div className="select-none px-2.5 text-right text-muted dark:text-dark-muted">
                      {line.lineNumber}
                    </div>
                    <pre className="m-0 overflow-x-auto px-3 py-0 text-slate-900">
                      <code>{line.code}</code>
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function sameCommitMeta(a, b) {
  if (!a || !b) return false;
  return (
    commitId(a) === commitId(b) &&
    String(a?.author ?? a?.userName ?? "") ===
      String(b?.author ?? b?.userName ?? "") &&
    String(a?.message ?? a?.commitMessage ?? a?.subject ?? "") ===
      String(b?.message ?? b?.commitMessage ?? b?.subject ?? "") &&
    String(a?.timestamp ?? a?.date ?? "") ===
      String(b?.timestamp ?? b?.date ?? "")
  );
}

/**
 * @param {{
 *   blameData: any[],
 *   fileBytes: Uint8Array,
 *   filePath?: string,
 *   fallbackMeta?: {
 *     commitSha?: string,
 *     author?: string,
 *     message?: string,
 *     timestamp?: string,
 *   } | null
 * }} props
 */
export default function BlameMode({
  blameData,
  fileBytes,
  filePath = "",
  fallbackMeta = null,
}) {
  const { t } = useTranslation();
  const [hoveredLineIndex, setHoveredLineIndex] = useState(null);
  const [selectedCommit, setSelectedCommit] = useState(null);
  const [hoveredSegmentId, setHoveredSegmentId] = useState(null);
  const [docxPopup, setDocxPopup] = useState(null);
  const [docRenderLoading, setDocRenderLoading] = useState(false);
  const [docRenderError, setDocRenderError] = useState("");
  const previewHostRef = useRef(null);
  const markerLayerRef = useRef(null);

  const decoded = tryDecodeUtf8(fileBytes ?? new Uint8Array());
  const text = decoded ?? "";
  const lines = decoded != null ? text.split("\n") : [];
  const ext = getFileExtension(filePath);
  const isDocumentSegmentMode = Array.isArray(blameData)
    && blameData.some(
      (row) =>
        row
        && typeof row === "object"
        && row.orderIndex != null
        && typeof row.text === "string"
        && row.lineNumber == null,
    );

  const blameByLine = useMemo(() => {
    const acc = {};
    const arr = Array.isArray(blameData) ? blameData : [];
    arr.forEach((row) => {
      const idx = lineIndexFrom(row);
      if (idx >= 0) acc[idx] = row;
    });
    return acc;
  }, [blameData]);

  const blameRows = Array.isArray(blameData) ? blameData : [];
  const resolvedMeta =
    blameRows.find((row) => commitId(row) === selectedCommit) ?? null;

  const formatTs = (ts) => {
    if (!ts) return t("documentViewer.na");
    const d =
      typeof ts === "number" ?
        new Date(ts)
      : new Date(String(ts));
    if (Number.isNaN(d.getTime()))
      return t("documentViewer.na");
    try {
      return format(d, "PPp");
    } catch {
      return d.toISOString();
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function renderDocxBlame() {
      if (!isDocumentSegmentMode || ext !== "docx" || !fileBytes?.length) {
        setDocRenderError("");
        setDocRenderLoading(false);
        return;
      }

      const host = previewHostRef.current;
      const markerLayer = markerLayerRef.current;
      if (!host) return;

      setDocRenderLoading(true);
      setDocRenderError("");
      setDocxPopup(null);
      host.innerHTML = "";
      if (markerLayer) markerLayer.innerHTML = "";

      try {
        if (!isZipMagic(fileBytes)) {
          throw new Error("The stored DOCX bytes are incomplete or invalid.");
        }

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

        if (cancelled) return;

        const blocks = Array.from(
          host.querySelectorAll("p, li, h1, h2, h3, h4, h5, h6, tr"),
        );
        let searchFrom = 0;
        const rows = Array.isArray(blameData) ? blameData : [];
        const matchedRows = [];

        rows.forEach((row, index) => {
          const match = findDocxBlockForRow(row, blocks, searchFrom);
          searchFrom = match.nextSearchFrom;

          const anchor = anchorForDocBlock(match.block);
          if (!anchor) return;

          anchor.setAttribute("data-blame-id", docxSegmentId(row, index));
          anchor.setAttribute("data-blame-commit", commitId(row));
          anchor.style.scrollMarginTop = "1rem";

          matchedRows.push({ row, index, anchor });
        });

        const markerGroups = [];
        matchedRows.forEach((item) => {
          const current = markerGroups[markerGroups.length - 1];
          if (!current || !sameDocxBlameGroup(current[current.length - 1], item)) {
            markerGroups.push([item]);
          } else {
            current.push(item);
          }
        });

        if (markerLayer) {
          markerLayer.style.height = `${Math.max(host.scrollHeight, host.offsetHeight)}px`;
        }

        if (markerLayer && isSingleDocxBlameCommit(rows)) {
          const row = rows[0];
          const activeCommit = commitId(row);
          const selected = selectedCommit && activeCommit === selectedCommit;
          const fullHeight = Math.max(96, host.scrollHeight || host.offsetHeight);
          const bar = document.createElement("button");
          bar.type = "button";
          bar.setAttribute("aria-label", `Show commit ${shortCommit(row) || ""}`);
          bar.style.position = "absolute";
          bar.style.left = "0.75rem";
          bar.style.top = "0";
          bar.style.width = "0.5rem";
          bar.style.height = `${fullHeight}px`;
          bar.style.border = "0";
          bar.style.borderRadius = "999px";
          bar.style.background = markerColor(row, selected);
          bar.style.cursor = "pointer";
          bar.style.pointerEvents = "auto";
          markerLayer.style.height = `${fullHeight}px`;

          const popupPayload = {
            ...docxPopupPayload(row, 0, t),
            id: row?.id || "whole-document",
            kind: row?.kind || "document",
          };

          bar.addEventListener("mouseenter", () => {
            setHoveredSegmentId(popupPayload.id);
            setDocxPopup({ ...popupPayload, top: 8 });
          });
          bar.addEventListener("mouseleave", () => {
            setHoveredSegmentId(null);
            setDocxPopup(null);
          });
          bar.addEventListener("focus", () => {
            setHoveredSegmentId(popupPayload.id);
            setDocxPopup({ ...popupPayload, top: 8 });
          });
          bar.addEventListener("blur", () => {
            setHoveredSegmentId(null);
            setDocxPopup(null);
          });
          bar.addEventListener("click", () => {
            setSelectedCommit(activeCommit || null);
          });

          markerLayer.appendChild(bar);
        } else {
          markerGroups.forEach((group) => {
          const { row, index } = group[0];
          const activeCommit = commitId(row);
          const selected = selectedCommit && activeCommit === selectedCommit;

          if (!markerLayer) return;

          const { top, height } = markerBounds(group);

          const bar = document.createElement("button");
          bar.type = "button";
          bar.setAttribute("aria-label", `Show commit ${shortCommit(row) || ""}`);
          bar.style.position = "absolute";
          bar.style.left = "0.75rem";
          bar.style.top = `${top}px`;
          bar.style.width = "0.5rem";
          bar.style.height = `${height}px`;
          bar.style.border = "0";
          bar.style.borderRadius = "999px";
          bar.style.background = markerColor(row, selected);
          bar.style.cursor = "pointer";
          bar.style.pointerEvents = "auto";

          const popupPayload = docxPopupPayload(row, index, t);

          bar.addEventListener("mouseenter", () => {
            const shell = bar.closest(".vc-docx-blame-shell");
            const visibleTop = top - (shell?.scrollTop ?? 0);
            setHoveredSegmentId(popupPayload.id);
            setDocxPopup({
              ...popupPayload,
              top: Math.max(8, Math.min(560, visibleTop + 4)),
            });
          });
          bar.addEventListener("mouseleave", () => {
            setHoveredSegmentId(null);
            setDocxPopup(null);
          });
          bar.addEventListener("focus", () => {
            const shell = bar.closest(".vc-docx-blame-shell");
            const visibleTop = top - (shell?.scrollTop ?? 0);
            setHoveredSegmentId(popupPayload.id);
            setDocxPopup({
              ...popupPayload,
              top: Math.max(8, Math.min(560, visibleTop + 4)),
            });
          });
          bar.addEventListener("blur", () => {
            setHoveredSegmentId(null);
            setDocxPopup(null);
          });
          bar.addEventListener("click", () => {
            setSelectedCommit(activeCommit || null);
          });

          markerLayer.appendChild(bar);
        });

        if (markerLayer && markerGroups.length === 0 && rows.length) {
          const row = rows[0];
          const activeCommit = commitId(row);
          const bar = document.createElement("button");
          bar.type = "button";
          bar.setAttribute("aria-label", `Show commit ${shortCommit(row) || ""}`);
          bar.style.position = "absolute";
          bar.style.left = "0.75rem";
          bar.style.top = "0";
          bar.style.width = "0.5rem";
          bar.style.height = `${Math.max(96, host.scrollHeight || host.offsetHeight)}px`;
          bar.style.border = "0";
          bar.style.borderRadius = "999px";
          bar.style.background = markerColor(row, false);
          bar.style.cursor = "pointer";
          bar.style.pointerEvents = "auto";
          markerLayer.style.height = `${Math.max(96, host.scrollHeight || host.offsetHeight)}px`;

          const popupPayload = {
            ...docxPopupPayload(row, 0, t),
            id: row?.id || "fallback-document",
            kind: row?.kind || "document",
          };

          bar.addEventListener("mouseenter", () => {
            setHoveredSegmentId(popupPayload.id);
            setDocxPopup({ ...popupPayload, top: 8 });
          });
          bar.addEventListener("mouseleave", () => {
            setHoveredSegmentId(null);
            setDocxPopup(null);
          });
          bar.addEventListener("focus", () => {
            setHoveredSegmentId(popupPayload.id);
            setDocxPopup({ ...popupPayload, top: 8 });
          });
          bar.addEventListener("blur", () => {
            setHoveredSegmentId(null);
            setDocxPopup(null);
          });
          bar.addEventListener("click", () => {
            setSelectedCommit(activeCommit || null);
          });

          markerLayer.appendChild(bar);
        }
        }

        setDocRenderLoading(false);
      } catch (error) {
        if (!cancelled) {
          setDocRenderError(
            String(
              error?.message ??
                "The DOCX layout preview could not be rendered.",
            ),
          );
          setDocRenderLoading(false);
        }
      }
    }

    renderDocxBlame();
    return () => {
      cancelled = true;
      if (previewHostRef.current) {
        previewHostRef.current.innerHTML = "";
      }
      if (markerLayerRef.current) {
        markerLayerRef.current.innerHTML = "";
      }
    };
  }, [blameData, ext, fileBytes, isDocumentSegmentMode, selectedCommit, t]);

  if (isDocumentSegmentMode) {
    const rows = Array.isArray(blameData) ? blameData : [];
    if (ext === "docx") {
      const groups = buildDocumentCommitGroups(rows);
      return (
        <div className="overflow-hidden rounded-2xl border border-(--color-light-card-border) bg-white text-slate-900 dark:border-(--color-dark-card-border) dark:bg-white dark:text-slate-900">
          <header className="border-b border-light-divider px-5 py-4 dark:border-dark-divider">
            <h3 className="text-sm font-semibold text-slate-900">
              Document blame
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              The original document layout is preserved and ownership is grouped beside matching document blocks like a blame gutter.
            </p>
          </header>

          {docRenderLoading ? <DocumentViewerLoading /> : null}
          {docRenderError ? (
            <div className="mx-4 my-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
              The original DOCX layout preview could not be rendered
              {docRenderError ? `: ${docRenderError}` : "."} Showing extracted
              document ownership instead.
            </div>
          ) : null}

          {!docRenderError ? (
            <div className="relative px-4 pb-4">
              {docxPopup ? (
                <aside
                  className="absolute left-10 z-20 w-80 max-w-[calc(100%-4rem)] rounded-xl border border-orange-200 bg-white/95 p-3 text-xs text-slate-700 shadow-lg backdrop-blur dark:border-orange-500/30 dark:bg-slate-950/95 dark:text-slate-200"
                  style={{ top: docxPopup.top ?? 8 }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-orange-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-orange-700 dark:bg-orange-500/15 dark:text-orange-200">
                      {docxPopup.shortSha || "—"}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${changeBadgeClass(docxPopup)}`}>
                      {docxPopup.changeLabel}
                      {docxPopup.page != null ? ` · Page ${docxPopup.page}` : ""}
                    </span>
                  </div>
                  <p className="mt-2 font-semibold text-primary dark:text-dark-primary">
                    {docxPopup.author || t("documentViewer.na")}
                  </p>
                  <p className="mt-1 text-[11px] text-muted dark:text-dark-muted">
                    {formatTs(docxPopup.timestamp)}
                  </p>
                  <p className="mt-2 line-clamp-3 text-[11px]">
                    {docxPopup.message || t("documentViewer.na")}
                  </p>
                  {docxPopup.previousText ? (
                    <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                      <p className="mb-1 font-semibold">Previous block</p>
                      <p className="line-clamp-4">{docxPopup.previousText}</p>
                    </div>
                  ) : null}
                </aside>
              ) : null}
              <div
                className="docx-render-shell vc-docx-blame-shell relative max-h-[720px] overflow-auto rounded-none bg-white p-4 text-slate-900 dark:bg-white dark:text-slate-900"
                onScroll={() => {
                  setHoveredSegmentId(null);
                  setDocxPopup(null);
                }}
              >
                <div
                  ref={markerLayerRef}
                  className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8"
                />
                <div ref={previewHostRef} />
              </div>
            </div>
          ) : (
            <DocumentSegmentBlameList
              groups={groups}
              selectedCommit={selectedCommit}
              onSelectCommit={setSelectedCommit}
              hoveredSegmentId={hoveredSegmentId}
              onHoverSegment={setHoveredSegmentId}
              formatTs={formatTs}
              t={t}
            />
          )}

          {selectedCommit && resolvedMeta ? (
            <footer className="border-t border-light-divider bg-white px-5 py-4 text-xs text-slate-900 dark:border-dark-divider dark:bg-white dark:text-slate-900">
              <h4 className="text-[11px] font-semibold text-slate-900">
                {t("documentViewer.blame.detailsTitle")}
              </h4>
              <dl className="mt-2 space-y-1 text-slate-500">
                <div className="flex justify-between gap-3">
                  <dt className="font-semibold text-(--color-light-text-secondary) dark:text-(--color-dark-text-secondary)">
                    {t("documentViewer.blame.sha")}
                  </dt>
                  <dd className="font-mono text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
                    {selectedCommit}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="font-semibold text-(--color-light-text-secondary) dark:text-(--color-dark-text-secondary)">
                    {t("documentViewer.blame.author")}
                  </dt>
                  <dd className="text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
                    {resolvedMeta.author || resolvedMeta.userName || t("documentViewer.na")}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="font-semibold text-(--color-light-text-secondary) dark:text-(--color-dark-text-secondary)">
                    {t("documentViewer.blame.date")}
                  </dt>
                  <dd className="text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
                    {formatTs(resolvedMeta.timestamp ?? resolvedMeta.date)}
                  </dd>
                </div>
                <div className="flex flex-col gap-1 pt-1">
                  <dt className="font-semibold text-(--color-light-text-secondary) dark:text-(--color-dark-text-secondary)">
                    {t("documentViewer.blame.message")}
                  </dt>
                  <dd className="text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
                    {resolvedMeta.commitMessage ||
                      resolvedMeta.message ||
                      resolvedMeta.subject ||
                      t("documentViewer.na")}
                  </dd>
                </div>
              </dl>
            </footer>
          ) : null}
        </div>
      );
    }

    const groups = buildDocumentCommitGroups(rows);
    return (
      <div className="overflow-hidden rounded-2xl border border-(--color-light-card-border) bg-white text-slate-900 dark:border-(--color-dark-card-border) dark:bg-white dark:text-slate-900">
        <header className="border-b border-light-divider px-5 py-4 dark:border-dark-divider">
          <h3 className="text-sm font-semibold text-slate-900">
            Document blame
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Ownership is tracked per extracted document segment instead of raw text lines.
          </p>
        </header>

        <div className="overflow-x-auto">
          {groups.map((row, index) => {
            const commit = row.commit;
            const selected = selectedCommit && commit === selectedCommit;
            const hovered = hoveredSegmentId === row.key;
            const hue = hashHue(commit || row.key || index);
            return (
              <div
                key={row.key || `${commit}-${index}`}
                className="grid border-b border-light-divider md:grid-cols-[minmax(180px,220px)_minmax(0,1fr)] dark:border-dark-divider"
                onMouseEnter={() => setHoveredSegmentId(row.key || `${index}`)}
                onMouseLeave={() => setHoveredSegmentId(null)}
              >
                <div
                  className={`border-r border-light-divider px-3 py-3 dark:border-dark-divider ${selected ? "ring-2 ring-inset ring-(--color-light-input-border-focus) dark:ring-(--color-dark-input-border-focus)" : ""}`}
                  style={{
                    backgroundColor: hovered
                      ? `hsla(${hue}, 72%, 75%, .35)`
                      : `hsla(${hue}, 70%, 70%, .18)`,
                  }}
                  onClick={() => setSelectedCommit(commit || null)}
                >
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted dark:text-dark-muted">
                    <span className="rounded-full border border-light-divider px-2 py-0.5 font-mono dark:border-dark-divider">
                      {(row.shortSha || commit || "").slice(0, 8)}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 font-medium ${changeBadgeClass(row)}`}>
                      {changeLabel(row)}
                    </span>
                  </div>
                  <div className="mt-2 font-semibold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
                    {row.author || t("documentViewer.na")}
                  </div>
                  <div className="mt-1 text-[11px] text-muted dark:text-dark-muted">
                    {formatTs(row.timestamp)}
                  </div>
                  <div className="mt-1 text-[11px] text-muted dark:text-dark-muted">
                    {row.message || t("documentViewer.na")}
                  </div>
                  {row.previousText ? (
                    <div className="mt-2 line-clamp-2 text-[10px] text-muted dark:text-dark-muted">
                      Before: {row.previousText}
                    </div>
                  ) : null}
                </div>

                <div className="px-4 py-3">
                  <div className="mb-2 text-[10px] uppercase tracking-[0.14em] text-muted dark:text-dark-muted">
                    {row.kind || "segment"}
                    {row.page != null ? ` • Page ${row.page}` : ""}
                  </div>
                  <div className="overflow-hidden rounded-xl border border-light-divider bg-white text-slate-900 dark:border-dark-divider dark:bg-white dark:text-slate-900">
                    {row.lines.map((line) => (
                      <div
                        key={`${row.key}-${line.lineNumber}`}
                        className="grid grid-cols-[48px_minmax(0,1fr)] border-b border-light-divider font-mono text-[11px] leading-6 last:border-b-0 dark:border-dark-divider"
                      >
                        <div className="select-none px-2.5 text-right text-muted dark:text-dark-muted">
                          {line.lineNumber}
                        </div>
                        <pre className="m-0 overflow-x-auto px-3 py-0 text-slate-900">
                          <code>{line.code}</code>
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (decoded == null) {
    if (ext === "docx" || ext === "pdf") {
      return (
        <div className="overflow-hidden rounded-2xl border border-(--color-light-card-border) bg-white text-slate-900 dark:border-(--color-dark-card-border) dark:bg-white dark:text-slate-900">
          <header className="border-b border-light-divider px-5 py-4 dark:border-dark-divider">
            <h3 className="text-sm font-semibold text-slate-900">
              Document blame
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Document blame metadata is unavailable for this revision, so the original document preview is shown instead.
            </p>
          </header>
          {fallbackMeta ? (
            <div className="border-b border-light-divider bg-white px-5 py-4 text-xs text-slate-900 dark:border-dark-divider dark:bg-white dark:text-slate-900">
              <div className="grid gap-3 md:grid-cols-4">
                <div>
                  <p className="font-semibold text-(--color-light-text-secondary) dark:text-(--color-dark-text-secondary)">
                    {t("documentViewer.blame.sha")}
                  </p>
                  <p className="mt-1 font-mono text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
                    {fallbackMeta.commitSha || t("documentViewer.na")}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-(--color-light-text-secondary) dark:text-(--color-dark-text-secondary)">
                    {t("documentViewer.blame.author")}
                  </p>
                  <p className="mt-1 text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
                    {fallbackMeta.author || t("documentViewer.na")}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-(--color-light-text-secondary) dark:text-(--color-dark-text-secondary)">
                    {t("documentViewer.blame.date")}
                  </p>
                  <p className="mt-1 text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
                    {formatTs(fallbackMeta.timestamp)}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-(--color-light-text-secondary) dark:text-(--color-dark-text-secondary)">
                    {t("documentViewer.blame.message")}
                  </p>
                  <p className="mt-1 text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
                    {fallbackMeta.message || t("documentViewer.na")}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
          <OverviewMode
            fileBytes={fileBytes}
            filePath={filePath}
            fileType={ext}
            embedded
          />
        </div>
      );
    }
    return (
      <div className="rounded-2xl border border-light-divider bg-(--color-light-card-bg) p-6 text-sm text-muted dark:border-dark-divider dark:bg-(--color-dark-card-bg) dark:text-dark-muted">
        {t("documentViewer.blame.binary")}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-(--color-light-card-border) bg-white text-slate-900 dark:border-(--color-dark-card-border) dark:bg-white dark:text-slate-900">
      <header className="border-b border-light-divider px-5 py-4 dark:border-dark-divider">
        <h3 className="text-sm font-semibold text-slate-900">
          {t("documentViewer.blame.title")}
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          {t("documentViewer.blame.hint")}
        </p>
      </header>

      <div className="flex max-h-[560px] overflow-auto border-light-divider bg-white text-slate-900 dark:border-dark-divider dark:bg-white dark:text-slate-900">
        <div className="sticky left-0 z-[1] min-w-[148px] border-r border-light-divider bg-slate-50 dark:border-dark-divider dark:bg-slate-50">
          {lines.map((_, index) => {
            const blame = blameByLine[index];
            const commit = commitId(blame);
            const hovered = hoveredLineIndex === index;
            const hue = blame ? hashHue(commit) : 210;
            return (
              <div
                key={`a-${index}`}
                role="presentation"
                className={`cursor-pointer border-b border-light-divider px-3 py-1 text-[11px] transition-colors hover:opacity-90 dark:border-dark-divider ${selectedCommit && commit === selectedCommit ? "ring-2 ring-inset ring-(--color-light-input-border-focus) dark:ring-(--color-dark-input-border-focus)" : ""}`}
                style={{
                  minHeight: 28,
                  backgroundColor:
                    hovered ?
                      `hsla(${hue}, 72%, 75%, .35)`
                    : blame ?
                      `hsla(${hue}, 70%, 70%, .55)`
                    : "transparent",
                }}
                onMouseEnter={() => setHoveredLineIndex(index)}
                onMouseLeave={() => setHoveredLineIndex(null)}
                onClick={() =>
                  blame ? setSelectedCommit(commit || null) : undefined
                }
                title={
                  blame ?
                    `${String(blame.author ?? blame.userName ?? t("documentViewer.na"))} · ${formatTs(blame.timestamp ?? blame.date ?? blame.time ?? blame.committedDate)} · ${commit?.slice?.(0, 7) ?? ""}`
                  : undefined
                }
              >
                {blame ?
                  <>
                    <div className="truncate font-semibold text-slate-900">
                      {blame.author || blame.userName || t("documentViewer.na")}
                    </div>
                    <div className="truncate font-mono text-[10px] text-slate-500">
                      {(commit ?? "").slice(0, 7)}
                    </div>
                  </>
                : null}
              </div>
            );
          })}
        </div>

        <div className="min-w-[56px] border-r border-light-divider bg-slate-50 text-right dark:border-dark-divider dark:bg-slate-50">
          {lines.map((_, index) => (
            <div
              key={`n-${index}`}
              role="presentation"
              className="border-b border-light-divider px-2 py-1 font-mono text-[11px] tabular-nums text-slate-500 dark:border-dark-divider"
              style={{ minHeight: 28 }}
              onMouseEnter={() => setHoveredLineIndex(index)}
              onMouseLeave={() => setHoveredLineIndex(null)}
            >
              {index + 1}
            </div>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          {lines.map((line, index) => {
            const hovered = hoveredLineIndex === index;
            return (
              <div
                key={`c-${index}`}
                role="presentation"
                className={`border-b border-light-divider px-4 py-1 dark:border-dark-divider ${hovered ? "bg-slate-50" : "bg-white"}`}
                style={{ minHeight: 28 }}
                onMouseEnter={() => setHoveredLineIndex(index)}
                onMouseLeave={() => setHoveredLineIndex(null)}
              >
                <pre className="m-0 whitespace-pre-wrap break-all font-mono text-[11px] text-slate-900">
                  <code>{line || "\u00a0"}</code>
                </pre>
              </div>
            );
          })}
        </div>
      </div>

      {selectedCommit && resolvedMeta ?
        <footer className="border-t border-light-divider bg-white px-5 py-4 text-xs text-slate-900 dark:border-dark-divider dark:bg-white dark:text-slate-900">
          <h4 className="text-[11px] font-semibold text-slate-900">
            {t("documentViewer.blame.detailsTitle")}
          </h4>
          <dl className="mt-2 space-y-1 text-slate-500">
            <div className="flex justify-between gap-3">
              <dt className="font-semibold text-(--color-light-text-secondary) dark:text-(--color-dark-text-secondary)">
                {t("documentViewer.blame.sha")}
              </dt>
              <dd className="font-mono text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
                {selectedCommit}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="font-semibold text-(--color-light-text-secondary) dark:text-(--color-dark-text-secondary)">
                {t("documentViewer.blame.author")}
              </dt>
              <dd className="text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
                {resolvedMeta.author || resolvedMeta.userName || t("documentViewer.na")}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="font-semibold text-(--color-light-text-secondary) dark:text-(--color-dark-text-secondary)">
                {t("documentViewer.blame.date")}
              </dt>
              <dd className="text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
                {formatTs(resolvedMeta.timestamp ?? resolvedMeta.date)}
              </dd>
            </div>
            <div className="flex flex-col gap-1 pt-1">
              <dt className="font-semibold text-(--color-light-text-secondary) dark:text-(--color-dark-text-secondary)">
                {t("documentViewer.blame.message")}
              </dt>
              <dd className="text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
                {resolvedMeta.commitMessage ||
                  resolvedMeta.message ||
                  resolvedMeta.subject ||
                  t("documentViewer.na")}
              </dd>
            </div>
          </dl>
        </footer>
      : null}
    </div>
  );
}
