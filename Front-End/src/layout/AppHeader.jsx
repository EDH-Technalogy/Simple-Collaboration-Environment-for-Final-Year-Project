import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import {
  TbLayoutSidebarLeftCollapse,
  TbLayoutSidebarRightCollapse,
} from "react-icons/tb";
import {
  DropdownContent,
  DropdownLabel,
  DropdownMenuRoot,
  DropdownRadioGroup,
  DropdownRadioItem,
  DropdownTrigger,
  DropdownItem,
  DropdownSeparator,
  DropdownSub,
  DropdownSubTrigger,
  DropdownSubContent,
} from "../components/DropdownMenu";
import AvatarDemo from "../components/Avatar";
import {
  getFacultyDashboardPath,
  resolveShellBasePath,
  settingsPathForShell,
} from "../lib/roles";
import {
  resolveProfilePhotoUrl,
  buildPersonInitials,
} from "../lib/profileMedia";
import IC from "../components/IC";
import Icon from "../components/Icon";
import NotificationDropdown from "../components/NotificationDropdown";
import SearchableSelect from "../components/SearchableSelect";
import { formatHeaderFullPath, splitPathFragments } from "../lib/headerPath";
import { useTheme } from "../context/themContext";
import { useAuth } from "../context/AuthContext";
import { useUserNotificationUnreadCount } from "../services/useApi";
import { useNotificationWebSocket } from "../hooks/useNotificationWebSocket";
import { resolveNotificationRecipientId } from "../lib/notificationRecipientId";

// ─── Data ────────────────────────────────────────────────────────────────────

function parseNotificationUnreadCount(raw) {
  if (raw == null) return 0;
  if (typeof raw === "number" && !Number.isNaN(raw)) return raw;
  if (typeof raw === "object") {
    if (typeof raw.count === "number") return raw.count;
    if (typeof raw.unreadCount === "number") return raw.unreadCount;
    if (typeof raw.totalUnread === "number") return raw.totalUnread;
  }
  return 0;
}

/** Styled path trail beside the sidebar control. */
function RouteTrail({ pathname }) {
  const { t } = useTranslation();
  const full = formatHeaderFullPath(pathname);
  const parts = splitPathFragments(pathname);
  const hasParts = parts.length > 0;

  return (
    <nav
      className="min-w-0 hidden md:block flex-1 overflow-hidden ps-1"
      aria-label={t("appHeader.routeLocation")}
      title={full}
    >
      <div className="flex min-w-0 items-center gap-2 overflow-x-auto whitespace-nowrap rounded-2xl   px-2.5 py-1.5  sm:px-3 sm:py-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <span className="inline-flex shrink-0 items-center rounded-full bg-(--color-light-card-bg) px-2.5 py-1 text-[11px] font-semibold tracking-wide text-primary dark:bg-(--color-dark-card-bg) dark:text-dark-primary sm:text-xs">
            {t("appHeader.routeHome")}
          </span>

          {hasParts
            ? parts.map((seg, idx) => {
                const last = idx === parts.length - 1;
                return (
                  <span
                    key={`${seg}-${idx}`}
                    className="inline-flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2"
                  >
                    <ChevronRight
                      className="size-3 shrink-0 text-muted dark:text-dark-muted sm:size-3.5"
                      strokeWidth={1.8}
                      aria-hidden
                    />
                    <span
                      className={`min-w-0 max-w-[8.25rem] capitalize truncate  px-2.5 py-1 text-[11px] sm:max-w-[12rem] sm:text-xs md:max-w-none ${
                        last
                          ? "bg-(--color-light-card-bg) font-semibold text-primary shadow-xs dark:bg-(--color-dark-card-bg) dark:text-dark-primary"
                          : "font-medium text-secondary dark:text-dark-secondary"
                      }`}
                    >
                      {seg}
                    </span>
                  </span>
                );
              })
            : null}
        </div>
      </div>
    </nav>
  );
}

function HeaderIconButton({ onClick, active = false, ariaLabel, children }) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`
        flex cursor-pointer items-center gap-0.5 rounded-lg p-1.5 sm:p-2
        text-secondary dark:text-dark-secondary
        hover:bg-hover dark:hover:bg-dark-hover transition-colors
        ${active ? "bg-nav-active dark:bg-dark-nav-active" : ""}
      `}
    >
      {children}
    </button>
  );
}

