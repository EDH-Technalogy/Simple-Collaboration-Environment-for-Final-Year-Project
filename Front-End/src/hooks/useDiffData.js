import { useQuery } from "@tanstack/react-query";
import { fetchPullRequestFiles } from "../services/versionControlService";

/**
 * Lists changed files on a PR (feeds `PRFilesDiff`, `DiffViewer`, review panels).
 */
export function useDiffData(owner, repo, prNumber, options = {}) {
  const enabled =
    Boolean(owner && repo && prNumber != null && prNumber !== "") &&
    options.enabled !== false;

  return useQuery({
    queryKey: ["vcPullRequestFiles", owner, repo, prNumber],
    queryFn: () => fetchPullRequestFiles(owner, repo, prNumber),
    staleTime: 30_000,
    enabled,
  });
}
