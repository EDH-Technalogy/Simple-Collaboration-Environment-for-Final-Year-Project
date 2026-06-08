import { useTranslation } from "react-i18next";

export default function BlogReviewPanel({ blog, statusLabels }) {
  const { t } = useTranslation();

  return (
    <div className="rounded-md border border-default bg-shell p-5 dark:border-dark-default dark:bg-dark-shell">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-md border border-default bg-card p-4 dark:border-dark-default dark:bg-dark-card">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted dark:text-dark-muted">
            {t("blogAdmin.detail.review.currentState")}
          </p>
          <p className="mt-2 text-base font-semibold text-primary dark:text-dark-primary">
            {statusLabels[blog.status]}
          </p>
          <p className="mt-1 text-sm text-secondary dark:text-dark-secondary">
            {blog.status === "published"
              ? t("blogAdmin.detail.review.visible")
              : t("blogAdmin.detail.review.adminControl")}
          </p>
        </div>
        <div className="rounded-md border border-default bg-card p-4 dark:border-dark-default dark:bg-dark-card">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted dark:text-dark-muted">
            {t("blogAdmin.detail.review.checklist")}
          </p>
          <p className="mt-2 text-sm leading-6 text-secondary dark:text-dark-secondary">
            {t("blogAdmin.detail.review.checklistDescription")}
          </p>
        </div>
      </div>
    </div>
  );
}
