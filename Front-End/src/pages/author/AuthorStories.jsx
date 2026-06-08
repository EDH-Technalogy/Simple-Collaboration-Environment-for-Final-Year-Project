import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BookOpenCheck,
  CalendarDays,
  ChevronRight,
  Eye,
  Heart,
  LayoutGrid,
  MessageCircle,
  NotebookPen,
  Search,
} from "lucide-react";
import Button from "../../components/Button";
import SettingsTabs from "../../components/SettingsTabs";
import RepoOverviewStatCard from "../../components/repo/RepoOverviewStatCard";
import { REPO_OVERVIEW_STAT_PALETTES } from "../../components/repo/repoOverviewStatPalettes";
import { useAuth } from "../../context/AuthContext";
import { mapArticleToAdminBlog } from "../../lib/adminArticleMap";
import { mapArticlePreviewToStory } from "../../lib/mapArticlePreviewToStory";
import { useArticlesByAuthor } from "../../services/useApi";

function normalizeAuthorArticles(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.content)) return raw.content;
  if (Array.isArray(raw?.data?.content)) return raw.data.content;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
}

function ArticleThumbnail({ article }) {
  if (article.coverImageUrl) {
    return (
      <img
        src={article.coverImageUrl}
        alt=""
        className="h-full w-full object-cover"
        loading="lazy"
      />
    );
  }
  return (
    <div className="flex h-full w-full items-center justify-center bg-light-app-tertiary dark:bg-dark-app-tertiary">
      <BookOpenCheck className="h-8 w-8 text-muted dark:text-dark-muted" strokeWidth={1.6} />
    </div>
  );
}

function statusClass(status) {
  if (status === "PUBLISHED") {
    return "border-(--color-light-success-border) bg-(--color-light-success-bg) text-(--color-light-success-text) dark:border-(--color-dark-success-border) dark:bg-(--color-dark-success-bg) dark:text-(--color-dark-success-text)";
  }
  return "border-(--color-light-warning-border) bg-(--color-light-warning-bg) text-(--color-light-warning-text) dark:border-(--color-dark-warning-border) dark:bg-(--color-dark-warning-bg) dark:text-(--color-dark-warning-text)";
}

