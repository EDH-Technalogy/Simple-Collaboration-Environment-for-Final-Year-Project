/** Web OAuth client ID from Google Cloud Console (OAuth 2.0 Client, Web application). */
export function hasGoogleOAuthClientId() {
  const id = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  return typeof id === "string" && id.trim().length > 0;
}

export function getGoogleOAuthClientId() {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? "";
}
