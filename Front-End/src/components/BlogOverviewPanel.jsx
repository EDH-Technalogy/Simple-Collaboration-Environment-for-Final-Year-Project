import { useTranslation } from "react-i18next";
import PersonAvatar from "./PersonAvatar";

export default function BlogOverviewPanel({ blog, formattedDate }) {
  const { t } = useTranslation();
  const authorProfile = blog.authorProfile ?? {};

  return (
    <div className="rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-5 shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary p-4 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted dark:text-dark-muted">
            {t("blogAdmin.detail.overview.writer")}
          </p>
          <div className="mt-4 flex min-w-0 items-center gap-3">
            <PersonAvatar
              person={authorProfile}
              sizeClass="inline-flex size-14 shrink-0 overflow-hidden rounded-full"
              className="ring-2 ring-white dark:ring-dark-card-bg"
            />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-primary dark:text-dark-primary">
                {blog.author}
              </p>
              <p className="truncate text-sm text-secondary dark:text-dark-secondary">
                {blog.authorEmail || t("blogAdmin.detail.writer.noEmail")}
              </p>
              <p className="mt-1 truncate text-xs font-medium text-muted dark:text-dark-muted">
                {blog.authorUsername || blog.authorRole}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary p-4 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted dark:text-dark-muted">
            {t("blogAdmin.detail.overview.category")}
          </p>
          <p className="mt-2 text-base font-semibold text-primary dark:text-dark-primary">
            {blog.category}
          </p>
          <p className="mt-1 text-sm text-secondary dark:text-dark-secondary">
            {blog.readTime} • {formattedDate}
          </p>
        </div>
        <div className="rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary p-4 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted dark:text-dark-muted">
            {t("blogAdmin.detail.overview.performance")}
          </p>
          <p className="mt-2 text-base font-semibold text-primary dark:text-dark-primary">
            {t("blogAdmin.detail.overview.performanceValue", {
              claps: blog.claps,
              comments: blog.comments,
            })}
          </p>
          <p className="mt-1 text-sm text-secondary dark:text-dark-secondary">
            {Number(blog.views ?? 0).toLocaleString()} views •{" "}
            {Number(blog.reads ?? 0).toLocaleString()} reads
          </p>
        </div>
      </div>
    </div>
  );
}
