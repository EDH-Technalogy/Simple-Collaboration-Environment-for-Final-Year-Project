import clsx from "clsx";
import { CircleHelp } from "lucide-react";
import Tooltip from "./Tooltip";

/** Column defs: `{ title, icon?, hint?, align?, className? }`. */
function TableHeader({ headerData }) {
  return (
    <thead className="table-advanced-thead">
      <tr>
        {headerData?.map((header, index) => {
          const tooltipText =
            typeof header.tooltip === "string" && header.tooltip.trim().length > 0
              ? header.tooltip
              : typeof header.hint === "string" && header.hint.trim().length > 0
                ? header.hint
                : null;
          return (
            <th
              key={index}
              className={clsx(
                "table-advanced-th",
                header.align === "center" && "text-center",
                header.align === "end" && "text-end",
                header.className,
              )}
            >
              <span
                className={clsx(
                  "inline-flex max-w-full items-center gap-1.5",
                  header.align === "center" && "justify-center",
                  header.align === "end" && "justify-end",
                )}
              >
                {header.icon ? (
                  <span className="inline-flex shrink-0 text-muted opacity-85 dark:text-dark-muted [&_svg]:size-3.5">
                    {header.icon}
                  </span>
                ) : null}
                <span className="min-w-0 leading-tight">{header.title}</span>
                {tooltipText ? (
                  <Tooltip content={tooltipText}>
                    <button
                      type="button"
                      className="inline-flex shrink-0 items-center rounded-sm text-muted opacity-60 transition-colors hover:opacity-100 dark:text-dark-muted"
                      aria-label={tooltipText}
                    >
                      <CircleHelp className="size-3.5 shrink-0" aria-hidden />
                    </button>
                  </Tooltip>
                ) : null}
              </span>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

export default TableHeader;
