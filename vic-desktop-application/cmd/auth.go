package cmd

import (
	"bufio"
	"fmt"
	"os"
	"strings"

	"github.com/elyasahmadi/vic/internal/app"
	"github.com/spf13/cobra"
)

var authCmd = &cobra.Command{
	Use:   "auth",
	Short: "Authentication commands",
}

var authLoginCmd = &cobra.Command{
	Use:   "login <server-url>",
	Short: "Log in to a VIC server and save the session token",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		serverURL := strings.TrimSpace(args[0])
		if serverURL == "" {
			return fmt.Errorf("server URL is required")
		}

		reader := bufio.NewReader(os.Stdin)

		fmt.Print("Username or email: ")
		identifier, err := reader.ReadString('\n')
		if err != nil {
			return fmt.Errorf("read identifier: %w", err)
		}
		identifier = strings.TrimSpace(identifier)
		if identifier == "" {
			return fmt.Errorf("username or email is required")
		}
		fmt.Print("Password: ")
		password, err := reader.ReadString('\n')
		if err != nil {
			return fmt.Errorf("read password: %w", err)
		}
		password = strings.TrimRight(password, "\r\n")
		if password == "" {
			return fmt.Errorf("password is required")
		}

		wd, _ := os.Getwd()
		if err := app.Login(wd, serverURL, identifier, password); err != nil {
			return err
		}
		fmt.Printf("Logged in to %s as %s\n", serverURL, identifier)
		return nil
	},
}

var authLogoutCmd = &cobra.Command{
	Use:   "logout <server-url>",
	Short: "Remove saved session for a server",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		serverURL := strings.TrimSpace(args[0])
		if err := app.Logout(serverURL); err != nil {
			return err
		}
		fmt.Printf("Logged out from %s\n", serverURL)
		return nil
	},
}

func init() {
	authCmd.AddCommand(authLoginCmd)
	authCmd.AddCommand(authLogoutCmd)
	rootCmd.AddCommand(authCmd)
}
