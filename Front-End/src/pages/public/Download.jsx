import { BlogShell } from "../blog/BlogShell";
import { FILE } from "../../services/RouteConfig";
import { useTranslation } from "react-i18next";

export default function Download() {
  const { t } = useTranslation();
  return (
    <BlogShell variant="feed">
      <div className="py-14 sm:py-20 lg:pb-28">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
          {t("publicDownload.eyebrow")}
        </p>
        <h1 className="font-blog-display max-w-2xl text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl dark:text-white">
          {t("publicDownload.title")}
        </h1>
        <p className="mt-6 max-w-2xl font-blog-serif text-lg leading-relaxed text-neutral-600 dark:text-neutral-300">
          {t("publicDownload.description")}
        </p>
        <a
          href={FILE.CLI_APPLICATION.DOWNLOAD_LATEST()}
          className="mt-10 inline-flex h-11 items-center justify-center rounded-xl bg-light-btn-primary-bg px-5 text-sm font-semibold text-white transition-colors hover:opacity-95 dark:bg-dark-primary dark:text-dark-shell"
        >
          {t("publicDownload.action")}
        </a>
      </div>
    </BlogShell>
  );
}
