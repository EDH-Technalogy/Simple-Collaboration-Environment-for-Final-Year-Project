import { Link } from "react-router-dom";
import { BookmarkPlus } from "lucide-react";
import { format } from "date-fns";

function ClapCount({ count, iconClass }) {
  return (
    <span className={`inline-flex items-center gap-1 ${iconClass}`}>
      <span aria-hidden className="text-[15px] leading-none">
        👏
      </span>
      {count}
    </span>
  );
}

function PublishTypeBadge({ type }) {
  if (type !== "monograph" && type !== "weblog") return null;
  const label = type === "monograph" ? "Monograph" : "Weblog";
  return (
    <span
      className="inline-flex shrink-0 rounded-full border border-default px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary dark:border-dark-default dark:text-dark-secondary"
      title={
        type === "monograph"
          ? "Long-form published work"
          : "Blog post or short article"
      }
    >
      {label}
    </span>
  );
}

export default function StoryCard({ story, variant = "default" }) {
  const date = story.created_date
    ? format(new Date(story.created_date), "MMM d")
    : "";
  const fullDate = story.created_date
    ? format(new Date(story.created_date), "MMM d, yyyy")
    : "";
  const readTime = story.reading_time || 1;

  if (variant === "sidebar") {
    return (
      <Link
        to={`/story/${story.id}`}
        className="group block px-3 py-3 transition-colors hover:bg-nav-hover dark:hover:bg-dark-hover"
      >
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <PublishTypeBadge type={story.publish_type} />
          </div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted dark:text-dark-muted">
            In {story.collection || "Stories"}{" "}
            <span className="normal-case">&middot;</span>{" "}
            {story.author_name || "Anonymous"}
          </p>
          <h3 className="font-blog-display line-clamp-2 text-sm font-bold leading-snug text-primary group-hover:text-secondary dark:text-dark-primary dark:group-hover:text-dark-secondary">
            {story.title}
          </h3>
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted dark:text-dark-muted">
            <span>{fullDate || date}</span>
            {story.claps_count > 0 && (
              <>
                <span aria-hidden>&middot;</span>
                <ClapCount count={story.claps_count} iconClass="" />
              </>
            )}
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "featured") {
    return (
      <article className="group">
        <Link to={`/story/${story.id}`} className="block">
          <div className="relative mb-5 aspect-[16/10] overflow-hidden rounded-md bg-muted/30 dark:bg-dark-card sm:mb-6">
            {story.cover_image ? (
              <img
                src={story.cover_image}
                alt=""
                className="size-full object-cover transition duration-700 group-hover:scale-[1.02]"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-card dark:bg-dark-card">
                <span className="font-blog-display text-7xl font-bold text-muted opacity-40 dark:text-dark-muted">
                  {story.title?.[0]}
                </span>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <PublishTypeBadge type={story.publish_type} />
            </div>
            <p className="text-sm font-medium text-primary dark:text-dark-primary">
              {story.author_name || "Anonymous"}
            </p>
            <h2 className="font-blog-display text-[1.75rem] font-bold leading-[1.15] tracking-tight text-primary sm:text-[2rem] dark:text-dark-primary">
              {story.title}
            </h2>
            {story.subtitle && (
              <p className="font-blog-serif line-clamp-3 max-w-[640px] text-base leading-relaxed text-secondary sm:text-lg dark:text-dark-secondary">
                {story.subtitle}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-sm text-muted dark:text-dark-muted">
              <span>{fullDate}</span>
              <span aria-hidden>&middot;</span>
              <span>{readTime} min read</span>
              {story.claps_count > 0 && (
                <>
                  <span aria-hidden>&middot;</span>
                  <ClapCount count={story.claps_count} iconClass="" />
                </>
              )}
              <BookmarkPlus className="ms-auto size-5 opacity-70 group-hover:text-primary dark:group-hover:text-dark-primary sm:ms-4" strokeWidth={1.5} />
            </div>
          </div>
        </Link>
        {story.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {story.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag}
                to={`/topic/${encodeURIComponent(tag)}`}
                className="rounded-full border border-default bg-shell px-3 py-1 text-xs font-medium text-secondary transition-colors hover:border-primary hover:text-primary dark:border-dark-default dark:bg-dark-shell dark:text-dark-secondary dark:hover:border-dark-primary dark:hover:text-dark-primary"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}
      </article>
    );
  }

  return (
    <div className="group flex flex-col-reverse gap-5 sm:flex-row sm:gap-8 lg:gap-10">
      <div className="min-w-0 flex-1 space-y-2">
        <Link to={`/story/${story.id}`} className="block space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <PublishTypeBadge type={story.publish_type} />
          </div>
          <p className="text-sm font-medium text-primary dark:text-dark-primary">
            {story.author_name || "Anonymous"}
          </p>
          <h3 className="font-blog-display text-xl font-bold leading-snug tracking-tight text-primary group-hover:text-secondary sm:text-[1.35rem] dark:text-dark-primary dark:group-hover:text-dark-secondary">
            {story.title}
          </h3>
          {story.subtitle && (
            <p className="font-blog-serif line-clamp-2 hidden text-base leading-relaxed text-secondary dark:text-dark-secondary sm:block">
              {story.subtitle}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 pt-2 text-[13px] text-muted dark:text-dark-muted">
            <span>{fullDate || date}</span>
            <span aria-hidden>&middot;</span>
            <span>{readTime} min read</span>
            {story.claps_count > 0 && (
              <>
                <span aria-hidden>&middot;</span>
                <ClapCount count={story.claps_count} iconClass="" />
              </>
            )}
          </div>
        </Link>
        {story.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {story.tags.slice(0, 2).map((tag) => (
              <Link
                key={tag}
                to={`/topic/${encodeURIComponent(tag)}`}
                className="rounded-full border border-default px-2.5 py-0.5 text-xs font-medium text-secondary transition-colors hover:border-primary hover:text-primary dark:border-dark-default dark:text-dark-secondary dark:hover:border-dark-primary dark:hover:text-dark-primary"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}
      </div>
      {story.cover_image ? (
        <Link
          to={`/story/${story.id}`}
          className="aspect-[16/10] w-full shrink-0 overflow-hidden rounded-sm sm:size-36 sm:aspect-auto"
        >
          <img
            src={story.cover_image}
            alt=""
            className="size-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        </Link>
      ) : null}
    </div>
  );
}
