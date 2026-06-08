package app

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

type VicCommandResult struct {
	Command  []string `json:"command"`
	Stdout   string   `json:"stdout"`
	Stderr   string   `json:"stderr"`
	ExitCode int      `json:"exitCode"`
}

func VicCommandCatalog() []string {
	return []string{
		"init", "add", "commit", "status", "diff", "log", "branch", "checkout",
		"merge", "remote", "fetch", "pull", "push", "clone", "auth", "watch",
	}
}

func RunVicCommand(repoPath string, args []string) (*VicCommandResult, error) {
	if len(args) == 0 {
		return nil, fmt.Errorf("command arguments are required")
	}
	exe, err := vicExecutablePath()
	if err != nil {
		return nil, err
	}
	wd := repoPath
	if wd == "" {
		wd, _ = os.Getwd()
	}
	cmd := exec.Command(exe, args...)
	cmd.Dir = wd
	var stdout bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	err = cmd.Run()
	result := &VicCommandResult{
		Command:  append([]string{exe}, args...),
		Stdout:   stdout.String(),
		Stderr:   stderr.String(),
		ExitCode: 0,
	}
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			result.ExitCode = exitErr.ExitCode()
			return result, fmt.Errorf("vic command failed: %s", result.Stderr)
		}
		return result, err
	}
	return result, nil
}

func vicExecutablePath() (string, error) {
	candidates := []string{}
	if wd, err := os.Getwd(); err == nil {
		candidates = append(candidates,
			filepath.Join(wd, "vic.exe"),
			filepath.Join(wd, "..", "vic.exe"),
		)
	}
	if exe, err := os.Executable(); err == nil {
		dir := filepath.Dir(exe)
		candidates = append(candidates,
			filepath.Join(dir, "vic.exe"),
			filepath.Join(dir, "..", "vic.exe"),
			filepath.Join(dir, "..", "..", "vic.exe"),
		)
	}
	for _, candidate := range candidates {
		if info, err := os.Stat(candidate); err == nil && !info.IsDir() {
			return candidate, nil
		}
	}
	if path, err := exec.LookPath("vic"); err == nil {
		return path, nil
	}
	if path, err := exec.LookPath("vic.exe"); err == nil {
		return path, nil
	}
	return "", fmt.Errorf("vic executable was not found")
}
