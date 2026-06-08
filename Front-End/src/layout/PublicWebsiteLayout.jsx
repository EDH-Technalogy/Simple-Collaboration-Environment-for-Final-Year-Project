import { Outlet } from "react-router-dom";
import PublicWebsiteFooter from "./PublicWebsiteFooter";
import PublicWebsiteHeader from "./PublicWebsiteHeader";

/**
 * Marketing-style public shell for blogs: top nav only, no dashboard sidebar / AppHeader.
 * Authentication and RBAC are enforced on **child routes** (see `App.jsx`): public pages stay
 * open, while `/write`, `/library`, and `/writer/profile` sit under a `ProtectedRoute` layout
 * that requires a signed-in user with one of `PUBLIC_SITE_MEMBER_ROLES`.
 */
export default function PublicWebsiteLayout() {
  return (
    <div className="relative min-h-screen bg-(--color-light-app-bg) text-primary dark:bg-dark-shell dark:text-dark-primary">
      <PublicWebsiteHeader />
      <main className="min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-4.25rem)]">
        <Outlet />
      </main>
      <PublicWebsiteFooter />
    </div>
  );
}
