import Button from "./Button";
import GlobalModal from "./GlobalModal";

export default function SensitiveActionModal({
  open,
  setOpen,
  title,
  subtitle,
  confirmLabel,
  cancelLabel = "Cancel",
  confirmVariant = "danger",
  onConfirm,
  submitting = false,
  confirmDisabled = false,
  warning,
  summaryItems = [],
  children,
  className = "max-w-[28rem]",
}) {
  return (
    <GlobalModal
      variant="center"
      open={open}
      setOpen={setOpen}
      isClose
      title={title}
      subtitle={subtitle}
      className={className}
      footer={
        <>
          <Button
            type="button"
            variant="tertiary"
            disabled={submitting}
            onClick={() => setOpen?.(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            disabled={submitting || confirmDisabled}
            onClick={() => void onConfirm?.()}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {summaryItems.length ? (
          <div className="rounded-xl border border-default bg-light-app-tertiary p-4 dark:border-dark-default dark:bg-dark-app-tertiary">
            <div className="space-y-2">
              {summaryItems.map((item) => (
                <div
                  key={`${item.label}-${item.value}`}
                  className="flex flex-wrap items-start gap-2 text-xs"
                >
                  <span className="font-medium text-muted dark:text-dark-muted">
                    {item.label}
                  </span>
                  <span
                    className={
                      item.mono
                        ? "rounded bg-light-card-bg px-2 py-0.5 font-mono text-secondary dark:bg-dark-card-bg dark:text-dark-secondary"
                        : "font-medium text-primary dark:text-dark-primary"
                    }
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {children}

        {warning ? (
          <p className="text-xs font-medium text-light-error-text dark:text-dark-error-text">
            {warning}
          </p>
        ) : null}
      </div>
    </GlobalModal>
  );
}
