package app

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

type ProjectSummary struct {
	Name       string `json:"name"`
	Path       string `json:"path"`
	Tracked    bool   `json:"tracked"`
	LastOpened string `json:"lastOpened"`
	Modified   string `json:"modified"`
}

func HasRepository(path string) bool {
	if strings.TrimSpace(path) == "" {
		return false
	}
	info, err := os.Stat(filepath.Join(path, ".vic"))
	return err == nil && info.IsDir()
}

func ListDesktopProjects() ([]ProjectSummary, error) {
	projects, err := loadDesktopProjects()
	if err != nil {
		return nil, err
	}
	for i := range projects {
		projects[i] = enrichProject(projects[i].Path, projects[i].LastOpened)
	}
	sort.Slice(projects, func(i, j int) bool {
		return projects[i].LastOpened > projects[j].LastOpened
	})
	return projects, nil
}

func RememberDesktopProject(path string) (*ProjectSummary, error) {
	if strings.TrimSpace(path) == "" {
		return nil, nil
	}
	abs, err := filepath.Abs(path)
	if err != nil {
		return nil, err
	}
	now := time.Now().Format(time.RFC3339)
	next := enrichProject(abs, now)
	projects, err := loadDesktopProjects()
	if err != nil {
		return nil, err
	}
	found := false
	for i := range projects {
		if samePath(projects[i].Path, abs) {
			projects[i] = next
			found = true
			break
		}
	}
	if !found {
		projects = append([]ProjectSummary{next}, projects...)
	}
	sort.Slice(projects, func(i, j int) bool {
		return projects[i].LastOpened > projects[j].LastOpened
	})
	if len(projects) > 24 {
		projects = projects[:24]
	}
	if err := saveDesktopProjects(projects); err != nil {
		return nil, err
	}
	return &next, nil
}

func CreateDesktopProject(parentPath, name string, initialize bool) (*ProjectSummary, error) {
	parentPath = strings.TrimSpace(parentPath)
	name = strings.TrimSpace(name)
	if parentPath == "" {
		return nil, nil
	}
	if name == "" {
		return nil, nil
	}
	parent, err := filepath.Abs(parentPath)
	if err != nil {
		return nil, err
	}
	target := filepath.Join(parent, name)
	if _, err := os.Stat(target); err == nil {
		return nil, fmt.Errorf("target folder %q already exists", target)
	} else if !os.IsNotExist(err) {
		return nil, err
	}
	if err := os.MkdirAll(target, 0o755); err != nil {
		return nil, err
	}
	if initialize {
		if _, err := InitRepository(target); err != nil {
			return nil, err
		}
	}
	return RememberDesktopProject(target)
}

func RemoveDesktopProject(path string) error {
	if strings.TrimSpace(path) == "" {
		return nil
	}
	abs, err := filepath.Abs(path)
	if err != nil {
		return err
	}
	projects, err := loadDesktopProjects()
	if err != nil {
		return err
	}
	filtered := projects[:0]
	for _, project := range projects {
		if !samePath(project.Path, abs) {
			filtered = append(filtered, project)
		}
	}
	return saveDesktopProjects(filtered)
}

func enrichProject(path, lastOpened string) ProjectSummary {
	name := filepath.Base(path)
	if name == "." || name == string(filepath.Separator) {
		name = path
	}
	modified := ""
	if info, err := os.Stat(path); err == nil && !info.ModTime().IsZero() {
		modified = info.ModTime().Format(time.RFC3339)
	}
	return ProjectSummary{
		Name:       name,
		Path:       path,
		Tracked:    HasRepository(path),
		LastOpened: lastOpened,
		Modified:   modified,
	}
}

func desktopProjectsFile() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	dir := filepath.Join(home, ".vic-cli")
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return "", err
	}
	return filepath.Join(dir, "desktop-projects.json"), nil
}

func loadDesktopProjects() ([]ProjectSummary, error) {
	path, err := desktopProjectsFile()
	if err != nil {
		return nil, err
	}
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return []ProjectSummary{}, nil
		}
		return nil, err
	}
	if strings.TrimSpace(string(data)) == "" {
		return []ProjectSummary{}, nil
	}
	var projects []ProjectSummary
	if err := json.Unmarshal(data, &projects); err != nil {
		return nil, err
	}
	return projects, nil
}

func saveDesktopProjects(projects []ProjectSummary) error {
	path, err := desktopProjectsFile()
	if err != nil {
		return err
	}
	data, err := json.MarshalIndent(projects, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0o600)
}

func samePath(a, b string) bool {
	return strings.EqualFold(filepath.Clean(a), filepath.Clean(b))
}
