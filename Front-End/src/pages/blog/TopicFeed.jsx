import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import StoryCard from "../../components/StoryCard";
import TopicPills from "../../components/TopicPills";
import { storiesForTopic } from "../../data/mockStories";
import { BlogShell } from "./BlogShell";

export default function TopicFeed() {
  const { topic } = useParams();
  const decoded = topic ? decodeURIComponent(topic) : "";
  const stories = useMemo(() => storiesForTopic(topic), [topic]);

  return (
    <BlogShell>
      <div className="pb-20 pt-6 sm:pt-10">
        <div className="mb-8 overflow-x-auto border-b border-default pb-6 dark:border-dark-default">
          <TopicPills activeTopic={decoded} />
        </div>

        <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted dark:text-dark-muted">
              Topic
            </p>
            <h1 className="font-blog-display text-3xl font-bold tracking-tight text-primary sm:text-4xl dark:text-dark-primary">
              {decoded || "For you"}
            </h1>
          </div>
          <Link
            to="/"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline dark:text-dark-primary"
          >
            All stories
          </Link>
        </div>

        {stories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-default px-8 py-20 text-center dark:border-dark-default">
            <p className="font-blog-serif text-secondary dark:text-dark-secondary">
              Nothing here yet.&nbsp;
              <Link
                to="/write"
                className="font-medium text-primary underline-offset-4 hover:underline dark:text-dark-primary"
              >
                Write the first piece
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="divide-y divide-default dark:divide-dark-default">
            {stories.map((story) => (
              <div key={story.id} className="py-9 first:pt-0 lg:py-10">
                <StoryCard story={story} />
              </div>
            ))}
          </div>
        )}
      </div>
    </BlogShell>
  );
}
