import { Outlet, useOutletContext } from "react-router-dom";

/**
 * Nested routes under `…/tasks` must forward the repository layout context
 * (`owner`, `repo`, `repositoryMeta`, `repoBase`); otherwise `useOutletContext()`
 * in child pages is empty and VC API calls get null owner/repo.
 */
export default function StudentRepoTasksOutlet() {
  const repositoryContext = useOutletContext();
  return <Outlet context={repositoryContext} />;
}
