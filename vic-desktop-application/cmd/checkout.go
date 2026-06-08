package cmd

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/elyasahmadi/vic/internal/refs"
	"github.com/elyasahmadi/vic/internal/repo"
	"github.com/elyasahmadi/vic/internal/worktree"
	"github.com/spf13/cobra"
)

var checkoutNewBranch string

var checkoutCmd = &cobra.Command{
	Use:   "checkout <branch|commit>",
	Short: "Switch branches or restore working tree from a commit",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		wd, err := os.Getwd()
		if err != nil {
			return err
		}
		root, err := repo.FindRepoRoot(wd)
		if err != nil {
			return err
		}
		vicDir := filepath.Join(root, ".vic")
		target := strings.TrimSpace(args[0])

		// ── checkout -b <new> <start-point> ──────────────────────────────────
		if checkoutNewBranch != "" {
			newBranch := strings.TrimSpace(checkoutNewBranch)
			if newBranch == "" {
				return fmt.Errorf("new branch name is empty")
			}
			if strings.ContainsAny(newBranch, " \t\n\r\\/:*?\"<>|") {
				return fmt.Errorf("invalid branch name %q", newBranch)
			}
			existing, err := refs.ReadRef(vicDir, "refs/heads/"+newBranch)
			if err != nil {
				return err
			}
			if existing != "" {
				return fmt.Errorf("branch %q already exists", newBranch)
			}
			commitHash, err := resolveRevision(vicDir, target)
			if err != nil {
				return err
			}
			if err := refs.WriteRef(vicDir, "refs/heads/"+newBranch, commitHash); err != nil {
				return err
			}
			if err := refs.SetHEADToRef(vicDir, "refs/heads/"+newBranch); err != nil {
				return err
			}
			if err := worktree.CheckoutCommit(root, vicDir, commitHash); err != nil {
				return err
			}
			fmt.Printf("Switched to a new branch '%s'\n", newBranch)
			return nil
		}

		// ── normal checkout ───────────────────────────────────────────────────
		commitHash, headRef, err := resolveTarget(vicDir, target)
		if err != nil {
			return err
		}
		if err := worktree.CheckoutCommit(root, vicDir, commitHash); err != nil {
			return err
		}
		if headRef != "" {
			if err := refs.SetHEADToRef(vicDir, headRef); err != nil {
				return err
			}
			fmt.Printf("Switched to branch '%s'\n", target)
		} else {
			if err := refs.SetHEADDetached(vicDir, commitHash); err != nil {
				return err
			}
			fmt.Printf("HEAD is now at %s\n", commitHash[:8])
		}
		return nil
	},
}

// resolveRevision resolves a branch name, remote/branch, or full hash to a
// commit hash without deciding what HEAD should point at.
func resolveRevision(vicDir, arg string) (string, error) {
	// local branch
	if h, _ := refs.ReadRef(vicDir, "refs/heads/"+arg); h != "" {
		return h, nil
	}
	// remote-tracking branch e.g. origin/main
	if strings.Contains(arg, "/") {
		if h, _ := refs.ReadRef(vicDir, "refs/remotes/"+arg); h != "" {
			return h, nil
		}
	}
	// full SHA-1 hash
	if len(arg) == 40 {
		return arg, nil
	}
	return "", fmt.Errorf("unknown revision %q", arg)
}

// resolveTarget resolves target and also returns the ref to set HEAD to
// (empty string means detached HEAD).
func resolveTarget(vicDir, arg string) (commitHash, headRefToSet string, err error) {
	// local branch
	refPath := "refs/heads/" + arg
	if h, _ := refs.ReadRef(vicDir, refPath); h != "" {
		return h, refPath, nil
	}
	// remote-tracking e.g. origin/main → detached
	if strings.Contains(arg, "/") {
		if h, _ := refs.ReadRef(vicDir, "refs/remotes/"+arg); h != "" {
			return h, "", nil
		}
	}
	// full hash
	if len(arg) == 40 {
		return arg, "", nil
	}
	return "", "", fmt.Errorf("unknown branch or revision %q", arg)
}

func init() {
	checkoutCmd.Flags().StringVarP(&checkoutNewBranch, "branch", "b", "", "create and switch to a new branch at the given start point")
	rootCmd.AddCommand(checkoutCmd)
}
