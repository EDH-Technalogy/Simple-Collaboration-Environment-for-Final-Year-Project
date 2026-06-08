import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function PublicWebsiteFooter() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  const linkCls =
    "text-sm font-medium text-primary transition-colors hover:text-secondary dark:text-dark-primary dark:hover:text-dark-secondary";

  const backToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="min-h-screen w-full overflow-hidden border-t border-light-divider bg-(--color-light-card-bg) text-primary dark:border-dark-divider dark:bg-(--color-dark-card-bg) dark:text-dark-primary">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col items-center px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-20 flex w-full flex-col items-start justify-between gap-12 md:flex-row">
          <div className="max-w-md">
            <h2 className="font-blog-display mb-6 text-3xl font-bold tracking-tight text-primary dark:text-dark-primary">
              {t("publicFooter.bold.title")}
            </h2>
            <a
              href={`mailto:${t("publicFooter.bold.email")}`}
              className="border-b-2 border-(--color-light-text-primary) pb-1 text-lg font-medium text-primary transition-colors hover:border-(--color-light-text-secondary) hover:text-secondary dark:border-(--color-dark-text-primary) dark:text-dark-primary dark:hover:border-(--color-dark-text-secondary) dark:hover:text-dark-secondary"
            >
              {t("publicFooter.bold.email")}
            </a>
          </div>

          <div className="grid grid-cols-2 gap-12 sm:gap-24">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted dark:text-dark-muted">
                {t("publicFooter.bold.location")}
              </p>
              <address className="space-y-1 text-sm not-italic text-secondary dark:text-dark-secondary">
                <p>{t("publicFooter.bold.locationLine1")}</p>
                <p>{t("publicFooter.bold.locationLine2")}</p>
              </address>
            </div>
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted dark:text-dark-muted">
                {t("publicFooter.column.explore")}
              </p>
              <nav className="flex flex-col gap-2">
                <Link to="/blogs" className={linkCls}>
                  {t("publicFooter.links.stories")}
                </Link>
                <Link to="/projects" className={linkCls}>
                  {t("publicFooter.links.projects")}
                </Link>
                <Link to="/documentation" className={linkCls}>
                  {t("publicFooter.links.documentation")}
                </Link>
                <Link to="/write" className={linkCls}>
                  {t("publicFooter.links.write")}
                </Link>
              </nav>
            </div>
          </div>
        </div>

        <div className="relative mt-auto w-full">
          <h1 className="font-blog-display pointer-events-none -mb-[2vw] select-none text-[11vw] font-black leading-none tracking-tighter text-primary opacity-[0.05] dark:text-dark-primary">
            {t("publicFooter.bold.watermark")}
          </h1>
          <div className="relative z-10 flex flex-col gap-6 border-t border-light-divider pt-8 pb-6 backdrop-blur dark:border-dark-divider sm:flex-row sm:items-end sm:justify-between">
            <span className="text-xs font-medium uppercase tracking-widest text-muted dark:text-dark-muted">
              {t("publicFooter.bottom", { year })}
            </span>
            <div className="flex flex-wrap gap-6 sm:gap-8">
              <span className="text-xs text-muted dark:text-dark-muted">
                {t("publicFooter.note")}
              </span>
              <button
                type="button"
                onClick={backToTop}
                className="text-xs font-bold uppercase tracking-widest text-primary transition-colors hover:text-secondary dark:text-dark-primary dark:hover:text-dark-secondary"
              >
                {t("publicFooter.bold.backToTop")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
