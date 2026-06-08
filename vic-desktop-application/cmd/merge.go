package cmd

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/elyasahmadi/vic/internal/commits"
	"github.com/elyasahmadi/vic/internal/index"
	"github.com/elyasahmadi/vic/internal/merge"
	"github.com/elyasahmadi/vic/internal/objects"
	"github.com/elyasahmadi/vic/internal/refs"
	"github.com/elyasahmadi/vic/internal/repo"
	"github.com/elyasahmadi/vic/internal/trees"
	"github.com/elyasahmadi/vic/internal/worktree"
	"github.com/spf13/cobra"
)

var (
	mergeAbort    bool
	mergeContinue bool
)

var mergeCmd = &cobra.Command{
	Use:   "merge <branch>",
	Short: "Merge another branch into the current branch",
	Args: func(cmd *cobra.Command, args []string) error {
		if mergeAbort || mergeContinue {
			if len(args) != 0 {
				return fmt.Errorf("merge --abort/--continue does not accept branch argument")
			}
			return nil
		}
		if len(args) != 1 {
			return fmt.Errorf("merge requires a branch")
		}
		return nil
	},
	RunE: func(cmd *cobra.Command, args []string) error {
		targetBranch := strings.TrimSpace(args[0])

		wd, err := os.Getwd()
		if err != nil {
			return err
		}

		root, err := repo.FindRepoRoot(wd)
		if err != nil {
			return err
		}

		vicDir := filepath.Join(root, ".vic")

		if mergeAbort {
			return abortMerge(root, vicDir)
		}

		if mergeContinue {
			return continueMerge(root, vicDir)
		}

		headRef, err := refs.HeadRefPath(vicDir)
		if err != nil {
			return err
		}

		oursHash, err := refs.ReadRef(vicDir, headRef)
		if err != nil {
			return err
		}
		if oursHash == "" {
			return fmt.Errorf("current branch has no commits yet")
		}

		theirsHash, err := refs.ReadRef(vicDir, "refs/heads/"+targetBranch)
		if err != nil {
			return err
		}
		if theirsHash == "" && strings.Contains(targetBranch, "/") {
			theirsHash, err = refs.ReadRef(vicDir, "refs/remotes/"+targetBranch)
			if err != nil {
				return err
			}
		}

		if theirsHash == "" {
			return fmt.Errorf("branch %q not found or has no commits", targetBranch)
		}

		// Already up to date
		upToDate, err := commits.IsAncestor(vicDir, theirsHash, oursHash)
		if err != nil {
			return err
		}
		if upToDate {
			fmt.Println("Already up to date.")
			return nil
		}

		// Fast-forward
		canFF, err := commits.IsAncestor(vicDir, oursHash, theirsHash)
		if err != nil {
			return err
		}
		if canFF {
			if err := refs.WriteRef(vicDir, headRef, theirsHash); err != nil {
				return err
			}

			if err := worktree.CheckoutCommit(root, vicDir, theirsHash); err != nil {
				return err
			}

			fmt.Printf("Fast-forward. Updated to %s.\n", theirsHash[:8])
			return nil
		}

		// Three-way merge
		baseHash, err := commits.MergeBase(vicDir, oursHash, theirsHash)
		if err != nil {
			return err
		}

		oursCommit, err := commits.ReadCommit(vicDir, oursHash)
		if err != nil {
			return err
		}

		theirsCommit, err := commits.ReadCommit(vicDir, theirsHash)
		if err != nil {
			return err
		}

		baseCommit, err := commits.ReadCommit(vicDir, baseHash)
		if err != nil {
			return err
		}

		baseTree, err := trees.ReadTreeRecursive(vicDir, baseCommit.Tree)
		if err != nil {
			return err
		}

		oursTree, err := trees.ReadTreeRecursive(vicDir, oursCommit.Tree)
		if err != nil {
			return err
		}

		theirsTree, err := trees.ReadTreeRecursive(vicDir, theirsCommit.Tree)
		if err != nil {
			return err
		}

		res, err := merge.MergeTrees(vicDir, baseTree, oursTree, theirsTree)
		if err != nil {
			return err
		}

		// Write merged/conflicted files to working directory
		for path, entry := range res.Merged {
			if entry.Type != "blob" {
				continue
			}

			obj, err := objects.ReadObject(vicDir, entry.Hash)
			if err != nil {
				return err
			}

			fullPath := filepath.Join(root, filepath.FromSlash(path))

			if err := os.MkdirAll(filepath.Dir(fullPath), 0o755); err != nil {
				return err
			}

			if err := os.WriteFile(fullPath, obj.Content, 0o644); err != nil {
				return err
			}
		}

		// Update index with merge result
		mergedIdx := buildIndexFromTree(res.Merged)
		if err := mergedIdx.Save(vicDir); err != nil {
			return err
		}

		// If conflicts exist, stop here.
		// Do NOT create a merge commit.
		// Do NOT update the current branch ref.
		if len(res.Conflicts) > 0 {
			// Save merge state
			if err := os.WriteFile(
				filepath.Join(vicDir, "MERGE_HEAD"),
				[]byte(theirsHash),
				0644,
			); err != nil {
				return err
			}
			if err := os.WriteFile(
				filepath.Join(vicDir, "MERGE_ORIG_HEAD"),
				[]byte(oursHash),
				0644,
			); err != nil {
				return err
			}

			if err := os.WriteFile(
				filepath.Join(vicDir, "MERGE_MSG"),
				[]byte(fmt.Sprintf("Merge branch '%s'", targetBranch)),
				0644,
			); err != nil {
				return err
			}

			fmt.Println("Merge stopped because of conflicts:")
			for _, p := range res.Conflicts {
				fmt.Println("  CONFLICT:", p)
			}

			fmt.Println()
			fmt.Println("Resolve the conflicts, then run:")
			fmt.Println("  vic add <file>")
			fmt.Println("  vic commit")

			return nil
		}
		fmt.Println("Merge stopped because of conflicts:")
		for _, p := range res.Conflicts {
			fmt.Println("  CONFLICT:", p)
		}

		if len(res.BinaryConflicts) > 0 {
			fmt.Println()
			fmt.Println("Binary conflicts detected. Conflict markers were NOT written into these files:")
			for _, p := range res.BinaryConflicts {
				fmt.Println("  BINARY:", p)
			}
			fmt.Println()
			fmt.Println("For binary files, choose one version or resolve using the web UI.")
		}
		// No conflicts: write merged tree
		mergedTreeHash, err := trees.WriteTreeFromIndex(vicDir, mergedIdx)
		if err != nil {
			return err
		}

		// Create merge commit with two parents
		mergeCommitHash, err := commits.WriteCommit(vicDir, commits.CommitInput{
			TreeHash: mergedTreeHash,
			Parents:  []string{oursHash, theirsHash},
			Message:  fmt.Sprintf("Merge branch '%s'", targetBranch),
		})
		if err != nil {
			return err
		}

		// Move current branch to merge commit
		if err := refs.WriteRef(vicDir, headRef, mergeCommitHash); err != nil {
			return err
		}

		// Apply merge commit to working directory
		if err := worktree.CheckoutCommit(root, vicDir, mergeCommitHash); err != nil {
			return err
		}

		fmt.Printf("Merged '%s' → %s\n", targetBranch, mergeCommitHash[:8])
		return nil
	},
}

