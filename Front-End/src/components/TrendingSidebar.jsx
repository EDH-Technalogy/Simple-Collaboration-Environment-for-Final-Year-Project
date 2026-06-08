import { useMemo } from "react";
import { Link } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import { MOCK_STORIES } from "../data/mockStories";

const TOPICS = [
  "Technology",
  "Science",
  "Programming",
  "Design",
  "Business",
  "Health",
  "Culture",
  "AI",
  "Startups",
];

export default function TrendingSidebar({
  stories: storyPool = MOCK_STORIES,
}) {
  const trending = useMemo(
    () =>
      [...storyPool]
        .sort((a, b) => (b.claps_count ?? 0) - (a.claps_count ?? 0))
        .slice(0, 5),
    [storyPool],
  );

  return (
    <aside className="space-y-10">
      <div>
        <div className="mb-4 flex items-center gap-2 text-secondary dark:text-dark-secondary">
          <TrendingUp className="size-4 text-primary dark:text-dark-primary" />
          <h3 className="text-xs font-semibold uppercase tracking-wider">
            Trending on Campus Medium
          </h3>
        </div>
        <div className="space-y-5">
          {trending.map((story, i) => (
            <Link
              key={story.id}
              to={`/story/${story.id}`}
              className="group flex gap-3"
            >
              <span className="font-blog-display text-3xl leading-none font-bold text-muted opacity-70 dark:text-dark-muted dark:opacity-60">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted dark:text-dark-muted">
                  {story.author_name || "Anonymous"}
                </p>
                <h4 className="font-blog-display text-sm font-bold leading-snug text-primary group-hover:text-secondary dark:text-dark-primary dark:group-hover:text-dark-secondary">
                  {story.title}
                </h4>
                <p className="mt-1 text-xs text-muted dark:text-dark-muted">
                  {story.reading_time || 1} min read
                </p>
              </div>
            </Link>
          ))}
          {trending.length === 0 && (
            <p className="text-sm text-muted dark:text-dark-muted">
              No trending stories yet.
            </p>
          )}
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-secondary dark:text-dark-secondary">
          Topics to follow
        </h3>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((topic) => (
            <Link
              key={topic}
              to={`/topic/${encodeURIComponent(topic)}`}
              className="rounded-full border border-default bg-shell px-3 py-1.5 text-xs font-medium text-secondary transition-colors hover:border-primary hover:bg-nav-hover hover:text-primary dark:border-dark-default dark:bg-dark-shell dark:text-dark-secondary dark:hover:border-dark-primary dark:hover:bg-dark-hover dark:hover:text-dark-primary"
            >
              {topic}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
