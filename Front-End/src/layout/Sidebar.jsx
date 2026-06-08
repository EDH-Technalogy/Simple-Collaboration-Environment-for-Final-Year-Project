import { Link, useLocation } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";
import Icon from "../components/Icon";
import IC from "../components/IC";

const NAV = [
  { to: "/", label: "Home", icon: IC.dashboard, end: true },
  { to: "/write", label: "Write", icon: IC.customize, end: false },
  { to: "/library", label: "Reading list", icon: IC.notes, end: false },
  {
    to: "/topic/Technology",
    label: "Follower",
    icon: IC.contact,
    end: false,
  },
];

function isNavActive(pathname, to, end) {
  if (end) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}

export default function Sidebar() {
  const { collapsed, handleSidebarToggle, isMobile, setMobileMenuOpen } =
    useSidebar();
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <aside
      className={`flex h-full shrink-0 flex-col overflow-hidden border-default bg-shell transition-[width] duration-100 ease-out dark:border-dark-default dark:bg-dark-shell ltr:border-r rtl:border-l ${isMobile ? "border-none" : ""} ${collapsed ? "w-16 min-w-16" : "w-65 min-w-65"}`}
    >
      <div
        className={`flex min-h-14 cursor-pointer items-center border-b border-default dark:border-dark-default ${collapsed ? "justify-center px-4 py-4.5" : "justify-between px-2.5 py-4"}`}
        onClick={handleSidebarToggle}
      >
        {!collapsed && (
          <>
            <span className="text-primary dark:text-dark-primary min-w-0 flex-1 truncate ps-1 text-sm font-bold tracking-tight">
              Campus Medium
            </span>
            <span className="ml-auto shrink-0 rounded p-1 hover:bg-accent/20 dark:hover:bg-accent/10">
              <Icon d={IC.menu} className="size-4 text-secondary dark:text-dark-secondary" />
            </span>
          </>
        )}
        {collapsed && (
          <Icon
            d={IC.menu}
            className="size-4 cursor-pointer text-secondary dark:text-dark-secondary"
          />
        )}
      </div>

      <nav
        style={{
          padding: collapsed ? "10px 8px" : "10px 10px",
        }}
        className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto"
      >
        {NAV.map((item) => {
          const active = isNavActive(pathname, item.to, item.end);

          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => {
                if (isMobile) setMobileMenuOpen(false);
              }}
              className={`relative mb-0.5 flex w-full cursor-pointer items-center gap-2.25 rounded-lg border-none text-left text-xs no-underline transition-all duration-150 hover:bg-dark-btn-primary-bg group ${active ? "bg-accent/10 font-bold dark:bg-dark-btn-primary-bg dark:text-white" : "font-normal"} ${collapsed ? "p-2.25" : "px-2.5 py-2.25"} ${collapsed || isMobile ? "justify-center" : "justify-start"}`}
            >
              {active && !collapsed && (
                <div className="border-light-badge-border absolute top-[10%] bottom-[10%] rounded-3xl border-2 ltr:-left-0.5 rtl:-right-0.5" />
              )}
              <Icon
                d={item.icon}
                className={`size-4 shrink-0 transition-all group-hover:translate-y-0.5 group-hover:text-dark-text-primary ${active ? "stroke-2 text-dark-text-primary dark:text-dark-text-primary" : "stroke-[1.5] text-light-text-primary dark:text-dark-text-primary"}`}
              />
              {!collapsed && (
                <span
                  className={`group-hover:text-dark-text-primary ${active ? "text-dark-text-primary" : "text-light-text-primary dark:text-dark-text-primary"}`}
                >
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div
        style={{
          padding: collapsed ? "12px 8px" : "12px 14px",
          borderTop: "1px solid var(--c-border)",
        }}
        className={collapsed ? "py-3 px-2" : "py-3 px-3.5"}
      >
        <Link
          to="/write"
          className="btn-primary flex h-9 w-full items-center justify-center gap-2 rounded-xl px-4 text-xs font-semibold no-underline"
          onClick={() => {
            if (isMobile) setMobileMenuOpen(false);
          }}
        >
          <Icon d={IC.plus} className="size-3.5 stroke-2" />
          {!collapsed && <span>Write</span>}
        </Link>
      </div>
    </aside>
  );
}
