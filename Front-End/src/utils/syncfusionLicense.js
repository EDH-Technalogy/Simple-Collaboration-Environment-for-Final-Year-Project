/**
 * Registers Syncfusion EJ2 license before any Syncfusion control mounts.
 * Set `VITE_SYNCFUSION_LICENSE_KEY` or reuse `VITE_DOCS_API_KEY` (see `.env`).
 * @see https://ej2.syncfusion.com/react/documentation/licensing/license-key-registration
 */
import { registerLicense } from "@syncfusion/ej2-base";

export function initializeSyncfusion() {
  const key =
    import.meta.env.VITE_SYNCFUSION_LICENSE_KEY ||
    import.meta.env.VITE_DOCS_API_KEY ||
    "";

  if (!String(key).trim()) {
    console.warn(
      "[syncfusion] Set VITE_SYNCFUSION_LICENSE_KEY or VITE_DOCS_API_KEY — trial banner may appear.",
    );
    return;
  }

  registerLicense(String(key).trim());
}
