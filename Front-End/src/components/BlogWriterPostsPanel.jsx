import { CalendarDays, Clock3 } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "../lib/utils";

export default function BlogWriterPostsPanel({
  author,
  authorBlogs,
  statusLabels,
  statusStyles,
}) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-5 shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
      <div>
        <p className="text-sm font-semibold text-primary dark:text-dark-primary">
          {t("blogAdmin.detail.writerPosts.title", { author })}
        </p>
        <p className="mt-1 text-sm text-secondary dark:text-dark-secondary">
          {t("blogAdmin.detail.writerPosts.description")}
        </p>
      </div>
      <div className="mt-5 grid gap-3">
        {authorBlogs.length ? (
          authorBlogs.map((item) => (
            <Link
              key={item.id}
              to={`/admin/blogs/${item.id}`}
              className="group grid gap-4 rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary p-3 transition-colors hover:border-(--color-light-input-border-focus) dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:hover:border-(--color-dark-input-border-focus) sm:grid-cols-[7rem_minmax(0,1fr)]"
            >
              <div className="aspect-[4/3] overflow-hidden rounded-lg border border-(--color-light-card-border) bg-(--color-light-card-bg) dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
                {item.coverImageUrl ? (
                  <img
                    src={item.coverImageUrl}
                    alt=""
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-light-app-bg text-xs font-semibold text-muted dark:bg-dark-card-bg dark:text-dark-muted">
                    {t("blogAdmin.common.noThumbnail")}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold",
                      statusStyles[item.status],
                    )}
                  >
                    {statusLabels[item.status]}
                  </span>
                  {item.date ? (
                    <span className="inline-flex items-center gap-1 text-xs text-muted dark:text-dark-muted">
                      <CalendarDays className="size-3.5" strokeWidth={1.8} />
                      {format(new Date(item.date), "yyyy-MM-dd")}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1 text-xs text-muted dark:text-dark-muted">
                    <Clock3 className="size-3.5" strokeWidth={1.8} />
                    {typeof item.readTime === "number"
                      ? t("blogAdmin.common.readMinutes", { count: item.readTime })
                      : item.readTime}
                  </span>
                </div>
                <p className="mt-3 line-clamp-1 text-sm font-semibold text-primary dark:text-dark-primary">
                  {item.title}
                </p>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-secondary dark:text-dark-secondary">
                  {item.excerpt || t("blogAdmin.detail.noSummary")}
                </p>
              </div>
            </Link>
          ))
        ) : (
          <p className="text-sm text-secondary dark:text-dark-secondary">
            {t("blogAdmin.detail.writerPosts.empty")}
          </p>
        )}
      </div>
    </div>
  );
}
