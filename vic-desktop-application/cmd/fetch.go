package cmd

import (
	"fmt"
	"os"
	"strings"

	"github.com/elyasahmadi/vic/internal/app"
	"github.com/spf13/cobra"
)

var fetchCmd = &cobra.Command{
	Use:   "fetch <remote>",
	Short: "Download objects and refs from a remote repository",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		remoteName := strings.TrimSpace(args[0])

		wd, err := os.Getwd()
		if err != nil {
			return err
		}
		if err := app.Fetch(wd, remoteName); err != nil {
			return err
		}
		fmt.Printf("Fetched from %s\n", remoteName)
		return nil
	},
}

func init() {
	rootCmd.AddCommand(fetchCmd)
}
