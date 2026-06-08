import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Heart,
  MessageCircle,
  Send,
  Star,
  Undo2,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { cn } from "../lib/utils";

const STATUS_STYLES = {
  pending:
    "bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/20",
  accepted:
    "bg-sky-100 text-sky-800 ring-1 ring-inset ring-sky-200 dark:bg-sky-500/15 dark:text-sky-200 dark:ring-sky-400/20",
  published:
    "bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/20",
  rejected:
    "bg-rose-100 text-rose-800 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-400/20",
  draft:
    "bg-slate-200 text-slate-700 ring-1 ring-inset ring-slate-300 dark:bg-slate-500/15 dark:text-slate-200 dark:ring-slate-400/20",
};

function formatBlogDate(date) {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  return format(parsed, "MMM d, yyyy");
}

function storyInitials(name) {
  return (
    String(name ?? "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "A"
  );
}

function ActionButton({ children, tone = "default", className, ...props }) {
  const toneClass =
    tone === "primary"
      ? "bg-primary text-white hover:opacity-90"
      : tone === "success"
        ? "bg-emerald-600 text-white hover:bg-emerald-700"
        : tone === "danger"
          ? "bg-rose-600 text-white hover:bg-rose-700"
          : "border border-default bg-card text-primary hover:bg-card-2 dark:border-dark-default dark:bg-dark-card dark:text-dark-primary dark:hover:bg-dark-card-2";

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors",
        toneClass,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export default function BlogModerationCard({
  blog,
  showActions = false,
  onStatusChange,
  onToggleFeatured,
  linkTo,
}) {
  const { t } = useTranslation();
  const statusLabels = {
    pending: t("blogAdmin.status.pendingShort"),
    accepted: t("blogAdmin.status.accepted"),
    published: t("blogAdmin.status.published"),
    rejected: t("blogAdmin.status.rejected"),
    draft: t("blogAdmin.status.draft"),
  };
  const authorImage =
    blog.authorProfile?.profilePicture ||
    blog.authorProfile?.profilePhotoUrl ||
    blog.authorProfile?.photoUrl ||
    "";
  const formattedDate = formatBlogDate(blog.date);
  const readTime =
    typeof blog.readTime === "number"
      ? t("blogAdmin.common.readMinutes", { count: blog.readTime })
      : blog.readTime;

  return (
    <article className="group flex h-full overflow-hidden rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
      <div className="flex w-full flex-col">
        <div className="relative aspect-[16/10] overflow-hidden bg-light-app-tertiary dark:bg-dark-app-tertiary">
          {blog.coverImageUrl ? (
            <img
              src={blog.coverImageUrl}
              alt=""
              className="size-full object-cover transition duration-300 group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="flex size-full items-center justify-center px-5 text-center text-sm font-semibold text-muted dark:text-dark-muted">
              {blog.category || t("blogAdmin.common.noThumbnail")}
            </div>
          )}
          <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
            <span
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-semibold shadow-sm backdrop-blur",
                STATUS_STYLES[blog.status],
              )}
            >
              {statusLabels[blog.status]}
            </span>
            {readTime && readTime !== "—" ? (
              <span className="rounded-full bg-(--color-light-card-bg)/92 px-3 py-1 text-[11px] font-semibold text-secondary shadow-sm backdrop-blur dark:bg-(--color-dark-card-bg)/92 dark:text-dark-secondary">
                {readTime}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4 md:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {authorImage ? (
                <img
                  src={authorImage}
                  alt=""
                  className="size-9 rounded-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="flex size-9 items-center justify-center rounded-full bg-light-app-tertiary text-[11px] font-bold text-primary dark:bg-dark-app-tertiary dark:text-dark-primary">
                  {storyInitials(blog.author)}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-primary dark:text-dark-primary">
                  {blog.author}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-muted dark:text-dark-muted">
                  <CalendarDays className="size-3.5" strokeWidth={1.8} />
                  {formattedDate || t("blogAdmin.common.noDate")}
                </p>
              </div>
            </div>

            {blog.category ? (
              <span className="max-w-28 truncate rounded-full bg-light-app-tertiary px-2.5 py-1 text-[11px] font-semibold text-secondary dark:bg-dark-app-tertiary dark:text-dark-secondary">
                {blog.category}
              </span>
            ) : null}

            {onToggleFeatured ? (
              <button
                type="button"
                onClick={() => onToggleFeatured(blog.id)}
                className={cn(
                  "inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) text-primary transition-colors hover:bg-light-app-tertiary dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:text-dark-primary dark:hover:bg-dark-app-tertiary",
                  blog.featured &&
                    "border-(--color-light-success-border) bg-light-success-bg text-light-success-text dark:border-dark-success-border dark:bg-dark-success-bg dark:text-(--color-dark-success-text)",
                )}
                aria-label={
                  blog.featured
                    ? t("blogAdmin.actions.removeFeatured")
                    : t("blogAdmin.actions.markFeatured")
                }
              >
                <Star className={cn("h-5 w-5", blog.featured && "fill-current")} />
              </button>
            ) : null}
          </div>

        <h3 className="mt-4 line-clamp-2 text-xl font-bold tracking-tight text-primary transition-colors group-hover:text-(--color-light-btn-primary-bg) dark:text-dark-primary dark:group-hover:text-(--color-dark-primary)">
          {linkTo ? (
            <Link
              to={linkTo}
              className="transition-colors"
            >
              {blog.title}
            </Link>
          ) : (
            blog.title
          )}
        </h3>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-secondary dark:text-dark-secondary">
          {blog.excerpt}
        </p>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
        <div className="flex items-center gap-3 text-xs font-semibold text-muted dark:text-dark-muted">
          <span className="inline-flex items-center gap-1">
            <Heart className="size-3.5" strokeWidth={1.8} />
            {blog.claps ?? 0}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="size-3.5" strokeWidth={1.8} />
            {blog.comments ?? 0}
          </span>
          {readTime && readTime !== "—" ? (
            <span className="inline-flex items-center gap-1">
              <Clock3 className="size-3.5" strokeWidth={1.8} />
              {readTime}
            </span>
          ) : null}
        </div>

        {linkTo ? (
          <Link
            to={linkTo}
            className="inline-flex items-center gap-1 text-sm font-semibold text-(--color-light-btn-primary-bg) dark:text-(--color-dark-primary)"
          >
            {t("blogAdmin.actions.reviewArticle")}
            <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.8} />
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-(--color-light-btn-primary-bg) dark:text-(--color-dark-primary)">
            {t("blogAdmin.actions.reviewArticle")}
            <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.8} />
          </span>
        )}
      </div>

      {blog.tags?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {blog.tags?.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-(--color-light-card-border) bg-light-app-tertiary px-2.5 py-1 text-[11px] font-semibold text-secondary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-secondary"
            >
              #{tag}
            </span>
          ))}
        </div>
      ) : null}

      {showActions && (
        <div className="mt-6 flex flex-wrap gap-2 border-t border-default/70 pt-5 dark:border-dark-default">
          {blog.status === "pending" && (
            <>
              <ActionButton
                tone="success"
                onClick={() => onStatusChange?.(blog.id, "accepted")}
              >
                <CheckCircle2 className="size-4" strokeWidth={1.9} />
                {t("blogAdmin.actions.accept")}
              </ActionButton>
              <ActionButton
                tone="danger"
                onClick={() => onStatusChange?.(blog.id, "rejected")}
              >
                <XCircle className="size-4" strokeWidth={1.9} />
                {t("blogAdmin.actions.reject")}
              </ActionButton>
            </>
          )}

          {blog.status === "accepted" && (
            <>
              <ActionButton
                tone="primary"
                onClick={() => onStatusChange?.(blog.id, "published")}
              >
                <Send className="size-4" strokeWidth={1.9} />
                {t("blogAdmin.actions.publishNow")}
              </ActionButton>
              <ActionButton
                onClick={() => onStatusChange?.(blog.id, "pending")}
              >
                <Undo2 className="size-4" strokeWidth={1.9} />
                {t("blogAdmin.actions.backToWaiting")}
              </ActionButton>
            </>
          )}

          {blog.status === "published" && (
            <>
              <ActionButton
                onClick={() => onStatusChange?.(blog.id, "accepted")}
              >
                <Undo2 className="size-4" strokeWidth={1.9} />
                {t("blogAdmin.actions.unpublish")}
              </ActionButton>
              <ActionButton onClick={() => onStatusChange?.(blog.id, "draft")}>
                <Undo2 className="size-4" strokeWidth={1.9} />
                {t("blogAdmin.actions.moveToDraft")}
              </ActionButton>
            </>
          )}

          {blog.status === "rejected" && (
            <ActionButton
              tone="success"
              onClick={() => onStatusChange?.(blog.id, "accepted")}
            >
              <CheckCircle2 className="size-4" strokeWidth={1.9} />
              {t("blogAdmin.actions.restoreAndAccept")}
            </ActionButton>
          )}

          {blog.status === "draft" && (
            <ActionButton
              tone="primary"
              onClick={() => onStatusChange?.(blog.id, "pending")}
            >
              <Send className="size-4" strokeWidth={1.9} />
              {t("blogAdmin.actions.sendForApproval")}
            </ActionButton>
          )}
        </div>
      )}
        </div>
      </div>
    </article>
  );
}
