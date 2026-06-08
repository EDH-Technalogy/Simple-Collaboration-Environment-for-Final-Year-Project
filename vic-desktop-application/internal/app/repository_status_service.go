package app

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"

	"github.com/elyasahmadi/vic/internal/commits"
	"github.com/elyasahmadi/vic/internal/index"
	"github.com/elyasahmadi/vic/internal/objects"
	"github.com/elyasahmadi/vic/internal/refs"
	"github.com/elyasahmadi/vic/internal/trees"
)

type FileStatus struct {
	Path   string `json:"path"`
	Status string `json:"status"`
}

type StatusResult struct {
	Branch    string       `json:"branch"`
	HeadHash  string       `json:"headHash"`
	HasCommit bool         `json:"hasCommit"`
	Clean     bool         `json:"clean"`
	Staged    []FileStatus `json:"staged"`
	Unstaged  []FileStatus `json:"unstaged"`
	Untracked []string     `json:"untracked"`
}

func Status(repoPath string) (*StatusResult, error) {
	root, vicDir, err := repoDirs(repoPath)
	if err != nil {
		return nil, err
	}
	idx, err := index.Load(vicDir)
	if err != nil {
		return nil, err
	}
	idxMap := idx.Map()

	headTree := map[string]trees.Entry{}
	headRef, err := refs.HeadRefPath(vicDir)
	if err != nil {
		return nil, err
	}
	headHash, err := refs.HeadCommitHash(vicDir)
	if err != nil {
		return nil, err
	}
	if headHash != "" {
		c, err := commits.ReadCommit(vicDir, headHash)
		if err != nil {
			return nil, err
		}
		headTree, err = trees.ReadTreeRecursive(vicDir, c.Tree)
		if err != nil {
			return nil, err
		}
	}

	workMap := map[string]string{}
	err = filepath.WalkDir(root, func(p string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() && d.Name() == ".vic" {
			return filepath.SkipDir
		}
		if d.IsDir() {
			return nil
		}
		rel, err := filepath.Rel(root, p)
		if err != nil {
			return err
		}
		rel = filepath.ToSlash(rel)
		data, err := os.ReadFile(p)
		if err != nil {
			return err
		}
		h, _ := objects.HashObject("blob", data)
		workMap[rel] = h
		return nil
	})
	if err != nil {
		return nil, err
	}

	result := &StatusResult{
		Branch:    branchNameFromRef(headRef),
		HeadHash:  headHash,
		HasCommit: headHash != "",
	}
	for p, ie := range idxMap {
		he, inHead := headTree[p]
		if !inHead {
			result.Staged = append(result.Staged, FileStatus{Path: p, Status: "new file"})
		} else if he.Hash != ie.Hash {
			result.Staged = append(result.Staged, FileStatus{Path: p, Status: "modified"})
		}
	}
	for p := range headTree {
		if _, ok := idxMap[p]; !ok {
			result.Staged = append(result.Staged, FileStatus{Path: p, Status: "deleted"})
		}
	}
	for p, ie := range idxMap {
		wh, inWork := workMap[p]
		if !inWork {
			result.Unstaged = append(result.Unstaged, FileStatus{Path: p, Status: "deleted"})
		} else if wh != ie.Hash {
			result.Unstaged = append(result.Unstaged, FileStatus{Path: p, Status: "modified"})
		}
	}
	for p := range workMap {
		if _, ok := idxMap[p]; !ok {
			result.Untracked = append(result.Untracked, p)
		}
	}
	sortFileStatuses(result.Staged)
	sortFileStatuses(result.Unstaged)
	sort.Strings(result.Untracked)
	result.Clean = len(result.Staged) == 0 && len(result.Unstaged) == 0 && len(result.Untracked) == 0
	return result, nil
}

func sortFileStatuses(files []FileStatus) {
	sort.Slice(files, func(i, j int) bool {
		if files[i].Path == files[j].Path {
			return files[i].Status < files[j].Status
		}
		return files[i].Path < files[j].Path
	})
}

func FormatFileStatuses(files []FileStatus) []string {
	lines := make([]string, 0, len(files))
	for _, file := range files {
		lines = append(lines, fmt.Sprintf("\t%-11s %s", file.Status+":", file.Path))
	}
	return lines
}
