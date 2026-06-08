package app

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/elyasahmadi/vic/internal/commits"
	"github.com/elyasahmadi/vic/internal/index"
	"github.com/elyasahmadi/vic/internal/refs"
	"github.com/elyasahmadi/vic/internal/trees"
)

func TestStatusReportsDetachedHeadCommit(t *testing.T) {
	repoPath := t.TempDir()
	if _, err := InitRepository(repoPath); err != nil {
		t.Fatalf("init repository: %v", err)
	}

	if err := os.WriteFile(filepath.Join(repoPath, "note.txt"), []byte("first\n"), 0o644); err != nil {
		t.Fatalf("write first file: %v", err)
	}
	if err := AddFiles(repoPath, []string{"note.txt"}); err != nil {
		t.Fatalf("stage first file: %v", err)
	}
	firstHash := writeTestCommit(t, repoPath, "first")

	if err := os.WriteFile(filepath.Join(repoPath, "note.txt"), []byte("second\n"), 0o644); err != nil {
		t.Fatalf("write second file: %v", err)
	}
	if err := AddFiles(repoPath, []string{"note.txt"}); err != nil {
		t.Fatalf("stage second file: %v", err)
	}
	writeTestCommit(t, repoPath, "second")

	if err := Checkout(repoPath, firstHash); err != nil {
		t.Fatalf("checkout first commit: %v", err)
	}

	status, err := Status(repoPath)
	if err != nil {
		t.Fatalf("status: %v", err)
	}
	if !status.HasCommit {
		t.Fatal("expected detached checkout to report a commit")
	}
	if status.HeadHash != firstHash {
		t.Fatalf("expected HEAD hash %s, got %s", firstHash, status.HeadHash)
	}
	if !strings.Contains(status.Branch, firstHash[:8]) {
		t.Fatalf("expected detached branch label to include %s, got %q", firstHash[:8], status.Branch)
	}
}

func TestCheckoutBranchRewritesWorkingTree(t *testing.T) {
	repoPath := t.TempDir()
	if _, err := InitRepository(repoPath); err != nil {
		t.Fatalf("init repository: %v", err)
	}

	filePath := filepath.Join(repoPath, "note.txt")
	if err := os.WriteFile(filePath, []byte("main base\n"), 0o644); err != nil {
		t.Fatalf("write base file: %v", err)
	}
	if err := AddFiles(repoPath, []string{"note.txt"}); err != nil {
		t.Fatalf("stage base file: %v", err)
	}
	baseHash := writeTestCommit(t, repoPath, "base")

	_, vicDir, err := repoDirs(repoPath)
	if err != nil {
		t.Fatalf("repo dirs: %v", err)
	}
	if err := refs.WriteRef(vicDir, "refs/heads/feature", baseHash); err != nil {
		t.Fatalf("create feature ref: %v", err)
	}

	if err := os.WriteFile(filePath, []byte("main change\n"), 0o644); err != nil {
		t.Fatalf("write main change: %v", err)
	}
	if err := AddFiles(repoPath, []string{"note.txt"}); err != nil {
		t.Fatalf("stage main change: %v", err)
	}
	writeTestCommit(t, repoPath, "main change")

	if err := Checkout(repoPath, "feature"); err != nil {
		t.Fatalf("checkout feature: %v", err)
	}
	content, err := os.ReadFile(filePath)
	if err != nil {
		t.Fatalf("read feature file: %v", err)
	}
	if string(content) != "main base\n" {
		t.Fatalf("expected feature content, got %q", string(content))
	}

	if err := Checkout(repoPath, "main"); err != nil {
		t.Fatalf("checkout main: %v", err)
	}
	content, err = os.ReadFile(filePath)
	if err != nil {
		t.Fatalf("read main file: %v", err)
	}
	if string(content) != "main change\n" {
		t.Fatalf("expected main content, got %q", string(content))
	}
}

func writeTestCommit(t *testing.T, repoPath, message string) string {
	t.Helper()

	_, vicDir, err := repoDirs(repoPath)
	if err != nil {
		t.Fatalf("repo dirs: %v", err)
	}
	idx, err := index.Load(vicDir)
	if err != nil {
		t.Fatalf("load index: %v", err)
	}
	treeHash, err := trees.WriteTreeFromIndex(vicDir, idx)
	if err != nil {
		t.Fatalf("write tree: %v", err)
	}
	parentHash, err := refs.HeadCommitHash(vicDir)
	if err != nil {
		t.Fatalf("read parent: %v", err)
	}
	parents := []string{}
	if parentHash != "" {
		parents = append(parents, parentHash)
	}
	commitHash, err := commits.WriteCommit(vicDir, commits.CommitInput{
		TreeHash: treeHash,
		Parents:  parents,
		Message:  message,
		Author:   "Test User",
		Email:    "test@example.com",
	})
	if err != nil {
		t.Fatalf("write commit: %v", err)
	}
	headRef, err := refs.HeadRefPath(vicDir)
	if err != nil {
		t.Fatalf("head ref: %v", err)
	}
	if err := refs.WriteRef(vicDir, headRef, commitHash); err != nil {
		t.Fatalf("update head ref: %v", err)
	}
	return commitHash
}