func buildIndexFromTree(m map[string]trees.Entry) *index.Index {
	paths := make([]string, 0, len(m))
	for p := range m {
		paths = append(paths, p)
	}
	sort.Strings(paths)

	idx := &index.Index{Version: 1, Entries: []index.Entry{}}

	for _, p := range paths {
		e := m[p]
		if e.Type != "blob" {
			continue
		}

		idx.Entries = append(idx.Entries, index.Entry{
			Path: p,
			Mode: e.Mode,
			Hash: e.Hash,
		})
	}

	return idx
}

func abortMerge(root, vicDir string) error {
	mergeHeadPath := filepath.Join(vicDir, "MERGE_HEAD")
	origHeadPath := filepath.Join(vicDir, "MERGE_ORIG_HEAD")

	if _, err := os.Stat(mergeHeadPath); os.IsNotExist(err) {
		return fmt.Errorf("no merge in progress")
	}

	origData, err := os.ReadFile(origHeadPath)
	if err != nil {
		return fmt.Errorf("cannot abort merge: MERGE_ORIG_HEAD missing")
	}

	origHash := strings.TrimSpace(string(origData))
	if origHash == "" {
		return fmt.Errorf("cannot abort merge: original HEAD is empty")
	}

	headRef, err := refs.HeadRefPath(vicDir)
	if err != nil {
		return err
	}

	if err := refs.WriteRef(vicDir, headRef, origHash); err != nil {
		return err
	}

	if err := worktree.CheckoutCommit(root, vicDir, origHash); err != nil {
		return err
	}

	clearMergeState(vicDir)

	fmt.Println("Merge aborted.")
	return nil
}

