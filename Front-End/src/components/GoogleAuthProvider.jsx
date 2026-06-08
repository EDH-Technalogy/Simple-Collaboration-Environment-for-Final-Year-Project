import { GoogleOAuthProvider } from "@react-oauth/google";
import { getGoogleOAuthClientId, hasGoogleOAuthClientId } from "../lib/googleOAuth";

/**
 * Wraps the SPA when `VITE_GOOGLE_CLIENT_ID` is set so `@react-oauth/google` hooks/components work.
 */
export function MaybeGoogleOAuthProvider({ children }) {
  if (!hasGoogleOAuthClientId()) {
    return children;
  }

  const clientId = getGoogleOAuthClientId();

  return (
    <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>
  );
}
