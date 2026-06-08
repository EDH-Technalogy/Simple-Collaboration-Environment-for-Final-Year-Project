package repo

import (
	"fmt"
	"os"
	"path/filepath"
)

const DirName = ".vic"

// Init creates a new VIC repository structure under dir.
func Init(dir string) error {
	vicDir := filepath.Join(dir, DirName)
	if _, err := os.Stat(vicDir); err == nil {
		return fmt.Errorf("repository already exists at %s", vicDir)
	}

	for _, sub := range []string{
		"objects",
		"refs/heads",
		"refs/remotes",
	} {
		if err := os.MkdirAll(filepath.Join(vicDir, sub), 0o755); err != nil {
			return fmt.Errorf("repo: mkdir %s: %w", sub, err)
		}
	}

	// HEAD defaults to refs/heads/main
	if err := os.WriteFile(
		filepath.Join(vicDir, "HEAD"),
		[]byte("ref: refs/heads/main\n"),
		0o644,
	); err != nil {
		return err
	}

	// Minimal config
	if err := os.WriteFile(
		filepath.Join(vicDir, "config"),
		[]byte("[core]\n\trepositoryformatversion = 0\n"),
		0o644,
	); err != nil {
		return err
	}

	return nil
}

// FindRepoRoot walks upward from dir until it finds a .vic directory.
func FindRepoRoot(dir string) (string, error) {
	cur := dir
	for {
		if _, err := os.Stat(filepath.Join(cur, DirName)); err == nil {
			return cur, nil
		}
		parent := filepath.Dir(cur)
		if parent == cur {
			return "", fmt.Errorf("not a vic repository (no .vic directory found)")
		}
		cur = parent
	}
}
