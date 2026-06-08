import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCheck,
  Clock3,
  Eye,
  Heart,
  Loader2,
  MessageCircle,
  NotebookText,
  PanelsTopLeft,
  Send,
  Share2,
  UserRound,
  XCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import ArticleBlocksReader from "../../components/ArticleBlocksReader";
import BlogDetailTabs from "../../components/BlogDetailTabs";
import BlogOverviewPanel from "../../components/BlogOverviewPanel";
import BlogWriterPanel from "../../components/BlogWriterPanel";
import BlogWriterPostsPanel from "../../components/BlogWriterPostsPanel";
import Button from "../../components/Button";
import PersonAvatar from "../../components/PersonAvatar";
import StatusPill from "../../components/StatusPill";
import {
  derivePlainTextPreview,
  mapArticleToAdminBlog,
} from "../../lib/adminArticleMap";
import { cn } from "../../lib/utils";
import {
  useArticle,
  useArticlesByAuthor,
  useDeleteArticle,
  usePublishArticle,
  useUpdateArticle,
} from "../../services/useApi";

const SURFACE_CARD =
  "rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)";
const SURFACE_SUB =
  "rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary";

/** Pills inside writer posts links (dense list). */
const writerPostStatusStyles = {
  pending:
    "bg-(--color-light-warning-bg) text-(--color-light-warning-text) ring-1 ring-inset ring-(--color-light-warning-border) dark:bg-(--color-dark-warning-bg) dark:text-(--color-dark-warning-text) dark:ring-(--color-dark-warning-border)",
  accepted:
    "bg-light-app-tertiary text-primary ring-1 ring-inset ring-(--color-light-card-border) dark:bg-dark-app-tertiary dark:text-dark-primary dark:ring-(--color-dark-card-border)",
  published:
    "bg-(--color-light-success-bg) text-(--color-light-success-text) ring-1 ring-inset ring-(--color-light-success-border) dark:bg-(--color-dark-success-bg) dark:text-(--color-dark-success-text) dark:ring-(--color-dark-success-border)",
  rejected:
    "bg-(--color-light-error-bg) text-(--color-light-error-text) ring-1 ring-inset ring-(--color-light-error-border) dark:bg-(--color-dark-error-bg) dark:text-(--color-dark-error-text) dark:ring-(--color-dark-error-border)",
  draft:
    "bg-light-app-tertiary text-secondary ring-1 ring-inset ring-(--color-light-card-border) dark:bg-dark-app-tertiary dark:text-dark-secondary dark:ring-(--color-dark-card-border)",
};

function blogUiStatusToPill(status) {
  const s = (status ?? "").toLowerCase();
  if (s === "published") return "success";
  if (s === "pending") return "warning";
  if (s === "rejected") return "error";
  if (s === "accepted") return "info";
  return "neutral";
}

function ModerationToolbar({ blog, onPublish, onReject, onDraft, busy }) {
  const { t } = useTranslation();
  const ui = blog?.status;

  return (
    <div className="flex flex-wrap gap-2">
      {ui === "pending" && (
        <>
          <Button
            type="button"
            variant="primary"
            className="gap-2"
            disabled={busy}
            onClick={() => onPublish()}
          >
            <CheckCheck className="size-4" strokeWidth={2} />
            {t("blogAdmin.detail.actions.publishArticle")}
          </Button>
          <Button
            type="button"
            variant="danger"
            className="gap-2"
            disabled={busy}
            onClick={() => onReject()}
          >
            <XCircle className="size-4" strokeWidth={2} />
            {t("blogAdmin.detail.actions.rejectArticle")}
          </Button>
        </>
      )}
      {ui === "published" && (
        <Button
          type="button"
          variant="tertiary"
          disabled={busy}
          onClick={() => onDraft()}
        >
          {t("blogAdmin.actions.moveToDraft")}
        </Button>
      )}
      {(ui === "draft" || ui === "accepted" || ui === "rejected") && (
        <Button
          type="button"
          variant="primary"
          className="gap-2"
          disabled={busy}
          onClick={() => onPublish()}
        >
          <Send className="size-4" strokeWidth={2} />
          {t("blogAdmin.actions.publishNow")}
        </Button>
      )}
    </div>
  );
}

