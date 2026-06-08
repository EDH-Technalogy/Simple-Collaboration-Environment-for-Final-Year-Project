import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BookMarked,
  Eye,
  GitFork,
  GitBranch,
  LayoutGrid,
  List,
  Lock,
  Plus,
  Search,
  Star,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/Button";
import Select from "../../components/Select";
import { resolveShellBasePath } from "../../lib/roles";
import { cn } from "../../lib/utils";
import { useVcAccessibleRepositoriesForViewer } from "../../services/useApi";

function visibilityKind(v) {
  const s = String(v ?? "").toLowerCase();
  if (s === "private" || s === "internal" || s === "limit" || s === "hidden") {
    return "private";
  }
  return "public";
}

function coalesceNumber(...vals) {
  for (const v of vals) {
    if (v == null) continue;
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return null;
}

function languageLabel(item) {
  const lang =
    item?.language ??
    item?.Language ??
    item?.primaryLanguage ??
    item?.repository?.language ??
    "";
  return typeof lang === "string" && lang.trim() ? lang.trim() : "";
}

function visibilityStyle(v) {
  return visibilityKind(v) === "private"
    ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900/60"
    : "bg-green-50 text-green-700 border-green-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/60";
}

function languageDotColor(language) {
  const colors = {
    TypeScript: "#3178c6",
    JavaScript: "#f7df1e",
    Python: "#3776ab",
    Markdown: "#083fa1",
  };
  return colors[language] || "#858585";
}

function repoOwnerUsername(item) {
  return String(
    item?.ownerUsername ??
      item?.owner_username ??
      item?.owner?.user_name ??
      item?.owner?.username ??
      item?.owner?.userName ??
      "",
  ).trim();
}

export default function StudentWorkspace() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const shellBase = resolveShellBasePath(location.pathname, user?.role);
  const repositoryCreatePath =
    shellBase === "/teacher"
      ? `${shellBase}/repositories/new`
      : `${shellBase}/workspace/repositories/new`;
  /** Gateway user id for VC `GET /api/v1/repos/{ownerId}` (list `RepositoryResponse`). */
  const vcOwnerAccountId =
    user?.id != null && String(user.id).trim() !== ""
      ? String(user.id).trim()
      : "";

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("relevance");
  const [layoutMode, setLayoutMode] = useState("list");

  const { data: repoList = [], isLoading: reposLoading } =
    useVcAccessibleRepositoriesForViewer(vcOwnerAccountId, {
      enabled: Boolean(vcOwnerAccountId),
      notifyOnError: false,
      activityUsernameFallback:
        typeof user?.username === "string" ? user.username.trim() : "",
    });

  const normalizedRepos = useMemo(() => {
    const list = Array.isArray(repoList) ? repoList : [];
    return list.filter((r) => repoOwnerUsername(r) && r?.repositoryName);
  }, [repoList]);

  const searchedRepos = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return normalizedRepos;
    return normalizedRepos.filter((item) => {
      const slug =
        `${repoOwnerUsername(item)}/${item.repositoryName}`.toLowerCase();
      const desc = String(item.description ?? "").toLowerCase();
      const lang = languageLabel(item).toLowerCase();
      return slug.includes(q) || desc.includes(q) || lang.includes(q);
    });
  }, [normalizedRepos, query]);

  const filteredRepos = useMemo(() => {
    const sorted = [...searchedRepos];
    if (sort === "name") {
      sorted.sort((a, b) =>
        `${repoOwnerUsername(a)}/${a.repositoryName}`.localeCompare(
          `${repoOwnerUsername(b)}/${b.repositoryName}`,
          i18n.language,
        ),
      );
    }
    if (sort === "updated") {
      sorted.sort((a, b) => {
        const ta = new Date(a.updatedAt ?? 0).getTime();
        const tb = new Date(b.updatedAt ?? 0).getTime();
        return tb - ta;
      });
    }
    return sorted;
  }, [searchedRepos, sort, i18n.language]);

  const pageTitle = t("studentWorkspace.tabs.repositories");

  const sortOptions = useMemo(
    () => [
      { value: "relevance", label: t("studentWorkspace.sort.relevance") },
      { value: "name", label: t("studentWorkspace.sort.name") },
      { value: "updated", label: t("studentWorkspace.sort.updated") },
    ],
    [t],
  );

  return (
    <div className="min-h-screen flex-1 bg-white dark:bg-dark-app-secondary">
      <div className="mx-auto flex w-full  flex-col gap-0 md:flex-row">
        <main className="min-w-0 flex-1 p-4 md:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight text-primary dark:text-dark-primary md:text-3xl">
                {pageTitle}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-secondary dark:text-dark-secondary">
                {t("studentWorkspace.lead.repositories")}
              </p>
            </div>
            <Link to={repositoryCreatePath} className="shrink-0">
              <Button
                icon={
                  <Plus
                    className="size-4 shrink-0"
                    strokeWidth={2}
                    aria-hidden
                  />
                }
                type="button"
                variant="primary"
                className="gap-2 whitespace-nowrap"
              >
                {t("studentWorkspace.actions.newRepository")}
              </Button>
            </Link>
          </div>

          <>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative min-w-0 flex-1">
                  <div className="pointer-events-none absolute inset-s-3 top-1/2 -translate-y-1/2 text-muted dark:text-dark-muted">
                    <Search className="size-4" strokeWidth={2} aria-hidden />
                  </div>
                  <label
                    htmlFor="student-workspace-repo-search"
                    className="sr-only"
                  >
                    {t("studentWorkspace.search.label")}
                  </label>
                  <input
                    id="student-workspace-repo-search"
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("studentWorkspace.search.placeholder")}
                    autoComplete="off"
                    className="h-9 w-full rounded-md border border-(--color-light-input-border) bg-(--color-light-input-bg) py-1.5 ps-9 pe-20 text-xs text-(--color-light-text-primary) outline-none transition-colors placeholder:text-(--color-light-input-placeholder) focus:border-(--color-light-input-border-focus) focus:ring-2 focus:ring-blue-500/15 dark:border-dark-input-border dark:bg-(--color-dark-input-bg) dark:text-(--color-dark-text-primary) dark:placeholder:text-(--color-dark-input-placeholder) dark:focus:border-(--color-dark-input-border-focus) dark:focus:ring-blue-400/15"
                  />
                  <div className="pointer-events-none absolute inset-e-10 top-1/2 -translate-y-1/2">
                    <span className="rounded-md border border-(--color-light-input-border) bg-light-app-tertiary px-2 py-0.5 font-mono text-[10px] font-medium text-secondary dark:border-dark-input-border dark:bg-dark-app-tertiary dark:text-dark-secondary">
                      {t("studentWorkspace.search.filterChip")}
                    </span>
                  </div>
                  {query.trim() ? (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="absolute inset-e-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition-colors hover:bg-light-app-tertiary hover:text-primary dark:text-dark-muted dark:hover:bg-dark-app-tertiary dark:hover:text-dark-primary"
                      aria-label={t("studentWorkspace.search.clearAria")}
                    >
                      <X className="size-4" strokeWidth={2} aria-hidden />
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 border-b border-light-divider pb-3 sm:flex-row sm:items-center sm:justify-between dark:border-dark-divider">
                <p className="text-sm font-semibold text-primary dark:text-dark-primary">
                  {t("studentWorkspace.toolbar.count", {
                    count: filteredRepos.length,
                  })}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="w-42">
                    <Select
                      value={sort}
                      onChange={setSort}
                      options={sortOptions}
                      placeholder={t("studentWorkspace.sort.label")}
                    />
                  </div>
                  <div className="inline-flex rounded-xl border border-(--color-light-input-border) p-0.5 dark:border-dark-input-border">
                    <button
                      type="button"
                      onClick={() => setLayoutMode("list")}
                      className={cn(
                        "inline-flex size-8 items-center justify-center rounded-lg transition-colors",
                        layoutMode === "list"
                          ? "bg-light-app-tertiary text-primary dark:bg-dark-app-tertiary dark:text-dark-primary"
                          : "text-muted hover:text-primary dark:text-dark-muted dark:hover:text-dark-primary",
                      )}
                      aria-label={t("studentWorkspace.view.listAria")}
                      aria-pressed={layoutMode === "list"}
                    >
                      <List className="size-4" strokeWidth={1.5} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => setLayoutMode("grid")}
                      className={cn(
                        "inline-flex size-8 items-center justify-center rounded-lg transition-colors",
                        layoutMode === "grid"
                          ? "bg-light-app-tertiary text-primary dark:bg-dark-app-tertiary dark:text-dark-primary"
                          : "text-muted hover:text-primary dark:text-dark-muted dark:hover:text-dark-primary",
                      )}
                      aria-pressed={layoutMode === "grid"}
                      aria-label={t("studentWorkspace.view.gridAria")}
                    >
                      <LayoutGrid
                        className="size-4"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                    </button>
                  </div>
                </div>
              </div>

              {reposLoading && (
                <p className="mt-6 text-sm text-muted dark:text-dark-muted">
                  {t("studentWorkspace.repositories.loading")}
                </p>
              )}

              {!reposLoading && !filteredRepos.length ? (
                <p className="mt-8 text-sm text-muted dark:text-dark-muted">
                  {!normalizedRepos.length
                    ? t("studentWorkspace.repositories.empty")
                    : t("studentWorkspace.repositories.noMatch")}
                </p>
              ) : null}

              {!reposLoading &&
              layoutMode === "list" &&
              filteredRepos.length ? (
                <ul
                  className="mt-4 flex flex-col gap-y-1 overflow-hidden rounded-md border border-(--color-light-card-border) bg-(--color-light-card-bg) p-2 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)"
                  aria-label={t("studentWorkspace.list.aria")}
                >
                  {filteredRepos.map((item) => (
                    <RepoListRow
                      key={`${repoOwnerUsername(item)}/${item.repositoryName}`}
                      item={item}
                      t={t}
                      shellBase={shellBase}
                    />
                  ))}
                </ul>
              ) : null}

              {!reposLoading &&
              layoutMode === "grid" &&
              filteredRepos.length ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredRepos.map((item) => (
                    <RepoGridCard
                      key={`${repoOwnerUsername(item)}/${item.repositoryName}`}
                      item={item}
                      t={t}
                      shellBase={shellBase}
                    />
                  ))}
                </div>
              ) : null}
          </>
        </main>
      </div>
    </div>
  );
}

