package cmd

import (
	"fmt"
	"os"
	"strings"

	"github.com/elyasahmadi/vic/internal/app"
	"github.com/spf13/cobra"
)

var pullCmd = &cobra.Command{
	Use:   "pull <remote> <branch>",
	Short: "Fetch from remote and fast-forward the local branch",
	Args:  cobra.ExactArgs(2),
	RunE: func(cmd *cobra.Command, args []string) error {
		remoteName := strings.TrimSpace(args[0])
		branchName := strings.TrimSpace(args[1])

		wd, err := os.Getwd()
		if err != nil {
			return err
		}
		if err := app.Pull(wd, remoteName, branchName); err != nil {
			return err
		}
		fmt.Printf("Pulled %s/%s\n", remoteName, branchName)
		return nil
	},
}

func init() {
	rootCmd.AddCommand(pullCmd)
}
