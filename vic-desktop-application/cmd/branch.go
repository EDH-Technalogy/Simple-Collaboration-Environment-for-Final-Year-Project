package cmd

import (
	"fmt"
	"os"
	"strings"

	"github.com/elyasahmadi/vic/internal/app"
	"github.com/spf13/cobra"
)

var (
	showRemoteBranches bool
	showAllBranches    bool
	deleteBranchName   string
)

var branchCmd = &cobra.Command{
	Use:   "branch [name]",
	Short: "List, create, or delete branches",
	Args:  cobra.MaximumNArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		wd, err := os.Getwd()
		if err != nil {
			return err
		}
		if deleteBranchName != "" {
			name := strings.TrimSpace(deleteBranchName)
			if err := app.DeleteBranch(wd, name); err != nil {
				return err
			}
			fmt.Printf("Deleted branch %s\n", name)
			return nil
		}

		if len(args) == 1 {
			name := strings.TrimSpace(args[0])
			if err := app.CreateBranch(wd, name); err != nil {
				return err
			}
			fmt.Printf("Created branch %s\n", name)
			return nil
		}

		branches, err := app.ListBranches(wd, showAllBranches || showRemoteBranches)
		if err != nil {
			return err
		}
		printed := false
		for _, branch := range branches {
			if showRemoteBranches && !showAllBranches && !branch.Remote {
				continue
			}
			prefix := "  "
			if branch.Current {
				prefix = "* "
			}
			fmt.Println(prefix + branch.Name)
			printed = true
		}
		if !printed {
			if showRemoteBranches {
				fmt.Println("  (no remote-tracking branches)")
			} else {
				fmt.Println("  (no local branches)")
			}
		}
		return nil
	},
}

func init() {
	branchCmd.Flags().BoolVarP(&showRemoteBranches, "remotes", "r", false, "show remote-tracking branches")
	branchCmd.Flags().BoolVarP(&showAllBranches, "all", "a", false, "show all branches (local + remote)")
	branchCmd.Flags().StringVarP(&deleteBranchName, "delete", "d", "", "delete a local branch")
	rootCmd.AddCommand(branchCmd)
}
