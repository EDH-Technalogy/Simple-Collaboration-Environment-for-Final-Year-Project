package app

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/elyasahmadi/vic/internal/refs"
	"github.com/elyasahmadi/vic/internal/worktree"
)

type Branch struct {
	Name    string `json:"name"`
	Current bool   `json:"current"`
	Remote  bool   `json:"remote"`
}

func ListBranches(repoPath string, includeRemote bool) ([]Branch, error) {
	_, vicDir, err := repoDirs(repoPath)
	if err != nil {
		return nil, err
	}
	headRef, err := refs.HeadRefPath(vicDir)
	if err != nil {
		return nil, err
	}
	current := strings.TrimPrefix(headRef, "refs/heads/")
	branches := []Branch{}
	headsDir := filepath.Join(vicDir, "refs", "heads")
	entries, err := os.ReadDir(headsDir)
	if err != nil && !os.IsNotExist(err) {
		return nil, err
	}
	for _, e := range entries {
		if !e.IsDir() {
			branches = append(branches, Branch{Name: e.Name(), Current: e.Name() == current})
		}
	}
	if includeRemote {
		remotesDir := filepath.Join(vicDir, "refs", "remotes")
		if _, err := os.Stat(remotesDir); err == nil {
			err = filepath.Walk(remotesDir, func(path string, info os.FileInfo, err error) error {
				if err != nil || info.IsDir() {
					return err
				}
				rel, err := filepath.Rel(remotesDir, path)
				if err != nil {
					return err
				}
				branches = append(branches, Branch{Name: "remotes/" + filepath.ToSlash(rel), Remote: true})
				return nil
			})
			if err != nil {
				return nil, err
			}
		}
	}
	sort.Slice(branches, func(i, j int) bool { return branches[i].Name < branches[j].Name })
	return branches, nil
}

func CreateBranch(repoPath, name string) error {
	name = strings.TrimSpace(name)
	if name == "" {
		return fmt.Errorf("branch name is empty")
	}
	if strings.ContainsAny(name, " \t\n\r\\/:*?\"<>|") {
		return fmt.Errorf("invalid branch name %q", name)
	}
	_, vicDir, err := repoDirs(repoPath)
	if err != nil {
		return err
	}
	headHash, err := refs.HeadCommitHash(vicDir)
	if err != nil {
		return err
	}
	if headHash == "" {
		return fmt.Errorf("cannot create branch %q: no commits yet", name)
	}
	existing, err := refs.ReadRef(vicDir, "refs/heads/"+name)
	if err != nil {
		return err
	}
	if existing != "" {
		return fmt.Errorf("branch %q already exists", name)
	}
	return refs.WriteRef(vicDir, "refs/heads/"+name, headHash)
}

func Checkout(repoPath, target string) error {
	target = strings.TrimSpace(target)
	if target == "" {
		return fmt.Errorf("checkout target is required")
	}
	root, vicDir, err := repoDirs(repoPath)
	if err != nil {
		return err
	}
	commitHash, headRef, err := resolveCheckoutTarget(vicDir, target)
	if err != nil {
		return err
	}
	if err := worktree.CheckoutCommit(root, vicDir, commitHash); err != nil {
		return err
	}
	if headRef != "" {
		return refs.SetHEADToRef(vicDir, headRef)
	}
	return refs.SetHEADDetached(vicDir, commitHash)
}

func CreateAndCheckoutBranch(repoPath, name, startPoint string) error {
	name = strings.TrimSpace(name)
	if name == "" {
		return fmt.Errorf("branch name is empty")
	}
	if strings.ContainsAny(name, " \t\n\r\\/:*?\"<>|") {
		return fmt.Errorf("invalid branch name %q", name)
	}
	root, vicDir, err := repoDirs(repoPath)
	if err != nil {
		return err
	}
	if strings.TrimSpace(startPoint) == "" {
		startPoint, err = refs.HeadCommitHash(vicDir)
		if err != nil {
			return err
		}
	}
	commitHash, err := resolveRevision(vicDir, startPoint)
	if err != nil {
		return err
	}
	if commitHash == "" {
		return fmt.Errorf("cannot create branch %q: no commits yet", name)
	}
	existing, err := refs.ReadRef(vicDir, "refs/heads/"+name)
	if err != nil {
		return err
	}
	if existing != "" {
		return fmt.Errorf("branch %q already exists", name)
	}
	refPath := "refs/heads/" + name
	if err := refs.WriteRef(vicDir, refPath, commitHash); err != nil {
		return err
	}
	if err := refs.SetHEADToRef(vicDir, refPath); err != nil {
		return err
	}
	return worktree.CheckoutCommit(root, vicDir, commitHash)
}

func DeleteBranch(repoPath, name string) error {
	name = strings.TrimSpace(name)
	if name == "" {
		return fmt.Errorf("branch name is empty")
	}
	_, vicDir, err := repoDirs(repoPath)
	if err != nil {
		return err
	}
	headRef, err := refs.HeadRefPath(vicDir)
	if err != nil {
		return err
	}
	if name == strings.TrimPrefix(headRef, "refs/heads/") {
		return fmt.Errorf("cannot delete the currently checked-out branch %q", name)
	}
	refPath := filepath.Join(vicDir, "refs", "heads", name)
	if _, err := os.Stat(refPath); err != nil {
		if os.IsNotExist(err) {
			return fmt.Errorf("branch %q does not exist", name)
		}
		return err
	}
	return os.Remove(refPath)
}

func resolveCheckoutTarget(vicDir, arg string) (commitHash, headRefToSet string, err error) {
	refPath := "refs/heads/" + arg
	if h, _ := refs.ReadRef(vicDir, refPath); h != "" {
		return h, refPath, nil
	}
	if strings.HasPrefix(arg, "remotes/") {
		arg = strings.TrimPrefix(arg, "remotes/")
	}
	if strings.Contains(arg, "/") {
		if h, _ := refs.ReadRef(vicDir, "refs/remotes/"+arg); h != "" {
			return h, "", nil
		}
	}
	if len(arg) == 40 {
		return arg, "", nil
	}
	return "", "", fmt.Errorf("unknown branch or revision %q", arg)
}

func resolveRevision(vicDir, arg string) (string, error) {
	arg = strings.TrimSpace(arg)
	if arg == "" {
		return "", fmt.Errorf("revision is required")
	}
	if h, _ := refs.ReadRef(vicDir, "refs/heads/"+arg); h != "" {
		return h, nil
	}
	if strings.HasPrefix(arg, "remotes/") {
		arg = strings.TrimPrefix(arg, "remotes/")
	}
	if strings.Contains(arg, "/") {
		if h, _ := refs.ReadRef(vicDir, "refs/remotes/"+arg); h != "" {
			return h, nil
		}
	}
	if len(arg) == 40 {
		return arg, nil
	}
	return "", fmt.Errorf("unknown revision %q", arg)
}
