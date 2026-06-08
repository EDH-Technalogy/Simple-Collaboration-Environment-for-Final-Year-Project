package cmd

import (
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/elyasahmadi/vic/internal/commits"
	"github.com/elyasahmadi/vic/internal/index"
	"github.com/elyasahmadi/vic/internal/objects"
	"github.com/elyasahmadi/vic/internal/refs"
	"github.com/elyasahmadi/vic/internal/repo"
	"github.com/elyasahmadi/vic/internal/trees"
	"github.com/pmezard/go-difflib/difflib"
	"github.com/spf13/cobra"
)

var diffStaged bool

var diffCmd = &cobra.Command{
	Use:   "diff [paths...]",
	Short: "Show changes (unstaged by default; use --staged for staged vs HEAD)",
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

		idx, err := index.Load(vicDir)
		if err != nil {
			return err
		}
		idxMap := idx.Map()

		// HEAD tree (needed for --staged)
		headTree := map[string]trees.Entry{}
		headRef, err := refs.HeadRefPath(vicDir)
		if err != nil {
			return err
		}
		headHash, err := refs.ReadRef(vicDir, headRef)
		if err != nil {
			return err
		}
		if headHash != "" {
			c, err := commits.ReadCommit(vicDir, headHash)
			if err != nil {
				return err
			}
			headTree, err = trees.ReadTreeRecursive(vicDir, c.Tree)
			if err != nil {
				return err
			}
		}

		// Compute working-tree hashes for unstaged diff
		workHash := map[string]string{}
		_ = filepath.WalkDir(root, func(p string, d os.DirEntry, err error) error {
			if err != nil {
				return err
			}
			if d.IsDir() && d.Name() == ".vic" {
				return filepath.SkipDir
			}
			if d.IsDir() {
				return nil
			}
			rel, _ := filepath.Rel(root, p)
			rel = filepath.ToSlash(rel)
			data, _ := os.ReadFile(p)
			h, _ := objects.HashObject("blob", data)
			workHash[rel] = h
			return nil
		})

		// Determine which paths to diff
		var paths []string
		if len(args) > 0 {
			for _, a := range args {
				paths = append(paths, filepath.ToSlash(a))
			}
		} else {
			if diffStaged {
				for p, ie := range idxMap {
					he, ok := headTree[p]
					if !ok || he.Hash != ie.Hash {
						paths = append(paths, p)
					}
				}
			} else {
				for p, ie := range idxMap {
					wh, ok := workHash[p]
					if !ok || wh != ie.Hash {
						paths = append(paths, p)
					}
				}
			}
		}
		sort.Strings(paths)

		for _, p := range paths {
			if diffStaged {
				if err := showStagedDiff(vicDir, headTree, idxMap, p); err != nil {
					return err
				}
			} else {
				if err := showUnstagedDiff(root, vicDir, idxMap, p); err != nil {
					return err
				}
			}
		}
		return nil
	},
}

func showStagedDiff(vicDir string, headTree map[string]trees.Entry, idxMap map[string]index.Entry, p string) error {
	ie, ok := idxMap[p]
	if !ok {
		return nil
	}
	var a []byte
	if he, ok := headTree[p]; ok && he.Hash != "" {
		obj, err := objects.ReadObject(vicDir, he.Hash)
		if err != nil {
			return err
		}
		a = obj.Content
	}
	obj, err := objects.ReadObject(vicDir, ie.Hash)
	if err != nil {
		return err
	}
	return printDiff(a, obj.Content, "a/"+p, "b/"+p)
}

func showUnstagedDiff(root, vicDir string, idxMap map[string]index.Entry, p string) error {
	ie, ok := idxMap[p]
	if !ok {
		return nil
	}
	obj, err := objects.ReadObject(vicDir, ie.Hash)
	if err != nil {
		return err
	}
	b, err := os.ReadFile(filepath.Join(root, filepath.FromSlash(p)))
	if err != nil {
		b = nil // deleted in working tree
	}
	return printDiff(obj.Content, b, "a/"+p, "b/"+p)
}

func printDiff(a, b []byte, fromFile, toFile string) error {
	if bytes.Contains(a, []byte{0}) || bytes.Contains(b, []byte{0}) {
		fmt.Printf("Binary files %s and %s differ\n", fromFile, toFile)
		return nil
	}
	ud := difflib.UnifiedDiff{
		A:        difflib.SplitLines(string(a)),
		B:        difflib.SplitLines(string(b)),
		FromFile: fromFile,
		ToFile:   toFile,
		Context:  3,
	}
	out, err := difflib.GetUnifiedDiffString(ud)
	if err != nil {
		return err
	}
	if strings.TrimSpace(out) == "" {
		return nil
	}
	fmt.Print(out)
	return nil
}

func init() {
	diffCmd.Flags().BoolVar(&diffStaged, "staged", false, "compare index against HEAD")
	rootCmd.AddCommand(diffCmd)
}
