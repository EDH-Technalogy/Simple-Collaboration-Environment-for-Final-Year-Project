/* Shared layout modeled on StudentRegistrationWizard (step rail + progress + stacks + footer + summary). */
import {
  AnimatePresence,
  LayoutGroup,
  motion,
} from "framer-motion";
import { CheckCircle2, Clock3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "../Button";
import Icon from "../Icon";
import IC from "../IC";

const MotionDiv = motion.div;

export const facultyStepMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

export function FacultySummaryLine({ label, value }) {
  return (
    <li className="flex justify-between gap-3 border-b border-default pb-2 last:border-0 last:pb-0 dark:border-dark-default">
      <span className="shrink-0 text-muted dark:text-dark-muted">{label}</span>
      <span className="min-w-0 text-right font-medium text-primary dark:text-dark-primary">
        {value}
      </span>
    </li>
  );
}

function defaultCompletedStepSnippet(_stepId) {
  return "—";
}

export function FacultyReviewRow({ k, v }) {
  const display = v != null && `${v}`.trim() !== "" ? `${v}` : "—";
  return (
    <div className="rounded-lg bg-slate-50/90 px-3 py-2 dark:bg-slate-800/60">
      <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-500">
        {k}
      </div>
      <div className="mt-1 text-xs font-semibold text-slate-900 dark:text-slate-100">
        {display}
      </div>
    </div>
  );
}

/**
 * @param {object} p
 * @param {boolean} [p.isEdit]
 * @param {string} [p.className]
 * @param {() => void} [p.onCancel]
 * @param {React.FormEventHandler} p.onSubmit
 * @param {{ id: number, titleKey: string, icon: React.ComponentType }[]} p.steps
 * @param {number} p.step
 * @param {number} p.progressPct
 * @param {string} [p.stepTitleKey]
 * @param {string} p.progressPercentKey — i18n key with {{pct}}
 * @param {string} p.progressHintKey
 * @param {number} [p.stackUpToExclusive] steps with id &lt; this appear in stacks (omit review)
 * @param {(stepId:number)=>string} [p.completedSnippet] defaults to “—”
 * @param {React.ReactNode} p.stepContent — active panel
 * @param {React.ReactNode} p.summaryLines — FacultySummaryLine list
 * @param {boolean} [p.continueDisabled]
 * @param {boolean} [p.actionPending]
 * @param {(n:number)=>void} p.goPrev
 * @param {(n:number)=>void} p.goNext
 * @param {string} [p.headerTitleEditKey]
 * @param {string} [p.headerTitleCreateKey]
 * @param {string} [p.heroSubtitleKey]
 * @param {string} [p.savedHintKey] — default studentForm.savedHint
 * @param {string} [p.summaryTitleKey]
 * @param {string} [p.summarySubtitleKey]
 * @param {string} [p.lastSubmitEditKey]
 * @param {string} [p.lastSubmitCreateKey]
 */
export default function FacultyRegistrationShell({
  isEdit,
  className,
  onCancel,
  onSubmit,
  steps,
  step,
  progressPct,
  stepTitleKey,
  progressPercentKey,
  progressHintKey,
  stackUpToExclusive,
  completedSnippet = defaultCompletedStepSnippet,
  stepContent,
  summaryLines,
  continueDisabled,
  actionPending,
  goPrev,
  goNext,
  headerTitleEditKey,
  headerTitleCreateKey,
  heroSubtitleKey,
  savedHintKey = "studentForm.savedHint",
  summaryTitleKey = "studentForm.summary.title",
  summarySubtitleKey = "studentForm.summary.subtitle",
  lastSubmitEditKey = "studentForm.actions.save",
  lastSubmitCreateKey = "studentForm.actions.create",
}) {
  const { t } = useTranslation();
  const motionEase = [0.22, 1, 0.36, 1];
  const cutoff = stackUpToExclusive ?? steps.length;

  const invokeSubmitFromFooter = () => {
    if (typeof onSubmit !== "function") return undefined;
    return onSubmit();
  };

  return (
    <form
      /* Enter in inputs must not POST the wizard; only footer “Create/Save”. */
      onSubmit={(event) => {
        event.preventDefault();
      }}
      className={[
        "mx-auto w-full max-w-[min(100%,92rem)] pb-28",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="card rounded-xl px-6 py-8 md:px-10 md:py-10">
        <header className="mb-8 flex flex-col gap-4 border-b border-default pb-6 sm:flex-row sm:items-start sm:justify-between dark:border-dark-default">
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--color-light-nav-text-active)" }}
            >
              {t("sidebar.brand")}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary sm:text-[1.65rem] dark:text-dark-primary">
              {isEdit ? t(headerTitleEditKey) : t(headerTitleCreateKey)}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-secondary dark:text-dark-secondary">
              {t(heroSubtitleKey)}
            </p>
          </div>
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="btn-tertiary shrink-0 rounded-xl px-4 py-2 text-xs shadow-sm"
            >
              {t("studentForm.actions.cancel")}
            </button>
          ) : null}
        </header>

        <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:gap-x-10 2xl:gap-x-14">
          <nav
            aria-label="Registration steps"
            className="shrink-0 xl:sticky xl:top-6 xl:w-[11.5rem] xl:max-w-[11.5rem] 2xl:w-52 2xl:max-w-none"
          >
            <ol className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] xl:hidden [&::-webkit-scrollbar]:hidden">
              {steps.map((s) => {
                const active = s.id === step;
                const done = s.id < step;
                const IconStep = s.icon;
                return (
                  <li
                    key={s.id}
                    className={[
                      "flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-semibold",
                      done
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                        : active
                          ? "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-200"
                          : "border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",
                    ].join(" ")}
                  >
                    <IconStep className="size-3.5 shrink-0" strokeWidth={2} />
                    <span className="max-w-[8rem] truncate">{t(s.titleKey)}</span>
                  </li>
                );
              })}
            </ol>

            <ol className="relative hidden space-y-0 xl:block">
              {steps.map((s, i) => {
                const active = s.id === step;
                const done = s.id < step;
                const IconStep = s.icon;
                return (
                  <li key={s.id} className="relative flex gap-3 pb-8 last:pb-0">
                    {i < steps.length - 1 ? (
                      <span
                        className={[
                          "absolute left-[17px] top-9 z-0 w-0.5 rounded-full",
                          done
                            ? "bg-[color:var(--color-chart-success)]/50 dark:bg-[color:var(--color-chart-success)]/35"
                            : "bg-(--color-light-border-subtle) dark:bg-(--color-dark-border-subtle)",
                        ].join(" ")}
                        style={{ height: "calc(100% - 0.125rem)" }}
                        aria-hidden
                      />
                    ) : null}
                    <span
                      className={[
                        "relative z-1 flex size-9 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
                        done
                          ? "border-[color:var(--color-chart-success)] bg-[color:var(--color-chart-success)] text-white shadow-[0_0_0_4px_rgba(16,185,129,0.2)]"
                          : active
                            ? "border-[color:var(--color-light-timeline-accent)] bg-[color:var(--color-light-timeline-accent)] text-white shadow-[0_0_0_4px_rgba(0,102,255,0.22)] dark:border-[color:var(--color-dark-timeline-accent)] dark:bg-[color:var(--color-dark-timeline-accent)]"
                            : "border-(--color-light-card-border) bg-(--color-light-card-bg) text-muted dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:text-dark-muted",
                      ].join(" ")}
                    >
                      <IconStep className="size-4 shrink-0" strokeWidth={2} />
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <span
                        style={
                          active
                            ? { color: "var(--color-light-timeline-text)" }
                            : done
                              ? { color: "var(--color-chart-success)" }
                              : undefined
                        }
                        className={[
                          "block text-[11px] font-semibold leading-snug break-words",
                          !active && !done
                            ? "text-secondary dark:text-dark-secondary"
                            : "",
                          active ? "dark:!text-[color:var(--color-dark-timeline-text)]" : "",
                          done ? "dark:!text-[color:var(--color-chart-success)]" : "",
                        ].join(" ")}
                      >
                        {t(s.titleKey)}
                      </span>
                      <span className="mt-0.5 block text-[9px] text-muted opacity-90 dark:text-dark-muted">
                        {i + 1}/{steps.length}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>
          </nav>

          <div className="min-w-0 flex-1 xl:flex xl:justify-center xl:px-2">
            <div className="w-full space-y-6 xl:max-w-[48rem] 2xl:max-w-[52rem]">
              <div className="overflow-hidden rounded-2xl border border-(--color-light-success-border) bg-(--color-light-success-bg) p-4 sm:p-5 dark:border-(--color-dark-success-border) dark:bg-(--color-dark-success-bg)">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-(--color-light-success-text) dark:text-(--color-dark-success-text)">
                      {t(progressPercentKey, { pct: progressPct })}
                    </p>
                    <p className="mt-1 text-[11px] text-(--color-light-success-text) opacity-90 dark:text-(--color-dark-success-text)">
                      {t(progressHintKey)}
                    </p>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-(--color-light-card-bg) dark:bg-(--color-dark-card-bg)">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, var(--color-chart-success), var(--color-light-timeline-accent))`,
                    }}
                    initial={false}
                    animate={{ width: `${progressPct}%` }}
                    transition={{
                      type: "spring",
                      stiffness: 100,
                      damping: 22,
                      mass: 0.85,
                    }}
                  />
                </div>
              </div>

              <h2 className="text-lg font-semibold text-primary dark:text-dark-primary">
                {stepTitleKey ? t(stepTitleKey) : ""}
              </h2>

              <LayoutGroup id="faculty-reg-flow">
                <div className="min-h-[200px] space-y-5">
                  <div className="space-y-3">
                    <AnimatePresence initial={false} mode="popLayout">
                      {steps
                        .filter((s) => s.id < step && s.id < cutoff)
                        .map((s) => {
                          const DoneIcon = s.icon;
                          return (
                            <motion.div
                              key={`stack-${s.id}`}
                              layout="position"
                              initial={{ opacity: 0, y: 14 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{ duration: 0.36, ease: motionEase }}
                              className="flex items-start gap-3 rounded-xl border border-(--color-light-border-default) bg-light-app-secondary px-4 py-3 dark:border-(--color-dark-border-default) dark:bg-(--color-dark-app-secondary) dark:shadow-[var(--shadow-dark-xs)]"
                            >
                              <span
                                className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border-2 bg-(--color-light-card-bg) dark:bg-(--color-dark-card-bg)"
                                style={{
                                  borderColor: "var(--color-chart-success)",
                                  color: "var(--color-chart-success)",
                                }}
                              >
                                <DoneIcon className="size-4" strokeWidth={2} />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-semibold text-primary dark:text-dark-primary">
                                  {t(s.titleKey)}
                                </p>
                                <p className="mt-0.5 truncate text-[11px] text-secondary dark:text-dark-secondary">
                                  {completedSnippet(s.id)}
                                </p>
                              </div>
                              <CheckCircle2
                                className="mt-1 size-4 shrink-0"
                                strokeWidth={2}
                                aria-hidden
                                style={{ color: "var(--color-chart-success)" }}
                              />
                            </motion.div>
                          );
                        })}
                    </AnimatePresence>
                  </div>
                  <AnimatePresence mode="wait">{stepContent}</AnimatePresence>
                </div>
              </LayoutGroup>

              <footer className="mt-10 space-y-4 border-t border-default pt-6 dark:border-dark-default">
                <div className="flex items-center gap-2 text-[11px] text-muted dark:text-dark-muted">
                  <Clock3 className="size-3.5 shrink-0 opacity-70" />
                  <span>{t(savedHintKey)}</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-h-9 min-w-[6.5rem]">
                    {step > 1 ? (
                      <Button type="button" variant="secondary" onClick={goPrev}>
                        {t("studentForm.actions.back")}
                      </Button>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {step < steps.length ? (
                      <button
                        type="button"
                        onClick={() => void goNext()}
                        disabled={continueDisabled || actionPending}
                        className="btn-primary min-h-9 rounded-full px-6 text-xs"
                      >
                        {t("studentForm.actions.continue")}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={actionPending}
                        onClick={() => void invokeSubmitFromFooter()}
                        className="btn-primary min-h-9 min-w-40 rounded-full px-6 text-xs"
                      >
                        {actionPending
                          ? t("studentForm.actions.submitting")
                          : isEdit
                            ? t(lastSubmitEditKey)
                            : t(lastSubmitCreateKey)}
                      </button>
                    )}
                  </div>
                </div>
              </footer>
            </div>
          </div>

          <aside className="shrink-0 xl:sticky xl:top-6 xl:h-fit xl:w-[17.5rem] xl:max-w-[280px]">
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-primary dark:text-dark-primary">
                {t(summaryTitleKey)}
              </h3>
              <p className="mt-1 text-[11px] text-muted dark:text-dark-muted">
                {t(summarySubtitleKey)}
              </p>
              <ul className="mt-5 space-y-3 border-t border-default pt-5 text-[11px] dark:border-dark-default">
                {summaryLines}
              </ul>
              <div className="mt-6 flex items-center gap-2 rounded-xl bg-(--color-light-nav-hover-bg) px-3 py-2 dark:bg-(--color-dark-card-hover)">
                <Icon
                  d={IC.check}
                  className="size-3"
                  style={{ color: "var(--color-chart-success)" }}
                />
                <span className="text-[10px] font-medium text-secondary dark:text-dark-secondary">
                  Step {step} / {steps.length}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </form>
  );
}
