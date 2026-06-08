package config

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

// Remote holds the URL and optional Bearer token for a remote.
type Remote struct {
	URL   string
	Token string
}

// Config is the parsed .vic/config file.
type Config struct {
	CoreVersion  string
	Remotes      map[string]Remote
	ActiveUser   string
	ActiveServer string
}

// Load reads .vic/config. Returns an empty Config if the file does not exist.
func Load(vicDir string) (*Config, error) {
	cfg := &Config{
		CoreVersion: "0",
		Remotes:     map[string]Remote{},
	}

	f, err := os.Open(filepath.Join(vicDir, "config"))
	if err != nil {
		if os.IsNotExist(err) {
			return cfg, nil
		}
		return nil, fmt.Errorf("config: open: %w", err)
	}
	defer f.Close()

	section := ""
	remoteName := ""

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())

		if line == "" || strings.HasPrefix(line, "#") || strings.HasPrefix(line, ";") {
			continue
		}

		if strings.HasPrefix(line, "[") && strings.HasSuffix(line, "]") {
			section = line[1 : len(line)-1]
			remoteName = ""

			if strings.HasPrefix(section, `remote "`) && strings.HasSuffix(section, `"`) {
				remoteName = strings.TrimSuffix(strings.TrimPrefix(section, `remote "`), `"`)
				if _, ok := cfg.Remotes[remoteName]; !ok {
					cfg.Remotes[remoteName] = Remote{}
				}
			}

			continue
		}

		kv := strings.SplitN(line, "=", 2)
		if len(kv) != 2 {
			continue
		}

		key := strings.TrimSpace(kv[0])
		val := strings.TrimSpace(kv[1])

		switch {
		case section == "core" && key == "repositoryformatversion":
			cfg.CoreVersion = val

		case section == "user" && key == "activeUser":
			cfg.ActiveUser = val

		case section == "user" && key == "activeServer":
			cfg.ActiveServer = val

		case remoteName != "":
			r := cfg.Remotes[remoteName]

			switch key {
			case "url":
				r.URL = val
			case "token":
				r.Token = val
			}

			cfg.Remotes[remoteName] = r
		}
	}

	return cfg, scanner.Err()
}

// Save writes the config to .vic/config.
func Save(vicDir string, cfg *Config) error {
	var b strings.Builder

	b.WriteString("[core]\n")
	fmt.Fprintf(&b, "\trepositoryformatversion = %s\n", cfg.CoreVersion)

	if strings.TrimSpace(cfg.ActiveUser) != "" || strings.TrimSpace(cfg.ActiveServer) != "" {
		b.WriteString("\n[user]\n")

		if strings.TrimSpace(cfg.ActiveServer) != "" {
			fmt.Fprintf(&b, "\tactiveServer = %s\n", cfg.ActiveServer)
		}

		if strings.TrimSpace(cfg.ActiveUser) != "" {
			fmt.Fprintf(&b, "\tactiveUser = %s\n", cfg.ActiveUser)
		}
	}

	names := make([]string, 0, len(cfg.Remotes))
	for n := range cfg.Remotes {
		names = append(names, n)
	}
	sort.Strings(names)

	for _, n := range names {
		r := cfg.Remotes[n]

		fmt.Fprintf(&b, "\n[remote %q]\n", n)
		fmt.Fprintf(&b, "\turl = %s\n", r.URL)

		if strings.TrimSpace(r.Token) != "" {
			fmt.Fprintf(&b, "\ttoken = %s\n", r.Token)
		}
	}

	return os.WriteFile(filepath.Join(vicDir, "config"), []byte(b.String()), 0o644)
}
