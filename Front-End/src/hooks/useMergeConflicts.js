import { useQuery } from "@tanstack/react-query";
import { fetchMergeConflicts } from "../services/versionControlService";

/** Merge conflict probe for ConflictResolver (+ teacher / admin dashboards). */
export function useMergeConflicts(owner, repo, prNumber, options = {}) {
  const enabled =
    Boolean(owner && repo && prNumber != null && prNumber !== "") &&
    options.enabled !== false;

  return useQuery({
    queryKey: ["vcMergeConflicts", owner, repo, prNumber],
    queryFn: () => fetchMergeConflicts(owner, repo, prNumber),
    staleTime: 30_000,
    enabled,
  });
}
