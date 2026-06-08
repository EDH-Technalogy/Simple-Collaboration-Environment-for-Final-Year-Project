import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import IC from "./IC";
import Icon from "./Icon";
import { useTheme } from "../context/themContext";

const CustomTooltip = ({ active, payload, label }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-lg p-2 border"
        style={{
          backgroundColor: isDark ? "#1f2937" : "#ffffff",
          borderColor: isDark ? "#374151" : "#e5e7eb",
        }}
      >
        <p
          className="text-xs font-semibold mb-1"
          style={{ color: isDark ? "#f3f4f6" : "#111827" }}
        >
          {label}
        </p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {entry.value}%
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function RetentionCard() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const retentionData = [
    { month: "Jun", sme: 55, start: 40, ent: 25 },
    { month: "Jul", sme: 60, start: 55, ent: 35 },
    { month: "Aug", sme: 50, start: 48, ent: 30 },
    { month: "Sep", sme: 80, start: 70, ent: 60, active: true },
    { month: "Oct", sme: 45, start: 40, ent: 28 },
    { month: "Nov", sme: 50, start: 45, ent: 32 },
    { month: "Dec", sme: 55, start: 50, ent: 35 },
  ];

  // Theme-aware colors for recharts
  const colors = {
    grid: isDark ? "var(--color-dark-default)" : "var(--color-default)",
    text: isDark ? "var(--color-dark-muted)" : "var(--color-muted)",
    sme: isDark ? "#8b5cf6" : "#7c3aed",
    startups: isDark ? "#a78bfa" : "#a78bfa",
    enterprises: isDark ? "#c4b5fd" : "#c4b5fd",
  };

  const legendItems = [
    ["SMEs", colors.sme],
    ["Startups", colors.startups],
    ["Enterprises", colors.enterprises],
  ];

  return (
    <div className="bg-white h-full  dark:bg-dark-card-bg  border border-default dark:border-dark-divider rounded-xl p-4 md:p-4.5 flex-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[13px] font-semibold text-primary dark:text-dark-primary">
          Retention Rate
        </span>
        <Icon
          className="text-muted dark:text-dark-muted"
          d={IC.moreV}
          size={14}
        />
      </div>
      <div className="mb-2.5">
        <span className="text-2xl font-extrabold text-primary dark:text-dark-primary tracking-tight">
          95%
        </span>
        <span className="text-[11px] text-success dark:text-success-dark ml-2 font-medium">
          +12% vs last month
        </span>
      </div>
      {/* Legend */}
      <div className="flex gap-3 mb-2.5">
        {legendItems.map(([label, color]) => (
          <div key={label} className="flex items-center gap-1">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: color }}
            />
            <span className="text-[10px] text-muted dark:text-dark-muted">
              {label}
            </span>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={90}>
        <BarChart
          data={retentionData}
          barSize={10}
          barGap={2}
          margin={{ top: 0, right: 0, left: -25, bottom: 0 }}
        >
          <CartesianGrid
            vertical={false}
            stroke={colors.grid}
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 9, fill: colors.text }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 9, fill: colors.text }}
            domain={[0, 100]}
          />
          <Bar
            dataKey="sme"
            name="SMEs"
            radius={[3, 3, 0, 0]}
            fill={colors.sme}
          />
          <Bar
            dataKey="start"
            name="Startups"
            radius={[3, 3, 0, 0]}
            fill={colors.startups}
          />
          <Bar
            dataKey="ent"
            name="Enterprises"
            radius={[3, 3, 0, 0]}
            fill={colors.enterprises}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{
              fill: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
