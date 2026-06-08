package session

import (
	"encoding/json"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	authclient "github.com/elyasahmadi/vic/internal/authClient"
	"github.com/elyasahmadi/vic/internal/config"
)

type SessionEntry struct {
	ServerURL    string          `json:"server_url"`
	AccessToken  string          `json:"access_token"`
	RefreshToken string          `json:"refresh_token"`
	ExpiresAt    int64           `json:"expires_at"`
	TokenType    string          `json:"token_type"`
	User         authclient.User `json:"user"`
}

type sessions map[string]SessionEntry

func (e SessionEntry) ExpiredSoon() bool {
	return time.Now().Unix() >= e.ExpiresAt-30
}

func sessionKey(serverURL, username string) string {
	return NormalizeServerURL(serverURL) + "|" + strings.ToLower(strings.TrimSpace(username))
}

func usernameOf(user authclient.User) string {
	if strings.TrimSpace(user.UserName) != "" {
		return strings.TrimSpace(user.UserName)
	}
	return strings.TrimSpace(user.Email)
}

func sessionFile() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}

	dir := filepath.Join(home, ".vic-cli")
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return "", err
	}

	return filepath.Join(dir, "sessions.json"), nil
}

func FromLoginResponse(serverURL string, resp *authclient.LoginResponse) SessionEntry {
	return SessionEntry{
		ServerURL:    NormalizeServerURL(serverURL),
		AccessToken:  resp.AccessToken,
		RefreshToken: resp.RefreshToken,
		TokenType:    resp.TokenType,
		ExpiresAt:    time.Now().Unix() + resp.ExpiresIn,
		User:         resp.User,
	}
}

func load() (sessions, error) {
	path, err := sessionFile()
	if err != nil {
		return nil, err
	}

	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			legacyData, legacyErr := readLegacySessionFile()
			if legacyErr != nil {
				return nil, legacyErr
			}
			if len(strings.TrimSpace(string(legacyData))) == 0 {
				return sessions{}, nil
			}
			data = legacyData
		} else {
			return nil, err
		}
	}
	if strings.TrimSpace(string(data)) == "" {
		return sessions{}, nil
	}

	var s sessions
	if err := json.Unmarshal(data, &s); err != nil {
		return nil, fmt.Errorf("session: invalid session file: %w", err)
	}

	if s == nil {
		s = sessions{}
	}

	return s, nil
}

func readLegacySessionFile() ([]byte, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return nil, err
	}
	legacyPath := filepath.Join(home, ".vic", "sessions.json")
	data, err := os.ReadFile(legacyPath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, err
	}
	return data, nil
}

func save(s sessions) error {
	path, err := sessionFile()
	if err != nil {
		return err
	}

	data, err := json.MarshalIndent(s, "", "  ")
	if err != nil {
		return fmt.Errorf("session: marshal: %w", err)
	}

	return os.WriteFile(path, data, 0o600)
}

func Set(serverURL string, entry SessionEntry) error {
	serverURL = NormalizeServerURL(serverURL)
	entry.ServerURL = serverURL

	username := usernameOf(entry.User)
	if username == "" {
		return fmt.Errorf("session: login response has no username/email")
	}

	s, err := load()
	if err != nil {
		return err
	}

	s[sessionKey(serverURL, username)] = entry
	return save(s)
}

func GetForUser(serverURL, username string) (SessionEntry, bool, error) {
	s, err := load()
	if err != nil {
		return SessionEntry{}, false, err
	}

	entry, ok := s[sessionKey(serverURL, username)]
	return entry, ok, nil
}

func Delete(serverURL string) error {
	serverURL = NormalizeServerURL(serverURL)

	s, err := load()
	if err != nil {
		return err
	}

	prefix := serverURL + "|"
	for key := range s {
		if strings.HasPrefix(key, prefix) {
			delete(s, key)
		}
	}

	return save(s)
}

func DeleteForUser(serverURL, username string) error {
	s, err := load()
	if err != nil {
		return err
	}

	delete(s, sessionKey(serverURL, username))
	return save(s)
}

func List() (map[string]SessionEntry, error) {
	s, err := load()
	if err != nil {
		return nil, err
	}
	return s, nil
}

func NormalizeServerURL(raw string) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return ""
	}

	u, err := url.Parse(raw)
	if err != nil || u.Scheme == "" || u.Host == "" {
		return raw
	}

	return u.Scheme + "://" + u.Host
}

func ServerBaseFromRemote(remoteURL string) (string, error) {
	remoteURL = strings.TrimSpace(remoteURL)
	if remoteURL == "" {
		return "", fmt.Errorf("session: empty remote URL")
	}

	u, err := url.Parse(remoteURL)
	if err != nil {
		return "", fmt.Errorf("session: parse %q: %w", remoteURL, err)
	}

	if u.Scheme == "" || u.Host == "" {
		return "", fmt.Errorf("session: invalid remote URL %q", remoteURL)
	}

	return u.Scheme + "://" + u.Host, nil
}

func EnsureValidSessionForUser(serverURL, username string) (SessionEntry, error) {
	serverURL = NormalizeServerURL(serverURL)

	entry, found, err := GetForUser(serverURL, username)
	if err != nil {
		return SessionEntry{}, err
	}

	if !found {
		return SessionEntry{}, fmt.Errorf("not logged in as %s on %s", username, serverURL)
	}

	if entry.ExpiredSoon() {
		client := authclient.New(serverURL)

		resp, err := client.Refresh(entry.RefreshToken)
		if err != nil {
			return SessionEntry{}, fmt.Errorf("session expired; please login again")
		}

		entry = FromLoginResponse(serverURL, resp)
		if err := Set(serverURL, entry); err != nil {
			return SessionEntry{}, err
		}

		fmt.Println("session refreshed")
	}

	return entry, nil
}

func CurrentSession(vicDir string) (SessionEntry, bool, error) {
	cfg, err := config.Load(vicDir)
	if err != nil {
		return SessionEntry{}, false, err
	}

	if cfg.ActiveServer == "" || cfg.ActiveUser == "" {
		return SessionEntry{}, false, nil
	}

	entry, err := EnsureValidSessionForUser(cfg.ActiveServer, cfg.ActiveUser)
	if err != nil {
		return SessionEntry{}, false, err
	}

	return entry, true, nil
}

func CurrentUser(vicDir string) (authclient.User, bool, error) {
	entry, ok, err := CurrentSession(vicDir)
	if err != nil {
		return authclient.User{}, false, err
	}
	if !ok {
		return authclient.User{}, false, nil
	}
	return entry.User, true, nil
}
