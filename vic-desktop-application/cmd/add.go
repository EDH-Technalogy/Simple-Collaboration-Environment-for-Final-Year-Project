package cmd

import (
	"os"

	"github.com/elyasahmadi/vic/internal/app"
	"github.com/spf13/cobra"
)

var addCmd = &cobra.Command{
	Use:   "add <path>...",
	Short: "Add file contents to the staging area",
	Args:  cobra.MinimumNArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		wd, err := os.Getwd()
		if err != nil {
			return err
		}
		return app.AddFiles(wd, args)
	},
}

func init() {
	rootCmd.AddCommand(addCmd)
}
