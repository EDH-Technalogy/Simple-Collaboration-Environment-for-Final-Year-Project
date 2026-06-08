// Package clone downloads all objects reachable from a commit hash
// from the remote server and stores them in the local object store.
package clone

import (
	"fmt"
	"strings"

	"github.com/elyasahmadi/vic/internal/objects"
	"github.com/elyasahmadi/vic/internal/remote"
)

// DownloadReachableObjects recursively downloads every object (commit, tree,
// blob) reachable from commitHash that is not already present locally.
func DownloadReachableObjects(client *remote.Client, vicDir, commitHash string) error {
	seen := map[string]bool{}
	return downloadCommit(client, vicDir, commitHash, seen)
}

func downloadCommit(client *remote.Client, vicDir, hash string, seen map[string]bool) error {
	if hash == "" || seen[hash] {
		return nil
	}
	seen[hash] = true

	if objects.HasObject(vicDir, hash) {
		return nil
	}

	if err := downloadAndStore(client, vicDir, hash); err != nil {
		return err
	}

	obj, err := objects.ReadObject(vicDir, hash)
	if err != nil {
		return fmt.Errorf("clone: read commit %s after download: %w", hash[:8], err)
	}
	if obj.Type != "commit" {
		return fmt.Errorf("clone: expected commit at %s, got %s", hash[:8], obj.Type)
	}

	treeHash, parentHashes := parseCommitObject(string(obj.Content))

	if err := downloadTree(client, vicDir, treeHash, seen); err != nil {
		return err
	}

	for _, p := range parentHashes {
		if err := downloadCommit(client, vicDir, p, seen); err != nil {
			return err
		}
	}
	return nil
}

func downloadTree(client *remote.Client, vicDir, hash string, seen map[string]bool) error {
	if hash == "" || seen[hash] {
		return nil
	}
	seen[hash] = true

	if objects.HasObject(vicDir, hash) {
		return nil
	}

	if err := downloadAndStore(client, vicDir, hash); err != nil {
		return err
	}

	obj, err := objects.ReadObject(vicDir, hash)
	if err != nil {
		return fmt.Errorf("clone: read tree %s: %w", hash[:8], err)
	}
	if obj.Type != "tree" {
		return fmt.Errorf("clone: expected tree at %s, got %s", hash[:8], obj.Type)
	}

	for _, ln := range nonEmptyLines(string(obj.Content)) {
		_, typ, entryHash, _, err := parseTreeLine(ln)
		if err != nil {
			return err
		}
		switch typ {
		case "tree":
			if err := downloadTree(client, vicDir, entryHash, seen); err != nil {
				return err
			}
		case "blob":
			if seen[entryHash] || objects.HasObject(vicDir, entryHash) {
				seen[entryHash] = true
				continue
			}
			seen[entryHash] = true
			if err := downloadAndStore(client, vicDir, entryHash); err != nil {
				return err
			}
		default:
			return fmt.Errorf("clone: unknown tree entry type %q", typ)
		}
	}
	return nil
}

func downloadAndStore(client *remote.Client, vicDir, hash string) error {
	zlibData, err := client.DownloadObject(hash)
	if err != nil {
		return fmt.Errorf("clone: download %s: %w", hash[:8], err)
	}
	return objects.WriteRawObject(vicDir, hash, zlibData)
}

func parseCommitObject(content string) (treeHash string, parents []string) {
	for _, ln := range strings.Split(content, "\n") {
		if strings.TrimSpace(ln) == "" {
			break
		}
		if strings.HasPrefix(ln, "tree ") {
			treeHash = strings.TrimSpace(strings.TrimPrefix(ln, "tree "))
		} else if strings.HasPrefix(ln, "parent ") {
			parents = append(parents, strings.TrimSpace(strings.TrimPrefix(ln, "parent ")))
		}
	}
	return
}

func parseTreeLine(ln string) (mode, typ, hash, name string, err error) {
	parts := strings.SplitN(ln, "\t", 4)
	if len(parts) != 4 {
		return "", "", "", "", fmt.Errorf("clone: invalid tree line %q", ln)
	}
	return parts[0], parts[1], parts[2], parts[3], nil
}

func nonEmptyLines(s string) []string {
	var out []string
	for _, ln := range strings.Split(s, "\n") {
		if strings.TrimSpace(ln) != "" {
			out = append(out, ln)
		}
	}
	return out
}
