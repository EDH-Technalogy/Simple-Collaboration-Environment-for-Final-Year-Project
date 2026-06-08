import IC from "./IC";
import Icon from "./Icon";

export default function StatCard({
  icon,
  label,
  value,
  delta,
  deltaDir,
  period,
}) {
  const isUp = deltaDir === "up";
  return (
    <div className=" bg-white  dark:bg-dark-card-bg  border border-default dark:border-dark-divider rounded-xl p-4 md:p-4.5 flex-1 min-w-0">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.75">
          <div className="w-7 h-7 rounded-lg bg-accent-light dark:bg-accent-dark-light flex items-center justify-center">
            <Icon
              d={icon}
              className="text-[14px] stroke-accent dark:stroke-accent-dark stroke-[1.8]"
            />
          </div>
          <span className="text-xs text-secondary dark:text-dark-secondary font-medium">
            {label}
          </span>
        </div>
        <Icon
          d={IC.moreH}
          className="stroke-muted dark:stroke-dark-muted stroke-[1.5]"
        />
      </div>
      <div className="flex items-end gap-2.5">
        <span className="text-[28px] font-extrabold text-primary dark:text-dark-primary leading-none tracking-tight">
          {value}
        </span>
        <div className="mb-0.75 flex flex-col gap-0.5">
          <div className="flex items-center gap-0.75">
            <Icon
              d={isUp ? IC.arrowUp : IC.arrowDown}
              className={`${isUp ? "stroke-success" : "stroke-error"} dark:${isUp ? "stroke-success-dark" : "stroke-error-dark"} stroke-[2.5]`}
            />
            <span className="text-[11px] font-semibold text-success dark:text-success-dark">
              {delta}
            </span>
          </div>
          <span className="text-[10px] text-muted dark:text-dark-muted">
            {period}
          </span>
        </div>
      </div>
    </div>
  );
}
