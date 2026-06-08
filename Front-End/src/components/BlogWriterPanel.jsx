import { useTranslation } from "react-i18next";
import PersonAvatar from "./PersonAvatar";

export default function BlogWriterPanel({
  blog,
  blogs = [],
  totalsOverride,
}) {
  const { t } = useTranslation();
  const totalPosts =
    totalsOverride?.total ??
    blogs.filter((item) => item.author === blog.author).length;
  const publishedPosts =
    totalsOverride?.published ??
    blogs.filter(
      (item) => item.author === blog.author && item.status === "published",
    ).length;
  const pendingPosts =
    totalsOverride?.pending ??
    blogs.filter(
      (item) => item.author === blog.author && item.status === "pending",
    ).length;
  const authorProfile = blog.authorProfile ?? {};

  return (
    <div className="rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-5 shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <PersonAvatar
            person={authorProfile}
            sizeClass="inline-flex size-16 shrink-0 overflow-hidden rounded-full"
            className="ring-2 ring-light-divider dark:ring-dark-divider"
          />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-primary dark:text-dark-primary">
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
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary p-3 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
            <p className="text-xs text-muted dark:text-dark-muted">
              {t("blogAdmin.detail.writer.posts")}
            </p>
            <p className="mt-1 text-lg font-semibold text-primary dark:text-dark-primary">
              {totalPosts}
            </p>
          </div>
          <div className="rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary p-3 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
            <p className="text-xs text-muted dark:text-dark-muted">
              {t("blogAdmin.detail.writer.published")}
            </p>
            <p className="mt-1 text-lg font-semibold text-primary dark:text-dark-primary">
              {publishedPosts}
            </p>
          </div>
          <div className="rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary p-3 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
            <p className="text-xs text-muted dark:text-dark-muted">
              {t("blogAdmin.detail.writer.pending")}
            </p>
            <p className="mt-1 text-lg font-semibold text-primary dark:text-dark-primary">
              {pendingPosts}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
