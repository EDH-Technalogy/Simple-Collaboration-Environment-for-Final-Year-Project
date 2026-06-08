import { useId, useMemo } from "react";
import {
  eachDayOfInterval,
  format,
  startOfDay,
  startOfWeek,
  subDays,
} from "date-fns";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslation } from "react-i18next";
import { cn } from "../../lib/utils";
import { readEngagementDailyMs } from "../../lib/studentEngagementStorage";

const CELL_LEVEL = [
  "bg-light-app-tertiary dark:bg-dark-app-tertiary",
  "bg-(--color-chart-blue-primary)/22 dark:bg-(--color-chart-blue-primary)/26",
  "bg-(--color-chart-blue-primary)/42 dark:bg-(--color-chart-blue-primary)/42",
  "bg-(--color-chart-blue-primary)/62 dark:bg-(--color-chart-blue-secondary)/72",
  "bg-(--color-chart-blue-primary) dark:bg-(--color-chart-blue-secondary)",
];

function minutesFromMs(ms) {
  return Math.round(ms / 60000);
}

function levelForMinutes(m) {
  if (m <= 0) return 0;
  if (m < 5) return 1;
  if (m < 15) return 2;
  if (m < 35) return 3;
  return 4;
}

/**
 * @param {{ epoch: number; className?: string }} props
 */
export function StudentEngagementCharts({ epoch, className = "" }) {
  const gradId = useId().replace(/:/g, "");
  const { t } = useTranslation();

  const dailyMs = useMemo(() => readEngagementDailyMs(), [epoch]);

  const areaData = useMemo(() => {
    const end = startOfDay(new Date());
    const start = subDays(end, 13);
    return eachDayOfInterval({ start, end }).map((d) => {
      const key = format(d, "yyyy-MM-dd");
      const ms = dailyMs[key] ?? 0;
      return {
        key,
        label: format(d, "MMM d"),
        minutes: minutesFromMs(ms),
      };
    });
  }, [dailyMs, epoch]);

  const weekBars = useMemo(() => {
    const end = startOfDay(new Date());
    const start = subDays(end, 6 * 7 - 1);
    const buckets = /** @type {Record<string, number>} */ ({});
    eachDayOfInterval({ start, end }).forEach((d) => {
      const ws = startOfWeek(d, { weekStartsOn: 1 });
      const wk = format(ws, "yyyy-MM-dd");
      const key = format(d, "yyyy-MM-dd");
      buckets[wk] = (buckets[wk] ?? 0) + (dailyMs[key] ?? 0);
    });
    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([wk, ms]) => ({
        label: format(new Date(`${wk}T12:00:00`), "d MMM"),
        minutes: minutesFromMs(ms),
      }));
  }, [dailyMs, epoch]);

  const heatmap = useMemo(() => {
    const end = startOfDay(new Date());
    const gridStart = startOfWeek(subDays(end, 7 * 12 - 1), { weekStartsOn: 1 });
    const cells = eachDayOfInterval({ start: gridStart, end }).map((d) => {
      const key = format(d, "yyyy-MM-dd");
      const ms = dailyMs[key] ?? 0;
      const minutes = minutesFromMs(ms);
      return {
        key,
        date: d,
        day: format(d, "EEE"),
        minutes,
        level: levelForMinutes(minutes),
      };
    });

    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    return weeks;
  }, [dailyMs, epoch]);

  const chartPrimary = "var(--color-chart-blue-primary)";
  const chartMuted = "rgba(51, 133, 255, 0.12)";

  return (
    <div className={`grid gap-6 lg:grid-cols-2 ${className}`}>
      <div className="rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) md:p-5">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted dark:text-dark-muted">
          {t("studentDashboard.charts.focusTitle")}
        </h3>
        <p className="mt-1 text-sm font-medium text-primary dark:text-dark-primary">
          {t("studentDashboard.charts.focusSubtitle")}
        </p>
        <div className="mt-4 h-56 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`fillFocus-${gradId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartPrimary} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={chartPrimary} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 8" stroke={chartMuted} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--color-light-text-muted)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                width={36}
                tick={{ fill: "var(--color-light-text-muted)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--color-light-card-border)",
                  fontSize: 12,
                }}
                formatter={(v) => [t("studentDashboard.charts.tooltipMinutes", { count: Number(v) }), ""]}
                labelFormatter={(_, p) => p?.[0]?.payload?.key ?? ""}
              />
              <Area
                type="monotone"
                dataKey="minutes"
                stroke={chartPrimary}
                strokeWidth={2}
                fill={`url(#fillFocus-${gradId})`}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) md:p-5">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted dark:text-dark-muted">
          {t("studentDashboard.charts.weeklyTitle")}
        </h3>
        <p className="mt-1 text-sm font-medium text-primary dark:text-dark-primary">
          {t("studentDashboard.charts.weeklySubtitle")}
        </p>
        <div className="mt-4 h-56 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekBars} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 8" stroke={chartMuted} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--color-light-text-muted)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                width={36}
                tick={{ fill: "var(--color-light-text-muted)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--color-light-card-border)",
                  fontSize: 12,
                }}
                formatter={(v) => [t("studentDashboard.charts.tooltipMinutes", { count: Number(v) }), ""]}
              />
              <Bar dataKey="minutes" fill={chartPrimary} radius={[8, 8, 4, 4]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) md:p-5 lg:col-span-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted dark:text-dark-muted">
          {t("studentDashboard.charts.heatmapTitle")}
        </h3>
        <p className="mt-1 text-sm font-medium text-primary dark:text-dark-primary">
          {t("studentDashboard.charts.heatmapSubtitle")}
        </p>
        <div className="mt-4 overflow-x-auto pb-1">
          <div className="inline-flex flex-col gap-1">
            <div className="flex gap-1 text-[10px] font-medium text-muted dark:text-dark-muted">
              <span className="w-8 shrink-0" />
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <span key={`${d}-${i}`} className="mx-px w-3.5 shrink-0 text-center">
                  {d}
                </span>
              ))}
            </div>
            {heatmap.map((week, wi) => (
              <div key={wi} className="flex items-center gap-1">
                <span className="w-8 shrink-0 text-[10px] text-muted dark:text-dark-muted">
                  {week[0] ? format(week[0].date, "d MMM") : ""}
                </span>
                <div className="flex gap-1">
                  {week.map((cell) => (
                    <span
                      key={cell.key}
                      title={t("studentDashboard.charts.cellTitle", {
                        date: cell.key,
                        count: cell.minutes,
                      })}
                      className={cn(
                        "size-3.5 shrink-0 rounded-sm border border-(--color-light-card-border)/60 transition-transform hover:z-[1] hover:scale-110 hover:shadow-sm dark:border-(--color-dark-card-border)/60",
                        CELL_LEVEL[cell.level] ?? CELL_LEVEL[0],
                      )}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] text-muted dark:text-dark-muted">
          <span>{t("studentDashboard.charts.legendLess")}</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((lv) => (
              <span
                key={lv}
                className={cn(
                  "size-3.5 rounded-sm border border-(--color-light-card-border)/50 dark:border-(--color-dark-card-border)/50",
                  CELL_LEVEL[lv] ?? CELL_LEVEL[0],
                )}
              />
            ))}
          </div>
          <span>{t("studentDashboard.charts.legendMore")}</span>
        </div>
      </div>
    </div>
  );
}
