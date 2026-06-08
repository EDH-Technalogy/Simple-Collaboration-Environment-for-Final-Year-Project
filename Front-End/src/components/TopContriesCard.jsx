import IC from "./IC";
import Icon from "./Icon";

export default function TopCountryCard() {
  const countries = [
    { name: "Australia", flag: "🇦🇺", pct: 48 },
    { name: "Malaysia", flag: "🇲🇾", pct: 33 },
    { name: "Indonesia", flag: "🇮🇩", pct: 25 },
    { name: "Singapore", flag: "🇸🇬", pct: 17 },
  ];
  return (
    <div className="bg-white  dark:bg-dark-card-bg border border-default dark:border-dark-divider rounded-xl p-4 md:p-4.5 flex-1">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] font-semibold text-primary dark:text-dark-primary">
          Top Country
        </span>
        <Icon
          className="text-muted dark:text-dark-muted"
          d={IC.moreV}
          size={14}
        />
      </div>
      {/* Map placeholder with purple blobs */}
      <div className="h-[100px] bg-card-2 dark:bg-dark-card-2 rounded-lg mb-3.5 overflow-hidden relative border border-default dark:border-dark-default">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 300 100"
          className="absolute inset-0"
        >
          {/* Simplified world-blob shapes for SE Asia/Pacific */}
          <ellipse
            cx="220"
            cy="50"
            rx="35"
            ry="22"
            fill="#7c3aed"
            opacity="0.18"
          />
          <ellipse
            cx="215"
            cy="48"
            rx="18"
            ry="12"
            fill="#7c3aed"
            opacity="0.5"
          />
          <ellipse
            cx="240"
            cy="60"
            rx="12"
            ry="8"
            fill="#a78bfa"
            opacity="0.5"
          />
          <ellipse
            cx="200"
            cy="62"
            rx="10"
            ry="6"
            fill="#6d28d9"
            opacity="0.4"
          />
          <ellipse
            cx="255"
            cy="45"
            rx="14"
            ry="8"
            fill="#7c3aed"
            opacity="0.35"
          />
          {/* dots */}
          <circle cx="215" cy="48" r="3" fill="#7c3aed" />
          <circle cx="240" cy="60" r="2.5" fill="#a78bfa" />
          <circle cx="200" cy="62" r="2" fill="#6d28d9" />
        </svg>
        {/* expand icon */}
        <button className="absolute top-1.5 right-1.5 bg-card dark:bg-dark-card border border-default dark:border-dark-default rounded-md p-0.75 cursor-pointer flex">
          <Icon
            className="text-muted dark:text-dark-muted"
            d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"
            size={11}
            strokeWidth={1.5}
          />
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {countries.map((c, i) => (
          <div key={c.name} className="flex items-center gap-2">
            <span className="text-[11px] text-muted dark:text-dark-muted w-3.5">
              {i + 1}
            </span>
            <span className="text-sm">{c.flag}</span>
            <span className="text-[12px] text-secondary dark:text-dark-secondary flex-1">
              {c.name}
            </span>
            <span className="text-[12px] font-semibold text-primary dark:text-dark-primary">
              {c.pct}%
            </span>
          </div>
        ))}
        <button className="mt-1 text-[11px] text-accent dark:text-accent-dark bg-transparent border-none cursor-pointer text-left flex items-center gap-1 hover:opacity-80">
          View more{" "}
          <Icon
            className="text-accent dark:text-accent-dark"
            d={IC.chevRight}
            size={11}
            strokeWidth={2}
          />
        </button>
      </div>
    </div>
  );
}
