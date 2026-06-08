import { cn } from "../lib/utils";
import { useTranslation } from "react-i18next";

export default function SettingsToggleRow({
  title,
  description,
  checked,
  onChange,
}) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-2xl border px-4 py-4 transition-colors",
        checked
          ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/20 dark:bg-emerald-500/10"
          : "border-(--color-light-card-border) bg-light-app-tertiary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-primary dark:text-dark-primary">
          {title}
        </p>
        <p className="mt-1 text-sm leading-6 text-secondary dark:text-dark-secondary">
          {description}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span
          className={cn(
            "min-w-8 text-right text-[11px] font-semibold uppercase tracking-[0.14em]",
            checked
              ? "text-emerald-700 dark:text-emerald-300"
              : "text-muted dark:text-dark-muted",
          )}
        >
          {checked
            ? t("settings.shared.toggle.on")
            : t("settings.shared.toggle.off")}
        </span>

        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-pressed={checked}
          onClick={onChange}
          className={cn(
            "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border p-1 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-light-input-border-focus) focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-light-card-bg) dark:focus-visible:ring-(--color-dark-input-border-focus) dark:focus-visible:ring-offset-(--color-dark-card-bg)",
            checked
              ? "border-emerald-500 bg-emerald-500 shadow-sm dark:border-emerald-400 dark:bg-emerald-500"
              : "border-slate-300 bg-slate-200 dark:border-slate-600 dark:bg-slate-700",
          )}
        >
          <span
            className={cn(
              "inline-block h-6 w-6 rounded-full bg-white shadow-[0_1px_4px_rgba(15,23,42,0.22)] transition-transform duration-200 dark:bg-white",
              checked ? "translate-x-6" : "translate-x-1",
            )}
          />
        </button>
      </div>
    </div>
  );
}
