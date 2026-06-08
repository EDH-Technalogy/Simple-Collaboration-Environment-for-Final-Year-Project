package app

import (
	"path/filepath"
	"strings"

	"github.com/elyasahmadi/vic/internal/repo"
)

func repoRoot(path string) (string, error) {
	if path == "" {
		path = "."
	}
	abs, err := filepath.Abs(path)
	if err != nil {
		return "", err
	}
	return repo.FindRepoRoot(abs)
}

func repoDirs(path string) (root, vicDir string, err error) {
	root, err = repoRoot(path)
	if err != nil {
		return "", "", err
	}
	return root, filepath.Join(root, repo.DirName), nil
}

func branchNameFromRef(headRef string) string {
	const prefix = "refs/heads/"
	if strings.HasPrefix(headRef, prefix) {
		return strings.TrimPrefix(headRef, prefix)
	}
	if len(headRef) >= 8 {
		return "(HEAD detached at " + headRef[:8] + ")"
	}
	return "(detached)"
}

func shortBranchName(headRef string) string {
	const prefix = "refs/heads/"
	if len(headRef) > len(prefix) && strings.HasPrefix(headRef, prefix) {
		return strings.TrimPrefix(headRef, prefix)
	}
	if len(headRef) >= 8 {
		return headRef[:8]
	}
	return headRef
}
