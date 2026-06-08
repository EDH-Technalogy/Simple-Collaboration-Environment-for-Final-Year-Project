import { Navigate } from "react-router-dom";
import AuthBootstrapOverlay from "../auth/AuthBootstrapOverlay";
import { postLoginPath } from "../lib/roles";
import { useAuth } from "../auth/useAuth";

export default function GuestRoute({ children }) {
  const { hydrated, user, isAuthenticated } = useAuth();

  if (!hydrated) {
    return <AuthBootstrapOverlay />;
  }

  if (isAuthenticated && user) {
    return <Navigate to={postLoginPath(user)} replace />;
  }

  return children;
}
