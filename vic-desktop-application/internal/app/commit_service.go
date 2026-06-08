package app

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/elyasahmadi/vic/internal/commits"
	"github.com/elyasahmadi/vic/internal/index"
	"github.com/elyasahmadi/vic/internal/refs"
	"github.com/elyasahmadi/vic/internal/session"
	"github.com/elyasahmadi/vic/internal/trees"
)

type CommitResult struct {
	Hash        string `json:"hash"`
	ShortHash   string `json:"shortHash"`
	Branch      string `json:"branch"`
	Message     string `json:"message"`
	StagedCount int    `json:"stagedCount"`
}

type CommitHistoryEntry struct {
	Hash      string   `json:"hash"`
	ShortHash string   `json:"shortHash"`
	Parents   []string `json:"parents"`
	Author    string   `json:"author"`
	Date      string   `json:"date"`
	Message   string   `json:"message"`
	Subject   string   `json:"subject"`
}

func Commit(repoPath string, message string) (*CommitResult, error) {
	message = strings.TrimSpace(message)
	if message == "" {
		return nil, fmt.Errorf("commit message is required")
	}
	_, vicDir, err := repoDirs(repoPath)
	if err != nil {
		return nil, err
	}
	idx, err := index.Load(vicDir)
	if err != nil {
		return nil, err
	}
	if len(idx.Entries) == 0 {
		return nil, fmt.Errorf("nothing to commit (index is empty; use vic add first)")
	}
	treeHash, err := trees.WriteTreeFromIndex(vicDir, idx)
	if err != nil {
		return nil, err
	}
	headRef, err := refs.HeadRefPath(vicDir)
	if err != nil {
		return nil, err
	}
	parentHash, err := refs.ReadRef(vicDir, headRef)
	if err != nil {
		return nil, err
	}
	parents := []string{}
	if parentHash != "" {
		parents = append(parents, parentHash)
	}
	if data, err := os.ReadFile(filepath.Join(vicDir, "MERGE_HEAD")); err == nil {
		if mergeParent := strings.TrimSpace(string(data)); mergeParent != "" {
			parents = append(parents, mergeParent)
		}
	}
	user, ok, err := session.CurrentUser(vicDir)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, fmt.Errorf("not logged in; run: vic auth login <server-url>")
	}
	authorName := user.UserName
	if user.FirstName != "" || user.LastName != "" {
		authorName = strings.TrimSpace(user.FirstName + " " + user.LastName)
	}
	commitHash, err := commits.WriteCommit(vicDir, commits.CommitInput{
		TreeHash: treeHash,
		Parents:  parents,
		Message:  message,
		Author:   authorName,
		Email:    user.Email,
	})
	if err != nil {
		return nil, err
	}
	if err := refs.WriteRef(vicDir, headRef, commitHash); err != nil {
		return nil, err
	}
	_ = os.Remove(filepath.Join(vicDir, "MERGE_HEAD"))
	_ = os.Remove(filepath.Join(vicDir, "MERGE_MSG"))

	shortMessage := message
	if len(shortMessage) > 72 {
		shortMessage = shortMessage[:72] + "..."
	}
	return &CommitResult{
		Hash:        commitHash,
		ShortHash:   commitHash[:8],
		Branch:      shortBranchName(headRef),
		Message:     shortMessage,
		StagedCount: len(idx.Entries),
	}, nil
}

func Log(repoPath string) ([]CommitHistoryEntry, error) {
	_, vicDir, err := repoDirs(repoPath)
	if err != nil {
		return nil, err
	}
	hash, err := refs.HeadCommitHash(vicDir)
	if err != nil {
		return nil, err
	}
	entries := []CommitHistoryEntry{}
	for hash != "" {
		c, err := commits.ReadCommit(vicDir, hash)
		if err != nil {
			return nil, err
		}
		entries = append(entries, CommitHistoryEntry{
			Hash:      c.Hash,
			ShortHash: shortHash(c.Hash),
			Parents:   c.Parents,
			Author:    c.Author,
			Date:      authorDate(c.Author),
			Message:   strings.TrimSpace(c.Message),
			Subject:   firstCommitLine(c.Message),
		})
		if len(c.Parents) == 0 {
			break
		}
		hash = c.Parents[0]
	}
	return entries, nil
}

func shortHash(hash string) string {
	if len(hash) > 8 {
		return hash[:8]
	}
	return hash
}

func firstCommitLine(message string) string {
	message = strings.TrimSpace(message)
	if i := strings.IndexByte(message, '\n'); i >= 0 {
		return strings.TrimSpace(message[:i])
	}
	return message
}

func authorDate(authorLine string) string {
	fields := strings.Fields(authorLine)
	if len(fields) == 0 {
		return ""
	}
	var sec int64
	if _, err := fmt.Sscanf(fields[len(fields)-1], "%d", &sec); err != nil {
		return ""
	}
	return time.Unix(sec, 0).Format("2006-01-02 15:04")
}
