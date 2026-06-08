import { useCallback, useEffect, useState } from "react";
import { fetchFileContent } from "../../services/versionControlService";

/**
 * Loads raw file bytes from the VC gateway (used across admin / teacher / student surfaces).
 */
export function useDocumentLoader({
  owner,
  repo,
  filePath,
  branch = "main",
  blobSha = null,
  enabled = true,
}) {
  const [bytes, setBytes] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!enabled || !owner || !repo || !filePath) {
      setBytes(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const b = await fetchFileContent(
        owner,
        repo,
        filePath,
        branch,
        blobSha,
      );
      setBytes(b);
    } catch (e) {
      setError(e?.message ?? "LOAD_ERROR");
      setBytes(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, owner, repo, filePath, branch, blobSha]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { bytes, loading, error, reload };
}
