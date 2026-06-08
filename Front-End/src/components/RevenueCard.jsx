import { useState } from "react";
import IC from "./IC";
import Icon from "./Icon";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import CustomTooltip from "./CustomTooltip";
import { useTheme } from "../context/themContext";

export default function RevenueCard() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const projectStatusData = [
    { status: "Ongoing", value: 32, color: "#3B82F6" },
    { status: "Completed", value: 28, color: "#22C55E" },
    { status: "Pending", value: 15, color: "#F59E0B" },
    { status: "In Review", value: 8, color: "#8B5CF6" },
    { status: "Cancelled", value: 4, color: "#EF4444" },
  ];

  // Theme-aware colors for recharts
  const colors = {
    grid: isDark ? "var(--color-dark-default)" : "var(--color-default)",
    text: isDark ? "var(--color-dark-muted)" : "var(--color-muted)",
    barBg: isDark ? "var(--color-bar-dark-bg)" : "var(--color-bar-bg)",
    purpleBar: isDark
      ? "var(--color-purple-dark-bar)"
      : "var(--color-purple-bar)",
  };

  const [period, setPeriod] = useState("All");
  const periods = ["All", "This Month", "This Week"];
  return (
    <div className="bg-white  dark:bg-dark-card-bg border border-default dark:border-dark-divider rounded-xl p-4 md:p-4.5 flex-1">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-semibold text-primary dark:text-dark-primary">
            Project Status
          </span>
          <Icon
            className="text-muted dark:text-dark-muted"
            d={IC.chevDown}
            size={13}
            strokeWidth={2}
          />
        </div>
        <div className="flex gap-0.5">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2 py-0.75 rounded-md border-none text-[11px] cursor-pointer transition-colors ${
                period === p
                  ? "bg-nav-main-active dark:bg-dark-nav-main-active text-nav-text-active dark:text-nav-text-active font-semibold"
                  : "bg-transparent text-muted dark:text-dark-muted font-normal hover:bg-nav-hover dark:hover:bg-dark-nav-hover"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-3">
        <span className="text-[22px] font-extrabold text-primary dark:text-dark-primary tracking-tight">
          87
        </span>
        <span className="text-[11px] text-success dark:text-success-dark ml-2 font-medium">
          Total Projects
        </span>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart
          data={projectStatusData}
          barSize={28}
          margin={{ top: 5, right: 0, left: -20, bottom: 0 }}
        >
          <CartesianGrid
            vertical={false}
            stroke={colors.grid}
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey="status"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 9, fill: colors.text }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: colors.text }}
          />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Bar
            dataKey="value"
            name="Projects"
            radius={[4, 4, 0, 0]}
            shape={(props) => {
              const { x, y, width, height, index } = props;
              const barColor = projectStatusData[index]?.color;
              return (
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  rx={4}
                  ry={4}
                  fill={barColor || colors.barBg}
                />
              );
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
