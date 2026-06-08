import clsx from "clsx";

const tintIconBox = {
  violet:
    "bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300",
  rose: "bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300",
  indigo:
    "bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300",
  sky: "bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300",
  emerald:
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/45 dark:text-emerald-300",
};

/**
 * Section card aligned with `StudentRegistrationWizard` for faculty flows.
 */
export default function FacultyFormSectionCard({
  icon: Glyph,
  tint = "violet",
  title,
  subtitle,
  children,
  className = "",
}) {
  return (
    <div
      className={clsx(
        "rounded-xl border bg-light-card-bg p-5 shadow-sm backdrop-blur-sm dark:border-dark-card-border border-default dark:bg-dark-card-bg dark:shadow-none sm:p-6",
        className,
      )}
    >
      <div className="mb-5 flex gap-4">
        <div
          className={clsx(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            tintIconBox[tint] ?? tintIconBox.violet,
          )}
        >
          <Glyph className="size-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-tight text-primary dark:text-dark-primary">
            {title}
          </h3>
          {subtitle ? (
            <p className="mt-0.5 text-[11px] leading-snug text-secondary dark:text-dark-secondary">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
