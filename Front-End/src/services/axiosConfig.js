/**
 * @deprecated Prefer `import apiClient from "../api/client"` and `auth/storageBridge` for helpers.
 */
export { default } from "../api/client";
export {
  persistTokens,
  clearAuthStorage,
  getStoredAccessToken,
  STORAGE_ACCESS_TOKEN_KEY,
  STORAGE_REFRESH_TOKEN_KEY,
} from "../auth/storageBridge";
