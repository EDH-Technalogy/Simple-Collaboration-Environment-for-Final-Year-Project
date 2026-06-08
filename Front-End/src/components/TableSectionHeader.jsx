import clsx from "clsx";
import { ChevronDown } from "lucide-react";

/**
 * Group header row inside `TableBody` (collapsible UX).
 */
export default function TableSectionHeader({
  children,
  colSpan,
  open = true,
  onToggle,
  className,
}) {
  return (
    <tr className={clsx(className)}>
      <td colSpan={colSpan} className="table-section-header-cell p-0">
        {typeof onToggle === "function" ? (
          <button
            type="button"
            className="table-section-toggle px-4 py-2"
            onClick={onToggle}
            aria-expanded={open}
          >
            <ChevronDown
              className={clsx(
                "size-3.5 shrink-0 text-muted transition-transform dark:text-dark-muted",
                !open && "-rotate-90",
              )}
              aria-hidden
            />
            <span>{children}</span>
          </button>
        ) : (
          <div className="px-4 py-2">{children}</div>
        )}
      </td>
    </tr>
  );
}
