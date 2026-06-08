import { NavLink, Outlet, Navigate, useLocation, useParams } from "react-router-dom";
import {
  BarChart3,
  BookMarked,
  ChevronDown,
  Eye,
  GitFork,
  GitPullRequest,
  LayoutGrid,
  ListTodo,
  PencilLine,
  Star,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { resolveShellBasePath } from "../../lib/roles";
import { cn } from "../../lib/utils";
import { useVcRepository } from "../../services/useApi";

function tabClass(active) {
  return cn(
    "inline-flex items-center gap-1.5 border-b-2 px-1 py-2.5 text-xs font-medium transition-colors",
    active
      ? "border-(--color-light-input-border-focus) text-primary dark:border-(--color-dark-input-border-focus) dark:text-dark-primary"
      : "border-transparent text-muted hover:border-(--color-light-card-border) hover:text-secondary dark:text-dark-muted dark:hover:border-(--color-dark-card-border) dark:hover:text-dark-secondary",
  );
}

function repoActionClass(disabled = false) {
  return cn(
    "inline-flex h-8 items-center gap-1.5 rounded-md border border-(--color-light-card-border) bg-(--color-light-card-bg) px-2.5 text-xs font-medium text-secondary transition-colors dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:text-dark-secondary",
    disabled
      ? "cursor-not-allowed opacity-55"
      : "hover:border-(--color-light-input-border) hover:bg-(--color-light-card-hover) hover:text-primary dark:hover:border-(--color-dark-input-border-focus) dark:hover:bg-(--color-dark-card-hover) dark:hover:text-dark-primary",
  );
}

function countOrZero(v) {
  if (v == null) return "0";
  const n = Number(v);
  return Number.isNaN(n) ? String(v) : String(n);
}

export default function StudentRepositoryLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const { owner, repo } = useParams();
  const decodedOwner = owner ? decodeURIComponent(owner) : "";
  const decodedRepo = repo ? decodeURIComponent(repo) : "";
  const shellBase = resolveShellBasePath(location.pathname, undefined);

  const {
    data: meta,
    isLoading,
    isError,
  } = useVcRepository(decodedOwner, decodedRepo, {
    notifyOnError: false,
    enabled: Boolean(decodedOwner && decodedRepo),
  });

  const repoBase = `${shellBase}/repository/${encodeURIComponent(decodedOwner)}/${encodeURIComponent(decodedRepo)}`;
  const backPath =
    shellBase === "/admin" || shellBase === "/teacher"
      ? `${shellBase}/projects`
      : `${shellBase}/workspace`;

  const visibility =
    meta?.visibility ??
    meta?.repository_visibility ??
    meta?.visibility_type ??
    "";
  const starCount =
    meta?.stars_count ??
    meta?.starsCount ??
    meta?.stars ??
    meta?.stargazers_count ??
    meta?.counts?.stars ??
    0;
  const forkCount =
    meta?.forks_count ??
    meta?.forksCount ??
    meta?.forks ??
    meta?.counts?.forks ??
    0;
  const watchCount =
    meta?.watchers_count ?? meta?.subscriptions_count ?? meta?.watch_count ?? 0;
  const summary =
    meta?.description ||
    (isLoading
      ? t("studentRepo.shell.loadingSubtitle")
      : isError
        ? t("studentRepo.shell.errorSubtitle")
        : t("studentRepo.shell.placeholderSubtitle"));

  if (!decodedOwner.trim() || !decodedRepo.trim()) {
    return <Navigate to={`${shellBase}/workspace`} replace />;
  }

  return (
    <div className="min-h-screen flex-1 bg-white dark:bg-dark-card-bg">
      <div className="mx-auto px-4 py-5 md:px-6 lg:px-8">
        <div className="mb-3 text-xs text-muted dark:text-dark-muted">
          <NavLink
            to={backPath}
            className="transition-colors hover:text-(--color-chart-blue-primary) dark:hover:text-(--color-chart-blue-secondary)"
          >
            {t("studentRepo.shell.back")}
          </NavLink>
          <span className="mx-2 text-(--color-light-card-border) dark:text-(--color-dark-card-border)">
            /
          </span>
          <span>{decodedOwner}</span>
        </div>

        <header className="border-b border-(--color-light-card-border) pb-4 dark:border-(--color-dark-card-border)">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-(--color-light-card-border) bg-(--color-light-card-bg) text-muted dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:text-dark-muted">
                <BookMarked className="h-4.5 w-4.5" strokeWidth={1.5} aria-hidden />
              </div>
              <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <h1 className="truncate text-xl font-semibold tracking-tight text-primary md:text-[1.75rem] dark:text-dark-primary">
                    {decodedRepo}
                  </h1>
                  {visibility ? (
                    <span className="inline-flex rounded-full border border-(--color-light-card-border) bg-light-app-tertiary px-2 py-0.5 text-[11px] font-medium text-secondary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-secondary">
                      {String(visibility)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1.5 max-w-3xl text-xs leading-5 text-secondary dark:text-dark-secondary">
                  {summary}
                </p>
              </div>
            </div>
          </div>
        </header>

        <nav
          className="mt-3 flex flex-wrap gap-x-4 border-b border-(--color-light-card-border) dark:border-(--color-dark-card-border)"
          aria-label={t("studentRepo.shell.tabsAria")}
        >
          <NavLink
            end
            to={repoBase}
            className={({ isActive }) => tabClass(isActive)}
          >
            <LayoutGrid
              className="size-4 shrink-0"
              strokeWidth={1.8}
              aria-hidden
            />
            {t("studentRepo.tabs.code")}
          </NavLink>
          <NavLink
            to={`${repoBase}/pull-requests`}
            className={({ isActive }) => tabClass(isActive)}
          >
            <GitPullRequest
              className="size-4 shrink-0"
              strokeWidth={1.5}
              aria-hidden
            />
            {t("studentRepo.tabs.pulls")}
          </NavLink>
          <NavLink
            to={`${repoBase}/tasks`}
            className={({ isActive }) => tabClass(isActive)}
          >
            <ListTodo
              className="size-4 shrink-0"
              strokeWidth={1.8}
              aria-hidden
            />
            {t("studentRepo.tabs.tasks")}
          </NavLink>
          <NavLink
            to={`${repoBase}/contributors`}
            className={({ isActive }) => tabClass(isActive)}
          >
            <Users className="size-4 shrink-0" strokeWidth={1.8} aria-hidden />
            {t("studentRepo.tabs.contributors")}
          </NavLink>
          <NavLink
            to={`${repoBase}/statistics`}
            className={({ isActive }) => tabClass(isActive)}
          >
            <BarChart3 className="size-4 shrink-0" strokeWidth={1.8} aria-hidden />
            {t("studentRepo.tabs.statistics")}
          </NavLink>
        </nav>

        <div className="pt-5">
          <Outlet
            context={{
              owner: decodedOwner,
              repo: decodedRepo,
              repositoryMeta: meta ?? null,
              repoBase,
            }}
          />
        </div>
      </div>
    </div>
  );
}
