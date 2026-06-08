import { cn } from "../../lib/utils";

/**
 * Shared blog surface: Medium-like max width and horizontal padding.
 */
export function BlogShell({ children, className, variant = "feed" }) {
  const max =
    variant === "article"
      ? "max-w-[880px]"
      : variant === "editor"
        ? "max-w-[720px]"
        : "max-w-[1192px]";
  return (
    <div
      className={cn(
        "min-h-screen w-full bg-white  text-light-btn-primary-disabled-text  dark:bg-dark-app-secondary  dark:text-dark-text-primary",
        className,
      )}
    >
      <div className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", max)}>
        {children}
      </div>
    </div>
  );
}
