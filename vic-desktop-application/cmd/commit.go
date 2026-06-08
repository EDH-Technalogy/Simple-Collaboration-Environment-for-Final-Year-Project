package cmd

import (
	"fmt"
	"os"
	"strings"

	"github.com/elyasahmadi/vic/internal/app"
	"github.com/spf13/cobra"
)

var commitMsg string

var commitCmd = &cobra.Command{
	Use:   "commit",
	Short: "Record staged changes to the repository",
	RunE: func(cmd *cobra.Command, args []string) error {
		if strings.TrimSpace(commitMsg) == "" {
			return fmt.Errorf("commit message is required (-m)")
		}

		wd, err := os.Getwd()
		if err != nil {
			return err
		}

		result, err := app.Commit(wd, commitMsg)
		if err != nil {
			return err
		}
		fmt.Printf("[%s %s] %s\n", result.Branch, result.ShortHash, result.Message)
		fmt.Printf(" %d file(s) staged\n", result.StagedCount)

		return nil
	},
}

func init() {
	commitCmd.Flags().StringVarP(&commitMsg, "message", "m", "", "commit message (required)")
	rootCmd.AddCommand(commitCmd)
}
