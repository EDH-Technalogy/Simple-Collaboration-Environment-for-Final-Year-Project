package cmd

import (
	"fmt"
	"os"
	"os/signal"
	"path/filepath"
	"strings"

	"github.com/elyasahmadi/vic/internal/config"
	"github.com/elyasahmadi/vic/internal/repo"
	"github.com/elyasahmadi/vic/internal/session"
	wsclient "github.com/elyasahmadi/vic/internal/wsClient"
	"github.com/spf13/cobra"
)

var watchCmd = &cobra.Command{
	Use:   "watch",
	Short: "Watch repository for real-time updates",
	RunE: func(cmd *cobra.Command, args []string) error {
		wd, err := os.Getwd()
		if err != nil {
			return err
		}

		root, err := repo.FindRepoRoot(wd)
		if err != nil {
			return err
		}

		vicDir := filepath.Join(root, ".vic")

		// Load remote config
		cfg, err := config.Load(vicDir)
		if err != nil {
			return err
		}

		origin, ok := cfg.Remotes["origin"]
		if !ok {
			return fmt.Errorf("no origin remote configured")
		}

		// Get auth token
		// Get auth token from repo active user
		serverBase, err := session.ServerBaseFromRemote(origin.URL)
		if err != nil {
			return err
		}

		cfg.ActiveServer = serverBase

		if cfg.ActiveUser == "" {
			return fmt.Errorf("no active user for this repository; run: vic auth login %s", serverBase)
		}

		if err := config.Save(vicDir, cfg); err != nil {
			return err
		}

		entry, err := session.EnsureValidSessionForUser(serverBase, cfg.ActiveUser)
		if err != nil {
			return err
		}

		token := entry.AccessToken

		// Extract owner/repo from URL
		parts := strings.Split(strings.TrimRight(origin.URL, "/"), "/")
		if len(parts) < 2 {
			return fmt.Errorf("invalid remote URL")
		}
		owner := parts[len(parts)-2]
		repo := parts[len(parts)-1]

		// Connect WebSocket
		client := wsclient.NewClient(serverBase, token)

		// Register handlers
		client.RegisterHandler("push", func(msg wsclient.Message) {
			fmt.Printf("\n New push to %s by %s\n", msg.Repository, msg.User)
			fmt.Printf("   Run 'vic pull' to update\n")
		})

		client.RegisterHandler("pull_request", func(msg wsclient.Message) {
			fmt.Printf("\n Pull request update in %s by %s\n", msg.Repository, msg.User)
		})

		client.RegisterHandler("activity", func(msg wsclient.Message) {
			fmt.Printf("\n Activity in %s: %s\n", msg.Repository, msg.User)
		})

		if err := client.Connect(); err != nil {
			return fmt.Errorf("connect: %w", err)
		}
		defer client.Close()

		// Subscribe to repository
		if err := client.Subscribe(owner, repo); err != nil {
			return fmt.Errorf("subscribe: %w", err)
		}

		fmt.Printf(" Watching %s/%s for updates...\n", owner, repo)
		fmt.Println("Press Ctrl+C to stop")

		// Wait for interrupt
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, os.Interrupt)
		<-sigChan

		return nil
	},
}

func init() {
	rootCmd.AddCommand(watchCmd)
}