/**
 * @param {{ item: object, t: import('i18next').TFunction, shellBase: string }} props
 */
function RepoListRow({ item, t, shellBase }) {
  const owner = repoOwnerUsername(item);
  const name = item.repositoryName;
  const to = `${shellBase}/repository/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
  const visibility = visibilityKind(item.visibility);
  const visibilityLabel =
    visibility === "private"
      ? t("studentWorkspace.repositories.private")
      : t("studentWorkspace.repositories.public");
  const lang = languageLabel(item);
  const stars = coalesceNumber(
    item.stars,
    item.stars_count,
    item.starsCount,
    item.stargazers_count,
    item.watchers_count /* some APIs reuse */,
  );
  const forks = coalesceNumber(item.forks, item.forks_count, item.forksCount);
  const updatedAt = item.updatedAt
    ? new Date(item.updatedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <li>
      <Link
        to={to}
        className="block rounded-lg border border-[#e4e8ef] bg-white p-4 transition-colors hover:border-[#cfd7e6] hover:bg-[#f7f8fa] dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:hover:border-(--color-dark-input-border-focus) dark:hover:bg-dark-app-tertiary"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="cursor-pointer text-sm font-semibold text-[#0a1224] hover:text-[#0066ff] dark:text-dark-text-primary dark:hover:text-(--color-chart-blue-secondary)">
                {name}
              </h4>
              <span
                className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${visibilityStyle(item.visibility)}`}
              >
                {visibilityLabel}
              </span>
            </div>

            <p className="mt-2 line-clamp-2 text-xs text-[#5f6f87] dark:text-dark-text-secondary">
              {item.description || t("studentWorkspace.repositories.noDesc")}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#5f6f87] dark:text-dark-text-secondary">
              {lang ? (
                <div className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: languageDotColor(lang) }}
                  />
                  <span>{lang}</span>
                </div>
              ) : null}

              <div className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                <span>{stars != null ? stars : "—"}</span>
              </div>

              <div className="flex items-center gap-1">
                <GitBranch className="h-3 w-3" />
                <span>{forks != null ? forks : "—"}</span>
              </div>

              {updatedAt ? (
                <span className="text-[#98a2b3] dark:text-dark-text-muted">
                  {t("studentWorkspace.repositories.updated")} {updatedAt}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex-shrink-0">
            <Eye className="h-4 w-4 cursor-pointer text-[#98a2b3] hover:text-[#0a1224] dark:text-dark-text-muted dark:hover:text-dark-text-primary" />
          </div>
        </div>
      </Link>
    </li>
  );
}

