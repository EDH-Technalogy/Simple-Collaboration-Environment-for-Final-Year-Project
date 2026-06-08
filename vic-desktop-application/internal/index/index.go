package index

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

// Entry is one staged file in the index.
type Entry struct {
	Path string `json:"path"` // always forward-slash relative to repo root
	Mode string `json:"mode"` // "100644" | "100755"
	Hash string `json:"hash"` // SHA-1 of the blob
}

// Index is the staging area stored as JSON at .vic/index.
type Index struct {
	Version int     `json:"version"`
	Entries []Entry `json:"entries"`
}

// Load reads the index from .vic/index. Returns an empty index if absent.
func Load(vicDir string) (*Index, error) {
	p := filepath.Join(vicDir, "index")
	data, err := os.ReadFile(p)
	if err != nil {
		if os.IsNotExist(err) {
			return &Index{Version: 1, Entries: []Entry{}}, nil
		}
		return nil, fmt.Errorf("index: read: %w", err)
	}
	if len(data) == 0 {
		return &Index{Version: 1, Entries: []Entry{}}, nil
	}
	var idx Index
	if err := json.Unmarshal(data, &idx); err != nil {
		return nil, fmt.Errorf("index: parse: %w", err)
	}
	if idx.Version == 0 {
		idx.Version = 1
	}
	return &idx, nil
}

// Save writes the index to .vic/index.
func (idx *Index) Save(vicDir string) error {
	data, err := json.MarshalIndent(idx, "", "  ")
	if err != nil {
		return fmt.Errorf("index: marshal: %w", err)
	}
	return os.WriteFile(filepath.Join(vicDir, "index"), data, 0o644)
}

// Upsert adds or replaces an entry by path.
func (idx *Index) Upsert(e Entry) {
	for i := range idx.Entries {
		if idx.Entries[i].Path == e.Path {
			idx.Entries[i] = e
			return
		}
	}
	idx.Entries = append(idx.Entries, e)
}

// Remove removes an entry by path.
func (idx *Index) Remove(path string) {
	out := idx.Entries[:0]
	for _, e := range idx.Entries {
		if e.Path != path {
			out = append(out, e)
		}
	}
	idx.Entries = out
}

// Map returns a path→Entry map for fast lookups.
func (idx *Index) Map() map[string]Entry {
	m := make(map[string]Entry, len(idx.Entries))
	for _, e := range idx.Entries {
		m[e.Path] = e
	}
	return m
}
