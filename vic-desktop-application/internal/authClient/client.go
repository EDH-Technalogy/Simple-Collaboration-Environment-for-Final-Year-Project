package authclient

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type Client struct {
	baseURL string
	http    *http.Client
}

func New(serverURL string) *Client {
	return &Client{
		baseURL: strings.TrimRight(strings.TrimSpace(serverURL), "/"),
		http:    &http.Client{Timeout: 30 * time.Second},
	}
}

func (c *Client) Login(identifier, password string) (*LoginResponse, error) {
	body, err := json.Marshal(LoginRequest{
		UsernameOrEmail: strings.TrimSpace(identifier),
		Password:        password,
		RememberMe:      true,
	})
	if err != nil {
		return nil, fmt.Errorf("auth: marshal: %w", err)
	}
	req, err := http.NewRequest(http.MethodPost, c.baseURL+"/auth/login", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("auth: build request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("auth: send: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(resp.Body)
		return nil, loginStatusError(resp.StatusCode, b)
	}
	var out LoginResponse
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, fmt.Errorf("auth: decode: %w", err)
	}
	if strings.TrimSpace(out.AccessToken) == "" {
		return nil, fmt.Errorf("auth: empty access token")
	}
	if strings.TrimSpace(out.RefreshToken) == "" {
		return nil, fmt.Errorf("auth: empty refresh token")
	}

	return &out, nil
}

func loginStatusError(statusCode int, body []byte) error {
	var payload struct {
		Error string `json:"error"`
		Path  string `json:"path"`
	}
	_ = json.Unmarshal(body, &payload)

	if statusCode == http.StatusServiceUnavailable {
		if payload.Error == "" {
			payload.Error = "Service Unavailable"
		}
		if payload.Path == "" {
			payload.Path = "/auth/login"
		}
		return fmt.Errorf("auth service unavailable at %s (%d %s); make sure the backend auth service and its dependencies are running", payload.Path, statusCode, payload.Error)
	}

	return fmt.Errorf("auth: login failed (status %d): %s", statusCode, string(body))
}
func (c *Client) Refresh(refreshToken string) (*LoginResponse, error) {
	body, err := json.Marshal(map[string]string{
		"refresh_token": refreshToken,
	})
	if err != nil {
		return nil, fmt.Errorf("auth: marshal refresh: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, c.baseURL+"/auth/refresh", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("auth: build refresh request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("auth: refresh send: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("auth: refresh failed: %s", string(b))
	}

	var out LoginResponse
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, fmt.Errorf("auth: refresh decode: %w", err)
	}

	if strings.TrimSpace(out.AccessToken) == "" {
		return nil, fmt.Errorf("auth: refresh returned empty access token")
	}

	if strings.TrimSpace(out.RefreshToken) == "" {
		out.RefreshToken = refreshToken
	}

	return &out, nil
}