/**
 * @param {{ item: object, t: import('i18next').TFunction, shellBase: string }} props
 */
function RepoGridCard({ item, t, shellBase }) {
  const owner = repoOwnerUsername(item);
  const name = item.repositoryName;
  const to = `${shellBase}/repository/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
  const visibility = visibilityKind(item.visibility);
  const visibilityLabel =
    visibility === "private"
      ? t("studentWorkspace.repositories.private")
      : t("studentWorkspace.repositories.public");
  const lang = languageLabel(item);
  const stars = coalesceNumber(
    item.stars,
    item.stars_count,
    item.starsCount,
    item.stargazers_count,
  );
  const forks = coalesceNumber(item.forks, item.forks_count, item.forksCount);
  const updatedAt = item.updatedAt
    ? new Date(item.updatedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <Link
      to={to}
      className="rounded-lg border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 transition-colors hover:border-(--color-light-input-border) hover:bg-[#f7f8fa] dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:hover:border-(--color-dark-input-border-focus) dark:hover:bg-dark-app-tertiary"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-semibold text-[#0a1224] dark:text-dark-text-primary">
              {owner}/{name}
            </span>
            <span
              className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${visibilityStyle(item.visibility)}`}
            >
              {visibilityLabel}
            </span>
          </div>

          <p className="mt-2 line-clamp-2 text-xs text-[#5f6f87] dark:text-dark-text-secondary">
            {item.description || t("studentWorkspace.repositories.noDesc")}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#5f6f87] dark:text-dark-text-secondary">
            {lang ? (
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: languageDotColor(lang) }}
                />
                <span>{lang}</span>
              </div>
            ) : null}

            <div className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              <span>{stars != null ? stars : "—"}</span>
            </div>

            <div className="flex items-center gap-1">
              <GitFork className="h-3 w-3" />
              <span>{forks != null ? forks : "—"}</span>
            </div>

            {updatedAt ? (
              <span className="text-[#98a2b3] dark:text-dark-text-muted">
                {t("studentWorkspace.repositories.updated")} {updatedAt}
              </span>
            ) : null}
          </div>
        </div>

        <div className="shrink-0">
          {visibility === "private" ? (
            <Lock className="h-4 w-4 text-[#98a2b3] dark:text-dark-text-muted" />
          ) : (
            <BookMarked className="h-4 w-4 text-[#98a2b3] dark:text-dark-text-muted" />
          )}
        </div>
      </div>
    </Link>
  );
}
