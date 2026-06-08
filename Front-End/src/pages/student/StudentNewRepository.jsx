import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BookMarked, Globe2, Lock, Slash } from "lucide-react";
import { gooeyToast } from "goey-toast";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/Button";
import Field from "../../components/Field";
import Select from "../../components/Select";
import {
  useVcCreateRepository,
  useRepositorySearch,
  useVcRepositoriesForViewer,
} from "../../services/useApi";
import { resolveShellBasePath } from "../../lib/roles";
import { cn } from "../../lib/utils";

const DESC_MAX = 350;
/** Radix Select forbids `<Select.Item value="">` — use this sentinel then strip on submit */
const NONE_OPTION_VALUE = "__none__";

function ownerInitials(username) {
  const u = String(username ?? "").trim();
  if (!u) return "??";
  const parts = u.split(/[._\s-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase().slice(0, 2);
  }
  return (
    u
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 2)
      .toUpperCase() || "GH"
  );
}

function slugRepoName(raw) {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

function StepRail({ step, children, last }) {
  return (
    <div className="flex gap-5 md:gap-8">
      <div className="flex shrink-0 flex-col items-center">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full border border-(--color-light-card-border) bg-light-app-tertiary text-sm font-bold text-primary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-primary"
          aria-hidden
        >
          {step}
        </span>
        {!last ? (
          <div
            className="mt-3 w-px flex-1 min-h-10 bg-light-divider dark:bg-dark-divider"
            aria-hidden
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1 space-y-4 pb-2">{children}</div>
    </div>
  );
}

function OwnerBadge({ username }) {
  const u = String(username ?? "").trim();
  return (
    <div
      className="pointer-events-none flex h-8 w-full items-center p-0.5 gap-2.5 rounded-md border border-(--color-light-input-border) bg-(--color-light-input-bg) px-3 py-1.5 dark:border-dark-input-border dark:bg-(--color-dark-input-bg)"
      title={u}
      aria-hidden={false}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/18 text-[10px] font-bold uppercase text-primary dark:bg-[rgba(0,102,255,0.22)] dark:text-dark-primary">
        {ownerInitials(u)}
      </span>
      <span className="min-w-0 truncate font-mono text-xs font-medium text-primary dark:text-dark-primary">
        {u || "—"}
      </span>
    </div>
  );
}

function ToggleSwitch({ checked, onCheckedChange, id }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-10.5 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 dark:focus-visible:ring-blue-400/25",
        checked
          ? "bg-[color-mix(in_srgb,var(--color-chart-success)_92%,transparent)] dark:bg-[color-mix(in_srgb,var(--color-chart-success)_88%,transparent)]"
          : "border border-(--color-light-input-border) bg-(--color-light-input-bg) dark:border-dark-input-border dark:bg-(--color-dark-input-bg)",
      )}
    >
      <span
        className={cn(
          "pointer-events-none mt-0.5 inline-block size-5 rounded-full bg-(--color-light-card-bg) shadow-sm ring-1 ring-black/10 transition-[transform] dark:bg-(--color-dark-card-bg)",
          checked ? "translate-x-5" : "translate-x-1",
        )}
      />
    </button>
  );
}

function ConfigRow({ title, help, aboutLabel, onAbout, trailing }) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-(--color-light-card-border) bg-(--color-light-card-bg) px-4 py-3.5 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) sm:flex-row sm:items-center sm:justify-between md:px-5">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-sm font-semibold text-primary dark:text-dark-primary">
            {title}
          </span>
          {aboutLabel ? (
            <button
              type="button"
              onClick={onAbout}
              className="text-[11px] font-semibold text-primary underline-offset-4 hover:underline dark:text-dark-primary"
            >
              {aboutLabel}
            </button>
          ) : null}
        </div>
        {help ? (
          <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-secondary dark:text-dark-secondary">
            {help}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-3 sm:ps-6">{trailing}</div>
    </div>
  );
}

