package cmd

import (
	"fmt"
	"os"
	"strings"

	"github.com/elyasahmadi/vic/internal/app"
	"github.com/spf13/cobra"
)

var remoteCmd = &cobra.Command{
	Use:   "remote",
	Short: "Manage remote repositories",
}

var remoteAddCmd = &cobra.Command{
	Use:   "add <name> <url>",
	Short: "Add a remote",
	Args:  cobra.ExactArgs(2),
	RunE: func(cmd *cobra.Command, args []string) error {
		name := strings.TrimSpace(args[0])
		url := strings.TrimSpace(args[1])
		if name == "" || url == "" {
			return fmt.Errorf("remote name and URL are required")
		}
		wd, err := os.Getwd()
		if err != nil {
			return err
		}
		if err := app.AddRemote(wd, name, url); err != nil {
			return err
		}
		fmt.Printf("Added remote %s → %s\n", name, url)
		return nil
	},
}

var remoteListCmd = &cobra.Command{
	Use:   "list",
	Short: "List remotes",
	RunE: func(cmd *cobra.Command, args []string) error {
		wd, err := os.Getwd()
		if err != nil {
			return err
		}
		remotes, err := app.ListRemotes(wd)
		if err != nil {
			return err
		}
		if len(remotes) == 0 {
			fmt.Println("No remotes configured.")
			return nil
		}
		for _, remote := range remotes {
			fmt.Printf("%-15s  %s\n", remote.Name, remote.URL)
		}
		return nil
	},
}

var remoteGetURLCmd = &cobra.Command{
	Use:   "get-url <name>",
	Short: "Print the URL of a remote",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		wd, err := os.Getwd()
		if err != nil {
			return err
		}
		url, err := app.GetRemoteURL(wd, args[0])
		if err != nil {
			return err
		}
		fmt.Println(url)
		return nil
	},
}

var remoteSetTokenCmd = &cobra.Command{
	Use:   "set-token <name> <token>",
	Short: "Store a Bearer token for a remote",
	Args:  cobra.ExactArgs(2),
	RunE: func(cmd *cobra.Command, args []string) error {
		name := strings.TrimSpace(args[0])
		token := strings.TrimSpace(args[1])
		if name == "" || token == "" {
			return fmt.Errorf("remote name and token are required")
		}
		wd, err := os.Getwd()
		if err != nil {
			return err
		}
		if err := app.SetRemoteToken(wd, name, token); err != nil {
			return err
		}
		fmt.Printf("Token updated for remote %s\n", name)
		return nil
	},
}

func init() {
	remoteCmd.AddCommand(remoteAddCmd)
	remoteCmd.AddCommand(remoteListCmd)
	remoteCmd.AddCommand(remoteGetURLCmd)
	remoteCmd.AddCommand(remoteSetTokenCmd)
	rootCmd.AddCommand(remoteCmd)
}
