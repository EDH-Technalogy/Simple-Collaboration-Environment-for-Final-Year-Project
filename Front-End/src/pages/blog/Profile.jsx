import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  Eye,
  Heart,
  MessageCircle,
} from "lucide-react";
import Avatar from "../../components/Avatar.jsx";
import SettingsTabs from "../../components/SettingsTabs.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { mapArticlePreviewToStory } from "../../lib/mapArticlePreviewToStory.js";
import {
  usePublishedArticlesByAuthor,
  useUserAuthorProfile,
} from "../../services/useApi.js";
import { BlogShell } from "./BlogShell";

const TABS = [{ id: "Stories", label: "Stories", icon: BookOpen }];

function initials(name) {
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

function extractList(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.content)) return payload.content;
  return [];
}

function profileValue(profile, key, fallback = "") {
  return profile?.[key] ?? profile?.data?.[key] ?? fallback;
}

export default function Profile() {
  const [params] = useSearchParams();
  const { user: sessionUser } = useAuth();
  const [activeTab, setActiveTab] = useState("Stories");

  const requestedUser = params.get("user");
  const requestedName = params.get("name") || "";
  const requestedEmail = params.get("email") || "";
  const requestedRole = params.get("role") || "";
  const requestedBio = params.get("bio") || "";
  const authorId =
    requestedUser ||
    sessionUser?.id ||
    sessionUser?.user_id ||
    sessionUser?.sub ||
    "";
  const profileQuery = useUserAuthorProfile(authorId, {
    enabled: Boolean(authorId),
    notifyOnError: false,
    retry: false,
  });
  const articlesQuery = usePublishedArticlesByAuthor(
    authorId,
    { page: 0, pageSize: 50 },
    { enabled: Boolean(authorId), notifyOnError: false },
  );

  const profile = profileQuery.data ?? {};
  const stories = useMemo(
    () =>
      extractList(articlesQuery.data).map((article) =>
        mapArticlePreviewToStory(article, { collectionLabel: "Stories" }),
      ),
    [articlesQuery.data],
  );

  const name =
    profileValue(profile, "displayName") ||
    profileValue(profile, "userName") ||
    profileValue(profile, "username") ||
    profileValue(profile, "name") ||
    requestedName ||
    sessionUser?.display_name ||
    sessionUser?.user_name ||
    "Writer";
  const email = profileValue(
    profile,
    "email",
    requestedEmail || sessionUser?.email || "",
  );
  const avatar =
    profileValue(profile, "profileImageUrl") ||
    profileValue(profile, "profile") ||
    profileValue(profile, "avatarUrl") ||
    sessionUser?.profilePicture ||
    "";
  const bio =
    profileValue(profile, "bio") ||
    requestedBio ||
    requestedRole ||
    "No biography has been added yet.";
  const totalArticles = Number(
    profileValue(profile, "totalArticles", stories.length) ?? stories.length,
  );
  const totalLikes = stories.reduce(
    (sum, story) => sum + Number(story.claps_count ?? 0),
    0,
  );
  const totalViews = stories.reduce(
    (sum, story) => sum + Number(story.view_count ?? 0),
    0,
  );

  return (
    <BlogShell variant="feed">
      <div className="min-h-screen pb-20">
        <header className="rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-5 shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) sm:p-7">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex min-w-0 gap-5">
              <Avatar
                src={avatar}
                alt={name}
                initials={initials(name)}
                className="rounded-full"
                sizeClass="inline-flex size-20 select-none items-center justify-center overflow-hidden rounded-full sm:size-24"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted dark:text-dark-muted">
                  {email || requestedRole || "Author profile"}
                </p>
                <h1 className="font-blog-display mt-2 text-3xl font-bold tracking-tight text-primary md:text-4xl dark:text-dark-primary">
                  {name}
                </h1>
                {requestedRole ? (
                  <p className="mt-2 inline-flex rounded-full border border-(--color-light-card-border) bg-light-app-tertiary px-3 py-1 text-xs font-semibold text-secondary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-secondary">
                    {requestedRole}
                  </p>
                ) : null}
                <p className="mt-4 max-w-2xl text-sm leading-6 text-secondary dark:text-dark-secondary sm:text-base">
                  {bio}
                </p>
                <div className="mt-6 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    ["Stories", totalArticles, BookOpen],
                    ["Likes", totalLikes, Heart],
                    ["Views", totalViews, Eye],
                  ].map(([label, value, Icon]) => (
                    <div
                      key={label}
                      className="flex items-center gap-3 rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary px-3 py-3 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary"
                    >
                      <span className="flex size-9 items-center justify-center rounded-xl bg-(--color-light-card-bg) text-(--color-light-btn-primary-bg) dark:bg-(--color-dark-card-bg) dark:text-(--color-dark-primary)">
                        <Icon className="size-4" strokeWidth={1.8} />
                      </span>
                      <span>
                        <p className="text-lg font-bold tabular-nums text-primary dark:text-dark-primary">
                          {Number(value).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted dark:text-dark-muted">
                          {label}
                        </p>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </header>

        <nav className="sticky top-[3.25rem] z-[5] mt-6 rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg)/95 p-1.5 shadow-sm backdrop-blur-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)/95 sm:top-14">
          <SettingsTabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
        </nav>

        <main className="pt-8">
          {profileQuery.isLoading || articlesQuery.isLoading ? (
            <div className="h-40 animate-pulse rounded-2xl bg-light-app-tertiary dark:bg-dark-app-tertiary" />
          ) : (
            <section>
              {stories.length ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {stories.map((story) => (
                    <Link
                      key={story.id}
                      to={`/story/${story.id}`}
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
                            <div className="flex size-full flex-col items-center justify-center gap-2 px-5 text-center">
                              <span className="text-xs font-semibold uppercase tracking-wide text-muted dark:text-dark-muted">
                                {story.collection}
                              </span>
                              <span className="line-clamp-2 text-lg font-bold text-primary dark:text-dark-primary">
                                {story.title}
                              </span>
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
                          <p className="flex items-center gap-1.5 text-xs text-muted dark:text-dark-muted">
                            <CalendarDays className="size-3.5" strokeWidth={1.8} />
                            {story.created_date
                              ? format(new Date(story.created_date), "MMM d, yyyy")
                              : "Recently published"}
                          </p>
                          <h2 className="mt-4 line-clamp-2 text-xl font-bold tracking-tight text-primary transition-colors group-hover:text-(--color-light-btn-primary-bg) dark:text-dark-primary dark:group-hover:text-(--color-dark-primary)">
                            {story.title}
                          </h2>
                          {story.subtitle || story.description ? (
                            <p className="mt-3 line-clamp-3 text-sm leading-6 text-secondary dark:text-dark-secondary">
                              {story.subtitle || story.description}
                            </p>
                          ) : null}

                          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
                            <div className="flex items-center gap-3 text-xs font-semibold text-muted dark:text-dark-muted">
                              <span className="inline-flex items-center gap-1">
                                <Heart className="size-3.5" strokeWidth={1.8} />
                                {Number(story.claps_count ?? 0).toLocaleString()}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <MessageCircle className="size-3.5" strokeWidth={1.8} />
                                {Number(story.comment_count ?? 0).toLocaleString()}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Eye className="size-3.5" strokeWidth={1.8} />
                                {Number(story.view_count ?? 0).toLocaleString()}
                              </span>
                            </div>
                            <span className="inline-flex items-center gap-1 text-sm font-semibold text-(--color-light-btn-primary-bg) dark:text-(--color-dark-primary)">
                              Read
                              <ChevronRight className="size-4" strokeWidth={1.8} />
                            </span>
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-(--color-light-card-border) p-10 text-center text-sm text-muted dark:border-(--color-dark-card-border) dark:text-dark-muted">
                  No published stories yet.
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </BlogShell>
  );
}
