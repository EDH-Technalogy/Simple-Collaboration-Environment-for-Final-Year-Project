import { useState } from "react";
import Icon from "./Icon";
import IC from "./IC";

export default function LeadsCard() {
  const [tab, setTab] = useState("Status");
  const tabs = ["Status", "Sources", "Qualification"];
  const leadsData = [
    { label: "Qualified", value: 65, color: "#7c3aed" },
    { label: "Contacted", value: 48, color: "#a78bfa" },
    { label: "Lost", value: 20, color: "#ef4444" },
    { label: "Won", value: 55, color: "#7c3aed" },
  ];
  return (
    <div className="bg-white dark:bg-dark-card-bg  border border-default dark:border-dark-divider rounded-xl p-4 md:p-4.5 flex-1">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] font-semibold text-primary dark:text-dark-primary">
          Leads Management
        </span>
        <Icon
          className="text-muted dark:text-dark-muted"
          d={IC.moreV}
          size={14}
        />
      </div>
      <div className="flex gap-1 mb-3.5">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-2.5 py-1 rounded-md text-[11px] cursor-pointer transition-colors ${
              tab === t
                ? "bg-card dark:bg-dark-card border border-default dark:border-dark-default text-primary dark:text-dark-primary font-semibold"
                : "bg-transparent border-none text-muted dark:text-dark-muted font-normal"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2.5">
        {leadsData.map((l) => (
          <div key={l.label} className="flex items-center gap-2.5">
            <span className="w-[72px] text-[11px] text-secondary dark:text-dark-secondary">
              {l.label}
            </span>
            <div className="flex-1 h-2 rounded-full bg-bar-bg dark:bg-bar-dark-bg overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${l.value}%`, background: l.color }}
              />
            </div>
            <span className="w-7 text-[11px] text-muted dark:text-dark-muted text-right">
              {l.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
