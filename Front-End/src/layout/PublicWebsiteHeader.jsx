import { useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Sun,
  UserCircle,
  UserPlus,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/themContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import AvatarDemo from "../components/Avatar";
import {
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownMenuRoot,
  DropdownSeparator,
  DropdownSub,
  DropdownSubContent,
  DropdownSubTrigger,
  DropdownTrigger,
} from "../components/DropdownMenu";
import { getDashboardPathForUser } from "../lib/roles";

const navLinkClass = ({ isActive }) =>
  `whitespace-nowrap rounded-xl px-3 py-2 text-[13px] font-medium transition-colors ${
    isActive
      ? "bg-light-app-tertiary text-primary dark:bg-dark-app-tertiary dark:text-dark-primary"
      : "text-secondary hover:bg-light-app-tertiary hover:text-primary dark:text-dark-secondary dark:hover:bg-dark-app-tertiary dark:hover:text-dark-primary"
  }`;

export default function PublicWebsiteHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { setLang } = useLanguage();
  const { user, hydrated, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navConfig = useMemo(
    () => [
      { to: "/", labelKey: "publicHeader.nav.home", end: true },
      { to: "/blogs", labelKey: "publicHeader.nav.blogs", end: false },
      { to: "/projects", labelKey: "publicHeader.nav.projects", end: false },
      {
        to: "/documentation",
        labelKey: "publicHeader.nav.documentation",
        end: false,
      },
    ],
    [],
  );

  const dashboardHref =
    hydrated && isAuthenticated && user ? getDashboardPathForUser(user) : null;

  const languageMenu = (
    <DropdownSub>
      <DropdownSubTrigger>{t("common.language")}</DropdownSubTrigger>
      <DropdownSubContent>
        <DropdownLabel>{t("common.language")}</DropdownLabel>
        <DropdownItem onClick={() => setLang("en")}>
          {t("appHeader.langNames.en")}
        </DropdownItem>
        <DropdownItem onClick={() => setLang("ps")}>
          {t("appHeader.langNames.ps")}
        </DropdownItem>
        <DropdownItem onClick={() => setLang("prs")}>
          {t("appHeader.langNames.prs")}
        </DropdownItem>
      </DropdownSubContent>
    </DropdownSub>
  );

  const signedInLabel =
    typeof user?.user_name === "string" && user.user_name.trim()
      ? user.user_name
      : typeof user?.email === "string"
        ? user.email
        : t("publicHeader.signedInFallback");
  const accountInitials = signedInLabel
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  const accountPhoto =
    user?.photoUrl || user?.photo_url || user?.profilePicture || "";

  const closeMobile = () => setMobileOpen(false);

  const languageDrawerItems = [
    { code: "en", label: t("appHeader.langNames.en") },
    { code: "ps", label: t("appHeader.langNames.ps") },
    { code: "prs", label: t("appHeader.langNames.prs") },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-light-divider bg-white backdrop-blur-md dark:border-dark-divider dark:bg-(--color-dark-card-bg)">
        <div className="mx-auto flex min-h-14 max-w-330 flex-wrap items-center gap-2 px-4 py-2 sm:h-16 sm:flex-nowrap sm:gap-4 sm:px-6 sm:py-0 lg:px-8">
          <Link
            to="/"
            className="font-blog-display order-1 me-2 shrink-0 text-[1.05rem] font-bold leading-tight tracking-tight text-primary no-underline sm:order-none sm:text-[1.125rem] dark:text-dark-primary md:text-xl lg:me-4"
          >
            {t("publicHeader.brand")}
          </Link>

          <nav className="order-4 hidden w-full basis-full flex-none items-center justify-center gap-0.5 lg:order-none lg:mx-3 lg:flex lg:min-w-0 lg:basis-auto lg:flex-1 lg:gap-1 xl:mx-6">
            {navConfig.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={navLinkClass}
              >
                {t(item.labelKey)}
              </NavLink>
            ))}
          </nav>

          <div className="order-2 ms-auto flex flex-1 flex-nowrap items-center justify-end gap-1 sm:order-none sm:flex-none sm:gap-2 lg:flex-none lg:shrink-0">
            <button
              type="button"
              onClick={() => toggleTheme()}
              aria-label={t("publicHeader.toggleTheme")}
              className="hidden size-9 shrink-0 items-center justify-center rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary text-secondary transition-colors hover:border-(--color-light-input-border-focus) hover:text-primary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-secondary dark:hover:border-(--color-dark-input-border-focus) dark:hover:text-dark-primary lg:flex"
            >
              {theme === "light" ? (
                <Moon className="size-3.5" strokeWidth={1.5} />
              ) : (
                <Sun className="size-3.5" strokeWidth={1.5} />
              )}
            </button>

            {!hydrated ? (
              <div className="hidden h-9 w-20 shrink-0 animate-pulse rounded-xl bg-light-app-tertiary dark:bg-dark-app-tertiary lg:block" />
            ) : isAuthenticated ? (
              <div className="hidden lg:block">
              <DropdownMenuRoot>
                <DropdownTrigger
                  showArrow={false}
                  compactIcon
                  aria-label={t("publicHeader.accountMenu")}
                  className="size-10! shrink-0 rounded-xl border border-(--color-light-card-border) shadow-sm dark:border-(--color-dark-card-border)"
                  icon={
                    <AvatarDemo
                      src={accountPhoto}
                      initials={accountInitials}
                      alt={signedInLabel}
                    />
                  }
                />
                <DropdownContent align="end" className="w-52">
                  <DropdownLabel>
                    {signedInLabel}
                  </DropdownLabel>
                  <DropdownItem
                    onSelect={() => {
                      navigate("/library");
                    }}
                  >
                    {t("publicHeader.readingList")}
                  </DropdownItem>
                  <DropdownItem
                    onSelect={() => {
                      navigate("/writer/profile");
                    }}
                  >
                    {t("publicHeader.yourProfile")}
                  </DropdownItem>
                  {dashboardHref ? (
                    <DropdownItem
                      onSelect={() => {
                        navigate(dashboardHref);
                      }}
                    >
                      {t("publicHeader.dashboard")}
                    </DropdownItem>
                  ) : null}
                  <DropdownSeparator />
                  {languageMenu}
                  <DropdownSeparator />
                  <DropdownItem onClick={() => logout()}>
                    {t("publicHeader.logOut")}
                  </DropdownItem>
                </DropdownContent>
              </DropdownMenuRoot>
              </div>
            ) : (
              <div className="hidden shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2 lg:flex">
                <Link
                  to="/login"
                  state={{ from: location }}
                  className="inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-xl border border-(--color-light-input-border) bg-(--color-light-card-bg) px-3 text-xs font-semibold text-primary shadow-sm transition-colors hover:border-(--color-light-input-border-focus) hover:bg-light-app-tertiary dark:border-(--color-dark-input-border) dark:bg-(--color-dark-input-bg) dark:text-dark-primary dark:hover:border-(--color-dark-input-border-focus) dark:hover:bg-dark-app-tertiary sm:px-4 sm:text-sm"
                >
                  <LogIn className="size-4" strokeWidth={1.8} />
                  {t("publicHeader.logIn")}
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-xl bg-(--color-light-btn-primary-bg) px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-(--color-light-btn-primary-hover) dark:bg-blue-400 dark:text-blue-950 dark:hover:bg-blue-300 sm:px-4 sm:text-sm"
                >
                  <UserPlus className="size-4" strokeWidth={1.8} />
                  {t("publicHeader.signUp")}
                </Link>
              </div>
            )}

            <button
              type="button"
              className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-(--color-light-card-border) text-secondary lg:hidden dark:border-(--color-dark-card-border) dark:text-dark-secondary"
              aria-expanded={mobileOpen}
              aria-label={t("publicHeader.openMenu")}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? (
                <X className="size-[18px]" strokeWidth={1.75} />
              ) : (
                <Menu className="size-[18px]" strokeWidth={1.75} />
              )}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-light-divider bg-(--color-light-card-bg) px-4 py-4 dark:border-dark-divider dark:bg-(--color-dark-card-bg) lg:hidden">
            <nav className="flex flex-col gap-1">
              {navConfig.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={navLinkClass}
                  onClick={closeMobile}
                >
                  {t(item.labelKey)}
                </NavLink>
              ))}
            </nav>

            <div className="mt-4 border-t border-light-divider pt-4 dark:border-dark-divider">
              <button
                type="button"
                onClick={() => {
                  toggleTheme();
                  closeMobile();
                }}
                className="flex w-full items-center justify-between rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary px-3 py-2.5 text-[13px] font-semibold text-primary transition-colors hover:border-(--color-light-input-border-focus) dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-primary dark:hover:border-(--color-dark-input-border-focus)"
              >
                <span>{t("publicHeader.toggleTheme")}</span>
                {theme === "light" ? (
                  <Moon className="size-4" strokeWidth={1.75} />
                ) : (
                  <Sun className="size-4" strokeWidth={1.75} />
                )}
              </button>

              <div className="mt-3 rounded-xl border border-(--color-light-card-border) p-3 dark:border-(--color-dark-card-border)">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted dark:text-dark-muted">
                  {t("common.language")}
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {languageDrawerItems.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => {
                        setLang(item.code);
                        closeMobile();
                      }}
                      className="rounded-xl border border-(--color-light-card-border) px-2 py-2 text-xs font-semibold text-secondary transition-colors hover:border-(--color-light-input-border-focus) hover:text-primary dark:border-(--color-dark-card-border) dark:text-dark-secondary dark:hover:border-(--color-dark-input-border-focus) dark:hover:text-dark-primary"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-light-divider pt-4 dark:border-dark-divider">
              {!hydrated ? (
                <div className="h-11 animate-pulse rounded-xl bg-light-app-tertiary dark:bg-dark-app-tertiary" />
              ) : isAuthenticated ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary p-3 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
                    <AvatarDemo
                      src={accountPhoto}
                      initials={accountInitials}
                      alt={signedInLabel}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-primary dark:text-dark-primary">
                        {signedInLabel}
                      </p>
                      <p className="text-xs text-muted dark:text-dark-muted">
                        {t("publicHeader.accountMenu")}
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/library"
                    onClick={closeMobile}
                    className="flex items-center gap-2 rounded-xl border border-(--color-light-card-border) px-3 py-2.5 text-[13px] font-semibold text-primary dark:border-(--color-dark-card-border) dark:text-dark-primary"
                  >
                    <UserCircle className="size-4 shrink-0" strokeWidth={1.75} />
                    {t("publicHeader.readingList")}
                  </Link>
                  <Link
                    to="/writer/profile"
                    onClick={closeMobile}
                    className="flex items-center gap-2 rounded-xl border border-(--color-light-card-border) px-3 py-2.5 text-[13px] font-semibold text-primary dark:border-(--color-dark-card-border) dark:text-dark-primary"
                  >
                    <UserCircle className="size-4 shrink-0" strokeWidth={1.75} />
                    {t("publicHeader.yourProfile")}
                  </Link>
                  {dashboardHref ? (
                    <Link
                      to={dashboardHref}
                      onClick={closeMobile}
                      className="flex items-center gap-2 rounded-xl border border-(--color-light-card-border) px-3 py-2.5 text-[13px] font-semibold text-primary dark:border-(--color-dark-card-border) dark:text-dark-primary"
                    >
                      <LayoutDashboard className="size-4 shrink-0" strokeWidth={1.75} />
                      {t("publicHeader.dashboard")}
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      closeMobile();
                    }}
                    className="flex w-full items-center gap-2 rounded-xl border border-(--color-light-card-border) px-3 py-2.5 text-[13px] font-semibold text-secondary dark:border-(--color-dark-card-border) dark:text-dark-secondary"
                  >
                    <LogOut className="size-4 shrink-0" strokeWidth={1.75} />
                    {t("publicHeader.logOut")}
                  </button>
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  <Link
                    to="/login"
                    state={{ from: location }}
                    onClick={closeMobile}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-(--color-light-input-border) bg-(--color-light-card-bg) px-4 text-sm font-semibold text-primary shadow-sm transition-colors hover:border-(--color-light-input-border-focus) hover:bg-light-app-tertiary dark:border-(--color-dark-input-border) dark:bg-(--color-dark-input-bg) dark:text-dark-primary dark:hover:border-(--color-dark-input-border-focus) dark:hover:bg-dark-app-tertiary"
                  >
                    <LogIn className="size-4" strokeWidth={1.8} />
                    {t("publicHeader.logIn")}
                  </Link>
                  <Link
                    to="/signup"
                    onClick={closeMobile}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-(--color-light-btn-primary-bg) px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-(--color-light-btn-primary-hover) dark:bg-blue-400 dark:text-blue-950 dark:hover:bg-blue-300"
                  >
                    <UserPlus className="size-4" strokeWidth={1.8} />
                    {t("publicHeader.signUp")}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
