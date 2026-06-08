import { forwardRef } from "react";

// Read direction once — `dir` changes at runtime are extremely rare
// and don't justify a MutationObserver on every mounted dropdown.
const isRTL = () => document.documentElement.dir === "rtl";

const Dropdown = forwardRef(({ children, className = "" }, ref) => (
  <div
    ref={ref}
    className={`
      absolute ${isRTL() ? "left-0" : "right-0"} top-full z-50 mt-2
      overflow-hidden rounded-xl border shadow-lg
      bg-(--color-light-card-bg) text-(--color-light-text-primary)
      border-(--color-light-card-border)
      dark:bg-(--color-dark-card-bg) dark:text-(--color-dark-text-primary)
      dark:border-(--color-dark-card-border)
      dark:shadow-black/25
      animate-in fade-in slide-in-from-top-2 duration-150
      ${className}
    `}
  >
    {children}
  </div>
));

Dropdown.displayName = "Dropdown";
export default Dropdown;
