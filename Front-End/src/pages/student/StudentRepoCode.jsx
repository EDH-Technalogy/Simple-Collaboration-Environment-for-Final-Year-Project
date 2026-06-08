import { useOutletContext } from "react-router-dom";
import GithubRepoCodeBrowser from "../../components/repo/GithubRepoCodeBrowser";

export default function StudentRepoCode() {
  const { owner, repo, repositoryMeta } = useOutletContext() ?? {};

  return (
    <GithubRepoCodeBrowser
      owner={owner}
      repo={repo}
      repositoryMeta={repositoryMeta}
    />
  );
}
