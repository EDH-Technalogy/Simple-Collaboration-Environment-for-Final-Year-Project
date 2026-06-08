import { cn } from "../lib/utils";

/** Same tab chrome as `SettingsTabs` for admin blog detail. */
export default function BlogDetailTabs({ tabs, activeTab, onChange }) {
  return (
    <div className="table-toolbar-tabs flex max-w-full flex-wrap p-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "table-toolbar-tab",
              isActive && "table-toolbar-tab--active",
            )}
          >
            <span className="inline-flex items-center gap-2">
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
