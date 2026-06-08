import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../../context/themContext";

export default function ContributionHeatmap({
  weeks,
  max = 1,
  valueLabel = "contributions",
  emptyLabel = "No contributions",
  xAxisLabel = "Weeks",
  yAxisLabel = "Weekday",
}) {
  const { theme } = useTheme();
  const [tooltip, setTooltip] = useState(null);
  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];
  const light = [
    "var(--color-light-app-tertiary)",
    "#dcfce7",
    "#86efac",
    "#22c55e",
    "#15803d",
  ];
  const dark = [
    "var(--color-dark-app-tertiary)",
    "rgba(34,197,94,0.18)",
    "rgba(34,197,94,0.38)",
    "rgba(34,197,94,0.68)",
    "rgba(21,128,61,0.95)",
  ];
  const palette = theme === "dark" ? dark : light;
  const normalizedWeeks = useMemo(() => (Array.isArray(weeks) ? weeks : []), [weeks]);
  const monthLabels = useMemo(() => {
    const monthKey = (cell) => {
      if (!cell?.date) return "";
      const date = new Date(cell.date);
      if (Number.isNaN(date.getTime())) return "";
      return `${date.getFullYear()}-${date.getMonth()}`;
    };
    return normalizedWeeks.map((col, index) => {
      const datedCell = col.find((cell) => cell?.date);
      if (!datedCell?.date) return "";
      const date = new Date(datedCell.date);
      if (Number.isNaN(date.getTime())) return "";
      const month = date.toLocaleDateString(undefined, { month: "short" });
      const previousDatedCell = normalizedWeeks
        .slice(0, index)
        .reverse()
        .flat()
        .find((cell) => cell?.date);
      if (
        date.getDate() > 7 ||
        monthKey(previousDatedCell) === monthKey(datedCell)
      )
        return "";
      return month;
    });
  }, [normalizedWeeks]);
  const showTooltip = (event, label, details) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = Math.min(280, window.innerWidth - 16);
    const estimatedHeight = 64;
    const gap = 8;
    const hasRoomAbove = rect.top >= estimatedHeight + gap + 8;
    const hasRoomBelow =
      window.innerHeight - rect.bottom >= estimatedHeight + gap + 8;
    const placement = hasRoomAbove || !hasRoomBelow ? "top" : "bottom";
    const left = Math.min(
      window.innerWidth - width / 2 - 8,
      Math.max(width / 2 + 8, rect.left + rect.width / 2),
    );
    setTooltip({
      label,
      details,
      style: {
        left,
        top: placement === "top" ? rect.top - gap : rect.bottom + gap,
        transform:
          placement === "top" ? "translate(-50%, -100%)" : "translate(-50%, 0)",
        width,
      },
    });
  };
  const tooltipDetails = tooltip
    ? [
        ["commits", tooltip.details.commits ?? 0],
        ["pushes", tooltip.details.pushes ?? 0],
        ["PRs", tooltip.details.pulls ?? 0],
        ["merges", tooltip.details.merges ?? 0],
        ["tasks", tooltip.details.tasks ?? 0],
        ["operations", tooltip.details.operations ?? tooltip.details.other ?? 0],
      ].filter(([, value]) => value > 0)
    : [];

  return (
    <div className="max-w-full overflow-x-scroll pb-3 pt-2 [scrollbar-gutter:stable]">
      <div className="min-w-[58rem]">
        <div className="mb-1 grid grid-cols-[2.5rem_minmax(0,1fr)] gap-2 text-[10px] text-muted dark:text-dark-muted">
          <span className="sr-only">{yAxisLabel}</span>
          <div className="relative h-4">
            {monthLabels.map((label, index) => (
              <span
                key={`${label || "month"}-${index}`}
                className="absolute top-0 h-4 min-w-8 whitespace-nowrap"
                style={{ left: `${index * 1}rem` }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-2">
          <div className="grid grid-rows-7 gap-1 text-[10px] leading-3 text-muted dark:text-dark-muted">
            {dayLabels.map((label) => (
              <span key={label} className="h-3">
                {label}
              </span>
            ))}
          </div>
          <div className="flex gap-1">
            {normalizedWeeks.map((col, index) => (
              <div key={index} className="flex flex-col gap-1">
                {Array.from({ length: 7 }).map((_, rowIndex) => {
                  const cell = col[rowIndex];
                  if (!cell) {
                    return (
                      <span
                        key={rowIndex}
                        className="h-3 w-3 rounded-[4px] opacity-0"
                        aria-hidden="true"
                      />
                    );
                  }
                  const value = cell?.value ?? 0;
                  const intensity = Math.round((value / Math.max(1, max)) * 4);
                  const label = cell?.key
                    ? `${cell.key}: ${value} ${valueLabel}`
                    : emptyLabel;
                  const details = cell?.details ?? {};
                  return (
                    <span
                      key={rowIndex}
                      className="h-3 w-3 rounded-[4px] border border-white/10"
                      aria-label={label}
                      onMouseEnter={(event) =>
                        showTooltip(event, label, details)
                      }
                      onMouseLeave={() => setTooltip(null)}
                      onFocus={(event) =>
                        showTooltip(event, label, details)
                      }
                      onBlur={() => setTooltip(null)}
                      tabIndex={0}
                      style={{
                        backgroundColor: palette[intensity] ?? palette[0],
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between gap-4 pl-[3rem] text-[10px] text-muted dark:text-dark-muted">
          <span>{xAxisLabel}</span>
          <span>
            Less
            <span className="mx-1 inline-flex translate-y-0.5 gap-1">
              {palette.map((color, index) => (
                <span
                  key={`${color}-${index}`}
                  className="h-3 w-3 rounded-[3px] border border-white/10"
                  style={{ backgroundColor: color }}
                />
              ))}
            </span>
            More
          </span>
        </div>
      </div>
      {tooltip
        ? createPortal(
            <div
              className="pointer-events-none fixed z-[99999] rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) px-2 py-1 text-center text-[10px] font-semibold text-primary shadow-2xl dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:text-dark-primary"
              style={tooltip.style}
            >
              <span className="block">{tooltip.label}</span>
              <span className="mt-1 block font-medium text-secondary dark:text-dark-secondary">
                {tooltipDetails.length
                  ? tooltipDetails
                      .map(([name, value]) => `${value} ${name}`)
                      .join(" · ")
                  : emptyLabel}
              </span>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
