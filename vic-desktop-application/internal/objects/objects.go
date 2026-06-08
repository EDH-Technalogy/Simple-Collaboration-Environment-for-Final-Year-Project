package objects

import (
	"bytes"
	"compress/zlib"
	"crypto/sha1"
	"encoding/hex"
	"fmt"
	"io"
	"os"
	"path/filepath"
)

// Object is a decoded object from the store.
type Object struct {
	Type    string // "blob", "tree", "commit", "tag"
	Content []byte
}

// HashObject computes the SHA-1 of the canonical object bytes without writing.
// Matches Git's object hashing exactly.
func HashObject(typ string, data []byte) (string, error) {
	return hex.EncodeToString(rawSHA1(typ, data)), nil
}

// WriteObject stores an object and returns its 40-char hex SHA-1.
// If the object already exists it is a no-op (content-addressed deduplication).
func WriteObject(vicDir, typ string, data []byte) (string, error) {
	hash := hex.EncodeToString(rawSHA1(typ, data))
	path := objectPath(vicDir, hash)
	if _, err := os.Stat(path); err == nil {
		return hash, nil // already stored
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return "", fmt.Errorf("objects: mkdir: %w", err)
	}
	raw := makeRaw(typ, data)
	var buf bytes.Buffer
	w := zlib.NewWriter(&buf)
	if _, err := w.Write(raw); err != nil {
		return "", fmt.Errorf("objects: zlib write: %w", err)
	}
	if err := w.Close(); err != nil {
		return "", fmt.Errorf("objects: zlib close: %w", err)
	}
	if err := os.WriteFile(path, buf.Bytes(), 0o444); err != nil {
		return "", fmt.Errorf("objects: write file: %w", err)
	}
	return hash, nil
}

// WriteRawObject writes pre-zlib-compressed bytes received from the server
// directly to the object store without re-compressing.
func WriteRawObject(vicDir, hash string, zlibData []byte) error {
	path := objectPath(vicDir, hash)
	if _, err := os.Stat(path); err == nil {
		return nil // already have it
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return fmt.Errorf("objects: mkdir for raw: %w", err)
	}
	return os.WriteFile(path, zlibData, 0o444)
}

// ReadObject decompresses and parses an object from the store.
func ReadObject(vicDir, hash string) (*Object, error) {
	path := objectPath(vicDir, hash)
	zlibData, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, fmt.Errorf("objects: object %s not found", hash)
		}
		return nil, fmt.Errorf("objects: read %s: %w", hash, err)
	}
	return decodeZlib(hash, zlibData)
}

// ReadObjectRaw returns the raw zlib-compressed bytes as stored on disk.
// Used by push to upload objects to the server exactly as stored locally.
func ReadObjectRaw(vicDir, hash string) ([]byte, error) {
	path := objectPath(vicDir, hash)
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("objects: read raw %s: %w", hash, err)
	}
	return data, nil
}

// HasObject reports whether an object exists locally.
func HasObject(vicDir, hash string) bool {
	_, err := os.Stat(objectPath(vicDir, hash))
	return err == nil
}

// ─────────────────────────────────────────────────────────────────────────────

func decodeZlib(hash string, zlibData []byte) (*Object, error) {
	r, err := zlib.NewReader(bytes.NewReader(zlibData))
	if err != nil {
		return nil, fmt.Errorf("objects: decompress %s: %w", hash, err)
	}
	defer r.Close()
	raw, err := io.ReadAll(r)
	if err != nil {
		return nil, fmt.Errorf("objects: read decompressed %s: %w", hash, err)
	}
	return parseRaw(hash, raw)
}

func parseRaw(hash string, raw []byte) (*Object, error) {
	nul := bytes.IndexByte(raw, 0)
	if nul < 0 {
		return nil, fmt.Errorf("objects: corrupt object %s (no null byte)", hash)
	}
	header := string(raw[:nul])
	var typ string
	var size int
	if _, err := fmt.Sscanf(header, "%s %d", &typ, &size); err != nil {
		return nil, fmt.Errorf("objects: bad header %q in %s: %w", header, hash, err)
	}
	content := raw[nul+1:]
	if len(content) != size {
		return nil, fmt.Errorf("objects: size mismatch in %s: header says %d, got %d", hash, size, len(content))
	}
	return &Object{Type: typ, Content: content}, nil
}

func makeRaw(typ string, data []byte) []byte {
	header := fmt.Sprintf("%s %d\x00", typ, len(data))
	raw := make([]byte, len(header)+len(data))
	copy(raw, header)
	copy(raw[len(header):], data)
	return raw
}

func rawSHA1(typ string, data []byte) []byte {
	h := sha1.New()
	h.Write(makeRaw(typ, data))
	return h.Sum(nil)
}

func objectPath(vicDir, hash string) string {
	return filepath.Join(vicDir, "objects", hash[:2], hash[2:])
}
