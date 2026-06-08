package commits

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/elyasahmadi/vic/internal/objects"
)

// CommitInput holds all data needed to create a commit object.
type CommitInput struct {
	TreeHash string
	Parents  []string
	Message  string
	Author   string // optional; defaults to env
	Email    string // optional; defaults to env
	Time     time.Time
}

// WriteCommit creates a commit object and returns its SHA-1.
func WriteCommit(vicDir string, in CommitInput) (string, error) {
	if in.TreeHash == "" {
		return "", fmt.Errorf("commits: missing tree hash")
	}
	if strings.TrimSpace(in.Message) == "" {
		return "", fmt.Errorf("commits: empty commit message")
	}
	if in.Time.IsZero() {
		in.Time = time.Now()
	}

	name, email := defaultAuthor()
	if in.Author != "" {
		name = in.Author
	}
	if in.Email != "" {
		email = in.Email
	}

	ts := in.Time.Unix()
	var b strings.Builder
	fmt.Fprintf(&b, "tree %s\n", in.TreeHash)
	for _, p := range in.Parents {
		p = strings.TrimSpace(p)
		if p != "" {
			fmt.Fprintf(&b, "parent %s\n", p)
		}
	}
	fmt.Fprintf(&b, "author %s <%s> %d\n", name, email, ts)
	fmt.Fprintf(&b, "committer %s <%s> %d\n", name, email, ts)
	b.WriteString("\n")
	b.WriteString(strings.TrimRight(in.Message, "\n"))
	b.WriteString("\n")

	return objects.WriteObject(vicDir, "commit", []byte(b.String()))
}

// ─────────────────────────────────────────────────────────────────────────────
// Commit reader
// ─────────────────────────────────────────────────────────────────────────────

// Commit holds a parsed commit object.
type Commit struct {
	Hash    string
	Tree    string
	Parents []string
	Author  string
	Message string
}

// ReadCommit parses a commit from the object store.
func ReadCommit(vicDir, hash string) (*Commit, error) {
	obj, err := objects.ReadObject(vicDir, hash)
	if err != nil {
		return nil, err
	}
	if obj.Type != "commit" {
		return nil, fmt.Errorf("commits: object %s is type %s, not commit", hash, obj.Type)
	}

	text := string(obj.Content)
	c := &Commit{
		Hash:    hash,
		Tree:    headerValue(text, "tree"),
		Parents: headerValues(text, "parent"),
		Author:  headerValue(text, "author"),
		Message: commitMessage(text),
	}
	if c.Tree == "" {
		return nil, fmt.Errorf("commits: commit %s has no tree", hash)
	}
	return c, nil
}

func headerValue(text, key string) string {
	vals := headerValues(text, key)
	if len(vals) == 0 {
		return ""
	}
	return vals[0]
}

func headerValues(text, key string) []string {
	prefix := key + " "
	var out []string
	for _, ln := range strings.Split(text, "\n") {
		if strings.TrimSpace(ln) == "" {
			break
		}
		if strings.HasPrefix(ln, prefix) {
			out = append(out, strings.TrimSpace(strings.TrimPrefix(ln, prefix)))
		}
	}
	return out
}

func commitMessage(text string) string {
	parts := strings.SplitN(text, "\n\n", 2)
	if len(parts) < 2 {
		return ""
	}
	return strings.TrimSpace(parts[1])
}

// ─────────────────────────────────────────────────────────────────────────────
// Graph utilities
// ─────────────────────────────────────────────────────────────────────────────

// IsAncestor returns true if ancestor is reachable from descendant (or equal).
func IsAncestor(vicDir, ancestor, descendant string) (bool, error) {
	if ancestor == "" || descendant == "" {
		return false, nil
	}
	if ancestor == descendant {
		return true, nil
	}
	seen := map[string]bool{}
	queue := []string{descendant}
	for len(queue) > 0 {
		cur := queue[0]
		queue = queue[1:]
		if cur == "" || seen[cur] {
			continue
		}
		seen[cur] = true
		if cur == ancestor {
			return true, nil
		}
		c, err := ReadCommit(vicDir, cur)
		if err != nil {
			return false, err
		}
		queue = append(queue, c.Parents...)
	}
	return false, nil
}

// MergeBase finds the best common ancestor of commits a and b.
func MergeBase(vicDir, a, b string) (string, error) {
	if a == "" || b == "" {
		return "", fmt.Errorf("commits: merge-base: empty commit id")
	}

	ancA, err := ancestorSet(vicDir, a)
	if err != nil {
		return "", err
	}

	queue := []string{b}
	seen := map[string]bool{}
	for len(queue) > 0 {
		cur := queue[0]
		queue = queue[1:]
		if cur == "" || seen[cur] {
			continue
		}
		seen[cur] = true
		if ancA[cur] {
			return cur, nil
		}
		c, err := ReadCommit(vicDir, cur)
		if err != nil {
			return "", err
		}
		queue = append(queue, c.Parents...)
	}
	return "", fmt.Errorf("commits: no merge base found between %s and %s", a[:8], b[:8])
}

func ancestorSet(vicDir, start string) (map[string]bool, error) {
	out := map[string]bool{}
	queue := []string{start}
	for len(queue) > 0 {
		cur := queue[0]
		queue = queue[1:]
		if cur == "" || out[cur] {
			continue
		}
		out[cur] = true
		c, err := ReadCommit(vicDir, cur)
		if err != nil {
			return nil, err
		}
		queue = append(queue, c.Parents...)
	}
	return out, nil
}

// ─────────────────────────────────────────────────────────────────────────────

func defaultAuthor() (string, string) {
	name := os.Getenv("VIC_AUTHOR_NAME")
	if name == "" {
		name = os.Getenv("USERNAME")
	}
	if name == "" {
		name = os.Getenv("USER")
	}
	if name == "" {
		name = "unknown"
	}
	email := os.Getenv("VIC_AUTHOR_EMAIL")
	if email == "" {
		email = "unknown@example.com"
	}
	return name, email
}
