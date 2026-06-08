import { createElement } from "react";

/**
 * Compact metric tile used by dashboards and settings panels.
 * Pass `children` to replace the default value + hint block (e.g. contributors “access” tile).
 */
export default function RepoOverviewStatCard({
  icon,
  label,
  value,
  hint,
  palette,
  children,
}) {
  return (
    <div
      className={`group rounded-lg border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-dark-card-bg ${palette.shell}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase text-muted dark:text-dark-muted">
            <span className={`size-1.5 rounded-full ${palette.accent}`} />
            {label}
          </p>
          {children != null ? (
            <div className="mt-3">{children}</div>
          ) : (
            <>
              <p className="mt-3 text-3xl font-semibold tabular-nums text-primary dark:text-dark-primary">
                {value}
              </p>
            </>
          )}
        </div>
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg border ${palette.icon}`}
        >
          {createElement(icon, { className: "size-5", strokeWidth: 1.75 })}
        </div>
      </div>
      {children == null && hint ? (
        <p className="mt-3 line-clamp-2 text-xs leading-5 text-secondary dark:text-dark-secondary">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
