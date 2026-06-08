import clsx from "clsx";

function TableToolbar({ children, className }) {
  return (
    <div className={clsx("table-toolbar-surface", className)}>{children}</div>
  );
}

/**
 * Toolbar row: primary controls / filters — use `justify="between"` for split layout.
 */
function ToolbarRow({ children, className, justify = "between" }) {
  return (
    <div
      className={clsx(
        "flex flex-wrap items-center gap-x-2 gap-y-2",
        justify === "between" && "justify-between",
        justify === "start" && "justify-start",
        justify === "end" && "justify-end",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Cluster of controls (e.g. filter chips + select). */
function ToolbarSection({ children, className }) {
  return (
    <div
      className={clsx(
        "flex flex-wrap items-center gap-1.5 sm:gap-2",
        className,
      )}
    >
      {children}
    </div>
  );
}

function ToolbarIconButton({
  children,
  icon,
  type = "button",
  className,
  ...rest
}) {
  return (
    <button
      type={type}
      className={clsx("table-toolbar-icon-btn", className)}
      {...rest}
    >
      {icon ? <span className="inline-flex shrink-0 opacity-80">{icon}</span> : null}
      <span>{children}</span>
    </button>
  );
}

/**
 * Segmented “view” control (list / board / …) — styling uses index.css tokens.
 */
function TableViewTabs({ tabs, value, onValueChange, className }) {
  return (
    <div className={clsx("table-toolbar-tabs shrink-0", className)}>
      {tabs?.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          className={clsx(
            "table-toolbar-tab",
            value === tab.id && "table-toolbar-tab--active",
          )}
          onClick={() => onValueChange?.(tab.id)}
        >
          {tab.icon ? (
            <span className="inline-flex size-3.5 shrink-0 opacity-85">
              {tab.icon}
            </span>
          ) : null}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

TableToolbar.Row = ToolbarRow;
TableToolbar.Section = ToolbarSection;
TableToolbar.IconButton = ToolbarIconButton;
TableToolbar.ViewTabs = TableViewTabs;

export default TableToolbar;
