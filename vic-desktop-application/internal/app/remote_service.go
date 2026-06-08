package app

import (
	"fmt"
	"sort"
	"strings"

	"github.com/elyasahmadi/vic/internal/clone"
	"github.com/elyasahmadi/vic/internal/commits"
	"github.com/elyasahmadi/vic/internal/config"
	"github.com/elyasahmadi/vic/internal/push"
	"github.com/elyasahmadi/vic/internal/refs"
	"github.com/elyasahmadi/vic/internal/remote"
	"github.com/elyasahmadi/vic/internal/session"
	"github.com/elyasahmadi/vic/internal/worktree"
)

type Remote struct {
	Name string `json:"name"`
	URL  string `json:"url"`
}

func AddRemote(repoPath, name, url string) error {
	name = strings.TrimSpace(name)
	url = strings.TrimSpace(url)
	if name == "" || url == "" {
		return fmt.Errorf("remote name and URL are required")
	}
	_, vicDir, err := repoDirs(repoPath)
	if err != nil {
		return err
	}
	cfg, err := config.Load(vicDir)
	if err != nil {
		return err
	}
	if _, exists := cfg.Remotes[name]; exists {
		return fmt.Errorf("remote %q already exists", name)
	}
	cfg.Remotes[name] = config.Remote{URL: url}
	return config.Save(vicDir, cfg)
}

func ListRemotes(repoPath string) ([]Remote, error) {
	_, vicDir, err := repoDirs(repoPath)
	if err != nil {
		return nil, err
	}
	cfg, err := config.Load(vicDir)
	if err != nil {
		return nil, err
	}
	names := make([]string, 0, len(cfg.Remotes))
	for name := range cfg.Remotes {
		names = append(names, name)
	}
	sort.Strings(names)
	remotes := make([]Remote, 0, len(names))
	for _, name := range names {
		remotes = append(remotes, Remote{Name: name, URL: cfg.Remotes[name].URL})
	}
	return remotes, nil
}

func GetRemoteURL(repoPath, name string) (string, error) {
	_, vicDir, err := repoDirs(repoPath)
	if err != nil {
		return "", err
	}
	cfg, err := config.Load(vicDir)
	if err != nil {
		return "", err
	}
	r, ok := cfg.Remotes[strings.TrimSpace(name)]
	if !ok {
		return "", fmt.Errorf("remote %q not found", name)
	}
	return r.URL, nil
}

func SetRemoteToken(repoPath, name, token string) error {
	name = strings.TrimSpace(name)
	token = strings.TrimSpace(token)
	if name == "" || token == "" {
		return fmt.Errorf("remote name and token are required")
	}
	_, vicDir, err := repoDirs(repoPath)
	if err != nil {
		return err
	}
	cfg, err := config.Load(vicDir)
	if err != nil {
		return err
	}
	r, ok := cfg.Remotes[name]
	if !ok {
		return fmt.Errorf("remote %q not found", name)
	}
	r.Token = token
	cfg.Remotes[name] = r
	return config.Save(vicDir, cfg)
}

func Fetch(repoPath, remoteName string) error {
	_, vicDir, err := repoDirs(repoPath)
	if err != nil {
		return err
	}
	client, err := remoteClient(vicDir, strings.TrimSpace(remoteName))
	if err != nil {
		return err
	}
	info, err := client.GetInfoRefs()
	if err != nil {
		return fmt.Errorf("fetch: %w", err)
	}
	for refPath, hash := range info.Refs {
		hash = strings.TrimSpace(hash)
		if hash == "" {
			continue
		}
		if err := clone.DownloadReachableObjects(client, vicDir, hash); err != nil {
			return err
		}
		if strings.HasPrefix(refPath, "refs/heads/") {
			branch := strings.TrimPrefix(refPath, "refs/heads/")
			trackingRef := "refs/remotes/" + remoteName + "/" + branch
			if err := refs.WriteRef(vicDir, trackingRef, hash); err != nil {
				return err
			}
		}
	}
	return nil
}

