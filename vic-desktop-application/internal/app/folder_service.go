package app

import (
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

type FolderEntry struct {
	Name     string `json:"name"`
	Path     string `json:"path"`
	Relative string `json:"relative"`
	IsDir    bool   `json:"isDir"`
	Size     int64  `json:"size"`
	Modified string `json:"modified"`
}

type FileTreeNode struct {
	Name     string         `json:"name"`
	Path     string         `json:"path"`
	Relative string         `json:"relative"`
	IsDir    bool           `json:"isDir"`
	Size     int64          `json:"size"`
	Modified string         `json:"modified"`
	Status   string         `json:"status"`
	Children []FileTreeNode `json:"children"`
}

func GetRepositoryTree(rootPath string) (*FileTreeNode, error) {
	root, err := filepath.Abs(rootPath)
	if err != nil {
		return nil, err
	}
	statuses := map[string]string{}
	if HasRepository(root) {
		if status, err := Status(root); err == nil {
			for _, file := range status.Staged {
				statuses[file.Path] = file.Status
			}
			for _, file := range status.Unstaged {
				statuses[file.Path] = file.Status
			}
			for _, file := range status.Untracked {
				statuses[file] = "untracked"
			}
		}
	}
	return buildFileTree(root, root, statuses)
}

func ListFolder(rootPath, folderPath string) ([]FolderEntry, error) {
	root, err := filepath.Abs(rootPath)
	if err != nil {
		return nil, err
	}
	folder := folderPath
	if folder == "" {
		folder = root
	}
	if !filepath.IsAbs(folder) {
		folder = filepath.Join(root, folder)
	}
	folder, err = filepath.Abs(folder)
	if err != nil {
		return nil, err
	}
	entries, err := os.ReadDir(folder)
	if err != nil {
		return nil, err
	}
	result := make([]FolderEntry, 0, len(entries))
	for _, entry := range entries {
		if entry.Name() == ".vic" {
			continue
		}
		fullPath := filepath.Join(folder, entry.Name())
		info, err := entry.Info()
		if err != nil {
			return nil, err
		}
		rel, err := filepath.Rel(root, fullPath)
		if err != nil {
			rel = entry.Name()
		}
		modified := ""
		if !info.ModTime().IsZero() {
			modified = info.ModTime().Format(time.RFC3339)
		}
		result = append(result, FolderEntry{
			Name:     entry.Name(),
			Path:     fullPath,
			Relative: filepath.ToSlash(rel),
			IsDir:    entry.IsDir(),
			Size:     info.Size(),
			Modified: modified,
		})
	}
	sort.Slice(result, func(i, j int) bool {
		if result[i].IsDir != result[j].IsDir {
			return result[i].IsDir
		}
		return strings.ToLower(result[i].Name) < strings.ToLower(result[j].Name)
	})
	return result, nil
}

func buildFileTree(root, path string, statuses map[string]string) (*FileTreeNode, error) {
	info, err := os.Stat(path)
	if err != nil {
		return nil, err
	}
	rel, err := filepath.Rel(root, path)
	if err != nil {
		rel = "."
	}
	if rel == "." {
		rel = ""
	}
	node := &FileTreeNode{
		Name:     filepath.Base(path),
		Path:     path,
		Relative: filepath.ToSlash(rel),
		IsDir:    info.IsDir(),
		Size:     info.Size(),
		Status:   statuses[filepath.ToSlash(rel)],
	}
	if !info.ModTime().IsZero() {
		node.Modified = info.ModTime().Format(time.RFC3339)
	}
	if !info.IsDir() {
		return node, nil
	}
	entries, err := os.ReadDir(path)
	if err != nil {
		return nil, err
	}
	children := make([]FileTreeNode, 0, len(entries))
	for _, entry := range entries {
		if entry.Name() == ".vic" {
			continue
		}
		childPath := filepath.Join(path, entry.Name())
		child, err := buildFileTree(root, childPath, statuses)
		if err != nil {
			return nil, err
		}
		children = append(children, *child)
	}
	sort.Slice(children, func(i, j int) bool {
		if children[i].IsDir != children[j].IsDir {
			return children[i].IsDir
		}
		return strings.ToLower(children[i].Name) < strings.ToLower(children[j].Name)
	})
	node.Children = children
	return node, nil
}
