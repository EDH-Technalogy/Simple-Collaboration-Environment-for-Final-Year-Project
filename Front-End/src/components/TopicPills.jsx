import { Link } from "react-router-dom";

const TOPICS = [
  "Technology",
  "Science",
  "Programming",
  "Design",
  "Business",
  "Health",
  "Culture",
  "Politics",
  "Travel",
  "Self Improvement",
  "Productivity",
  "Writing",
  "AI",
  "Startups",
];

export default function TopicPills({ activeTopic }) {
  const inactive =
    "border border-default bg-input text-secondary hover:border-default hover:bg-nav-hover hover:text-primary dark:border-dark-default dark:bg-dark-input dark:text-dark-secondary dark:hover:border-dark-default dark:hover:bg-dark-hover dark:hover:text-dark-primary";
  const active =
    "border border-transparent bg-primary text-white dark:bg-dark-primary dark:text-[var(--color-dark-shell)]";

  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
      <Link
        to="/"
        className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
          !activeTopic ? active : inactive
        }`}
      >
        Home
      </Link>
      {TOPICS.map((topic) => (
        <Link
          key={topic}
          to={`/topic/${encodeURIComponent(topic)}`}
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            activeTopic === topic ? active : inactive
          }`}
        >
          {topic}
        </Link>
      ))}
    </div>
  );
}
