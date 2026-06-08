package app

import (
	"github.com/elyasahmadi/vic/internal/authClient"
	"github.com/elyasahmadi/vic/internal/config"
	"github.com/elyasahmadi/vic/internal/session"
)

type DesktopSession struct {
	ServerURL    string       `json:"serverUrl"`
	AccessToken  string       `json:"accessToken"`
	RefreshToken string       `json:"refreshToken"`
	TokenType    string       `json:"tokenType"`
	ExpiresAt    int64        `json:"expiresAt"`
	Profile      *UserProfile `json:"profile"`
}

func Login(repoPath, serverURL, identifier, password string) error {
	_, err := LoginWithSession(repoPath, serverURL, identifier, password)
	return err
}

func LoginWithSession(repoPath, serverURL, identifier, password string) (*DesktopSession, error) {
	serverURL = session.NormalizeServerURL(serverURL)
	client := authclient.New(serverURL)
	resp, err := client.Login(identifier, password)
	if err != nil {
		return nil, err
	}
	entry := session.FromLoginResponse(serverURL, resp)
	if err := session.Set(serverURL, entry); err != nil {
		return nil, err
	}
	if _, vicDir, err := repoDirs(repoPath); err == nil {
		cfg, err := config.Load(vicDir)
		if err != nil {
			return nil, err
		}
		cfg.ActiveServer = serverURL
		cfg.ActiveUser = entry.User.UserName
		if cfg.ActiveUser == "" {
			cfg.ActiveUser = entry.User.Email
		}
		if err := config.Save(vicDir, cfg); err != nil {
			return nil, err
		}
	}
	return desktopSessionFromEntry(entry), nil
}

func Logout(serverURL string) error {
	return session.Delete(session.NormalizeServerURL(serverURL))
}

func ListDesktopSessions() ([]DesktopSession, error) {
	entries, err := session.List()
	if err != nil {
		return nil, err
	}
	result := make([]DesktopSession, 0, len(entries))
	for _, entry := range entries {
		result = append(result, *desktopSessionFromEntry(entry))
	}
	return result, nil
}

func desktopSessionFromEntry(entry session.SessionEntry) *DesktopSession {
	return &DesktopSession{
		ServerURL:    entry.ServerURL,
		AccessToken:  entry.AccessToken,
		RefreshToken: entry.RefreshToken,
		TokenType:    entry.TokenType,
		ExpiresAt:    entry.ExpiresAt,
		Profile:      profileFromUser(entry.User),
	}
}
