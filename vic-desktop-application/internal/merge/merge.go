package merge

import (
	"fmt"
	"path/filepath"
	"sort"
	"strings"
	"unicode/utf8"

	"github.com/elyasahmadi/vic/internal/objects"
	"github.com/elyasahmadi/vic/internal/trees"
)

// Result holds the output of a three-way merge.
type Result struct {
	Merged          map[string]trees.Entry
	Conflicts       []string
	BinaryConflicts []string
}

// MergeTrees performs a three-way merge of base, ours, and theirs.
// Text conflicts get inline conflict markers.
// Binary conflicts do NOT get conflict markers because that would corrupt files
// like .docx, .xlsx, .pptx, images, PDFs, zips, etc.
func MergeTrees(vicDir string, base, ours, theirs map[string]trees.Entry) (*Result, error) {
	allPaths := unionPaths(base, ours, theirs)
	result := &Result{Merged: map[string]trees.Entry{}}

	for _, path := range allPaths {
		baseEntry, inBase := base[path]
		ourEntry, inOurs := ours[path]
		theirEntry, inTheirs := theirs[path]

		baseHash := ""
		if inBase {
			baseHash = baseEntry.Hash
		}

		ourHash := ""
		if inOurs {
			ourHash = ourEntry.Hash
		}

		theirHash := ""
		if inTheirs {
			theirHash = theirEntry.Hash
		}

		switch {
		case ourHash == theirHash:
			// Both sides agree, including both deleted.
			if inOurs {
				result.Merged[path] = ourEntry
			}

		case ourHash == baseHash:
			// Only theirs changed.
			if inTheirs {
				result.Merged[path] = theirEntry
			}

		case theirHash == baseHash:
			// Only ours changed.
			if inOurs {
				result.Merged[path] = ourEntry
			}

		default:
			// Both sides changed differently.
			if IsBinaryConflictPath(path, vicDir, ourHash, theirHash) {
				// Never write conflict markers into binary files.
				// Keep ours in working tree as a safe placeholder.
				// User can resolve later by choosing ours/theirs or using web UI.
				if inOurs {
					result.Merged[path] = ourEntry
				} else if inTheirs {
					result.Merged[path] = theirEntry
				}

				result.Conflicts = append(result.Conflicts, path)
				result.BinaryConflicts = append(result.BinaryConflicts, path)
				continue
			}

			entry, err := writeConflictBlob(vicDir, path, ourHash, theirHash)
			if err != nil {
				return nil, err
			}

			result.Merged[path] = entry
			result.Conflicts = append(result.Conflicts, path)
		}
	}

	sort.Strings(result.Conflicts)
	sort.Strings(result.BinaryConflicts)

	return result, nil
}

func writeConflictBlob(vicDir, path, ourHash, theirHash string) (trees.Entry, error) {
	ourContent := readContent(vicDir, ourHash)
	theirContent := readContent(vicDir, theirHash)

	var b strings.Builder
	fmt.Fprintf(
		&b,
		"<<<<<<< ours\n%s\n=======\n%s\n>>>>>>> theirs\n",
		ourContent,
		theirContent,
	)

	hash, err := objects.WriteObject(vicDir, "blob", []byte(b.String()))
	if err != nil {
		return trees.Entry{}, err
	}

	return trees.Entry{
		Mode: "100644",
		Type: "blob",
		Hash: hash,
		Name: filepath.Base(path),
	}, nil
}
func readContent(vicDir, hash string) string {
	if hash == "" {
		return ""
	}

	obj, err := objects.ReadObject(vicDir, hash)
	if err != nil {
		return ""
	}

	return string(obj.Content)
}

func IsBinaryConflictPath(path, vicDir, ourHash, theirHash string) bool {
	if IsBinaryPath(path) {
		return true
	}

	if isBinaryObject(vicDir, ourHash) || isBinaryObject(vicDir, theirHash) {
		return true
	}

	return false
}

func IsBinaryPath(path string) bool {
	ext := strings.ToLower(filepath.Ext(path))

	switch ext {
	case ".doc", ".docx",
		".xls", ".xlsx",
		".ppt", ".pptx",
		".pdf",
		".zip", ".rar", ".7z", ".tar", ".gz",
		".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".ico",
		".mp3", ".wav", ".mp4", ".mov", ".avi",
		".exe", ".dll", ".so", ".class", ".jar":
		return true
	default:
		return false
	}
}

func isBinaryObject(vicDir, hash string) bool {
	if hash == "" {
		return false
	}

	obj, err := objects.ReadObject(vicDir, hash)
	if err != nil {
		return false
	}

	content := obj.Content

	if len(content) == 0 {
		return false
	}

	// Null byte is a strong binary signal.
	if strings.Contains(string(content), "\x00") {
		return true
	}

	// If it is not valid UTF-8, treat it as binary.
	if !utf8.Valid(content) {
		return true
	}

	return false
}

func unionPaths(maps ...map[string]trees.Entry) []string {
	seen := map[string]bool{}

	for _, m := range maps {
		for p := range m {
			seen[p] = true
		}
	}

	paths := make([]string, 0, len(seen))
	for p := range seen {
		paths = append(paths, p)
	}

	sort.Strings(paths)

	return paths
}
