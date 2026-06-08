import IC from "./IC";
import Icon from "./Icon";

export default function CalendarCard() {
  const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const rows = [
    [null, null, 1, 2, 3, 4, 5],
    [6, 7, null, null, null, null, null],
    [null, null, null, null, null, null, 11],
  ];
  // Simpler: show Oct 2025 grid
  const grid = [
    [null, null, 1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10, 11, null],
  ];
  const calEvents = [
    {
      title: "Mesh Weekly Meeting",
      time: "9.00 am - 10.00 am",
      platform: "On Google Meet",
      avatars: ["#6366f1", "#ec4899", "#f59e0b"],
    },
    {
      title: "Gamification Demo",
      time: "10.45 am - 11.45 am",
      platform: "On Slack",
      avatars: ["#10b981", "#6366f1", "#f97316"],
    },
  ];
  return (
    <div className="bg-white dark:bg-dark-card-bg  border border-default dark:border-dark-divider rounded-xl p-4 md:p-4.5 w-70 shrink-0">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button className="bg-transparent border-none cursor-pointer text-muted dark:text-dark-muted p-0.5 hover:bg-nav-hover dark:hover:bg-dark-nav-hover rounded">
            <Icon
              className="text-muted dark:text-dark-muted"
              d={IC.chevLeft}
              size={14}
              strokeWidth={2}
            />
          </button>
          <span className="text-[13px] font-semibold text-primary dark:text-dark-primary">
            October 2025
          </span>
          <button className="bg-transparent border-none cursor-pointer text-muted dark:text-dark-muted p-0.5 hover:bg-nav-hover dark:hover:bg-dark-nav-hover rounded">
            <Icon
              className="text-muted dark:text-dark-muted"
              d={IC.chevRight}
              size={14}
              strokeWidth={2}
            />
          </button>
        </div>
        <Icon
          className="text-muted dark:text-dark-muted"
          d={IC.moreV}
          size={14}
        />
      </div>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {days.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] text-muted dark:text-dark-muted font-semibold py-0.5"
          >
            {d}
          </div>
        ))}
      </div>
      {/* Days grid */}
      {[
        [null, null, null, null, 1, 2, 3],
        [4, 5, 6, 7, 8, 9, 10],
      ].map((row, ri) => (
        <div key={ri} className="grid grid-cols-7 mb-0.5">
          {row.map((d, di) => (
            <div key={di} className="text-center py-1">
              {d && (
                <div
                  className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center cursor-pointer text-[12px] ${
                    d === 8
                      ? "bg-accent text-white font-bold"
                      : "text-primary dark:text-dark-primary font-normal hover:bg-nav-hover dark:hover:bg-dark-nav-hover"
                  }`}
                >
                  {d}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
      {/* Events */}
      <div className="mt-3 flex flex-col gap-2">
        {calEvents.map((ev, i) => (
          <div
            key={i}
            className="bg-card-2 dark:bg-dark-card-2 rounded-lg p-2.5 border border-default dark:border-dark-default"
          >
            <div className="flex justify-between mb-1.5">
              <span className="text-[12px] font-semibold text-primary dark:text-dark-primary">
                {ev.title}
              </span>
              <span className="text-[10px] text-muted dark:text-dark-muted">
                {ev.time}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex">
                {ev.avatars.map((c, ai) => (
                  <div
                    key={ai}
                    className="w-5 h-5 rounded-full border-2 border-card dark:border-dark-card -ml-1.5 first:ml-0"
                    style={{ background: c }}
                  />
                ))}
              </div>
              <span className="text-[10px] text-muted dark:text-dark-muted bg-input dark:bg-dark-input px-2 py-0.5 rounded-full border border-default dark:border-dark-default">
                {ev.platform}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
