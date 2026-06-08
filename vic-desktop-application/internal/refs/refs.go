package refs

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// HeadRefPath returns the ref path that HEAD points to (e.g. "refs/heads/main").
// If HEAD is detached it returns the raw commit hash.
func HeadRefPath(vicDir string) (string, error) {
	data, err := os.ReadFile(filepath.Join(vicDir, "HEAD"))
	if err != nil {
		return "", fmt.Errorf("refs: read HEAD: %w", err)
	}
	val := strings.TrimSpace(string(data))
	if strings.HasPrefix(val, "ref: ") {
		return strings.TrimPrefix(val, "ref: "), nil
	}
	return val, nil // detached HEAD — returns hash directly
}

// HeadCommitHash resolves HEAD all the way to a commit hash.
func HeadCommitHash(vicDir string) (string, error) {
	ref, err := HeadRefPath(vicDir)
	if err != nil {
		return "", err
	}
	// Detached HEAD — ref is already the hash
	if len(ref) == 40 {
		return ref, nil
	}
	return ReadRef(vicDir, ref)
}

// ReadRef reads a ref file and returns its trimmed content.
// Returns "" without error if the ref file does not exist yet.
func ReadRef(vicDir, refPath string) (string, error) {
	p := filepath.Join(vicDir, filepath.FromSlash(refPath))
	data, err := os.ReadFile(p)
	if err != nil {
		if os.IsNotExist(err) {
			return "", nil
		}
		return "", fmt.Errorf("refs: read %s: %w", refPath, err)
	}
	return strings.TrimSpace(string(data)), nil
}

// WriteRef atomically writes hash to the ref file.
func WriteRef(vicDir, refPath, hash string) error {
	p := filepath.Join(vicDir, filepath.FromSlash(refPath))
	if err := os.MkdirAll(filepath.Dir(p), 0o755); err != nil {
		return fmt.Errorf("refs: mkdir for %s: %w", refPath, err)
	}
	return os.WriteFile(p, []byte(hash+"\n"), 0o644)
}

// SetHEADToRef updates HEAD to point to a symbolic ref.
func SetHEADToRef(vicDir, refPath string) error {
	return os.WriteFile(
		filepath.Join(vicDir, "HEAD"),
		[]byte("ref: "+refPath+"\n"),
		0o644,
	)
}

// SetHEADDetached puts HEAD into detached state pointing at hash.
func SetHEADDetached(vicDir, hash string) error {
	return os.WriteFile(
		filepath.Join(vicDir, "HEAD"),
		[]byte(hash+"\n"),
		0o644,
	)
}
