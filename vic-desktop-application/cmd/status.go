package cmd

import (
	"fmt"
	"os"

	"github.com/elyasahmadi/vic/internal/app"
	"github.com/spf13/cobra"
)

var statusCmd = &cobra.Command{
	Use:   "status",
	Short: "Show the working tree status",
	RunE: func(cmd *cobra.Command, args []string) error {
		wd, err := os.Getwd()
		if err != nil {
			return err
		}
		result, err := app.Status(wd)
		if err != nil {
			return err
		}

		fmt.Printf("On branch %s\n", result.Branch)
		if !result.HasCommit {
			fmt.Println("\nNo commits yet.")
		}
		if result.Clean {
			fmt.Println("nothing to commit, working tree clean")
			return nil
		}

		if len(result.Staged) > 0 {
			fmt.Println("\nChanges to be committed:")
			fmt.Println(`  (use "vic diff --staged" to view)`)
			for _, s := range app.FormatFileStatuses(result.Staged) {
				fmt.Println(s)
			}
		}
		if len(result.Unstaged) > 0 {
			fmt.Println("\nChanges not staged for commit:")
			fmt.Println(`  (use "vic add <file>" to stage)`)
			fmt.Println(`  (use "vic diff" to view)`)
			for _, s := range app.FormatFileStatuses(result.Unstaged) {
				fmt.Println(s)
			}
		}
		if len(result.Untracked) > 0 {
			fmt.Println("\nUntracked files:")
			for _, p := range result.Untracked {
				fmt.Println("\t" + p)
			}
		}
		return nil
	},
}

func init() {
	rootCmd.AddCommand(statusCmd)
}
