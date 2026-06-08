import { useQuery } from "@tanstack/react-query";
import { fetchCommitHistory } from "../services/versionControlService";

/** Commit timeline for VC file / repo views (any role-specific page). */
export function useFileHistory(owner, repo, branch = "main", options = {}) {
  const enabled = Boolean(owner && repo && branch) && options.enabled !== false;

  return useQuery({
    queryKey: ["vcCommitHistory", owner, repo, branch, options.limit],
    queryFn: () =>
      fetchCommitHistory(owner, repo, branch, {
        limit: options.limit ?? 50,
        ...options.params,
      }),
    staleTime: 60_000,
    enabled,
  });
}
