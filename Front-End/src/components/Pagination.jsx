import React, { useState } from "react";
import Icon from "./Icon";
import IC from "./IC";
import Select from "./Select";

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50].map((n) => ({
  value: String(n),
  label: String(n),
}));

/** Build [1, '...', 4, 5, 6, '...', 10] without duplicates. */
function computePageList(totalPages, currentPage, delta = 2) {
  if (totalPages <= 0) return [];
  if (totalPages === 1) return [1];

  const add = new Set([1, totalPages, currentPage]);
  for (let i = currentPage - delta; i <= currentPage + delta; i++) {
    if (i >= 1 && i <= totalPages) add.add(i);
  }
  const sorted = [...add].sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const n of sorted) {
    if (prev > 0 && n - prev > 1) out.push("...");
    out.push(n);
    prev = n;
  }
  return out;
}

const btnGhost =
  "inline-flex items-center justify-center rounded-xl border text-xs font-medium transition-colors " +
  "border-(--color-light-card-border) bg-(--color-light-card-bg) text-(--color-light-text-secondary) " +
  "hover:bg-(--color-light-nav-hover-bg) hover:text-(--color-light-text-primary) " +
  "disabled:pointer-events-none disabled:opacity-40 " +
  "dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:text-(--color-dark-text-secondary) " +
  "dark:hover:bg-(--color-dark-card-hover) dark:hover:text-(--color-dark-text-primary)";

const btnGhostIcon = `${btnGhost} size-9 shrink-0`;
const pillBase =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-xl border text-[12px] font-semibold transition-colors";
const pillIdle = `${pillBase} border-default text-secondary hover:bg-(--color-light-nav-hover-bg) dark:border-dark-default dark:text-dark-secondary dark:hover:bg-(--color-dark-card-hover)`;
const pillActive = `${pillBase} border-(--color-light-input-border-focus) bg-(--color-light-nav-active-bg) text-(--color-light-nav-text-active) shadow-sm dark:border-(--color-dark-input-border-focus) dark:bg-(--color-dark-card-hover) dark:text-(--color-chart-blue-secondary)`;

/**
 * @param {number} currentPage — **1-based**
 * @param {number} totalPages — from API (may be 0 when empty)
 * @param {(page: number, pageSize: number) => void} onPageChange — 1-based page
 */
function Pagination({
  currentPage = 1,
  totalPages = 0,
  onPageChange,
  pageSize = 10,
  totalItems = 0,
  showPageSize = true,
  showGoTo = true,
  className = "",
}) {
  const total = Math.max(0, Number(totalItems) || 0);
  const tp = Math.max(0, Number(totalPages) || 0);
  const safeTotalPages = tp > 0 ? tp : total > 0 ? 1 : 0;
  const safePage = Math.min(
    Math.max(1, Number(currentPage) || 1),
    safeTotalPages > 0 ? safeTotalPages : 1,
  );

  const [jump, setJump] = useState("");

  const pageNumbers =
    safeTotalPages > 1 ? computePageList(safeTotalPages, safePage) : [];

  const handleJump = (e) => {
    e.preventDefault();
    const n = Number.parseInt(`${jump}`.trim(), 10);
    if (!Number.isFinite(n) || n < 1) return;
    if (safeTotalPages > 0 && n > safeTotalPages) {
      onPageChange(safeTotalPages, pageSize);
    } else if (safeTotalPages === 0 && total === 0) {
      onPageChange(1, pageSize);
    } else {
      onPageChange(n, pageSize);
    }
    setJump("");
  };

  const sizeStr = String(
    PAGE_SIZE_OPTIONS.some((o) => o.value === String(pageSize)) ? pageSize : 10,
  );

  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-3 ${className}`}>
      <div className="flex flex-wrap items-center gap-3">
        {showPageSize && (
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-wide text-muted dark:text-dark-muted">
              Rows
            </span>
            <div className="w-[5.25rem] shrink-0 [&_.flex.flex-col]:gap-0">
              <Select
                value={sizeStr}
                options={PAGE_SIZE_OPTIONS}
                onValueChange={(v) =>
                  onPageChange(1, Number.parseInt(v, 10) || 10)
                }
              />
            </div>
          </div>
        )}

        <div className="min-w-0 text-[12px] text-muted dark:text-dark-muted">
          {total === 0 ? (
            <span>No results</span>
          ) : (
            <span>
              <span className="font-medium text-secondary dark:text-dark-secondary">
                {Math.min((safePage - 1) * pageSize + 1, total)}–
                {Math.min(safePage * pageSize, total)}
              </span>
              {" of "}
              <span className="font-semibold text-primary dark:text-dark-primary">
                {total}
              </span>
              {safeTotalPages > 0 ? (
                <>
                  {" · Page "}
                  <span className="font-medium">{safePage}</span>
                  <span> / {safeTotalPages}</span>
                </>
              ) : null}
            </span>
          )}
        </div>
      </div>

      {showGoTo && safeTotalPages > 1 && (
        <form
          className="flex items-center gap-2 rounded-xl border border-default bg-(--color-light-input-bg) px-2 py-1 dark:border-dark-default dark:bg-dark-input-bg"
          onSubmit={handleJump}
        >
          <label htmlFor="pagination-jump" className="sr-only">
            Go to page
          </label>
          <span className="hidden text-[11px] font-medium text-muted sm:inline dark:text-dark-muted">
            Go to
          </span>
          <input
            id="pagination-jump"
            type="number"
            min={1}
            max={safeTotalPages}
            placeholder="#"
            value={jump}
            onChange={(e) => setJump(e.target.value)}
            className="focus:border-(--color-light-input-border-focus) h-8 w-11 rounded-lg border border-default bg-(--color-light-input-bg) px-2 text-center text-xs text-light-text-primary outline-none transition focus:ring-2 focus:ring-blue-500 dark:border-dark-default dark:bg-dark-input-bg dark:text-dark-text-primary"
          />
          <button type="submit" className={`${btnGhost} h-8 px-3`}>
            Go
          </button>
        </form>
      )}

      {safeTotalPages > 1 && (
        <div
          className="flex items-center gap-1 rounded-2xl border border-default bg-(--color-light-card-bg)/80 p-1 shadow-sm dark:border-dark-default dark:bg-(--color-dark-card-bg)/80"
          role="navigation"
          aria-label="Pagination"
        >
          <button
            type="button"
            onClick={() => onPageChange(safePage - 1, pageSize)}
            disabled={safePage <= 1}
            className={btnGhostIcon}
            aria-label="Previous page"
          >
            <Icon d={IC.chevLeft} className="size-4 stroke-current" />
          </button>

          <div className="mx-1 flex flex-wrap items-center gap-1 sm:gap-1.5">
            {pageNumbers.map((page, index) =>
              page === "..." ? (
                <span
                  key={`e-${index}`}
                  className="flex size-9 items-center justify-center text-[11px] text-muted dark:text-dark-muted"
                >
                  …
                </span>
              ) : (
                <button
                  key={page}
                  type="button"
                  onClick={() => onPageChange(page, pageSize)}
                  className={safePage === page ? pillActive : pillIdle}
                >
                  {page}
                </button>
              ),
            )}
          </div>

          <button
            type="button"
            onClick={() => onPageChange(safePage + 1, pageSize)}
            disabled={safePage >= safeTotalPages}
            className={btnGhostIcon}
            aria-label="Next page"
          >
            <Icon d={IC.chevRight} className="size-4 stroke-current" />
          </button>
        </div>
      )}
    </div>
  );
}

export default Pagination;
