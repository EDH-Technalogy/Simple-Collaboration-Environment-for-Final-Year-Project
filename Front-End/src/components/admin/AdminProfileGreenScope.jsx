import React from "react";

/**
 * Local green theme override for admin profile dashboards.
 * Keeps the global design system untouched; only affects descendants.
 */
export default function AdminProfileGreenScope({ children, className }) {
  return (
    <div
      className={className}
      style={{
        "--color-light-admin-profile-violet": "#10b981",
        "--color-light-admin-profile-violet-strong": "#059669",
        "--color-light-admin-profile-violet-soft-bg": "#ecfdf5",
        "--color-light-admin-profile-violet-soft-text": "#047857",
        "--color-light-admin-profile-violet-soft-border": "#6ee7b7",
        "--color-light-admin-profile-hero-from": "#a7f3d0",
        "--color-light-admin-profile-hero-to": "#10b981",
        "--color-light-admin-profile-peer-rose": "#34d399",
        "--color-light-admin-profile-link": "#059669",

        "--color-dark-admin-profile-violet": "#6ee7b7",
        "--color-dark-admin-profile-violet-strong": "#34d399",
        "--color-dark-admin-profile-violet-soft-bg": "rgba(16, 185, 129, 0.18)",
        "--color-dark-admin-profile-violet-soft-text": "#a7f3d0",
        "--color-dark-admin-profile-violet-soft-border": "rgba(52, 211, 153, 0.35)",
        "--color-dark-admin-profile-hero-from": "#34d399",
        "--color-dark-admin-profile-hero-to": "#064e3b",
        "--color-dark-admin-profile-peer-rose": "#2dd4bf",
        "--color-dark-admin-profile-link": "#6ee7b7",
      }}
    >
      {children}
    </div>
  );
}