export default function StudentNewRepository() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const shellBase = resolveShellBasePath(location.pathname, user?.role);
  const repositoryListPath =
    shellBase === "/teacher"
      ? `${shellBase}/repositories`
      : `${shellBase}/workspace`;

  /** Auto-injected from the signed-in gateway user — never selectable */
  const owner =
    typeof user?.username === "string" && user.username.trim().length > 0
      ? user.username.trim()
      : typeof user?.user_name === "string"
        ? user.user_name.trim()
        : "";

  /** Same listing as workspace — authoritive owner + repo for this account. */
  const vcOwnerAccountId =
    user?.id != null && String(user.id).trim() !== ""
      ? String(user.id).trim()
      : "";

  const {
    data: repoList = [],
    isLoading: reposLoading,
    isError: reposLoadError,
  } = useVcRepositoriesForViewer(vcOwnerAccountId, {
    enabled: Boolean(vcOwnerAccountId),
    notifyOnError: false,
    activityUsernameFallback: owner,
  });

  const [repositoryName, setRepositoryName] = useState("");
  /** Debounced slug for `REPOSITORY.SEARCH` — avoids a request on every keystroke. */
  const [debouncedSlug, setDebouncedSlug] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [addReadme] = useState(false);
  const [gitignore] = useState(NONE_OPTION_VALUE);
  const [license] = useState(NONE_OPTION_VALUE);

  const createRepo = useVcCreateRepository({
    onSuccess: (data) => {
      const rn =
        data?.repositoryName ??
        data?.repository_name ??
        slugRepoName(repositoryName);
      gooeyToast.success(t("studentNewRepo.success"));
      const own = encodeURIComponent(owner);
      navigate(
        `${shellBase}/repository/${own}/${encodeURIComponent(String(rn ?? "").trim())}`,
        { replace: true },
      );
    },
  });

  const slugPreview = slugRepoName(repositoryName);

  useEffect(() => {
    const next = slugRepoName(repositoryName);
    const tick = setTimeout(() => setDebouncedSlug(next), 360);
    return () => clearTimeout(tick);
  }, [repositoryName]);

  const {
    data: searchHits = [],
    isFetching: searchFetching,
    isError: searchError,
  } = useRepositorySearch(debouncedSlug, {
    enabled: Boolean(owner && debouncedSlug.length >= 1),
    notifyOnError: false,
  });

  const searchSynced = debouncedSlug === slugPreview && slugPreview.length > 0;

  /** Exact `ownerUsername` + canonical repo slug from your workspace list (not regex keyword search). */
  const duplicateFromMyRepos = useMemo(() => {
    if (!slugPreview || !owner || !vcOwnerAccountId) return false;
    if (reposLoading) return false;
    const ownerLc = owner.toLowerCase();
    const list = Array.isArray(repoList) ? repoList : [];
    return list.some((r) => {
      const o = String(r?.ownerUsername ?? r?.owner_username ?? "").trim();
      const n = String(
        r?.repositoryName ?? r?.repository_name ?? r?.name ?? "",
      ).trim();
      if (!o || !n) return false;
      return o.toLowerCase() === ownerLc && slugRepoName(n) === slugPreview;
    });
  }, [repoList, owner, reposLoading, slugPreview, vcOwnerAccountId]);

  /**
   * Keyword search hits the whole catalogue (repo/description/owner regex).
   * We only treat a row as a collision when **owner + canonical repo name** match.
   */
  const duplicateFromSearch = useMemo(() => {
    if (!searchSynced || !owner || !slugPreview) return false;
    const ownerLc = owner.toLowerCase();
    const list = Array.isArray(searchHits) ? searchHits : [];
    return list.some((r) => {
      const o = String(
        r?.ownerUsername ??
          r?.owner_username ??
          r?.owner?.username ??
          r?.owner?.userName ??
          "",
      ).trim();
      const n = String(
        r?.repositoryName ?? r?.repository_name ?? r?.name ?? "",
      ).trim();
      if (!n || !o) return false;
      const apiSlug = slugRepoName(n);
      if (!apiSlug) return false;
      return o.toLowerCase() === ownerLc && apiSlug === slugPreview;
    });
  }, [searchHits, owner, searchSynced, slugPreview]);

  const nameTaken = duplicateFromMyRepos || duplicateFromSearch;

  const showNameAvailability = Boolean(slugPreview && owner);

  /** Lock input when we know this owner/repo already exists (list or search exact match). */
  const nameBlocksFurtherTyping = Boolean(
    showNameAvailability &&
    repositoryName.length > 0 &&
    ((!reposLoading && vcOwnerAccountId && duplicateFromMyRepos) ||
      (searchSynced && !searchFetching && !searchError && duplicateFromSearch)),
  );

  const nameCheckBusy = Boolean(
    slugPreview &&
    (!searchSynced ||
      searchFetching ||
      (Boolean(vcOwnerAccountId) && reposLoading)),
  );

  /** Green only after your repo list loaded OK — empty keyword search results do not prove availability. */
  const canConfirmNameAvailable = Boolean(
    showNameAvailability &&
    searchSynced &&
    !searchFetching &&
    !searchError &&
    !nameTaken &&
    vcOwnerAccountId &&
    !reposLoading &&
    !reposLoadError,
  );

  const showNameNeutralHint = Boolean(
    showNameAvailability &&
    searchSynced &&
    !searchFetching &&
    !searchError &&
    !nameTaken &&
    !nameCheckBusy &&
    !canConfirmNameAvailable,
  );

  const visOptions = [
    {
      value: "PUBLIC",
      label: `${t("studentNewRepo.vis.public")}`,
      icon: Globe2,
    },
    {
      value: "PRIVATE",
      label: t("studentNewRepo.vis.private"),
      icon: Lock,
    },
  ];

  const visSelectOptions = visOptions.map((o) => ({
    value: o.value,
    label: o.label,
  }));

  const VisIcon = visibility === "PRIVATE" ? Lock : Globe2;

  const submit = () => {
    const rn = slugRepoName(repositoryName);
    if (!owner) {
      gooeyToast.error(t("studentNewRepo.needUsername"));
      return;
    }
    if (!rn) {
      gooeyToast.error(t("studentNewRepo.nameInvalid"));
      return;
    }
    if (vcOwnerAccountId && !reposLoading && duplicateFromMyRepos) {
      gooeyToast.error(t("studentNewRepo.nameTaken", { name: rn }));
      return;
    }
    if (
      searchSynced &&
      !searchFetching &&
      !searchError &&
      duplicateFromSearch
    ) {
      gooeyToast.error(t("studentNewRepo.nameTaken", { name: rn }));
      return;
    }

    const body = {
      user_name: owner,
      repository_name: rn,
      description: description.trim().slice(0, DESC_MAX) || "",
      repository_visibility: visibility,
    };

    if (addReadme) body.include_readme = true;
    if (gitignore !== NONE_OPTION_VALUE && gitignore.trim()) {
      body.gitignore_template = gitignore.trim();
    }
    if (license !== NONE_OPTION_VALUE && license.trim()) {
      body.license_template = license.trim();
    }

    createRepo.mutate(body);
  };

  return (
    <div className="min-h-screen flex-1 bg-white dark:bg-dark-card-bg p-3 ">
      <div className="mx-auto w-full border border-default rounded-md dark:bg-dark-app-secondary dark:border-dark-default max-w-6xl px-4 py-6 md:px-6 md:py-10">
        <div className="mb-8 flex flex-wrap items-center gap-3 border-b border-light-divider pb-6 dark:border-dark-divider">
          <Link
            to={repositoryListPath}
            className="text-xs font-semibold text-primary underline-offset-4 hover:underline dark:text-dark-primary"
          >
            ← {t("studentNewRepo.back")}
          </Link>
        </div>

        <header className="space-y-2">
          <h1 className="text-3xl font-normal rtl:font-persian tracking-tight text-primary dark:text-dark-primary md:text-4xl">
            {t("studentNewRepo.title")}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-secondary dark:text-dark-secondary">
            {t("studentNewRepo.intro")}{" "}
            <button
              type="button"
              onClick={() => gooeyToast.info(t("studentNewRepo.importToast"))}
              className="font-semibold text-primary underline-offset-4 hover:underline dark:text-dark-primary"
            >
              {t("studentNewRepo.importCta")}
            </button>
          </p>
          <p className="text-[11px] text-muted dark:text-dark-muted">
            {t("studentNewRepo.requiredNote")}
          </p>
        </header>

        <div className="mt-10 space-y-12">
          {/* Step 1 — General */}
          <StepRail step={1} last={false}>
            <h2 className="text-xl font-semibold text-primary dark:text-dark-primary md:text-2xl">
              {t("studentNewRepo.stepGeneral")}
            </h2>

            <div className="space-y-4">
              <div>
                <p className="mb-3 text-[11px] font-semibold text-muted dark:text-dark-muted">
                  {t("studentNewRepo.repoNameRowLabel")}{" "}
                  <span className="text-light-error-text dark:text-dark-error-text">
                    *
                  </span>
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
                  <div className="w-full shrink-0 sm:w-[min(42%,14rem)]">
                    <OwnerBadge username={owner} />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <span className="block  text-[11px] font-semibold text-transparent sm:hidden">
                      &nbsp;
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start">
                      <input
                        type="text"
                        autoCapitalize="off"
                        spellCheck={false}
                        aria-required
                        readOnly={nameBlocksFurtherTyping}
                        aria-invalid={Boolean(
                          showNameAvailability &&
                          ((!reposLoading &&
                            vcOwnerAccountId &&
                            duplicateFromMyRepos) ||
                            (searchSynced &&
                              !searchFetching &&
                              !searchError &&
                              duplicateFromSearch)),
                        )}
                        placeholder={t("studentNewRepo.namePlaceholder")}
                        value={repositoryName}
                        onChange={(e) => setRepositoryName(e.target.value)}
                        className={cn(
                          "h-8 min-w-0 flex-1 rounded-md border px-3.5 py-1.5 font-mono text-xs outline-none transition-colors border-(--color-light-input-border) bg-(--color-light-input-bg) text-(--color-light-text-primary) placeholder:text-(--color-light-input-placeholder) focus:border-(--color-light-input-border-focus) focus:ring-2 focus:ring-blue-500/15 dark:border-dark-input-border dark:bg-(--color-dark-input-bg) dark:text-(--color-dark-text-primary) dark:placeholder:text-(--color-dark-input-placeholder) dark:focus:border-(--color-dark-input-border-focus) dark:focus:ring-blue-400/15",
                          nameBlocksFurtherTyping &&
                            "cursor-not-allowed opacity-90",
                        )}
                      />
                      {nameBlocksFurtherTyping ? (
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-8 shrink-0 self-stretch sm:self-auto sm:px-3"
                          onClick={() => setRepositoryName("")}
                        >
                          {t("studentNewRepo.nameTakenChangeCta")}
                        </Button>
                      ) : null}
                    </div>
                    {showNameAvailability ? (
                      nameCheckBusy ? (
                        <p
                          className="pt-1 text-[11px] text-muted dark:text-dark-muted"
                          aria-live="polite"
                        >
                          {t("studentNewRepo.nameAvailabilityChecking")}
                        </p>
                      ) : searchError ? (
                        <p
                          className="pt-1 text-[11px] text-muted dark:text-dark-muted"
                          aria-live="polite"
                        >
                          {t("studentNewRepo.nameAvailabilityUnavailable")}
                        </p>
                      ) : nameTaken ? (
                        <p
                          className="pt-1 text-[11px] font-medium text-light-error-text dark:text-dark-error-text"
                          aria-live="polite"
                        >
                          {t("studentNewRepo.nameTaken", {
                            name: slugPreview,
                          })}
                        </p>
                      ) : vcOwnerAccountId && reposLoadError ? (
                        <p
                          className="pt-1 text-[11px] text-muted dark:text-dark-muted"
                          aria-live="polite"
                        >
                          {t("studentNewRepo.nameAvailabilityRepoListFailed")}
                        </p>
                      ) : canConfirmNameAvailable ? (
                        <p
                          className="pt-1 text-[11px] font-medium text-light-success-text dark:text-(--color-dark-success-text)"
                          aria-live="polite"
                        >
                          {t("studentNewRepo.nameAvailable", {
                            path: `${owner}/${slugPreview}`,
                          })}
                        </p>
                      ) : showNameNeutralHint ? (
                        <p
                          className="pt-1 text-[11px] text-muted dark:text-dark-muted"
                          aria-live="polite"
                        >
                          {!vcOwnerAccountId
                            ? t("studentNewRepo.nameAvailabilityNeedsAccountId")
                            : t(
                                "studentNewRepo.nameAvailabilitySearchNotProof",
                              )}
                        </p>
                      ) : null
                    ) : null}
                  </div>
                </div>
              </div>

              <Field label={t("studentNewRepo.description")} register={{}}>
                <textarea
                  maxLength={DESC_MAX}
                  rows={5}
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value.slice(0, DESC_MAX))
                  }
                  placeholder={t("studentNewRepo.descriptionPlaceholder")}
                  className="w-full resize-y rounded-md border px-3.5 py-2.5 text-xs outline-none transition-colors min-h-22 border-(--color-light-input-border) bg-(--color-light-input-bg) text-(--color-light-text-primary) placeholder:text-(--color-light-input-placeholder) focus:border-(--color-light-input-border-focus) focus:ring-2 focus:ring-blue-500/15 dark:border-dark-input-border dark:bg-(--color-dark-input-bg) dark:text-(--color-dark-text-primary) dark:placeholder:text-(--color-dark-input-placeholder) dark:focus:border-(--color-dark-input-border-focus) dark:focus:ring-blue-400/15"
                />
              </Field>
              <div className="flex justify-end">
                <p className="text-[11px] text-muted dark:text-dark-muted">
                  {t("studentNewRepo.descriptionCounter", {
                    count: description.length,
                    max: DESC_MAX,
                  })}
                </p>
              </div>
            </div>
          </StepRail>

          {/* Step 2 — Configuration */}
          <StepRail step={2} last>
            <h2 className="text-xl font-semibold text-primary dark:text-dark-primary md:text-2xl">
              {t("studentNewRepo.stepConfig")}
            </h2>

            <div className="space-y-3">
              <ConfigRow
                title={
                  <span className="inline-flex items-center gap-1">
                    <span>{t("studentNewRepo.visibilityLabel")}</span>
                    <span
                      aria-hidden
                      className="text-light-error-text dark:text-dark-error-text"
                    >
                      *
                    </span>
                  </span>
                }
                help={t("studentNewRepo.visibilityHelp")}
                trailing={
                  <div className="flex items-center gap-2">
                    <VisIcon
                      className="size-4 shrink-0 text-muted dark:text-dark-muted"
                      strokeWidth={2}
                      aria-hidden
                    />
                    <div className="w-[min(100%,12rem)]">
                      <Select
                        value={visibility}
                        onChange={(v) => setVisibility(v)}
                        options={visSelectOptions}
                      />
                    </div>
                  </div>
                }
              />

              <div className="flex flex-wrap justify-end gap-2 border-t border-light-divider pt-6 dark:border-dark-divider">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate(repositoryListPath)}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  icon={
                    <BookMarked
                      className="me-2 size-4 shrink-0"
                      strokeWidth={2}
                      aria-hidden
                    />
                  }
                  type="button"
                  variant="primary"
                  disabled={
                    createRepo.isPending ||
                    !owner ||
                    nameCheckBusy ||
                    (vcOwnerAccountId &&
                      !reposLoading &&
                      duplicateFromMyRepos) ||
                    (searchSynced &&
                      !searchFetching &&
                      !searchError &&
                      duplicateFromSearch)
                  }
                  onClick={submit}
                  className="min-w-44"
                >
                  {t("studentNewRepo.submit")}
                </Button>
              </div>
            </div>
          </StepRail>
        </div>
      </div>
    </div>
  );
}