func continueMerge(root, vicDir string) error {
	mergeHeadPath := filepath.Join(vicDir, "MERGE_HEAD")
	mergeMsgPath := filepath.Join(vicDir, "MERGE_MSG")

	if _, err := os.Stat(mergeHeadPath); os.IsNotExist(err) {
		return fmt.Errorf("no merge in progress")
	}

	mergeHeadData, err := os.ReadFile(mergeHeadPath)
	if err != nil {
		return err
	}

	mergeParent := strings.TrimSpace(string(mergeHeadData))
	if mergeParent == "" {
		return fmt.Errorf("MERGE_HEAD is empty")
	}

	message := "Merge"
	if data, err := os.ReadFile(mergeMsgPath); err == nil {
		if msg := strings.TrimSpace(string(data)); msg != "" {
			message = msg
		}
	}

	headRef, err := refs.HeadRefPath(vicDir)
	if err != nil {
		return err
	}

	parentHash, err := refs.ReadRef(vicDir, headRef)
	if err != nil {
		return err
	}

	if parentHash == "" {
		return fmt.Errorf("current branch has no commits")
	}

	idx, err := index.Load(vicDir)
	if err != nil {
		return err
	}

	if len(idx.Entries) == 0 {
		return fmt.Errorf("nothing staged; resolve conflicts and run: vic add <file>")
	}

	treeHash, err := trees.WriteTreeFromIndex(vicDir, idx)
	if err != nil {
		return err
	}

	mergeCommitHash, err := commits.WriteCommit(vicDir, commits.CommitInput{
		TreeHash: treeHash,
		Parents:  []string{parentHash, mergeParent},
		Message:  message,
	})
	if err != nil {
		return err
	}

	if err := refs.WriteRef(vicDir, headRef, mergeCommitHash); err != nil {
		return err
	}

	if err := worktree.CheckoutCommit(root, vicDir, mergeCommitHash); err != nil {
		return err
	}

	clearMergeState(vicDir)

	fmt.Printf("Merge completed → %s\n", mergeCommitHash[:8])
	return nil
}

func clearMergeState(vicDir string) {
	os.Remove(filepath.Join(vicDir, "MERGE_HEAD"))
	os.Remove(filepath.Join(vicDir, "MERGE_MSG"))
	os.Remove(filepath.Join(vicDir, "MERGE_ORIG_HEAD"))
}

func init() {
	mergeCmd.Flags().BoolVar(&mergeAbort, "abort", false, "abort the current merge")
	mergeCmd.Flags().BoolVar(&mergeContinue, "continue", false, "continue the current merge after resolving conflicts")
	rootCmd.AddCommand(mergeCmd)
}
