package trees

import (
	"fmt"
	"path/filepath"
	"sort"
	"strings"

	"github.com/elyasahmadi/vic/internal/index"
	"github.com/elyasahmadi/vic/internal/objects"
)

// Entry is one line in a tree object.
type Entry struct {
	Mode string // "100644", "100755", "040000"
	Type string // "blob" | "tree"
	Hash string // SHA-1
	Name string // leaf filename (no slashes)
}

// WriteTreeFromIndex builds a root tree from the current index and stores all
// intermediate tree objects. Returns the root tree SHA-1.
func WriteTreeFromIndex(vicDir string, idx *index.Index) (string, error) {
	root := &treeNode{children: map[string]*treeNode{}}
	for _, e := range idx.Entries {
		parts := strings.Split(e.Path, "/")
		root.insert(parts, e.Mode, e.Hash)
	}
	return root.write(vicDir)
}

// ReadTreeRecursive returns a flat map of path → Entry for every blob reachable
// from the given tree hash.
func ReadTreeRecursive(vicDir, treeHash string) (map[string]Entry, error) {
	result := map[string]Entry{}
	if err := readRecurse(vicDir, treeHash, "", result); err != nil {
		return nil, err
	}
	return result, nil
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal tree builder
// ─────────────────────────────────────────────────────────────────────────────

type treeNode struct {
	// leaf fields (set when this node IS a blob)
	mode     string
	blobHash string
	// directory fields
	children map[string]*treeNode
}

func (n *treeNode) insert(parts []string, mode, hash string) {
	if len(parts) == 1 {
		n.children[parts[0]] = &treeNode{mode: mode, blobHash: hash}
		return
	}
	child, ok := n.children[parts[0]]
	if !ok {
		child = &treeNode{children: map[string]*treeNode{}}
		n.children[parts[0]] = child
	}
	child.insert(parts[1:], mode, hash)
}

func (n *treeNode) write(vicDir string) (string, error) {
	if n.blobHash != "" {
		// leaf — already stored as a blob
		return n.blobHash, nil
	}

	// Sort children names for deterministic hashing (same as Git)
	names := make([]string, 0, len(n.children))
	for name := range n.children {
		names = append(names, name)
	}
	sort.Strings(names)

	var lines []string
	for _, name := range names {
		child := n.children[name]
		var mode, typ, hash string

		if child.blobHash != "" {
			// file entry
			mode = child.mode
			if mode == "" {
				mode = "100644"
			}
			typ = "blob"
			hash = child.blobHash
		} else {
			// sub-tree — recurse
			mode = "040000"
			typ = "tree"
			var err error
			hash, err = child.write(vicDir)
			if err != nil {
				return "", err
			}
		}
		// TSV format: mode \t type \t hash \t name
		lines = append(lines, fmt.Sprintf("%s\t%s\t%s\t%s", mode, typ, hash, name))
	}

	content := strings.Join(lines, "\n")
	return objects.WriteObject(vicDir, "tree", []byte(content))
}

// ─────────────────────────────────────────────────────────────────────────────
// Recursive tree reader
// ─────────────────────────────────────────────────────────────────────────────

func readRecurse(vicDir, hash, prefix string, out map[string]Entry) error {
	obj, err := objects.ReadObject(vicDir, hash)
	if err != nil {
		return err
	}
	if obj.Type != "tree" {
		return fmt.Errorf("trees: object %s is not a tree (got %s)", hash, obj.Type)
	}

	for _, ln := range splitLines(string(obj.Content)) {
		mode, typ, entryHash, name, err := parseLine(ln)
		if err != nil {
			return err
		}

		path := name
		if prefix != "" {
			path = prefix + "/" + name
		}

		switch typ {
		case "tree":
			if err := readRecurse(vicDir, entryHash, path, out); err != nil {
				return err
			}
		case "blob":
			out[path] = Entry{Mode: mode, Type: typ, Hash: entryHash, Name: name}
		default:
			return fmt.Errorf("trees: unknown entry type %q in %s", typ, hash)
		}
	}
	return nil
}

func parseLine(ln string) (mode, typ, hash, name string, err error) {
	parts := strings.SplitN(ln, "\t", 4)
	if len(parts) != 4 {
		return "", "", "", "", fmt.Errorf("trees: invalid tree line %q", ln)
	}
	return parts[0], parts[1], parts[2], parts[3], nil
}

func splitLines(s string) []string {
	var out []string
	for _, ln := range strings.Split(s, "\n") {
		if strings.TrimSpace(ln) != "" {
			out = append(out, ln)
		}
	}
	return out
}

// ToIndexEntries converts a flat tree map back to index entries.
func ToIndexEntries(tree map[string]Entry) []index.Entry {
	out := make([]index.Entry, 0, len(tree))
	for path, e := range tree {
		if e.Type == "blob" {
			out = append(out, index.Entry{
				Path: filepath.ToSlash(path),
				Mode: e.Mode,
				Hash: e.Hash,
			})
		}
	}
	return out
}