/** Public “Medium” stories surface: `/`, `/write`, `/library`, `/topic/*`, `/story/*`, `/writer/*` */
function isPublicStoriesPath(pathname) {
  if (pathname === "/") return true;
  if (pathname === "/write" || pathname.startsWith("/write/")) return true;
  if (pathname === "/writer" || pathname.startsWith("/writer/")) return true;
  if (pathname === "/library" || pathname.startsWith("/library/")) return true;
  if (pathname.startsWith("/topic/")) return true;
  if (pathname.startsWith("/story/")) return true;
  return false;
}

/** Notification bell with unread badge. */
function NotificationButton({ unreadCount, active, onToggle, ariaLabel }) {
  return (
    <div className="relative">
      <HeaderIconButton
        onClick={onToggle}
        active={active}
        ariaLabel={ariaLabel}
      >
        <Icon d={IC.bell} className="size-3.5 stroke-[1.5] sm:size-4" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[14px] h-3.5 px-0.5 flex items-center justify-center rounded-full bg-chart-error text-white text-[8px] font-bold text-success-light leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </HeaderIconButton>
      {active && <NotificationDropdown onClose={() => onToggle()} />}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function AppHeader({
  handleSidebarToggle,
  isMobile = false,
  mobileMenuOpen = false,
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const notificationUserId = resolveNotificationRecipientId(user);
  const { data: unreadRaw } = useUserNotificationUnreadCount(
    notificationUserId,
    {
      enabled: Boolean(notificationUserId),
      notifyOnError: false,
    },
  );
  useNotificationWebSocket(notificationUserId, Boolean(notificationUserId));
  const showStoriesSearch = isPublicStoriesPath(pathname);

  const { t } = useTranslation();
  const { setLang } = useLanguage();
  const { toggleTheme, theme } = useTheme();
  const [openPanel, setOpenPanel] = useState(null);
  const [search, setSearch] = useState();
  const FRAMEWORK_OPTIONS = [
    { value: "react", label: "React" },
    { value: "vue", label: "Vue" },
    { value: "svelte", label: "Svelte" },
  ];
  // Memoised so child components that receive this as a prop don't re-render
  // unnecessarily when unrelated state changes.
  const toggle = useCallback(
    (panel) => setOpenPanel((prev) => (prev === panel ? null : panel)),
    [],
  );

  const handleLanguageChange = useCallback(
    (langCode) => {
      /** Default context stub uses `setLang()` with no params; Provider passes arity-1 updater. */
      /** @type {(next?: string) => void} */ (setLang)(langCode);
    },
    [setLang],
  );

  const notifUnread = parseNotificationUnreadCount(unreadRaw);

  const shell = resolveShellBasePath(pathname, user?.role);

  const navigateToProfile = useCallback(() => {
    const base = getFacultyDashboardPath(user?.role ?? "student");
    if (base === "/admin" && user?.id != null) {
      navigate(`/admin/users/${encodeURIComponent(user.id)}`);
      return;
    }
    if (base === "/writer" || user?.role === "author") {
      navigate("/writer/profile");
      return;
    }
    if (base === "/student" || base === "/teacher") {
      navigate(`${base}/profile`);
      return;
    }
    navigate(`${base}/dashboard`);
  }, [navigate, user]);

  const navigateToAccountSettings = useCallback(() => {
    navigate(settingsPathForShell(shell));
  }, [navigate, shell]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch {
      /* AuthProvider redirects to /login on success */
    }
  }, [logout]);

  return (
    <header className="sticky top-0 z-20 flex h-11 shrink-0 items-center gap-2 border-b border-(--color-light-card-border) bg-(--color-light-card-bg)/88 px-2 backdrop-blur-md dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)/90 sm:h-14 sm:gap-2.5 md:gap-3 md:px-4 lg:px-5">
      {/* Sidebar + route */}
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        {isMobile ? (
          <button
            type="button"
            onClick={handleSidebarToggle}
            aria-label={t("appHeader.toggleSidebar")}
            aria-expanded={mobileMenuOpen ? "true" : "false"}
            className="-ms-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-(--color-light-input-border) bg-(--color-light-input-bg) text-secondary transition-colors hover:border-(--color-light-input-border-focus) hover:bg-(--color-light-nav-hover-bg) hover:text-primary dark:border-dark-input-border dark:bg-(--color-dark-input-bg) dark:text-dark-secondary dark:hover:border-(--color-dark-input-border-focus) dark:hover:bg-(--color-dark-card-hover) dark:hover:text-dark-primary md:hidden"
          >
            {mobileMenuOpen ? (
              <TbLayoutSidebarLeftCollapse className="size-[17px]" />
            ) : (
              <TbLayoutSidebarRightCollapse className="size-[17px]" />
            )}
          </button>
        ) : null}
        <RouteTrail pathname={pathname} />
      </div>

      {/* Stories filter — lg+ only (see header responsive rules) */}
      {showStoriesSearch ? (
        <div className="mx-2 hidden min-w-0 max-w-xs flex-1 lg:flex xl:max-w-md">
          <SearchableSelect
            options={FRAMEWORK_OPTIONS}
            searchPlaceholder="select"
            value={search}
            onValueChange={setSearch}
            className="min-h-9 gap-2 px-3.5 py-1.5 text-sm"
          />
        </div>
      ) : null}

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1 md:gap-1.5">
        {/* Theme toggle */}
        <HeaderIconButton
          onClick={toggleTheme}
          ariaLabel={t("appHeader.toggleTheme")}
        >
          <Icon
            d={theme === "light" ? IC.moon : IC.sun}
            className="size-3.5 stroke-[1.5] sm:size-4"
          />
        </HeaderIconButton>

        {/* Notifications */}
        <NotificationButton
          unreadCount={notifUnread}
          active={openPanel === "notifications"}
          onToggle={() => toggle("notifications")}
          ariaLabel={t("appHeader.notificationsBell")}
        />

        {/* <DropdownMenuDemo /> */}
        <DropdownMenuRoot>
          <DropdownTrigger
            showArrow={false}
            compactIcon
            aria-label={t("appHeader.accountMenu")}
            icon={
              <AvatarDemo
                src={resolveProfilePhotoUrl(user)}
                initials={buildPersonInitials(user)}
              />
            }
          ></DropdownTrigger>

          <DropdownContent align="end" className="w-48">
            <DropdownItem>
              <div
                onClick={navigateToProfile}
                className="flex items-center gap-4 ltr:flex-row rtl:flex-row-reverse"
              >
                <AvatarDemo
                  src={resolveProfilePhotoUrl(user)}
                  initials={buildPersonInitials(user)}
                />
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900 ltr:text-left rtl:text-right">
                    {user.username}
                  </span>
                  <span
                    className="text-gray-500 text-sm truncate max-w-[140px] ltr:text-left rtl:text-right"
                    title={user.email}
                  >
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownItem>
            <DropdownSeparator />

            <DropdownItem onClick={navigateToAccountSettings}>
              {t("common.actions.settings")}
            </DropdownItem>
            <DropdownSeparator />
            <DropdownSub>
              <DropdownSubTrigger>{t("common.language")}</DropdownSubTrigger>
              <DropdownSubContent>
                <DropdownLabel>{t("common.language")}</DropdownLabel>
                <DropdownItem onClick={() => handleLanguageChange("en")}>
                  {t("appHeader.langNames.en")}
                </DropdownItem>
                <DropdownItem onClick={() => handleLanguageChange("ps")}>
                  {t("appHeader.langNames.ps")}
                </DropdownItem>
                <DropdownItem onClick={() => handleLanguageChange("prs")}>
                  {t("appHeader.langNames.prs")}
                </DropdownItem>
              </DropdownSubContent>
            </DropdownSub>

            <DropdownSeparator />
            <DropdownLabel>{t("common.sections.actions")}</DropdownLabel>
            <DropdownItem
              data={20}
              icon={<Icon d={IC.bell} className="size-4 stroke-[1.5]" />}
              onClick={() => toggle("notifications")}
            >
              {t("appHeader.notifications")}
            </DropdownItem>
            <DropdownSeparator />

            <DropdownItem
              variant="danger"
              onClick={() => {
                void handleLogout();
              }}
            >
              {t("common.actions.logout")}
            </DropdownItem>
          </DropdownContent>
        </DropdownMenuRoot>
      </div>
    </header>
  );
}