export default function BlogDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const articleId = id ? String(id) : "";

  const {
    data: article,
    isLoading,
    isError,
    refetch,
  } = useArticle(articleId, {
    enabled: Boolean(articleId),
  });

  const blog = useMemo(() => {
    if (!article) return null;
    const b = mapArticleToAdminBlog(article);
    const preview = derivePlainTextPreview(b.blocks);
    return {
      ...b,
      excerpt:
        b.excerpt?.trim() ||
        preview.slice(0, 500) ||
        t("blogAdmin.detail.noSummary"),
      contentHtml: "",
    };
  }, [article, t]);

  const authorId = blog?.authorId;
  const { data: authorPage } = useArticlesByAuthor(
    authorId ?? "",
    { page: 0, pageSize: 40 },
    { enabled: Boolean(authorId), notifyOnError: false },
  );

  const authorRows = authorPage?.data ?? authorPage?.content ?? [];

  const authorBlogs = useMemo(() => {
    return authorRows
      .map((raw) => mapArticleToAdminBlog(raw))
      .filter((item) => String(item.id) !== String(blog?.id));
  }, [authorRows, blog?.id]);

  const writerTotals = useMemo(() => {
    const allAuthor = [...authorRows.map((raw) => mapArticleToAdminBlog(raw))];
    if (blog && !allAuthor.some((x) => String(x.id) === String(blog.id))) {
      allAuthor.push(blog);
    }
    return {
      total: allAuthor.length,
      published: allAuthor.filter((x) => x.status === "published").length,
      pending: allAuthor.filter((x) => x.status === "pending").length,
    };
  }, [authorRows, blog]);

  const publishMutation = usePublishArticle({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      refetch();
    },
  });
  const deleteMutation = useDeleteArticle({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      navigate("/admin/blogs");
    },
  });
  const updateMutation = useUpdateArticle({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      refetch();
    },
  });

  const busy =
    publishMutation.isPending ||
    deleteMutation.isPending ||
    updateMutation.isPending;

  const [activeTab, setActiveTab] = useState("overview");

  const statusLabels = {
    pending: t("blogAdmin.status.pendingReview"),
    accepted: t("blogAdmin.status.accepted"),
    published: t("blogAdmin.status.published"),
    rejected: t("blogAdmin.status.rejected"),
    draft: t("blogAdmin.status.draft"),
  };

  const tabs = [
    {
      id: "overview",
      label: t("blogAdmin.detail.tabs.overview"),
      icon: PanelsTopLeft,
    },
    { id: "writer", label: t("blogAdmin.detail.tabs.writer"), icon: UserRound },
    {
      id: "posts",
      label: t("blogAdmin.detail.tabs.posts"),
      icon: NotebookText,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-1 flex-col items-center justify-center gap-3 bg-light-app-bg px-4 dark:bg-dark-card-bg">
        <Loader2
          className="size-9 animate-spin text-(--color-chart-success)"
          strokeWidth={2}
          aria-hidden
        />
        <p className="text-sm font-medium text-muted dark:text-dark-muted">
          {t("blogAdmin.detail.loading")}
        </p>
      </div>
    );
  }

  if (isError || !blog) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center bg-light-app-bg px-4 dark:bg-dark-card-bg">
        <div className={cn(SURFACE_CARD, "max-w-md p-8 text-center shadow-md")}>
          <h1 className="text-2xl font-bold text-primary dark:text-dark-primary">
            {t("blogAdmin.detail.notFound.title")}
          </h1>
          <p className="mt-3 text-sm leading-6 text-secondary dark:text-dark-secondary">
            {t("blogAdmin.detail.notFound.description")}
          </p>
          <Link to="/admin/blogs" className="mt-6 inline-flex">
            <Button type="button" variant="primary">
              {t("blogAdmin.detail.notFound.back")}
            </Button>
          </Link>
          <button
            type="button"
            className="mt-4 ml-4 text-sm font-semibold text-primary underline dark:text-dark-primary"
            onClick={() => refetch()}
          >
            {t("blogAdmin.retry")}
          </button>
        </div>
      </div>
    );
  }

  const formattedDate = blog.date
    ? format(new Date(blog.date), "MMMM d, yyyy")
    : t("blogAdmin.common.noDate");

  const readLabel =
    typeof blog.readTime === "number"
      ? t("blogAdmin.common.readMinutes", { count: blog.readTime })
      : blog.readTime;

  const overviewBlog = {
    ...blog,
    readTime: readLabel,
  };

  const handlePublish = () => {
    if (!blog.authorId) return;
    publishMutation.mutate({
      articleId: blog.id,
      authorId: blog.authorId,
      visibility: "PUBLIC",
    });
  };

  const handleReject = () => {
    if (!blog.authorId) return;
    deleteMutation.mutate({
      articleId: blog.id,
      authorId: blog.authorId,
    });
  };

  const handleDraft = () => {
    if (!blog.authorId) return;
    updateMutation.mutate({
      articleId: blog.id,
      authorId: blog.authorId,
      status: "DRAFT",
    });
  };

  /** BlogWriterPanel augmented */
  const panelBlog = blog;

  return (
    <div className="min-h-screen flex-1 bg-light-app-bg p-4 md:p-5 dark:bg-dark-card-bg">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className={SURFACE_CARD}>
          <div className="border-b border-light-divider px-4 py-5 dark:border-dark-divider md:px-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <Link
                  to="/admin/blogs"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-primary dark:text-dark-muted dark:hover:text-dark-primary"
                >
                  <ArrowLeft className="size-4" strokeWidth={2} aria-hidden />
                  {t("blogAdmin.detail.backToCollection")}
                </Link>
                <h1 className="mt-4 text-2xl font-bold tracking-tight text-primary dark:text-dark-primary md:text-3xl">
                  {blog.title}
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-secondary dark:text-dark-secondary md:text-base">
                  {blog.excerpt}
                </p>
              </div>
              <StatusPill variant={blogUiStatusToPill(blog.status)}>
                {statusLabels[blog.status]}
              </StatusPill>
            </div>
          </div>
          <div className={`${SURFACE_SUB} mx-4 my-4 p-4 md:mx-6 md:my-5`}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-primary dark:text-dark-primary">
                  {blog.title}
                </p>
                <p className="mt-2 text-xs text-muted dark:text-dark-muted">
                  {t("blogAdmin.detail.moderation.title")}
                </p>
              </div>
              <ModerationToolbar
                blog={blog}
                busy={busy}
                onPublish={handlePublish}
                onReject={handleReject}
                onDraft={handleDraft}
              />
            </div>
          </div>
        </section>

        <section className={`${SURFACE_CARD} overflow-hidden`}>
          <div className="border-b border-light-divider px-4 py-4 dark:border-dark-divider md:px-6">
            <BlogDetailTabs
              tabs={tabs}
              activeTab={activeTab}
              onChange={setActiveTab}
            />
          </div>
          <div className="space-y-6 px-4 py-5 md:px-6 md:py-6">
            {activeTab === "overview" && (
              <BlogOverviewPanel
                blog={overviewBlog}
                formattedDate={formattedDate}
              />
            )}

            {activeTab === "writer" && (
              <BlogWriterPanel
                blog={panelBlog}
                blogs={[]}
                totalsOverride={writerTotals}
              />
            )}

            {activeTab === "posts" && (
              <BlogWriterPostsPanel
                author={panelBlog.author}
                authorBlogs={authorBlogs}
                statusLabels={statusLabels}
                statusStyles={writerPostStatusStyles}
              />
            )}

          </div>
        </section>

        <article className={SURFACE_CARD}>
          <div className="border-b border-light-divider px-4 py-5 dark:border-dark-divider md:px-8">
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted dark:text-dark-muted">
              <span className="rounded-full border border-(--color-light-card-border) bg-light-app-tertiary px-3 py-1 text-xs font-semibold text-secondary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-secondary">
                {blog.category}
              </span>
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="size-4 shrink-0" strokeWidth={2} />
                {formattedDate}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 className="size-4 shrink-0" strokeWidth={2} />
                {readLabel}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-light-divider px-4 py-4 dark:border-dark-divider md:px-8">
            <div className="flex items-center gap-3">
              <PersonAvatar
                person={blog.authorProfile}
                sizeClass="inline-flex size-11 shrink-0 overflow-hidden rounded-full"
              />
              <div>
                <p className="text-sm font-semibold text-primary dark:text-dark-primary">
                  {blog.author}
                </p>
                <p className="text-xs text-muted dark:text-dark-muted">
                  {blog.authorEmail || blog.authorUsername || blog.authorRole}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-5 text-sm text-muted dark:text-dark-muted">
              <span className="inline-flex items-center gap-2">
                <Heart className="size-4" strokeWidth={2} aria-hidden />
                {t("blogAdmin.detail.metrics.claps", {
                  count: blog.claps,
                })}
              </span>
              <span className="inline-flex items-center gap-2">
                <MessageCircle className="size-4" strokeWidth={2} aria-hidden />
                {t("blogAdmin.detail.metrics.comments", {
                  count: blog.comments,
                })}
              </span>
              <span className="inline-flex items-center gap-2">
                <Eye className="size-4" strokeWidth={2} aria-hidden />
                {t("blogAdmin.detail.metrics.views", {
                  count: Number(blog.views ?? 0).toLocaleString(),
                })}
              </span>
              <span className="inline-flex items-center gap-2">
                <BookOpen className="size-4" strokeWidth={2} aria-hidden />
                {t("blogAdmin.detail.metrics.reads", {
                  count: Number(blog.reads ?? 0).toLocaleString(),
                })}
              </span>
              <button
                type="button"
                className="inline-flex items-center gap-2 font-semibold text-primary transition-colors hover:text-secondary dark:text-dark-primary dark:hover:text-dark-secondary"
              >
                <Share2 className="size-4" strokeWidth={2} aria-hidden />
                {t("blogAdmin.detail.share")}
              </button>
            </div>
          </div>

          <div className="px-4 py-8 md:px-8 md:py-10">
            {blog.coverImageUrl ? (
              <div className="mx-auto mb-10 max-w-5xl overflow-hidden rounded-xl border border-light-divider dark:border-dark-divider">
                <img
                  src={blog.coverImageUrl}
                  alt=""
                  className="max-h-[420px] w-full object-cover"
                />
              </div>
            ) : null}

            <section className="mx-auto max-w-3xl">
              {blog.blocks?.length ? (
                <ArticleBlocksReader blocks={blog.blocks} />
              ) : (
                <p className="text-secondary dark:text-dark-secondary">
                  {blog.excerpt}
                </p>
              )}

              {blog.tags?.length > 0 && (
                <div className="mt-12 flex flex-wrap gap-2 border-t border-light-divider pt-8 dark:border-dark-divider">
                  {blog.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`${SURFACE_SUB} px-4 py-2 text-sm font-medium text-secondary dark:text-dark-secondary`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </section>
          </div>
        </article>

        {!authorId && !busy ? (
          <p className="text-center text-xs text-muted dark:text-dark-muted">
            {t("blogAdmin.detail.authorIdMissing")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
