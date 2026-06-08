import { useTranslation } from "react-i18next";

export default function DocumentViewerLoading({ className = "" }) {
  const { t } = useTranslation();
  return (
    <div
      className={
        "flex min-h-32 items-center justify-center rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) text-sm text-muted dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:text-dark-muted " +
        className
      }
      role="status"
      aria-live="polite"
    >
      {t("documentViewer.loading")}
    </div>
  );
}
