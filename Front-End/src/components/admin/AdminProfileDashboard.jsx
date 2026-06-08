import { Activity } from "lucide-react";
import { useId } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Icon from "../Icon";
import IC from "../IC";

/** @param {{ value: number; label: string; suffix?: string }} props */
export function AdminProfileMetricCard({ value, label, suffix = "%" }) {
  const v =
    typeof value === "number" && !Number.isNaN(value) ? Math.round(value) : 0;
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 shadow-[var(--shadow-sm)] dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:shadow-[var(--shadow-dark-sm)]">
      <span className="text-[11px] font-semibold text-muted dark:text-dark-muted">
        {label}
      </span>
      <span className="mt-2 font-mono text-2xl font-bold tabular-nums text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
        {suffix === "%" ? `${v}%` : `${value}${suffix ? ` ${suffix}` : ""}`}
      </span>
    </div>
  );
}

/** @param {{ score: number; title: string }} props */
export function AdminProfileSemiGaugeCard({ score, title }) {
  const gradId = useId().replace(/:/g, "");
  const pct = Math.min(100, Math.max(0, Number(score) || 0));
  const r = 56;
  const c = Math.PI * r;
  const dash = (pct / 100) * (c / 2);

  return (
    <div className="flex flex-col rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-5  dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
      <div className="mb-4 flex items-center gap-2">
        <Activity
          className="size-4 text-(--color-light-admin-profile-violet) dark:text-(--color-dark-admin-profile-violet)"
          strokeWidth={2}
          aria-hidden
        />
        <h3 className="text-sm font-semibold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
          {title}
        </h3>
      </div>
      <div className="relative mx-auto flex w-full max-w-[220px] flex-col items-center">
        <svg viewBox="0 0 120 72" className="w-full overflow-visible">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--admin-profile-gauge-a)" />
              <stop offset="100%" stopColor="var(--admin-profile-gauge-b)" />
            </linearGradient>
          </defs>
          <path
            d={`M ${12 + r} ${12 + r} A ${r} ${r} 0 0 1 ${120 - 12 - r} ${12 + r}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-(--color-light-app-tertiary) dark:text-(--color-dark-card-border)"
            strokeLinecap="round"
          />
          <path
            d={`M ${12 + r} ${12 + r} A ${r} ${r} 0 0 1 ${120 - 12 - r} ${12 + r}`}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="10"
            strokeDasharray={`${dash} ${c}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 top-9 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold tracking-tight text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
            {Math.round(pct)}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * @param {{
 *   title: string;
 *   badge?: string;
 *   badgeTone?: "success" | "violet";
 *   items: Array<{
 *     key: string;
 *     label: string;
 *     Icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
 *     iconPath?: string;
 *   }>;
 * }} props
 */
export function AdminProfileHighlightCard({
  title,
  badge,
  badgeTone = "success",
  items,
}) {
  const badgeToneClass =
    badgeTone === "violet"
      ? "border border-(--color-light-admin-profile-violet-soft-border) bg-(--color-light-admin-profile-violet-soft-bg) text-(--color-light-admin-profile-violet-soft-text) dark:border-(--color-dark-admin-profile-violet-soft-border) dark:bg-(--color-dark-admin-profile-violet-soft-bg) dark:text-(--color-dark-admin-profile-violet-soft-text)"
      : "bg-(--color-light-success-bg) text-(--color-light-success-text) dark:bg-green-950/40 dark:text-green-300";
  return (
    <div className="flex flex-col rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-5 ss dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
          {title}
        </h3>
        {badge ? (
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${badgeToneClass}`}
          >
            {badge}
          </span>
        ) : null}
      </div>
      <ul className="flex flex-col gap-3">
        {items.map((it) => (
          <li
            key={it.key}
            className="flex items-start gap-3 rounded-xl border border-(--color-light-card-border) bg-(--color-light-app-secondary) px-3 py-2.5 dark:border-(--color-dark-card-border) dark:bg-dark-shell"
          >
            {it.Icon ? (
              <it.Icon
                className="mt-0.5 size-4 shrink-0 text-(--color-light-admin-profile-violet) dark:text-(--color-dark-admin-profile-violet)"
                strokeWidth={2}
              />
            ) : (
              <Icon
                d={it.iconPath ?? IC.check}
                className="mt-0.5 size-4 shrink-0 text-(--color-light-admin-profile-violet) dark:text-(--color-dark-admin-profile-violet)"
              />
            )}
            <span className="text-sm font-medium text-(--color-light-text-secondary) dark:text-(--color-dark-text-secondary)">
              {it.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** @param {{ title: string; subjectLabel: string; peerLabel: string; subjectPct: number; peerPct: number; benchmark?: number }} props */
export function AdminProfilePeerCompareCard({
  title,
  subjectLabel,
  peerLabel,
  subjectPct,
  peerPct,
  benchmark = 80,
}) {
  const data = [
    {
      name: subjectLabel,
      v: Math.min(100, Math.max(0, Number(subjectPct) || 0)),
      fill: "var(--admin-profile-peer-subject)",
    },
    {
      name: peerLabel,
      v: Math.min(100, Math.max(0, Number(peerPct) || 0)),
      fill: "var(--admin-profile-peer-cohort)",
    },
  ];

  return (
    <div className="flex min-h-[220px] flex-col rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-5 shadow-md dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
      <h3 className="mb-4 text-sm font-semibold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
        {title}
      </h3>
      <div className="min-h-[160px] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
          >
            <CartesianGrid
              horizontal={false}
              strokeDasharray="3 6"
              className="stroke-(--color-light-card-border) dark:stroke-(--color-dark-card-border)"
            />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "var(--color-light-text-muted)" }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={88}
              tick={{ fontSize: 11, fill: "var(--color-light-text-secondary)" }}
            />
            <Tooltip
              cursor={{ fill: "rgba(99, 102, 241, 0.08)" }}
              formatter={(val) => [`${Math.round(Number(val))}%`, ""]}
            />
            <ReferenceLine
              x={benchmark}
              stroke="#ef4444"
              strokeDasharray="4 4"
              strokeWidth={2}
            />
            <Bar dataKey="v" radius={[0, 8, 8, 0]} barSize={18}>
              {data.map((e, idx) => (
                <Cell key={idx} fill={e.fill} />
              ))}
              <LabelList
                dataKey="v"
                position="right"
                formatter={(v) =>
                  `${Math.round(typeof v === "number" ? v : Number(v))}%`
                }
                style={{
                  fill: "var(--color-light-text-muted)",
                  fontSize: 11,
                  fontWeight: 600,
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/**
 * Lightweight donut summary for workload / completeness (admin profile).
 *
 * @param {{
 *   title: string;
 *   segments: Array<{ key: string; label: string; value: number; color: string }>;
 * }} props
 */
export function AdminProfileWorkloadDonutCard({ title, segments }) {
  const chart = [...segments];
  const total = chart.reduce((s, x) => s + (Number(x.value) || 0), 0);

  return (
    <div className="flex flex-col rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-5 shadow-md dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
      <h3 className="mb-2 text-sm font-semibold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
        {title}
      </h3>
      <div className="flex flex-1 flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <div className="h-44 w-44 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                innerRadius={52}
                outerRadius={68}
                data={chart.map((x) => ({
                  ...x,
                  value: Number(x.value) || 0,
                }))}
                dataKey="value"
                nameKey="label"
              >
                {chart.map((e) => (
                  <Cell key={e.key} fill={e.color} stroke="transparent" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="flex w-full min-w-0 flex-col gap-2 text-[11px] font-semibold sm:max-w-[12rem]">
          {chart.map((seg) => {
            const v = Number(seg.value) || 0;
            const pct = total > 0 ? Math.round((v / total) * 100) : 0;
            return (
              <li
                key={seg.key}
                className="flex items-center gap-2 text-(--color-light-text-secondary) dark:text-(--color-dark-text-secondary)"
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="truncate">{seg.label}</span>
                <span className="ms-auto tabular-nums text-muted dark:text-dark-muted">
                  {pct}%
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
