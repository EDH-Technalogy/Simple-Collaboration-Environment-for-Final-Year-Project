// Package push handles uploading all objects reachable from a commit tip
// to the remote server, skipping objects the server already has.
package push

import (
	"fmt"

	"github.com/elyasahmadi/vic/internal/commits"
	"github.com/elyasahmadi/vic/internal/objects"
	"github.com/elyasahmadi/vic/internal/remote"
	"github.com/elyasahmadi/vic/internal/trees"
)

// UploadReachableObjects walks the commit graph starting from tipHash and
// uploads every object (commit, tree, blob) the server does not already have.
// Uses HEAD requests to skip already-present objects — avoids redundant uploads.
func UploadReachableObjects(client *remote.Client, vicDir, tipHash string) error {
	seen := map[string]bool{}
	return uploadCommit(client, vicDir, tipHash, seen)
}

func uploadCommit(client *remote.Client, vicDir, hash string, seen map[string]bool) error {
	if hash == "" || seen[hash] {
		return nil
	}
	seen[hash] = true

	// Check whether the server already has this commit
	has, err := client.HasObject(hash)
	if err != nil {
		return fmt.Errorf("push: check commit %s: %w", hash[:8], err)
	}

	// Always walk parents even if the server has this commit —
	// an older commit might have been uploaded without its full subtree.
	c, err := commits.ReadCommit(vicDir, hash)
	if err != nil {
		return fmt.Errorf("push: read commit %s: %w", hash[:8], err)
	}

	// Upload parents first (bottom-up so server can verify ancestry)
	for _, p := range c.Parents {
		if err := uploadCommit(client, vicDir, p, seen); err != nil {
			return err
		}
	}

	// Upload the tree for this commit
	if err := uploadTree(client, vicDir, c.Tree, seen); err != nil {
		return err
	}

	// Upload the commit object itself
	if !has {
		if err := uploadObject(client, vicDir, hash); err != nil {
			return err
		}
	}
	return nil
}

func uploadTree(client *remote.Client, vicDir, hash string, seen map[string]bool) error {
	if hash == "" || seen[hash] {
		return nil
	}
	seen[hash] = true

	has, err := client.HasObject(hash)
	if err != nil {
		return fmt.Errorf("push: check tree %s: %w", hash[:8], err)
	}

	// Read tree entries so we can upload blobs and sub-trees
	treeEntries, err := trees.ReadTreeRecursive(vicDir, hash)
	if err != nil {
		return fmt.Errorf("push: read tree %s: %w", hash[:8], err)
	}

	// Upload all blobs referenced by this tree
	for _, entry := range treeEntries {
		if entry.Type == "blob" {
			if err := uploadBlob(client, vicDir, entry.Hash, seen); err != nil {
				return err
			}
		}
	}

	// Upload the tree object itself
	if !has {
		if err := uploadObject(client, vicDir, hash); err != nil {
			return err
		}
	}
	return nil
}

func uploadBlob(client *remote.Client, vicDir, hash string, seen map[string]bool) error {
	if hash == "" || seen[hash] {
		return nil
	}
	seen[hash] = true

	has, err := client.HasObject(hash)
	if err != nil {
		return fmt.Errorf("push: check blob %s: %w", hash[:8], err)
	}
	if has {
		return nil
	}
	return uploadObject(client, vicDir, hash)
}

// uploadObject reads the raw zlib bytes from disk and sends them as-is.
// The Java backend (VicObjectServiceImpl) decompresses them on arrival.
func uploadObject(client *remote.Client, vicDir, hash string) error {
	zlibData, err := objects.ReadObjectRaw(vicDir, hash)
	if err != nil {
		return fmt.Errorf("push: read raw object %s: %w", hash[:8], err)
	}
	if err := client.UploadObject(hash, zlibData); err != nil {
		return fmt.Errorf("push: upload object %s: %w", hash[:8], err)
	}
	return nil
}
