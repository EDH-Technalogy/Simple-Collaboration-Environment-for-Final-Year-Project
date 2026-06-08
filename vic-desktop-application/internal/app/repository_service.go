package app

import (
	"os"
	"path/filepath"

	"github.com/elyasahmadi/vic/internal/repo"
)

func InitRepository(path string) (string, error) {
	dir := path
	if dir == "" {
		var err error
		dir, err = os.Getwd()
		if err != nil {
			return "", err
		}
	}
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", err
	}
	if err := repo.Init(dir); err != nil {
		return "", err
	}
	return filepath.Join(dir, repo.DirName), nil
}
