package worktree

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/elyasahmadi/vic/internal/commits"
	"github.com/elyasahmadi/vic/internal/index"
	"github.com/elyasahmadi/vic/internal/objects"
	"github.com/elyasahmadi/vic/internal/trees"
)

// CheckoutCommit restores the working tree to the given commit and rebuilds the index.
// It removes files that were tracked before but are absent in the new tree.
func CheckoutCommit(root, vicDir, commitHash string) error {
	c, err := commits.ReadCommit(vicDir, commitHash)
	if err != nil {
		return err
	}

	newTree, err := trees.ReadTreeRecursive(vicDir, c.Tree)
	if err != nil {
		return err
	}

	// Remove files tracked in old index but absent in new tree
	oldIdx, _ := index.Load(vicDir)
	for _, e := range oldIdx.Entries {
		if _, ok := newTree[e.Path]; !ok {
			_ = os.Remove(filepath.Join(root, filepath.FromSlash(e.Path)))
		}
	}

	// Write new files
	for path, entry := range newTree {
		if entry.Type != "blob" {
			continue
		}
		obj, err := objects.ReadObject(vicDir, entry.Hash)
		if err != nil {
			return fmt.Errorf("worktree: read blob %s: %w", entry.Hash, err)
		}
		fullPath := filepath.Join(root, filepath.FromSlash(path))
		if err := os.MkdirAll(filepath.Dir(fullPath), 0o755); err != nil {
			return err
		}
		mode := os.FileMode(0o644)
		if entry.Mode == "100755" {
			mode = 0o755
		}
		if err := os.WriteFile(fullPath, obj.Content, mode); err != nil {
			return err
		}
	}

	// Rebuild index to match the checked-out tree exactly
	newIdx := &index.Index{Version: 1, Entries: trees.ToIndexEntries(newTree)}
	return newIdx.Save(vicDir)
}
