package cmd

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/elyasahmadi/vic/internal/clone"
	"github.com/elyasahmadi/vic/internal/config"
	"github.com/elyasahmadi/vic/internal/refs"
	"github.com/elyasahmadi/vic/internal/remote"
	"github.com/elyasahmadi/vic/internal/repo"
	"github.com/elyasahmadi/vic/internal/worktree"
	"github.com/spf13/cobra"
)

var cloneCmd = &cobra.Command{
	Use:   "clone <url> [directory]",
	Short: "Clone a remote repository into a new directory",
	Args:  cobra.RangeArgs(1, 2),
	RunE: func(cmd *cobra.Command, args []string) error {
		url := strings.TrimSpace(args[0])

		// Derive target directory from URL if not given
		targetDir := ""
		if len(args) == 2 {
			targetDir = strings.TrimSpace(args[1])
		} else {
			parts := strings.Split(strings.TrimRight(url, "/"), "/")
			targetDir = parts[len(parts)-1]
		}
		if url == "" || targetDir == "" {
			return fmt.Errorf("url and target directory are required")
		}

		// Target must not already exist
		if _, err := os.Stat(targetDir); err == nil {
			return fmt.Errorf("target directory %q already exists", targetDir)
		}

		if err := os.MkdirAll(targetDir, 0o755); err != nil {
			return err
		}

		cleanupTargetDir := true
		defer func() {
			if cleanupTargetDir {
				_ = os.RemoveAll(targetDir)
			}
		}()

		// Initialise the new repo
		if err := repo.Init(targetDir); err != nil {
			return err
		}
		vicDir := filepath.Join(targetDir, ".vic")

		client := remote.NewClient(url, "")

		info, err := client.GetInfoRefs()
		if err != nil {
			return fmt.Errorf("clone: cannot reach remote: %w", err)
		}

		// Determine HEAD ref and commit hash
		headRef := strings.TrimSpace(info.HEAD)
		if headRef == "" {
			headRef = "refs/heads/main"
		}
		headHash := strings.TrimSpace(info.Refs[headRef])

		// Store all advertised refs as remote-tracking refs
		for refPath, hash := range info.Refs {
			hash = strings.TrimSpace(hash)
			if hash == "" {
				continue
			}
			if err := refs.WriteRef(vicDir, refPath, hash); err != nil {
				return err
			}
			// Also write remote-tracking refs under refs/remotes/origin/
			if strings.HasPrefix(refPath, "refs/heads/") {
				branch := strings.TrimPrefix(refPath, "refs/heads/")
				if err := refs.WriteRef(vicDir, "refs/remotes/origin/"+branch, hash); err != nil {
					return err
				}
			}
		}

		if err := refs.SetHEADToRef(vicDir, headRef); err != nil {
			return err
		}

		// Save origin in config
		cfg, err := config.Load(vicDir)
		if err != nil {
			return err
		}
		cfg.Remotes["origin"] = config.Remote{URL: url}
		if err := config.Save(vicDir, cfg); err != nil {
			return err
		}

		// Empty repository case
		if headHash == "" {
			cleanupTargetDir = false
			fmt.Printf("Cloned empty repository into '%s'\n", targetDir)
			return nil
		}

		// Download all reachable objects
		fmt.Printf("Cloning from %s ...\n", url)
		if err := clone.DownloadReachableObjects(client, vicDir, headHash); err != nil {
			return err
		}

		// Checkout working tree and rebuild index
		if err := worktree.CheckoutCommit(targetDir, vicDir, headHash); err != nil {
			return err
		}

		cleanupTargetDir = false
		fmt.Printf("Cloned into '%s'\n", targetDir)
		return nil
	},
}

func init() {
	rootCmd.AddCommand(cloneCmd)
}
