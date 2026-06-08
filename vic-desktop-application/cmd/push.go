package cmd

import (
	"fmt"
	"os"
	"strings"

	"github.com/elyasahmadi/vic/internal/app"
	"github.com/spf13/cobra"
)

var pushCmd = &cobra.Command{
	Use:   "push <remote> <branch>",
	Short: "Push a branch to a remote repository",
	Args:  cobra.ExactArgs(2),
	RunE: func(cmd *cobra.Command, args []string) error {
		remoteName := strings.TrimSpace(args[0])
		branchName := strings.TrimSpace(args[1])

		wd, err := os.Getwd()
		if err != nil {
			return err
		}
		fmt.Printf("Pushing %s/%s ...\n", remoteName, branchName)
		if err := app.Push(wd, remoteName, branchName); err != nil {
			return err
		}
		fmt.Printf("Pushed branch %s to %s\n", branchName, remoteName)
		return nil
	},
}

func init() {
	rootCmd.AddCommand(pushCmd)
}
