package cmd

import (
	"fmt"
	"os"

	"github.com/elyasahmadi/vic/internal/app"
	"github.com/spf13/cobra"
)

var initCmd = &cobra.Command{
	Use:   "init [directory]",
	Short: "Initialise a new VIC repository",
	Args:  cobra.MaximumNArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		dir, err := os.Getwd()
		if err != nil {
			return err
		}
		if len(args) == 1 {
			dir = args[0]
			if err := os.MkdirAll(dir, 0o755); err != nil {
				return err
			}
		}
		vicDir, err := app.InitRepository(dir)
		if err != nil {
			return err
		}
		fmt.Printf("Initialised empty VIC repository in %s\n", vicDir)
		return nil
	},
}

func init() {
	rootCmd.AddCommand(initCmd)
}