function storyInitials(name) {
  return String(name || "A")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function AuthorStoryCard({ article }) {
  const published = article._rawStatus === "PUBLISHED";
  const story = mapArticlePreviewToStory(article.raw ?? article, {
    collectionLabel: published ? "Published" : "Draft",
  });
  const date = article.date ? new Date(article.date).toLocaleDateString() : "";

  return (
    <Link
      to={`/author/stories/${encodeURIComponent(article.id)}`}
      className="group flex h-full overflow-hidden rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)"
    >
      <article className="flex w-full flex-col">
        <div className="relative aspect-[16/10] overflow-hidden bg-light-app-tertiary dark:bg-dark-app-tertiary">
          {article.coverImageUrl || story.cover_image ? (
            <img
              src={article.coverImageUrl || story.cover_image}
              alt=""
              className="size-full object-cover transition duration-300 group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <ArticleThumbnail article={article} />
          )}
          <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide shadow-sm backdrop-blur ${statusClass(article._rawStatus)}`}
            >
              {story.collection}
            </span>
            {article.readTime && article.readTime !== "—" ? (
              <span className="rounded-full bg-(--color-light-card-bg)/92 px-3 py-1 text-[11px] font-semibold text-secondary shadow-sm backdrop-blur dark:bg-(--color-dark-card-bg)/92 dark:text-dark-secondary">
                {article.readTime} min
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4 md:p-5">
          <div className="flex items-center gap-3">
            {story.author_profile ? (
              <img
                src={story.author_profile}
                alt=""
                className="size-9 rounded-full object-cover"
                loading="lazy"
              />
            ) : (
              <span className="flex size-9 items-center justify-center rounded-full bg-light-app-tertiary text-[11px] font-bold text-primary dark:bg-dark-app-tertiary dark:text-dark-primary">
                {storyInitials(article.author)}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-primary dark:text-dark-primary">
                {article.author || "You"}
              </p>
              <p className="flex items-center gap-1.5 text-xs text-muted dark:text-dark-muted">
                <CalendarDays className="size-3.5" strokeWidth={1.8} />
                {date || "Recently updated"}
              </p>
            </div>
          </div>

          <h2 className="mt-4 line-clamp-2 text-xl font-bold tracking-tight text-primary transition-colors group-hover:text-(--color-light-btn-primary-bg) dark:text-dark-primary dark:group-hover:text-(--color-dark-primary)">
            {article.title}
          </h2>
          {article.excerpt ? (
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-secondary dark:text-dark-secondary">
              {article.excerpt}
            </p>
          ) : null}

          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
            <div className="flex items-center gap-3 text-xs font-semibold text-muted dark:text-dark-muted">
              <span className="inline-flex items-center gap-1">
                <Heart className="size-3.5" strokeWidth={1.8} />
                {article.claps ?? 0}
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="size-3.5" strokeWidth={1.8} />
                {article.comments ?? 0}
              </span>
              <span className="inline-flex items-center gap-1">
                <Eye className="size-3.5" strokeWidth={1.8} />
                {article.views ?? 0}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-(--color-light-btn-primary-bg) dark:text-(--color-dark-primary)">
              Open story
              <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.8} />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function AuthorStories() {
  const { user } = useAuth();
  const location = useLocation();
  const initialFilter = location.pathname.includes("/unpublished")
    ? "unpublished"
    : location.pathname.includes("/published")
      ? "published"
      : "all";
  const [filter, setFilter] = useState(initialFilter);
  const [query, setQuery] = useState("");
  useEffect(() => {
    setFilter(initialFilter);
  }, [initialFilter]);
  const authorId = String(user?.id ?? "").trim();
  const { data, isLoading } = useArticlesByAuthor(
    authorId,
    { page: 0, size: 100 },
    { enabled: Boolean(authorId), notifyOnError: false },
  );

  const articles = useMemo(() => {
    const mapped = normalizeAuthorArticles(data).map((article) =>
      mapArticleToAdminBlog(article),
    );
    const byStatus =
      filter === "published"
        ? mapped.filter((article) => article._rawStatus === "PUBLISHED")
        : filter === "unpublished"
          ? mapped.filter((article) => article._rawStatus !== "PUBLISHED")
          : mapped;
    const needle = query.trim().toLowerCase();
    if (!needle) return byStatus;
    return byStatus.filter((article) =>
      [article.title, article.excerpt, article.category, article.author]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [data, filter, query]);

  const counts = useMemo(() => {
    const all = normalizeAuthorArticles(data).map((article) =>
      mapArticleToAdminBlog(article),
    );
    return {
      all: all.length,
      published: all.filter((article) => article._rawStatus === "PUBLISHED").length,
      unpublished: all.filter((article) => article._rawStatus !== "PUBLISHED").length,
    };
  }, [data]);

  const tabs = useMemo(
    () => [
      { id: "all", label: `All (${counts.all})`, icon: LayoutGrid },
      {
        id: "published",
        label: `Published (${counts.published})`,
        icon: BookOpenCheck,
      },
      {
        id: "unpublished",
        label: `Unpublished (${counts.unpublished})`,
        icon: NotebookPen,
      },
    ],
    [counts.all, counts.published, counts.unpublished],
  );

  const summaryCards = [
    {
      icon: LayoutGrid,
      label: "Total stories",
      value: counts.all,
      hint: "All stories in your writing workspace",
      paletteIndex: 0,
    },
    {
      icon: BookOpenCheck,
      label: "Published",
      value: counts.published,
      hint: "Visible on the public site",
      paletteIndex: 2,
    },
    {
      icon: NotebookPen,
      label: "Unpublished",
      value: counts.unpublished,
      hint: "Drafts and stories still in progress",
      paletteIndex: 1,
    },
  ];

  return (
    <div className="min-h-screen w-full bg-light-app-bg p-4 dark:bg-dark-card-bg md:p-5">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
          <div className="border-b border-light-divider px-5 py-6 dark:border-dark-divider md:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-muted">
                <BookOpenCheck className="size-3.5" strokeWidth={1.8} />
                Author workspace
              </p>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-primary dark:text-dark-primary md:text-3xl">
                My stories
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-secondary dark:text-dark-secondary sm:text-base">
                Manage drafts, submitted stories, and published articles from one place.
              </p>
            </div>
            <Link to="/author/writing">
              <Button type="button">New story</Button>
            </Link>
          </div>
          </div>

          <div className="grid gap-3 px-5 py-5 md:grid-cols-3 md:px-6">
            {summaryCards.map((item) => (
              <RepoOverviewStatCard
                key={item.label}
                icon={item.icon}
                label={item.label}
                value={item.value}
                hint={item.hint}
                palette={
                  REPO_OVERVIEW_STAT_PALETTES[
                    item.paletteIndex % REPO_OVERVIEW_STAT_PALETTES.length
                  ]
                }
              />
            ))}
          </div>

          <div className="border-t border-light-divider px-5 py-4 dark:border-dark-divider md:px-6">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-center">
              <SettingsTabs tabs={tabs} activeTab={filter} onChange={setFilter} />
              <div className="relative">
                <Search
                  className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted dark:text-dark-muted"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search your stories"
                  className="h-11 w-full rounded-xl border border-(--color-light-input-border) bg-(--color-light-input-bg) pe-3 ps-10 text-sm text-(--color-light-text-primary) outline-none transition-colors placeholder:text-(--color-light-input-placeholder) focus:border-(--color-light-input-border-focus) focus:ring-2 focus:ring-blue-500/15 dark:border-dark-input-border dark:bg-(--color-dark-input-bg) dark:text-(--color-dark-text-primary) dark:placeholder:text-(--color-dark-input-placeholder) dark:focus:border-(--color-dark-input-border-focus) dark:focus:ring-blue-400/15"
                />
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-(--color-light-card-border) bg-light-app-tertiary px-6 py-12 text-center text-sm text-muted dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-muted">
            Loading stories...
          </div>
        ) : !articles.length ? (
          <div className="rounded-2xl border border-dashed border-(--color-light-card-border) bg-light-app-tertiary px-6 py-12 text-center dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
            <NotebookPen className="mx-auto h-10 w-10 text-muted dark:text-dark-muted" strokeWidth={1.6} />
            <p className="mt-4 text-base font-semibold text-primary dark:text-dark-primary">
              No stories found
            </p>
            <p className="mt-2 text-sm text-secondary dark:text-dark-secondary">
              Start a draft in the editor, then come back here to review it.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {articles.map((article) => (
              <AuthorStoryCard
                key={article.id}
                article={article}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
