import { Link } from "react-router-dom";
import { Bookmark } from "lucide-react";
import { BlogShell } from "./BlogShell";

const SAVED = [
  { id: "2", title: "Why Group Projects Need Clear Roles" },
  { id: "3", title: "From Topic to Thread: Writing Like Medium" },
];

export default function ReaderLibrary() {
  return (
    <BlogShell variant="editor">
      <div className="pb-24 pt-8 sm:pt-12">
        <div className="mb-10 flex flex-col gap-6 border-b border-default pb-10 dark:border-dark-default sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted dark:text-dark-muted">
              Reading list
            </p>
            <h1 className="font-blog-display text-3xl font-bold tracking-tight sm:text-[2.25rem]">
              Saved stories
            </h1>
            <p className="mt-3 max-w-lg text-secondary dark:text-dark-secondary">
              Everything you bookmark appears here until you plug in syncing
              with your backend.
            </p>
          </div>
          <Link
            to="/"
            className="btn-secondary inline-flex h-10 shrink-0 items-center px-5 text-sm"
          >
            Explore home
          </Link>
        </div>

        {SAVED.length === 0 ? (
          <div className="rounded-2xl border border-default bg-card px-8 py-16 text-center dark:border-dark-default dark:bg-dark-card">
            <Bookmark className="mx-auto size-12 stroke-[1.25] text-muted opacity-70 dark:text-dark-muted" />
            <p className="mt-4 text-secondary dark:text-dark-secondary">
              No saved stories yet. Save from any story&apos;s toolbar.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {SAVED.map((item) => (
              <li key={item.id}>
                <Link
                  to={`/story/${item.id}`}
                  className="font-blog-display group flex flex-col gap-3 rounded-xl border border-default bg-card px-5 py-4 transition-all hover:border-primary hover:shadow-md dark:border-dark-default dark:bg-dark-card dark:hover:border-dark-primary md:flex-row md:items-center md:justify-between"
                >
                  <span className="text-lg font-bold leading-snug text-primary group-hover:text-secondary dark:text-dark-primary dark:group-hover:text-dark-secondary md:text-xl">
                    {item.title}
                  </span>
                  <span className="shrink-0 text-sm font-medium text-primary underline-offset-2 group-hover:underline dark:text-dark-primary">
                    Read
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </BlogShell>
  );
}
