import React from "react";

function BtnSpinner({ className = "" }) {
  return (
    <svg
      className={`animate-spin size-3.5 shrink-0 ${className}`.trim()}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

function Button({
  onClick,
  children,
  icon,
  type = "button",
  className = "",
  disabled = false,
  loading = false,
  variant = "primary",
  fullWidth = false,
  ...rest
}) {
  const pending = Boolean(loading);
  const base =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold min-h-9 transition-colors " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/25 " +
    "dark:focus-visible:ring-blue-400/20 disabled:pointer-events-none disabled:opacity-55 disabled:cursor-not-allowed";

  const variants = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    tertiary: "btn-tertiary",
    ghost: "btn-ghost",
    danger:
      "rounded-xl px-5 py-2.5 text-white bg-(--color-light-error-text) hover:opacity-95 active:opacity-90 " +
      "dark:bg-(--color-dark-error-border)",
  };

  return (
    <button
      onClick={onClick}
      type={type}
      disabled={disabled}
      className={[
        base,
        variants[variant] ?? variants.primary,
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {pending ? (
        <BtnSpinner />
      ) : icon ? (
        <span
          className="inline-flex shrink-0 items-center justify-center [&>svg]:size-[1rem] [&>svg]:shrink-0"
          aria-hidden
        >
          {icon}
        </span>
      ) : null}
      <span className={pending ? "opacity-90" : undefined}>{children}</span>
    </button>
  );
}

export default Button;
