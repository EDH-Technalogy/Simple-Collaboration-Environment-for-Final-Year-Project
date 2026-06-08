/**
 * Lightweight full-screen spinner while SPA auth restores (cookie bootstrap / hydration).
 */
export default function AuthBootstrapOverlay() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-shell px-4 dark:bg-dark-app">
      <div
        className="size-10 animate-spin rounded-full border-2 border-(--color-light-input-border) border-t-[color:var(--color-light-accent)] dark:border-dark-input-border dark:border-t-[color:var(--color-dark-accent)]"
        aria-hidden
      />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
