package app

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/elyasahmadi/vic/internal/clone"
	"github.com/elyasahmadi/vic/internal/config"
	"github.com/elyasahmadi/vic/internal/refs"
	"github.com/elyasahmadi/vic/internal/remote"
	"github.com/elyasahmadi/vic/internal/repo"
	"github.com/elyasahmadi/vic/internal/worktree"
)

func CloneDesktopProject(url, parentPath, directoryName string) (*ProjectSummary, error) {
	url = strings.TrimSpace(url)
	parentPath = strings.TrimSpace(parentPath)
	directoryName = strings.TrimSpace(directoryName)
	if url == "" {
		return nil, fmt.Errorf("repository URL is required")
	}
	if parentPath == "" {
		return nil, fmt.Errorf("destination folder is required")
	}
	if directoryName == "" {
		directoryName = cloneDirectoryName(url)
	}
	if directoryName == "" || strings.ContainsAny(directoryName, `/\`) {
		return nil, fmt.Errorf("valid project folder name is required")
	}
	parent, err := filepath.Abs(parentPath)
	if err != nil {
		return nil, err
	}
	targetDir := filepath.Join(parent, directoryName)
	if _, err := os.Stat(targetDir); err == nil {
		return nil, fmt.Errorf("target directory %q already exists", targetDir)
	} else if !os.IsNotExist(err) {
		return nil, err
	}
	if err := os.MkdirAll(targetDir, 0o755); err != nil {
		return nil, err
	}
	cleanupTargetDir := true
	defer func() {
		if cleanupTargetDir {
			_ = os.RemoveAll(targetDir)
		}
	}()

	if err := repo.Init(targetDir); err != nil {
		return nil, err
	}
	vicDir := filepath.Join(targetDir, repo.DirName)
	client := remote.NewClient(url, "")
	info, err := client.GetInfoRefs()
	if err != nil {
		return nil, fmt.Errorf("clone: cannot reach remote: %w", err)
	}
	headRef := strings.TrimSpace(info.HEAD)
	if headRef == "" {
		headRef = "refs/heads/main"
	}
	headHash := strings.TrimSpace(info.Refs[headRef])

	for refPath, hash := range info.Refs {
		hash = strings.TrimSpace(hash)
		if hash == "" {
			continue
		}
		if err := refs.WriteRef(vicDir, refPath, hash); err != nil {
			return nil, err
		}
		if strings.HasPrefix(refPath, "refs/heads/") {
			branch := strings.TrimPrefix(refPath, "refs/heads/")
			if err := refs.WriteRef(vicDir, "refs/remotes/origin/"+branch, hash); err != nil {
				return nil, err
			}
		}
	}
	if err := refs.SetHEADToRef(vicDir, headRef); err != nil {
		return nil, err
	}
	cfg, err := config.Load(vicDir)
	if err != nil {
		return nil, err
	}
	cfg.Remotes["origin"] = config.Remote{URL: url}
	if err := config.Save(vicDir, cfg); err != nil {
		return nil, err
	}
	if headHash != "" {
		if err := clone.DownloadReachableObjects(client, vicDir, headHash); err != nil {
			return nil, err
		}
		if err := worktree.CheckoutCommit(targetDir, vicDir, headHash); err != nil {
			return nil, err
		}
	}
	cleanupTargetDir = false
	return RememberDesktopProject(targetDir)
}

func cloneDirectoryName(url string) string {
	trimmed := strings.TrimRight(strings.TrimSpace(url), "/")
	if trimmed == "" {
		return ""
	}
	parts := strings.Split(trimmed, "/")
	name := strings.TrimSpace(parts[len(parts)-1])
	name = strings.TrimSuffix(name, ".git")
	return name
}
