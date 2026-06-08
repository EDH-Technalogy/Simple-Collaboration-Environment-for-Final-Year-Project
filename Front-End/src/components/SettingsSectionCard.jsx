import { cn } from "../lib/utils";

export default function SettingsSectionCard({
  icon: Icon,
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}) {
  return (
    <section
      className={cn(
        "rounded-md border border-(--color-light-card-border) bg-(--color-light-card-bg)  dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)",
        className,
      )}
    >
      <div className="flex flex-col gap-3 border-b border-light-divider px-4 py-4 dark:border-dark-divider md:flex-row md:items-start md:justify-between md:px-5 md:py-4">
        <div className="flex items-start gap-3">
          {Icon ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary text-primary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-primary">
              <Icon className="h-5 w-5" strokeWidth={2} />
            </div>
          ) : null}
          <div>
            <h2 className="text-base font-semibold text-primary dark:text-dark-primary">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 max-w-2xl text-sm leading-6 text-secondary dark:text-dark-secondary">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {action}
      </div>

      <div className={cn("p-4 md:p-5", contentClassName)}>{children}</div>
    </section>
  );
}
