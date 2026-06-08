import { ChevronDown, ChevronRight } from "lucide-react";
import { Fragment, useId, useState } from "react";
import Icon from "../Icon";
import IC from "../IC";

/** @param {{ items: Array<{ label: string; href?: boolean; onClick?: () => void }> }} props */
export function AdminPersonProfileBreadcrumbs({ items }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-4 flex flex-wrap items-center gap-1 text-[13px]"
    >
      {items.map((it, idx) => (
        <Fragment key={`${idx}-${it.label}`}>
          {idx > 0 ? (
            <ChevronRight
              className="size-4 shrink-0 text-(--color-light-text-muted) dark:text-dark-muted"
              aria-hidden
            />
          ) : null}
          {idx < items.length - 1 ? (
            <button
              type="button"
              className="text-(--color-light-text-muted) transition-colors hover:text-(--color-light-admin-profile-link) dark:text-dark-muted dark:hover:text-(--color-dark-admin-profile-link)"
              onClick={it.onClick}
            >
              {it.label}
            </button>
          ) : (
            <span className="rounded-full border border-(--color-light-card-border) bg-(--color-light-admin-profile-surface-muted) px-2.5 py-0.5 text-xs font-semibold text-(--color-light-text-primary) dark:border-(--color-dark-card-border) dark:bg-(--color-dark-admin-profile-surface-muted) dark:text-(--color-dark-text-primary)">
              {it.label}
            </span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}

/**
 * @param {{
 *   onBack?: () => void;
 *   verifiedLabel?: string;
 *   initials: string;
 * }} props
 */
export function AdminPersonProfileHero({ onBack, verifiedLabel, initials }) {
  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-(--color-light-card-border) bg-gradient-to-br from-(--color-light-admin-profile-hero-from) to-(--color-light-admin-profile-hero-to) shadow-md dark:border-(--color-dark-card-border) dark:from-(--color-dark-admin-profile-hero-from) dark:to-(--color-dark-admin-profile-hero-to)">
        <div
          className="pointer-events-none absolute -end-6 -top-10 size-32 rounded-full bg-white/25 dark:bg-white/10"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-8 start-12 size-24 rotate-12 rounded-xl bg-white/15 dark:bg-white/10"
          aria-hidden
        />
        <div className="relative flex h-28 items-start justify-between px-4 pt-4 pb-14">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-white/30 dark:bg-black/25 dark:hover:bg-black/35"
            aria-label="Back"
          >
            <Icon d={IC.chevLeft} className="size-5 text-white" />
          </button>
          {verifiedLabel ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/40 bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-(--color-light-admin-profile-violet-strong) shadow-sm dark:bg-(--color-dark-card-bg)/95 dark:text-(--color-dark-admin-profile-violet)">
              <Icon d={IC.check} className="size-3.5 shrink-0" />
              {verifiedLabel}
            </span>
          ) : null}
        </div>
      </div>
      <div className="-mt-14 flex justify-center px-5 md:-mt-19 md:justify-start md:px-6">
        <div className="flex size-28 shrink-0 items-center justify-center rounded-xl border-[5px] border-(--color-light-card-bg) bg-(--color-light-card-bg) text-2xl font-bold text-(--color-light-admin-profile-violet-strong) shadow-[0_12px_40px_-8px_rgba(79,70,229,0.45)] dark:border-(--color-dark-card-bg) dark:bg-(--color-dark-card-bg) dark:text-(--color-dark-admin-profile-violet) dark:shadow-[0_14px_40px_-8px_rgba(0,0,0,0.55)]">
          {initials}
        </div>
      </div>
    </>
  );
}

/** @param {{ label: string; value: string }} props */
export function AdminPersonProfileMiniCard({ label, value }) {
  return (
    <div className="rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) px-4 py-3 shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted dark:text-dark-muted">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold leading-snug text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
        {value}
      </p>
    </div>
  );
}

/**
 * @param {{ title: string; tags: string[] }} props
 */
export function AdminPersonProfilePillSection({ title, tags }) {
  if (!tags.length) return null;
  return (
    <div className="mt-4">
      <h3 className="text-[13px] font-bold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
        {title}
      </h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-(--color-light-admin-profile-pill-bg) px-3 py-1 text-[11px] font-semibold text-(--color-light-admin-profile-pill-text) dark:bg-(--color-dark-admin-profile-pill-bg) dark:text-(--color-dark-admin-profile-pill-text)"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * @param {{
 *   title: string;
 *   items: Array<{ id?: string; title: string; subtitle?: string }>;
 *   collapsedCount?: number;
 *   expandLabel?: string;
 *   collapseLabel?: string;
 * }} props
 */
export function AdminPersonProfileExpandableList({
  title,
  items,
  collapsedCount = 2,
  expandLabel,
  collapseLabel,
}) {
  const [open, setOpen] = useState(false);
  if (!items.length) return null;

  const show = open ? items : items.slice(0, collapsedCount);
  const hidden = Math.max(0, items.length - collapsedCount);

  return (
    <div className="mt-6 border-t border-light-divider pt-5 dark:border-dark-divider">
      <h3 className="text-[13px] font-bold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
        {title}
      </h3>
      <ul className="mt-3 flex flex-col gap-3">
        {show.map((row) => (
          <li key={row.id ?? row.title} className="flex gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-(--color-light-admin-profile-pill-bg) text-[11px] font-bold uppercase text-(--color-light-admin-profile-pill-text) dark:bg-(--color-dark-admin-profile-pill-bg) dark:text-(--color-dark-admin-profile-pill-text)">
              {row.title.slice(0, 2)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
                {row.title}
              </p>
              {row.subtitle ? (
                <p className="truncate text-xs text-muted dark:text-dark-muted">
                  {row.subtitle}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      {hidden > 0 ? (
        <button
          type="button"
          className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-(--color-light-admin-profile-link) dark:text-(--color-dark-admin-profile-link)"
          onClick={() => setOpen((x) => !x)}
        >
          {open ? (collapseLabel ?? "") : (expandLabel ?? "")}
          <ChevronDown
            className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      ) : null}
    </div>
  );
}

/**
 * @param {{ label: string; onClick?: () => void }} props
 */
const navyBtnClass =
  "inline-flex w-full items-center justify-center rounded-xl bg-(--color-light-admin-profile-navy) py-3.5 text-center text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-(--color-light-admin-profile-navy-hover) dark:bg-(--color-dark-admin-profile-navy) dark:hover:bg-(--color-dark-admin-profile-navy-hover)";

export function AdminPersonProfileNavyButton({ label, onClick }) {
  return (
    <button type="button" onClick={onClick} className={navyBtnClass}>
      {label}
    </button>
  );
}

/** @param {{ label: string; href: string }} props */
export function AdminPersonProfileNavyLink({ label, href }) {
  return (
    <a href={href} className={`${navyBtnClass} no-underline`}>
      {label}
    </a>
  );
}

/**
 * @param {{
 *   title: string;
 *   stageLabels: string[];
 *   rows: Array<{
 *     id: string;
 *     title: string;
 *     subtitle?: string;
 *     counts: number[];
 *     activeStageIndex: number;
 *     onViewDetails?: () => void;
 *     viewDetailsLabel?: string;
 *   }>;
 * }} props
 */
export function AdminPersonProfilePipeline({ title, stageLabels, rows }) {
  const uid = useId();
  if (!rows.length) return null;

  return (
    <section className="rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 shadow-md md:p-5 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
      <h2 className="mb-5 text-base font-bold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
        {title}
      </h2>
      <div className="flex flex-col gap-6">
        {rows.map((row) => (
          <div
            key={row.id}
            className="rounded-xl border border-(--color-light-card-border) bg-(--color-light-admin-profile-surface-muted) p-4 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-admin-profile-surface-muted)"
          >
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
                  {row.title}
                </p>
                {row.subtitle ? (
                  <p className="mt-0.5 text-xs text-muted dark:text-dark-muted">
                    {row.subtitle}
                  </p>
                ) : null}
              </div>
              {row.onViewDetails ? (
                <button
                  type="button"
                  onClick={row.onViewDetails}
                  className="text-[13px] font-semibold text-(--color-light-admin-profile-link) dark:text-(--color-dark-admin-profile-link)"
                >
                  {row.viewDetailsLabel}
                </button>
              ) : null}
            </div>
            <div className="overflow-x-auto pb-2">
              <div className="flex min-w-[780px] gap-3">
                {stageLabels.map((lbl, idx) => {
                  const active = idx === row.activeStageIndex;
                  const count =
                    typeof row.counts[idx] === "number" ? row.counts[idx] : 0;
                  return (
                    <div
                      key={`${uid}-${row.id}-${idx}`}
                      className={`min-w-0 flex-1 rounded-xl border px-2 py-3 text-center transition-colors ${active ? "border-(--color-light-admin-profile-violet) shadow-sm dark:border-(--color-dark-admin-profile-violet)" : "border-(--color-light-card-border) dark:border-(--color-dark-card-border)"}`}
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted dark:text-dark-muted">
                        {lbl}
                      </p>
                      <p
                        className={`mt-1 text-lg font-bold tabular-nums ${active ? "text-(--color-light-admin-profile-violet-strong) dark:text-(--color-dark-admin-profile-violet)" : "text-(--color-light-text-secondary) dark:text-(--color-dark-text-secondary)"}`}
                      >
                        {count}
                      </p>
                      <div
                        className={`mx-auto mt-3 h-1 max-w-[4rem] rounded-full ${active ? "bg-(--color-light-admin-profile-violet)" : "bg-(--color-light-border-subtle) dark:bg-(--color-dark-border-subtle)"}`}
                        aria-hidden
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Wrapper: max-width + two-column rhythm like reference desktop.
 *
 * @param {{
 *   sidebar: import("react").ReactNode;
 *   children: import("react").ReactNode;
 * }} props
 */
export function AdminPersonProfileFrame({ sidebar, children }) {
  return (
    <div className="flex flex-1 flex-col bg-white dark:bg-dark-card-bg">
      <div className="mx-auto flex w-full max-w-360 flex-1 flex-col gap-6 overflow-y-auto p-4 md:p-6 lg:flex-row lg:gap-10 lg:p-8">
        <aside className="flex w-full shrink-0 flex-col lg:max-w-100">
          {sidebar}
        </aside>
        <div className="flex min-w-0 flex-1 flex-col gap-5">{children}</div>
      </div>
    </div>
  );
}
