import {
  BookOpenCheck,
  BarChart3,
  CalendarDays,
  ChevronRight,
  FileText,
  FolderKanban,
  GraduationCap,
  Heart,
  MessageCircle,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { createElement, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LoadingSpinner from "../../components/LoadingSpinner";
import { filterAndSortStories } from "../../data/mockStories";
import { mapArticlePreviewToStory } from "../../lib/mapArticlePreviewToStory";
import { usePublicArticles } from "../../services/useApi";
import { BlogShell } from "./BlogShell";

const DEFAULT_SEARCH = {
  query: "",
  sort: "newest",
};

function extractPaginatedList(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.content)) return payload.content;
  return [];
}

function extractPagination(payload) {
  return payload?.pagination ?? payload?.page ?? null;
}

function isPublicPublishedArticle(article) {
  const status = String(article?.status ?? "").toUpperCase();
  const visibility = String(article?.visibility ?? "PUBLIC").toUpperCase();
  return (
    (!status || status === "PUBLISHED") &&
    !["PRIVATE", "MEMBERS_ONLY"].includes(visibility)
  );
}

function TimelineAnimation({
  children,
  animationNum,
  timelineRef,
  className = "",
  as = "div",
  ...props
}) {
  const isInView = useInView(timelineRef, { once: true });
  const MotionComponent = motion[as] || motion.div;

  return (
    <MotionComponent
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      custom={animationNum}
      variants={{
        visible: (index) => ({
          filter: "blur(0px)",
          y: 0,
          opacity: 1,
          transition: {
            delay: index * 0.12,
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
          },
        }),
        hidden: {
          filter: "blur(18px)",
          y: 12,
          opacity: 0,
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </MotionComponent>
  );
}

function HomeHero({ latestCount = 0, monographMode = false }) {
  const { t } = useTranslation();
  const timelineRef = useRef(null);

  const heroStats = [
    {
      icon: BookOpenCheck,
      label: t("publicHome.hero.stats.publications"),
      value: latestCount,
    },
    {
      icon: FolderKanban,
      label: t("publicHome.hero.stats.projects"),
      value: t("publicHome.hero.stats.live"),
    },
    {
      icon: ShieldCheck,
      label: t("publicHome.hero.stats.moderation"),
      value: t("publicHome.hero.stats.reviewed"),
    },
  ];

  return (
    <section
      ref={timelineRef}
      className="relative isolate flex min-h-[calc(100vh-4rem)] flex-col items-center overflow-hidden bg-(--color-light-app-bg) text-primary dark:bg-(--color-dark-card-bg) dark:text-dark-primary"
    >
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=1470&auto=format&fit=crop')",
        }}
      />
      <div className="absolute inset-0 -z-10 bg-(--color-light-card-bg)/82 backdrop-blur-[1px] dark:bg-(--color-dark-card-bg)/86" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col items-center px-4 pb-10 pt-16 text-center sm:px-6 lg:px-8 lg:pt-20">
        <TimelineAnimation
          animationNum={1}
          timelineRef={timelineRef}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-(--color-light-card-border) bg-(--color-light-card-bg)/90 px-2 py-1 text-primary shadow-md dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)/90 dark:text-dark-primary"
        >
          <span className="rounded-full bg-(--color-light-btn-primary-bg) px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white dark:bg-(--color-dark-primary) dark:text-dark-shell">
            {t("publicHome.hero.badge")}
          </span>
          <span className="text-xs font-semibold sm:text-sm">
            {t("publicHome.hero.kicker")}
          </span>
        </TimelineAnimation>

        <TimelineAnimation
          as="h1"
          animationNum={2}
          timelineRef={timelineRef}
          className="font-blog-display mt-7 max-w-6xl text-4xl font-bold tracking-tight text-primary dark:text-dark-primary sm:text-6xl lg:text-7xl"
        >
          {t("publicHome.hero.title")}
        </TimelineAnimation>

        <TimelineAnimation
          as="p"
          animationNum={3}
          timelineRef={timelineRef}
          className="mt-6 max-w-3xl text-base font-medium leading-8 text-secondary dark:text-dark-secondary sm:text-xl"
        >
          {t("publicHome.hero.subtitle")}
        </TimelineAnimation>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <TimelineAnimation
            animationNum={4}
            timelineRef={timelineRef}
            className="inline-flex"
          >
            <Link
              to="/blogs"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-(--color-light-btn-primary-bg) px-5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-(--color-light-btn-primary-hover) dark:bg-(--color-dark-primary) dark:text-dark-shell"
            >
              {t("publicHome.hero.ctaPrimary")}
              <ChevronRight className="size-4" strokeWidth={1.9} />
            </Link>
          </TimelineAnimation>
          <TimelineAnimation
            animationNum={5}
            timelineRef={timelineRef}
            className="inline-flex"
          >
            <Link
              to="/projects"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg)/90 px-5 text-sm font-semibold text-primary shadow-sm transition-colors hover:border-(--color-light-input-border-focus) dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)/90 dark:text-dark-primary dark:hover:border-(--color-dark-input-border-focus)"
            >
              {t("publicHome.hero.ctaSecondary")}
            </Link>
          </TimelineAnimation>
        </div>

        <TimelineAnimation
          animationNum={6}
          timelineRef={timelineRef}
          className="mt-12 w-full max-w-6xl rounded-2xl border border-white/40 bg-(--color-light-card-bg)/70 p-3 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-(--color-dark-card-bg)/70"
        >
          <div className="overflow-hidden rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) text-left dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
            <div className="flex flex-col gap-4 border-b border-light-divider p-4 dark:border-dark-divider md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted dark:text-dark-muted">
                  {t("publicHome.hero.dashboardEyebrow")}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-primary dark:text-dark-primary">
                  {t("publicHome.hero.dashboardTitle")}
                </h2>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-(--color-light-card-border) bg-light-app-tertiary px-3 py-1 text-xs font-semibold text-secondary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-secondary">
                <span className="size-2 rounded-full bg-(--color-chart-success)" />
                {monographMode
                  ? t("publicHome.tabs.monographs")
                  : t("publicHome.tabs.weblogs")}
              </span>
            </div>

            <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  {heroStats.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary p-3 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary"
                    >
                      <item.icon
                        className="size-4 text-(--color-chart-blue-primary) dark:text-(--color-chart-blue-secondary)"
                        strokeWidth={1.8}
                      />
                      <p className="mt-3 text-2xl font-semibold text-primary dark:text-dark-primary">
                        {item.value}
                      </p>
                      <p className="mt-1 text-xs text-secondary dark:text-dark-secondary">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-(--color-light-card-border) p-4 dark:border-(--color-dark-card-border)">
                  <div className="flex items-center gap-3">
                    <FileText className="size-5 text-(--color-chart-blue-primary) dark:text-(--color-chart-blue-secondary)" />
                    <div>
                      <p className="text-sm font-semibold text-primary dark:text-dark-primary">
                        {t("publicHome.hero.workflowTitle")}
                      </p>
                      <p className="text-xs text-secondary dark:text-dark-secondary">
                        {t("publicHome.hero.workflowSubtitle")}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {[
                      t("publicHome.hero.workflow.draft"),
                      t("publicHome.hero.workflow.review"),
                      t("publicHome.hero.workflow.publish"),
                    ].map((label, index) => (
                      <div
                        key={label}
                        className="rounded-xl bg-light-app-tertiary px-3 py-2 text-xs font-semibold text-secondary dark:bg-dark-app-tertiary dark:text-dark-secondary"
                      >
                        <span className="me-2 inline-flex size-5 items-center justify-center rounded-full bg-(--color-light-card-bg) text-[10px] text-primary dark:bg-(--color-dark-card-bg) dark:text-dark-primary">
                          {index + 1}
                        </span>
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary p-4 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted dark:text-dark-muted">
                  {t("publicHome.hero.previewTitle")}
                </p>
                <div className="mt-4 space-y-3">
                  {[0, 1, 2].map((item) => (
                    <div
                      key={item}
                      className="rounded-xl bg-(--color-light-card-bg) p-3 dark:bg-(--color-dark-card-bg)"
                    >
                      <div className="h-2 w-2/3 rounded-full bg-light-app-tertiary dark:bg-dark-app-tertiary" />
                      <div className="mt-2 h-2 w-full rounded-full bg-light-app-tertiary dark:bg-dark-app-tertiary" />
                      <div className="mt-2 h-2 w-4/5 rounded-full bg-light-app-tertiary dark:bg-dark-app-tertiary" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TimelineAnimation>
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, desc, highlight }) {
  return (
    <div
      className={`group flex flex-col items-center text-center transition-transform duration-200 ${
        highlight ? "md:scale-105" : ""
      }`}
    >
      <div
        className={`mb-6 flex size-12 items-center justify-center rounded-full transition-colors duration-200 ${
          highlight
            ? "bg-(--color-light-btn-primary-bg) text-white shadow-lg shadow-blue-500/20 dark:bg-(--color-dark-primary) dark:text-dark-shell"
            : "bg-light-app-tertiary text-(--color-chart-blue-primary) group-hover:bg-(--color-light-badge-bg) dark:bg-dark-app-tertiary dark:text-(--color-chart-blue-secondary) dark:group-hover:bg-(--color-dark-badge-bg)"
        }`}
      >
        {createElement(icon, { className: "size-6", strokeWidth: 1.8 })}
      </div>
      <h3 className="mb-3 text-xl font-bold tracking-tight text-primary dark:text-dark-primary">
        {title}
      </h3>
      <p className="mx-auto max-w-xs text-sm leading-6 text-secondary dark:text-dark-secondary">
        {desc}
      </p>
    </div>
  );
}

function FeatureHero() {
  const { t } = useTranslation();
  const sectionRef = useRef(null);
  const features = [
    {
      icon: ShieldCheck,
      title: t("publicHome.features.items.moderation.title"),
      desc: t("publicHome.features.items.moderation.desc"),
    },
    {
      icon: Users,
      title: t("publicHome.features.items.author.title"),
      desc: t("publicHome.features.items.author.desc"),
      highlight: true,
    },
    {
      icon: FolderKanban,
      title: t("publicHome.features.items.projects.title"),
      desc: t("publicHome.features.items.projects.desc"),
    },
    {
      icon: GraduationCap,
      title: t("publicHome.features.items.monographs.title"),
      desc: t("publicHome.features.items.monographs.desc"),
    },
    {
      icon: BarChart3,
      title: t("publicHome.features.items.analytics.title"),
      desc: t("publicHome.features.items.analytics.desc"),
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen overflow-hidden bg-(--color-light-card-bg) px-4 py-20 dark:bg-(--color-dark-card-bg) sm:px-6 lg:px-8 lg:py-24"
    >
      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,var(--color-light-app-tertiary)_0px_1px,transparent_1px_8px)] opacity-70 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] dark:bg-[repeating-linear-gradient(45deg,var(--color-dark-app-tertiary)_0px_1px,transparent_1px_8px)]" />
      <div className="absolute inset-0 bg-[radial-gradient(125%_125%_at_50%_10%,transparent_42%,rgba(51,133,255,0.24)_100%)] dark:bg-[radial-gradient(125%_125%_at_50%_10%,transparent_42%,rgba(77,153,255,0.18)_100%)]" />

      <div className="relative mx-auto max-w-7xl text-center">
        <TimelineAnimation animationNum={1} timelineRef={sectionRef}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted dark:text-dark-muted">
            {t("publicHome.features.eyebrow")}
          </p>
          <h2 className="font-blog-display mx-auto mt-4 max-w-4xl text-4xl font-bold tracking-tight text-primary dark:text-dark-primary md:text-5xl">
            {t("publicHome.features.title")}
          </h2>
          <p className="mx-auto mt-5 mb-16 max-w-2xl text-base leading-7 text-secondary dark:text-dark-secondary md:text-lg">
            {t("publicHome.features.subtitle")}
          </p>
        </TimelineAnimation>

        <div className="grid grid-cols-1 gap-x-12 gap-y-16 md:grid-cols-3">
          {features.slice(0, 3).map((feature, index) => (
            <TimelineAnimation
              key={feature.title}
              animationNum={index + 2}
              timelineRef={sectionRef}
            >
              <FeatureCard {...feature} />
            </TimelineAnimation>
          ))}

          <div className="flex flex-col justify-center gap-x-12 gap-y-16 md:col-span-3 md:flex-row">
            {features.slice(3).map((feature, index) => (
              <TimelineAnimation
                key={feature.title}
                animationNum={index + 5}
                timelineRef={sectionRef}
                className="md:w-1/3"
              >
                <FeatureCard {...feature} />
              </TimelineAnimation>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PublicBlogHero({ query, onQueryChange, totalCount }) {
  const { t } = useTranslation();

  return (
    <section className="relative isolate overflow-hidden rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-5 shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) sm:p-6 lg:p-8">
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=1470&auto=format&fit=crop')",
        }}
      />
      <div className="absolute inset-0 -z-10 bg-(--color-light-card-bg)/88 backdrop-blur-[1px] dark:bg-(--color-dark-card-bg)/90" />
      <div className="max-w-3xl">
        <p className="inline-flex items-center gap-2 rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-muted">
          <BookOpenCheck className="size-3.5" strokeWidth={1.8} />
          {t("publicBlogs.hero.eyebrow")}
        </p>
        <h1 className="font-blog-display mt-4 text-3xl font-bold tracking-tight text-primary dark:text-dark-primary sm:text-5xl">
          {t("publicBlogs.hero.title")}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-secondary dark:text-dark-secondary sm:text-base">
          {t("publicBlogs.hero.description")}
        </p>
      </div>
      <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_12rem] lg:items-center">
        <div className="relative col-span-2">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted dark:text-dark-muted"
            strokeWidth={1.75}
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={t("publicBlogs.hero.search")}
            className="h-11 w-full rounded-xl border border-(--color-light-input-border) bg-(--color-light-input-bg) pe-3 ps-10 text-sm text-(--color-light-text-primary) outline-none transition-colors placeholder:text-(--color-light-input-placeholder) focus:border-(--color-light-input-border-focus) focus:ring-2 focus:ring-blue-500/15 dark:border-dark-input-border dark:bg-(--color-dark-input-bg) dark:text-(--color-dark-text-primary) dark:placeholder:text-(--color-dark-input-placeholder) dark:focus:border-(--color-dark-input-border-focus) dark:focus:ring-blue-400/15"
            autoComplete="off"
          />
        </div>
      </div>
    </section>
  );
}

function formatStoryDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function storyInitials(name) {
  return String(name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "A";
}

function PublicStoryCard({ story, featured = false }) {
  const date = formatStoryDate(story.created_date);
  const href = `/story/${encodeURIComponent(story.id)}`;
  const description = story.description || story.subtitle;

  return (
    <Link
      to={href}
      className="group flex h-full overflow-hidden rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)"
    >
      <article className="flex w-full flex-col">
        <div className="relative aspect-[16/10] overflow-hidden bg-light-app-tertiary dark:bg-dark-app-tertiary">
          {story.cover_image ? (
            <img
              src={story.cover_image}
              alt=""
              className="size-full object-cover transition duration-300 group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="flex size-full items-center justify-center px-5 text-center text-sm font-semibold text-muted dark:text-dark-muted">
              {story.collection}
            </div>
          )}
          <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
            <span className="rounded-full bg-(--color-light-card-bg)/92 px-3 py-1 text-[11px] font-semibold text-primary shadow-sm backdrop-blur dark:bg-(--color-dark-card-bg)/92 dark:text-dark-primary">
              {story.collection}
            </span>
            {story.reading_time ? (
              <span className="rounded-full bg-(--color-light-card-bg)/92 px-3 py-1 text-[11px] font-semibold text-secondary shadow-sm backdrop-blur dark:bg-(--color-dark-card-bg)/92 dark:text-dark-secondary">
                {story.reading_time} min
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
                {storyInitials(story.author_name)}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-primary dark:text-dark-primary">
                {story.author_name}
              </p>
              <p className="flex items-center gap-1.5 text-xs text-muted dark:text-dark-muted">
                <CalendarDays className="size-3.5" strokeWidth={1.8} />
                {date || "Recently published"}
              </p>
            </div>
          </div>

          <h2 className="mt-4 line-clamp-2 text-xl font-bold tracking-tight text-primary transition-colors group-hover:text-(--color-light-btn-primary-bg) dark:text-dark-primary dark:group-hover:text-(--color-dark-primary)">
            {story.title}
          </h2>
          {description ? (
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-secondary dark:text-dark-secondary">
              {description}
            </p>
          ) : null}

          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
            <div className="flex items-center gap-3 text-xs font-semibold text-muted dark:text-dark-muted">
              <span className="inline-flex items-center gap-1">
                <Heart className="size-3.5" strokeWidth={1.8} />
                {story.claps_count ?? 0}
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="size-3.5" strokeWidth={1.8} />
                {story.comment_count ?? 0}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-(--color-light-btn-primary-bg) dark:text-(--color-dark-primary)">
              Read story
              <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.8} />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const location = useLocation();
  const isBlogPage = location.pathname === "/blogs";
  const [criteria, setCriteria] = useState(() => ({ ...DEFAULT_SEARCH }));
  const [page, setPage] = useState(0);
  const pageSize = 6;
  const searchTerm = criteria.query.trim();

  const {
    data: articlePayload,
    isLoading,
    isError,
    refetch,
  } = usePublicArticles(
    {
      page,
      pageSize,
      contentType: "WEBLOG",
      q: searchTerm || undefined,
      search: searchTerm || undefined,
    },
    {
      notifyOnError: false,
      enabled: isBlogPage,
    },
  );

  const stories = useMemo(() => {
    const raw = extractPaginatedList(articlePayload);
    return raw.filter(isPublicPublishedArticle).map((item) =>
      mapArticlePreviewToStory(item, {
        collectionLabel: t("publicFooter.links.stories"),
      }),
    );
  }, [articlePayload, t]);

  const pagination = useMemo(() => extractPagination(articlePayload), [articlePayload]);
  const totalPages = Math.max(Number(pagination?.totalPages ?? 1), 1);
  const currentPage = Number(pagination?.page ?? page);

  const filteredStories = useMemo(
    () => filterAndSortStories(stories, criteria),
    [stories, criteria],
  );

  const listAnimKey = useMemo(
    () => [criteria.query, criteria.sort].join("|"),
    [criteria],
  );

  const staffPicks = useMemo(
    () =>
      [...stories]
        .sort((a, b) => (b.claps_count ?? 0) - (a.claps_count ?? 0))
        .slice(0, 4),
    [stories],
  );

  const setField = (key, value) => {
    setCriteria((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const resetAdvanced = () => {
    setCriteria({ ...DEFAULT_SEARCH });
  };

  const hasActiveFilters = criteria.query.trim() || criteria.sort !== "newest";

  const scopeLabel = t("publicHome.context.weblogs");

  return (
    <>
      {!isBlogPage ? (
        <>
          <HomeHero latestCount={0} monographMode={false} />
          <FeatureHero />

          <section className="border-b border-light-divider bg-(--color-light-card-bg) px-4 py-12 dark:border-dark-divider dark:bg-(--color-dark-card-bg) sm:px-6 lg:px-8 lg:py-16">
            <div className="mx-auto grid max-w-298 gap-8 lg:grid-cols-2 lg:items-start lg:gap-x-16 xl:gap-x-24">
              <h2 className="font-blog-display text-2xl font-bold leading-tight tracking-tight text-primary dark:text-dark-primary sm:text-3xl lg:text-[2rem]">
                {t("publicHome.secondary.title")}
              </h2>
              <p className="max-w-xl text-sm leading-relaxed text-secondary dark:text-dark-secondary sm:text-base lg:pt-1">
                {t("publicHome.secondary.subtitle")}
              </p>
            </div>
          </section>
        </>
      ) : null}

      {isBlogPage ? (
        <BlogShell>
          <div className="pb-14 pt-5 sm:pt-8 lg:pb-24">
            <div className="mb-8">
              <PublicBlogHero
                query={criteria.query}
                onQueryChange={(value) => setField("query", value)}
                totalCount={stories.length}
              />
            </div>

            {isLoading && (
              <div className="mb-10 flex justify-center py-12">
                <LoadingSpinner />
                <span className="sr-only">{t("publicHome.feed.loading")}</span>
              </div>
            )}

            {!isLoading && (
              <>
                <p className="mb-6 text-sm text-secondary dark:text-dark-secondary">
                  {t(
                    filteredStories.length === 1
                      ? "publicHome.count.one"
                      : "publicHome.count.other",
                    {
                      count: filteredStories.length,
                      scope: scopeLabel,
                    },
                  )}
                  {hasActiveFilters ? t("publicHome.filteredSuffix") : ""}
                </p>

                <div className="grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] xl:gap-16">
                  <div className=" col-span-2">
                    {filteredStories.length > 0 ? (
                      <motion.div
                        key={listAnimKey}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.32,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
                      >
                        {filteredStories.map((story, idx) => (
                          <motion.div
                            key={story.id}
                            layout="position"
                            transition={{ duration: 0.22, ease: "easeOut" }}
                          >
                            <PublicStoryCard story={story} />
                          </motion.div>
                        ))}
                      </motion.div>
                    ) : (
                      <div className="rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) px-5 py-12 text-center dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) sm:px-8 sm:py-16"></div>
                    )}
                  </div>
                </div>
                {totalPages > 1 ? (
                  <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-3 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
                    <p className="text-sm text-secondary dark:text-dark-secondary">
                      Page {currentPage + 1} of {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="btn-secondary h-9 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={currentPage <= 0 || isLoading}
                        onClick={() => setPage((value) => Math.max(value - 1, 0))}
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        className="btn-primary h-9 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={currentPage >= totalPages - 1 || isLoading}
                        onClick={() => setPage((value) => value + 1)}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </BlogShell>
      ) : null}
    </>
  );
}
