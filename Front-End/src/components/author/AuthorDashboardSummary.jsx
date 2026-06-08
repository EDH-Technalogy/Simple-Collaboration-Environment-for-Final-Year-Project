import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, BookOpenCheck, NotebookPen, PenLine } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useArticlesByAuthor, usePublishedArticlesByAuthor } from "../../services/useApi";

function normalizeAuthorArticles(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.content)) return raw.content;
  if (Array.isArray(raw?.data?.content)) return raw.data.content;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
}

function rawStatus(article) {
  return String(
    article?.status ??
      article?.articleStatus ??
      article?.publicationStatus ??
      article?.approvalStatus ??
      "",
  ).toUpperCase();
}

export default function AuthorDashboardSummary({ className = "" }) {
  const { t } = useTranslation();
  const { user, hasRole } = useAuth();
  const isAuthor = hasRole?.("author") || user?.role === "author";
  const authorId = String(user?.id ?? "").trim();

  const allArticlesQ = useArticlesByAuthor(
    authorId,
    { page: 0, size: 100 },
    { enabled: Boolean(isAuthor && authorId), notifyOnError: false },
  );
  const publishedQ = usePublishedArticlesByAuthor(
    authorId,
    { page: 0, size: 100 },
    { enabled: Boolean(isAuthor && authorId), notifyOnError: false },
  );

  const allArticles = useMemo(
    () => normalizeAuthorArticles(allArticlesQ.data),
    [allArticlesQ.data],
  );
  const publishedArticles = useMemo(
    () => normalizeAuthorArticles(publishedQ.data),
    [publishedQ.data],
  );
  const unpublishedCount = allArticles.filter(
    (article) => rawStatus(article) !== "PUBLISHED",
  ).length;
  const loading = allArticlesQ.isLoading || publishedQ.isLoading;

  if (!isAuthor) return null;

  const quickLinks = [
    {
      to: "/author/writing",
      icon: PenLine,
      title: t("authorDashboard.cards.writingTitle"),
      body: t("authorDashboard.cards.writingBody"),
      value: t("authorDashboard.cards.writingAction"),
    },
    {
      to: "/author/stories",
      icon: NotebookPen,
      title: t("authorDashboard.cards.unpublishedTitle"),
      body: t("authorDashboard.cards.unpublishedBody"),
      value: loading ? "..." : unpublishedCount,
    },
    {
      to: "/author/stories",
      icon: BookOpenCheck,
      title: t("authorDashboard.cards.publishedTitle"),
      body: t("authorDashboard.cards.publishedBody"),
      value: loading ? "..." : publishedArticles.length,
    },
  ];

  return (
    <section
      className={[
        "rounded-md border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 shadow-md dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted dark:text-dark-muted">
            {t("authorDashboard.embedded.eyebrow")}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-primary dark:text-dark-primary">
            {t("authorDashboard.embedded.title")}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-secondary dark:text-dark-secondary">
            {t("authorDashboard.embedded.subtitle")}
          </p>
        </div>
        <Link
          to="/author/dashboard"
          className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-(--color-light-card-border) px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-light-app-tertiary dark:border-(--color-dark-card-border) dark:text-dark-primary dark:hover:bg-dark-app-tertiary"
        >
          {t("authorDashboard.embedded.open")}
          <ArrowRight className="size-3.5" strokeWidth={1.8} aria-hidden />
        </Link>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {quickLinks.map(({ to, icon: Glyph, title, body, value }) => (
          <Link
            key={`${to}:${title}`}
            to={to}
            className="group rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary p-3 transition-colors hover:border-(--color-light-input-border-focus) dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:hover:border-(--color-dark-input-border-focus)"
          >
            <div className="flex items-start justify-between gap-3">
              <Glyph className="size-5 text-primary dark:text-dark-primary" strokeWidth={1.75} />
              <span className="text-sm font-semibold text-primary dark:text-dark-primary">
                {value}
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold text-primary dark:text-dark-primary">
              {title}
            </p>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted dark:text-dark-muted">
              {body}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
