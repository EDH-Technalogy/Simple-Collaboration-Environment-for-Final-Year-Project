// Package remote implements the HTTP client that talks to the Java VicController.
//
// Endpoint contract (matches VicController exactly):
//
//	GET  /repos/{owner}/{repo}/info/refs
//	     → JSON { "HEAD": "...", "refs": { "refs/heads/main": "sha" } }
//
//	GET  /repos/{owner}/{repo}/objects/{hash}
//	     → raw zlib bytes (application/octet-stream)
//
//	POST /repos/{owner}/{repo}/objects/{hash}
//	     body: raw zlib bytes (application/octet-stream)
//
//	POST /repos/{owner}/{repo}/refs/heads/{branch}
//	     body: JSON { "hash": "sha" }
package remote

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// InfoRefsResponse is the JSON shape returned by GET /info/refs.
type InfoRefsResponse struct {
	HEAD string            `json:"HEAD"`
	Refs map[string]string `json:"refs"`
}

// Client is an HTTP client bound to one repository URL.
type Client struct {
	baseURL string // e.g. "http://localhost:8082/repos/user001/my-repo"
	token   string // Bearer token, may be empty
	http    *http.Client
}

// NewClient creates a client for a specific repository.
// baseURL should be the full repository URL, e.g.:
//
//	http://localhost:8082/repos/alice/my-project
func NewClient(baseURL, token string) *Client {
	return &Client{
		baseURL: strings.TrimRight(strings.TrimSpace(baseURL), "/"),
		token:   token,
		http:    &http.Client{Timeout: 60 * time.Second},
	}
}

// GetInfoRefs fetches the remote ref listing.
// Called as the first step of push, fetch, pull, and clone.
func (c *Client) GetInfoRefs() (*InfoRefsResponse, error) {
	body, err := c.get("/info/refs")
	if err != nil {
		return nil, err
	}
	var resp InfoRefsResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, fmt.Errorf("remote: parse info/refs response: %w", err)
	}
	if resp.Refs == nil {
		resp.Refs = map[string]string{}
	}
	return &resp, nil
}

// HasObject checks whether the remote already stores an object.
// Uses HTTP HEAD so no body is transferred.
func (c *Client) HasObject(hash string) (bool, error) {
	req, err := http.NewRequest(http.MethodHead, c.baseURL+"/objects/"+hash, nil)
	if err != nil {
		return false, err
	}
	c.addAuth(req)
	resp, err := c.http.Do(req)
	if err != nil {
		return false, err
	}
	resp.Body.Close()
	return resp.StatusCode == http.StatusOK, nil
}

// DownloadObject fetches raw zlib-compressed bytes for one object.
func (c *Client) DownloadObject(hash string) ([]byte, error) {
	return c.get("/objects/" + hash)
}

// UploadObject sends raw zlib-compressed bytes to the server.
func (c *Client) UploadObject(hash string, zlibData []byte) error {
	return c.postOctet("/objects/"+hash, zlibData)
}

// UpdateBranchRef advances a branch pointer on the server.
// This is the final step of a push.
func (c *Client) UpdateBranchRef(branch, hash string) error {
	body, err := json.Marshal(map[string]string{"hash": hash})
	if err != nil {
		return err
	}
	return c.postJSON("/refs/heads/"+branch, body)
}

func (c *Client) get(path string) ([]byte, error) {
	req, err := http.NewRequest(http.MethodGet, c.baseURL+path, nil)
	if err != nil {
		return nil, fmt.Errorf("remote: build GET %s: %w", path, err)
	}
	c.addAuth(req)
	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("remote: GET %s: %w", path, err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("remote: GET %s → %d: %s", path, resp.StatusCode, string(b))
	}
	return io.ReadAll(resp.Body)
}

func (c *Client) postOctet(path string, data []byte) error {
	req, err := http.NewRequest(http.MethodPost, c.baseURL+path, bytes.NewReader(data))
	if err != nil {
		return fmt.Errorf("remote: build POST %s: %w", path, err)
	}
	req.Header.Set("Content-Type", "application/octet-stream")
	c.addAuth(req)
	resp, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("remote: POST %s: %w", path, err)
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("remote: POST %s → %d: %s", path, resp.StatusCode, string(b))
	}
	return nil
}

func (c *Client) postJSON(path string, data []byte) error {
	req, err := http.NewRequest(http.MethodPost, c.baseURL+path, bytes.NewReader(data))
	if err != nil {
		return fmt.Errorf("remote: build POST JSON %s: %w", path, err)
	}
	req.Header.Set("Content-Type", "application/json")
	c.addAuth(req)
	resp, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("remote: POST JSON %s: %w", path, err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("remote: POST JSON %s → %d: %s", path, resp.StatusCode, string(b))
	}
	return nil
}

func (c *Client) addAuth(req *http.Request) {
	if c.token != "" {
		req.Header.Set("Authorization", "Bearer "+c.token)
	}
}
