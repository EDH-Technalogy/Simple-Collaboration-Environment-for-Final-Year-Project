import { Link } from "react-router-dom";
import { BlogShell } from "../blog/BlogShell";

export default function About() {
  return (
    <BlogShell variant="feed">
      <div className="py-14 sm:py-20 lg:pb-28">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
          About us
        </p>
        <h1 className="font-blog-display max-w-2xl text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl dark:text-white">
          A campus publisher for scholars, teachers, and students.
        </h1>
        <p className="mt-6 max-w-2xl font-blog-serif text-lg leading-relaxed text-neutral-600 dark:text-neutral-300">
          Stories and weblogs are open for everyone to read. Sign in when you’re
          ready to write, bookmark, comment, or manage your drafts.
        </p>
        <div className="mt-12 flex flex-wrap gap-3">
          <Link
            to="/"
            className="inline-flex h-11 items-center rounded-full border border-neutral-300 px-6 text-sm font-semibold text-neutral-900 no-underline transition-colors hover:bg-neutral-50 dark:border-white/20 dark:text-white dark:hover:bg-white/5"
          >
            Browse stories
          </Link>
          <Link
            to="/write"
            className="inline-flex h-11 items-center rounded-full bg-neutral-950 px-6 text-sm font-semibold text-white no-underline shadow-sm hover:opacity-90 dark:bg-white dark:text-neutral-950"
          >
            Start writing
          </Link>
        </div>
      </div>
    </BlogShell>
  );
}
