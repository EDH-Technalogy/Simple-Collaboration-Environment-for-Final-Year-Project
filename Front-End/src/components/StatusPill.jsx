import clsx from "clsx";

const VARIANT_CLASS = {
  success: "status-pill status-pill--success",
  warning: "status-pill status-pill--warning",
  error: "status-pill status-pill--error",
  neutral: "status-pill status-pill--neutral",
  info: "status-pill status-pill--info",
};

/**
 * Status cell with optional leading dot (reference-style SaaS tables).
 */
export default function StatusPill({
  variant = "neutral",
  dot = true,
  className,
  children,
}) {
  return (
    <span className={clsx(VARIANT_CLASS[variant] ?? VARIANT_CLASS.neutral, className)}>
      {dot ? <span className="status-pill__dot" aria-hidden /> : null}
      {children}
    </span>
  );
}

/** Map normalized status strings from adminShared to pill variants */
export function statusToPillVariant(status) {
  const s = (status ?? "").toLowerCase();
  if (s === "active") return "success";
  if (s === "pending") return "warning";
  if (s === "disabled" || s === "suspended" || s === "rejected") return "error";
  return "neutral";
}
