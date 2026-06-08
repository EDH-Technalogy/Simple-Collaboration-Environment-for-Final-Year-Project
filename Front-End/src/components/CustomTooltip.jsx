import IC from "./IC";
import Icon from "./Icon";
import { useTheme } from "../context/themContext";

function CustomTooltip({ active, payload, label }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  if (active && payload && payload.length) {
    const val = payload[0].value;
    return (
      <div
        style={{
          background: isDark ? "#1f2937" : "#ffffff",
          border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
          borderRadius: 10,
          padding: "10px 14px",
          boxShadow: isDark
            ? "0 8px 24px rgba(0,0,0,0.4)"
            : "0 8px 24px rgba(0,0,0,0.12)",
          minWidth: 120,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: isDark ? "#9ca3af" : "#6b7280",
            marginBottom: 4,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: isDark ? "#f3f4f6" : "#111827",
          }}
        >
          {val}
        </div>
        <div
          style={{
            fontSize: 11,
            color: isDark ? "#22c55e" : "#22c55e",
            display: "flex",
            alignItems: "center",
            gap: 3,
            marginTop: 2,
          }}
        >
          <Icon
            d={IC.arrowUp}
            size={10}
            stroke={isDark ? "#22c55e" : "#22c55e"}
            strokeWidth={2.5}
          />{" "}
          Projects
        </div>
      </div>
    );
  }
  return null;
}
export default CustomTooltip;
