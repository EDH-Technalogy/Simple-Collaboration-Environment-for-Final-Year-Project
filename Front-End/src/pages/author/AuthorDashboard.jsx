import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  Bell,
  BookOpenCheck,
  LayoutDashboard,
  NotebookPen,
  PenLine,
  Sparkles,
} from "lucide-react";
import RepoOverviewStatCard from "../../components/repo/RepoOverviewStatCard";
import { REPO_OVERVIEW_STAT_PALETTES } from "../../components/repo/repoOverviewStatPalettes";
import { useAuth } from "../../context/AuthContext";
import {
  useArticlesByAuthor,
  usePublishedArticlesByAuthor,
} from "../../services/useApi";

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

export default function AuthorDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const authorOnly = user?.role === "author";
  const authorId = String(user?.id ?? "").trim();

  const allArticlesQ = useArticlesByAuthor(
    authorId,
    { page: 0, size: 100 },
    { enabled: Boolean(authorId), notifyOnError: false },
  );
  const publishedQ = usePublishedArticlesByAuthor(
    authorId,
    { page: 0, size: 100 },
    { enabled: Boolean(authorId), notifyOnError: false },
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

  const stats = [
    {
      label: t("authorDashboard.stats.total"),
      value: allArticles.length,
      icon: NotebookPen,
      hint: t("authorDashboard.title"),
      paletteIndex: 0,
    },
    {
      label: t("authorDashboard.stats.published"),
      value: publishedArticles.length,
      icon: BookOpenCheck,
      hint: t("authorDashboard.cards.publishedBody"),
      paletteIndex: 2,
    },
    {
      label: t("authorDashboard.stats.unpublished"),
      value: unpublishedCount,
      icon: PenLine,
      hint: t("authorDashboard.cards.unpublishedBody"),
      paletteIndex: 1,
    },
  ];

  const cards = [
    {
      to: "/author/writing",
      icon: PenLine,
      title: t("authorDashboard.cards.writingTitle"),
      body: t("authorDashboard.cards.writingBody"),
      action: t("authorDashboard.cards.writingAction"),
    },
    {
      to: "/author/stories",
      icon: BookOpenCheck,
      title: t("authorDashboard.cards.publishedTitle"),
      body: t("authorDashboard.cards.publishedBody"),
      action: t("authorDashboard.cards.publishedAction"),
    },
    {
      to: "/author/stories",
      icon: NotebookPen,
      title: t("authorDashboard.cards.unpublishedTitle"),
      body: t("authorDashboard.cards.unpublishedBody"),
      action: t("authorDashboard.cards.unpublishedAction"),
    },
    ...(authorOnly
      ? [
          {
            to: "/author/notifications",
            icon: Bell,
            title: t("authorDashboard.cards.notificationsTitle"),
            body: t("authorDashboard.cards.notificationsBody"),
            action: t("authorDashboard.cards.notificationsAction"),
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-white p-4 dark:bg-dark-card-bg md:p-5">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
          <div className="border-b border-light-divider px-5 py-6 dark:border-dark-divider md:px-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-(--color-light-card-border) bg-light-app-tertiary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-muted">
                <Sparkles className="size-3.5" strokeWidth={1.8} aria-hidden />
                {t("authorDashboard.eyebrow")}
              </p>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-primary dark:text-dark-primary md:text-3xl">
                {t("authorDashboard.title")}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-secondary dark:text-dark-secondary">
                {t("authorDashboard.subtitle")}
              </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/author/writing"
                  className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl bg-light-btn-primary-bg px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-light-btn-primary-hover dark:bg-dark-primary dark:text-dark-shell dark:hover:bg-dark-primary-hover"
                >
                  <PenLine className="size-4" strokeWidth={1.8} aria-hidden />
                  {t("authorDashboard.primaryAction")}
                </Link>
                <Link
                  to="/author/stories"
                  className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-(--color-light-card-border) px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-light-app-tertiary dark:border-(--color-dark-card-border) dark:text-dark-primary dark:hover:bg-dark-app-tertiary"
                >
                  {t("authorDashboard.secondaryAction")}
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-3 px-5 py-5 md:grid-cols-3 md:px-6">
            {stats.map(({ label, value, icon, hint, paletteIndex }) => (
              <RepoOverviewStatCard
                key={label}
                icon={icon}
                label={label}
                value={allArticlesQ.isLoading || publishedQ.isLoading ? "..." : value}
                hint={hint}
                palette={
                  REPO_OVERVIEW_STAT_PALETTES[
                    paletteIndex % REPO_OVERVIEW_STAT_PALETTES.length
                  ]
                }
              />
              ))}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ to, icon: Glyph, title, body, action }) => (
            <Link
              key={to}
              to={to}
              className="group flex min-h-44 flex-col rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 shadow-sm transition-colors hover:border-(--color-light-input-border-focus) hover:bg-light-app-tertiary dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:hover:border-(--color-dark-input-border-focus) dark:hover:bg-dark-app-tertiary"
            >
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-light-app-tertiary text-primary dark:bg-dark-app-tertiary dark:text-dark-primary">
                <Glyph className="size-5" strokeWidth={1.75} aria-hidden />
              </span>
              <span className="mt-4 text-sm font-semibold text-primary dark:text-dark-primary">
                {title}
              </span>
              <span className="mt-2 flex-1 text-xs leading-relaxed text-muted dark:text-dark-muted">
                {body}
              </span>
              <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-(--color-chart-blue-primary) dark:text-(--color-chart-blue-secondary)">
                {action}
                <ArrowRight
                  className="size-3.5 transition-transform group-hover:translate-x-0.5"
                  strokeWidth={1.8}
                  aria-hidden
                />
              </span>
            </Link>
          ))}
        </section>

        <section className="rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-5 shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-light-app-tertiary text-primary dark:bg-dark-app-tertiary dark:text-dark-primary">
              <LayoutDashboard className="size-5" strokeWidth={1.8} />
            </span>
            <div>
              <p className="text-sm font-semibold text-primary dark:text-dark-primary">
                Writing workspace overview
              </p>
              <p className="mt-1 text-xs leading-5 text-muted dark:text-dark-muted">
                Use the cards above to move between writing, story review, and notifications.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