func Push(repoPath, remoteName, branchName string) error {
	_, vicDir, err := repoDirs(repoPath)
	if err != nil {
		return err
	}
	remoteName = strings.TrimSpace(remoteName)
	branchName = strings.TrimSpace(branchName)
	cfg, err := config.Load(vicDir)
	if err != nil {
		return err
	}
	remoteCfg, ok := cfg.Remotes[remoteName]
	if !ok {
		return fmt.Errorf("remote %q not found; add it with: vic remote add %s <url>", remoteName, remoteName)
	}
	serverBase, err := session.ServerBaseFromRemote(remoteCfg.URL)
	if err != nil {
		return err
	}
	cfg.ActiveServer = serverBase
	if cfg.ActiveUser == "" {
		return fmt.Errorf("no active user for this repository; run: vic auth login %s", serverBase)
	}
	if err := config.Save(vicDir, cfg); err != nil {
		return err
	}
	entry, err := session.EnsureValidSessionForUser(serverBase, cfg.ActiveUser)
	if err != nil {
		return err
	}
	localHash, err := refs.ReadRef(vicDir, "refs/heads/"+branchName)
	if err != nil {
		return err
	}
	if localHash == "" {
		return fmt.Errorf("branch %q has no commits", branchName)
	}
	client := remote.NewClient(remoteCfg.URL, entry.AccessToken)
	info, err := client.GetInfoRefs()
	if err != nil {
		return fmt.Errorf("cannot reach remote: %w", err)
	}
	remoteHash := strings.TrimSpace(info.Refs["refs/heads/"+branchName])
	if remoteHash == localHash {
		return nil
	}
	if remoteHash != "" {
		isAncestor, err := commits.IsAncestor(vicDir, remoteHash, localHash)
		if err != nil {
			return fmt.Errorf("ancestry check failed (have you fetched recently?): %w", err)
		}
		if !isAncestor {
			return fmt.Errorf("rejected: remote has commits you don't have; run 'vic pull %s %s' first", remoteName, branchName)
		}
	}
	if err := push.UploadReachableObjects(client, vicDir, localHash); err != nil {
		return err
	}
	return client.UpdateBranchRef(branchName, localHash)
}

func Pull(repoPath, remoteName, branchName string) error {
	root, vicDir, err := repoDirs(repoPath)
	if err != nil {
		return err
	}
	remoteName = strings.TrimSpace(remoteName)
	branchName = strings.TrimSpace(branchName)
	client, err := remoteClient(vicDir, remoteName)
	if err != nil {
		return err
	}
	info, err := client.GetInfoRefs()
	if err != nil {
		return fmt.Errorf("pull: fetch refs: %w", err)
	}
	for refPath, hash := range info.Refs {
		hash = strings.TrimSpace(hash)
		if hash == "" {
			continue
		}
		if err := clone.DownloadReachableObjects(client, vicDir, hash); err != nil {
			return err
		}
		if strings.HasPrefix(refPath, "refs/heads/") {
			branch := strings.TrimPrefix(refPath, "refs/heads/")
			trackingRef := "refs/remotes/" + remoteName + "/" + branch
			if err := refs.WriteRef(vicDir, trackingRef, hash); err != nil {
				return err
			}
		}
	}
	localRef := "refs/heads/" + branchName
	trackingRef := "refs/remotes/" + remoteName + "/" + branchName
	localHash, err := refs.ReadRef(vicDir, localRef)
	if err != nil {
		return err
	}
	remoteHash, err := refs.ReadRef(vicDir, trackingRef)
	if err != nil {
		return err
	}
	if remoteHash == "" {
		return fmt.Errorf("remote branch %q not found after fetch", branchName)
	}
	if localHash == "" {
		if err := refs.WriteRef(vicDir, localRef, remoteHash); err != nil {
			return err
		}
		return worktree.CheckoutCommit(root, vicDir, remoteHash)
	}
	if isAncestor, _ := commits.IsAncestor(vicDir, remoteHash, localHash); isAncestor {
		return nil
	}
	canFF, err := commits.IsAncestor(vicDir, localHash, remoteHash)
	if err != nil {
		return err
	}
	if !canFF {
		return fmt.Errorf("cannot fast-forward; local branch has diverged. Use 'vic merge %s/%s' to do a three-way merge", remoteName, branchName)
	}
	if err := refs.WriteRef(vicDir, localRef, remoteHash); err != nil {
		return err
	}
	return worktree.CheckoutCommit(root, vicDir, remoteHash)
}

func remoteClient(vicDir, remoteName string) (*remote.Client, error) {
	cfg, err := config.Load(vicDir)
	if err != nil {
		return nil, err
	}
	remoteCfg, ok := cfg.Remotes[remoteName]
	if !ok {
		return nil, fmt.Errorf("remote %q not found", remoteName)
	}
	serverBase, err := session.ServerBaseFromRemote(remoteCfg.URL)
	if err != nil {
		return nil, err
	}
	cfg.ActiveServer = serverBase
	if cfg.ActiveUser == "" {
		return nil, fmt.Errorf("no active user for this repository; run: vic auth login %s", serverBase)
	}
	if err := config.Save(vicDir, cfg); err != nil {
		return nil, err
	}
	entry, err := session.EnsureValidSessionForUser(serverBase, cfg.ActiveUser)
	if err != nil {
		return nil, err
	}
	return remote.NewClient(remoteCfg.URL, entry.AccessToken), nil
}
