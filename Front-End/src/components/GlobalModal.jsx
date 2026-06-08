import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "../lib/utils";

/**
 * Unified overlay: centered dialog or trailing sheet (`variant="sheet"`).
 * Pass `footer` for action rows (settings forms, confirms).
 */
export default function GlobalModal({
  open,
  setOpen,
  children,
  isClose = false,
  variant = "center",
  title,
  subtitle,
  footer,
  className,
  sheetClassName,
  contentClassName,
  overlayClassName,
}) {
  const close = () => setOpen?.(false);
  const MotionDiv = motion.div;
  const hasHeaderBar =
    Boolean(title || subtitle) || (Boolean(isClose) && variant === "sheet");

  return createPortal(
    <AnimatePresence>
      {open ? (
        <MotionDiv
          key="modal-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className={cn(
            "fixed inset-0 z-[999] flex p-4 backdrop-blur-[2px]",
            variant === "sheet"
              ? "items-stretch justify-end bg-black/25 dark:bg-black/50 sm:justify-end sm:p-0"
              : "items-center justify-center bg-black/30 dark:bg-black/55",
            overlayClassName,
          )}
          onMouseDown={(e) => {
            if (e.target !== e.currentTarget) return;
            if (variant === "center") close();
          }}
        >
          <MotionDiv
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "global-modal-title" : undefined}
            initial={
              variant === "sheet"
                ? { x: 48, opacity: 0 }
                : { scale: 0.96, opacity: 0 }
            }
            animate={
              variant === "sheet"
                ? { x: 0, opacity: 1 }
                : { scale: 1, opacity: 1 }
            }
            exit={
              variant === "sheet"
                ? { x: 48, opacity: 0 }
                : { scale: 0.96, opacity: 0 }
            }
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              variant === "sheet"
                ? "flex h-full max-h-[100dvh] w-full flex-col bg-(--color-light-card-bg) shadow-2xl dark:bg-(--color-dark-card-bg) sm:max-w-[min(28rem,100vw)] sm:border-s sm:border-light-divider sm:dark:border-dark-divider"
                : cn(
                    "relative flex w-full max-h-[min(640px,calc(100vh-3rem))] min-h-0 flex-col overflow-hidden rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) shadow-lg dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)",
                    className ?? "max-w-lg",
                  ),
              sheetClassName,
            )}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {!hasHeaderBar && isClose && variant === "center" ? (
              <button
                type="button"
                onClick={close}
                className="absolute end-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-(--color-light-input-border) bg-(--color-light-input-bg) text-(--color-light-text-secondary) transition-colors hover:bg-(--color-light-card-hover) hover:text-primary focus-visible:ring-2 focus-visible:ring-blue-500/20 dark:border-dark-input-border dark:bg-(--color-dark-input-bg) dark:text-(--color-dark-text-secondary) dark:hover:bg-(--color-dark-card-hover) dark:hover:text-dark-primary dark:focus-visible:ring-blue-400/25"
                aria-label="Close"
              >
                <X className="size-4" strokeWidth={2} aria-hidden />
              </button>
            ) : null}

            {hasHeaderBar ? (
              <div
                className={cn(
                  "flex shrink-0 items-start gap-3 border-b border-light-divider px-5 pb-4 pt-5 dark:border-dark-divider",
                  variant === "sheet" ? "rtl:flex-row-reverse" : "",
                )}
              >
                <div className="min-w-0 flex-1">
                  {title ? (
                    <h2
                      id="global-modal-title"
                      className=" text-lg font-normal tracking-tight text-primary dark:text-dark-primary"
                    >
                      {title}
                    </h2>
                  ) : null}
                  {subtitle ? (
                    <p className="mt-1 text-xs leading-relaxed text-secondary dark:text-dark-secondary">
                      {subtitle}
                    </p>
                  ) : null}
                </div>
                {isClose ? (
                  <button
                    type="button"
                    onClick={close}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-(--color-light-input-border) bg-(--color-light-input-bg) text-(--color-light-text-secondary) transition-colors hover:bg-(--color-light-card-hover) hover:text-primary focus-visible:ring-2 focus-visible:ring-blue-500/20 dark:border-dark-input-border dark:bg-(--color-dark-input-bg) dark:text-(--color-dark-text-secondary) dark:hover:bg-(--color-dark-card-hover) dark:hover:text-dark-primary dark:focus-visible:ring-blue-400/25 rtl:rotate-180"
                    aria-label="Close"
                  >
                    <X className="size-4" strokeWidth={2} aria-hidden />
                  </button>
                ) : null}
              </div>
            ) : null}

            <div
              className={cn(
                "min-h-0 flex-1 overflow-y-auto px-5 py-4",
                contentClassName,
              )}
            >
              {children}
            </div>

            {footer ? (
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-light-divider bg-(--color-light-app-tertiary)/60 px-5 py-4 dark:border-dark-divider dark:bg-(--color-dark-app-tertiary)/40">
                {footer}
              </div>
            ) : null}
          </MotionDiv>
        </MotionDiv>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
