package app

import (
	"fmt"
	"strings"

	"github.com/elyasahmadi/vic/internal/config"
)

func EnsureRepositoryAccess(repoPath, username, email string) error {
	if !HasRepository(repoPath) {
		return nil
	}
	_, vicDir, err := repoDirs(repoPath)
	if err != nil {
		return err
	}
	cfg, err := config.Load(vicDir)
	if err != nil {
		return err
	}
	owner := strings.TrimSpace(cfg.ActiveUser)
	if owner == "" {
		return nil
	}
	if sameIdentity(owner, username) || sameIdentity(owner, email) {
		return nil
	}
	current := strings.TrimSpace(username)
	if current == "" {
		current = strings.TrimSpace(email)
	}
	if current == "" {
		current = "the current user"
	}
	return fmt.Errorf("this repository belongs to %q, but you are signed in as %q", owner, current)
}

func SetRepositoryOwner(repoPath, username, email, serverURL string) error {
	if !HasRepository(repoPath) {
		return nil
	}
	_, vicDir, err := repoDirs(repoPath)
	if err != nil {
		return err
	}
	cfg, err := config.Load(vicDir)
	if err != nil {
		return err
	}
	owner := strings.TrimSpace(username)
	if owner == "" {
		owner = strings.TrimSpace(email)
	}
	cfg.ActiveUser = owner
	cfg.ActiveServer = strings.TrimSpace(serverURL)
	return config.Save(vicDir, cfg)
}

func sameIdentity(a, b string) bool {
	return strings.EqualFold(strings.TrimSpace(a), strings.TrimSpace(b)) && strings.TrimSpace(a) != ""
}
