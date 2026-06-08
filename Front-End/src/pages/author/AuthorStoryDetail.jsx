import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Edit3,
  Eye,
  FileText,
  Globe2,
  Heart,
  MessageCircle,
  Share2,
} from "lucide-react";
import ArticleBlocksReader from "../../components/ArticleBlocksReader";
import Button from "../../components/Button";
import { useAuth } from "../../context/AuthContext";
import { derivePlainTextPreview, mapArticleToAdminBlog } from "../../lib/adminArticleMap";
import { useArticleComments, useAuthorArticleDetail } from "../../services/useApi";

function normalizeCommentsPayload(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.content)) return raw.content;
  if (Array.isArray(raw?.data?.content)) return raw.data.content;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.comments)) return raw.comments;
  return [];
}

function statusClass(status) {
  if (status === "PUBLISHED") {
    return "border-(--color-light-success-border) bg-(--color-light-success-bg) text-(--color-light-success-text) dark:border-(--color-dark-success-border) dark:bg-(--color-dark-success-bg) dark:text-(--color-dark-success-text)";
  }
  if (status === "DRAFT") {
    return "border-(--color-light-warning-border) bg-(--color-light-warning-bg) text-(--color-light-warning-text) dark:border-(--color-dark-warning-border) dark:bg-(--color-dark-warning-bg) dark:text-(--color-dark-warning-text)";
  }
  return "border-(--color-light-card-border) bg-light-app-tertiary text-secondary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-secondary";
}

function formatDate(value) {
  if (!value) return "Recently updated";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently updated";
  return date.toLocaleString();
}

function commentAuthor(comment) {
  const author = comment?.author || comment?.user || comment?.createdBy || {};
  return (
    author.displayName ||
    author.userName ||
    author.username ||
    author.name ||
    comment?.authorName ||
    comment?.username ||
    "Reader"
  );
}

function commentBody(comment) {
  return comment?.body || comment?.content || comment?.message || comment?.text || "";
}

function MetricCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
      <div className="flex items-center justify-between gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-light-app-tertiary text-primary dark:bg-dark-app-tertiary dark:text-dark-primary">
          <Icon className="size-5" strokeWidth={1.8} />
        </span>
        <span className="text-2xl font-semibold text-primary dark:text-dark-primary">
          {Number(value || 0).toLocaleString()}
        </span>
      </div>
      <p className="mt-3 text-sm font-medium text-secondary dark:text-dark-secondary">
        {label}
      </p>
    </div>
  );
}

