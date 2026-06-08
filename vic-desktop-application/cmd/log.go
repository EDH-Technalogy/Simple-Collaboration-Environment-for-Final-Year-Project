package cmd

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/elyasahmadi/vic/internal/commits"
	"github.com/elyasahmadi/vic/internal/refs"
	"github.com/elyasahmadi/vic/internal/repo"
	"github.com/spf13/cobra"
)

var logCmd = &cobra.Command{
	Use:   "log",
	Short: "Show commit history",
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

		headRef, err := refs.HeadRefPath(vicDir)
		if err != nil {
			return err
		}
		hash, err := refs.ReadRef(vicDir, headRef)
		if err != nil {
			return err
		}
		if hash == "" {
			fmt.Println("No commits yet.")
			return nil
		}

		for hash != "" {
			c, err := commits.ReadCommit(vicDir, hash)
			if err != nil {
				return err
			}

			fmt.Printf("commit %s\n", c.Hash)
			if len(c.Parents) > 1 {
				fmt.Printf("Merge: %s\n", strings.Join(shortHashes(c.Parents), " "))
			}
			if c.Author != "" {
				fmt.Printf("Author: %s\n", c.Author)
			}
			if t := parseAuthorTimestamp(c.Author); t != "" {
				fmt.Printf("Date:   %s\n", t)
			}
			msg := strings.TrimSpace(c.Message)
			if msg != "" {
				fmt.Printf("\n    %s\n", firstLine(msg))
			}
			fmt.Println()

			if len(c.Parents) == 0 {
				break
			}
			hash = c.Parents[0]
		}
		return nil
	},
}

func shortHashes(hashes []string) []string {
	out := make([]string, 0, len(hashes))
	for _, h := range hashes {
		if len(h) > 7 {
			out = append(out, h[:7])
		} else {
			out = append(out, h)
		}
	}
	return out
}

func firstLine(s string) string {
	if i := strings.IndexByte(s, '\n'); i >= 0 {
		return s[:i]
	}
	return s
}

func parseAuthorTimestamp(authorLine string) string {
	// format: "Name <email> unix-timestamp"
	fields := strings.Fields(authorLine)
	if len(fields) < 2 {
		return ""
	}
	last := fields[len(fields)-1]
	var sec int64
	if _, err := fmt.Sscanf(last, "%d", &sec); err != nil {
		return ""
	}
	return time.Unix(sec, 0).Format("Mon Jan 2 15:04:05 2006 -0700")
}

func init() {
	rootCmd.AddCommand(logCmd)
}