export default function AuthorStoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const authorId = String(user?.id ?? "").trim();
  const articleId = String(id ?? "").trim();

  const articleQuery = useAuthorArticleDetail(authorId, articleId, {
    enabled: Boolean(authorId && articleId),
    notifyOnError: false,
    refetchInterval: 15000,
  });
  const commentsQuery = useArticleComments(
    articleId,
    { page: 0, size: 100 },
    {
      enabled: Boolean(articleId),
      notifyOnError: false,
    },
  );

  const article = useMemo(
    () => (articleQuery.data ? mapArticleToAdminBlog(articleQuery.data) : null),
    [articleQuery.data],
  );
  const comments = useMemo(
    () => normalizeCommentsPayload(commentsQuery.data),
    [commentsQuery.data],
  );

  const preview = article ? derivePlainTextPreview(article.blocks) : "";
  const commentCount = Math.max(Number(article?.comments || 0), comments.length);
  const metrics = [
    { label: "Views", value: article?.views ?? 0, icon: Eye },
    { label: "Likes", value: article?.claps ?? 0, icon: Heart },
    { label: "Shares", value: article?.shares ?? 0, icon: Share2 },
    { label: "Comments", value: commentCount, icon: MessageCircle },
  ];
  const maxMetric = Math.max(...metrics.map((metric) => Number(metric.value) || 0), 1);
  const maxEngagementMetric = Math.max(
    Number(article?.claps || 0),
    Number(article?.shares || 0),
    Number(commentCount || 0),
    1,
  );
  const status = article?._rawStatus || "DRAFT";
  const isPublished = status === "PUBLISHED";

  if (articleQuery.isLoading) {
    return (
      <div className="min-h-screen bg-light-app-bg p-4 dark:bg-dark-card-bg md:p-5">
        <div className="mx-auto max-w-6xl rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) px-6 py-12 text-center text-sm text-muted shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:text-dark-muted">
          Loading story...
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-light-app-bg p-4 dark:bg-dark-card-bg md:p-5">
        <div className="mx-auto max-w-6xl rounded-2xl border border-dashed border-(--color-light-card-border) bg-light-app-tertiary px-6 py-12 text-center dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
          <FileText className="mx-auto size-10 text-muted dark:text-dark-muted" strokeWidth={1.6} />
          <p className="mt-4 text-base font-semibold text-primary dark:text-dark-primary">
            Story could not be loaded
          </p>
          <p className="mt-2 text-sm text-secondary dark:text-dark-secondary">
            The story may have moved, or you may not own this article.
          </p>
          <Button
            type="button"
            variant="secondary"
            className="mt-5"
            onClick={() => navigate("/author/stories")}
          >
            Back to stories
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-app-bg p-4 dark:bg-dark-card-bg md:p-5">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="secondary"
            icon={<ArrowLeft />}
            onClick={() => navigate("/author/stories")}
          >
            Stories
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              icon={<Edit3 />}
              onClick={() =>
                navigate(`/author/writing?articleId=${encodeURIComponent(article.id)}`)
              }
            >
              Edit
            </Button>
            {isPublished ? (
              <Link to={`/story/${encodeURIComponent(article.id)}`}>
                <Button type="button" icon={<Globe2 />}>
                  Public view
                </Button>
              </Link>
            ) : null}
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
          {article.coverImageUrl ? (
            <a href={article.coverImageUrl} target="_blank" rel="noreferrer" className="block">
              <img
                src={article.coverImageUrl}
                alt=""
                className="aspect-[21/8] w-full object-cover"
              />
            </a>
          ) : null}
          <div className="p-5 md:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusClass(status)}`}
              >
                {isPublished ? "Published" : "Draft"}
              </span>
              {article.visibility ? (
                <span className="rounded-full border border-(--color-light-card-border) bg-light-app-tertiary px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-secondary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-secondary">
                  {article.visibility}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted dark:text-dark-muted">
                <CalendarDays className="size-3.5" strokeWidth={1.8} />
                {formatDate(article.date)}
              </span>
            </div>
            <h1 className="mt-4 max-w-4xl break-words text-3xl font-bold tracking-tight text-primary dark:text-dark-primary md:text-4xl">
              {article.title}
            </h1>
            {article.excerpt ? (
              <p className="mt-3 max-w-3xl text-base leading-7 text-secondary dark:text-dark-secondary">
                {article.excerpt}
              </p>
            ) : null}
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-5 shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) md:p-6">
            <ArticleBlocksReader
              blocks={article.blocks}
              className="text-[16px] leading-7"
            />
            {!article.blocks?.length && preview ? (
              <p className="whitespace-pre-wrap text-sm leading-7 text-secondary dark:text-dark-secondary">
                {preview}
              </p>
            ) : null}
          </section>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-5 shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-5 text-primary dark:text-dark-primary" strokeWidth={1.8} />
                <h2 className="text-base font-semibold text-primary dark:text-dark-primary">
                  Engagement chart
                </h2>
              </div>
              <div className="mt-5 space-y-4">
                {metrics.map((metric) => (
                  <div key={metric.label}>
                    <div className="mb-1 flex items-center justify-between text-xs font-semibold text-secondary dark:text-dark-secondary">
                      <span>{metric.label}</span>
                      <span>{Number(metric.value || 0).toLocaleString()}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-(--color-light-card-bg) dark:bg-(--color-dark-card-bg)">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        title={`${metric.label}: ${Number(metric.value || 0).toLocaleString()}`}
                        style={{
                          background:
                            "linear-gradient(90deg, var(--color-chart-success), var(--color-light-timeline-accent))",
                          width: `${Math.max(
                            ((Number(metric.value) || 0) /
                              (metric.label === "Views" ? maxMetric : maxEngagementMetric)) *
                              100,
                            Number(metric.value) ? 8 : 0,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-5 shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
              <h2 className="text-base font-semibold text-primary dark:text-dark-primary">
                Comments
              </h2>
              <div className="mt-4 space-y-3">
                {comments.length ? (
                  comments.slice(0, 5).map((comment) => (
                    <div
                      key={comment.id ?? comment.commentId ?? comment.createdAt}
                      className="rounded-xl border border-light-divider bg-light-app-tertiary p-3 dark:border-dark-divider dark:bg-dark-app-tertiary"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-primary dark:text-dark-primary">
                          {commentAuthor(comment)}
                        </p>
                        <span className="shrink-0 text-[11px] text-muted dark:text-dark-muted">
                          {formatDate(comment.createdAt || comment.updatedAt)}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-secondary dark:text-dark-secondary">
                        {commentBody(comment)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl border border-dashed border-(--color-light-card-border) bg-light-app-tertiary p-4 text-sm text-muted dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-muted">
                    No comments yet.
                  </p>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
