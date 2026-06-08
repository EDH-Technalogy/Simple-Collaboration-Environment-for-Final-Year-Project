package wsclient

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// Client represents a WebSocket connection to the VIC server
type Client struct {
	conn      *websocket.Conn
	serverURL string
	token     string
	mu        sync.Mutex
	handlers  map[string]MessageHandler
	done      chan struct{}
}

// Message represents a WebSocket message from the server
type Message struct {
	Type       string          `json:"type"`
	Repository string          `json:"repository"`
	Branch     string          `json:"branch"`
	User       string          `json:"user"`
	Payload    json.RawMessage `json:"payload"`
	Timestamp  time.Time       `json:"timestamp"`
	MessageID  string          `json:"messageId"`
}

// MessageHandler is a callback for handling specific message types
type MessageHandler func(msg Message)

// NewClient creates a new WebSocket client
func NewClient(serverURL, token string) *Client {
	return &Client{
		serverURL: serverURL,
		token:     token,
		handlers:  make(map[string]MessageHandler),
		done:      make(chan struct{}),
	}
}

// Connect establishes a WebSocket connection
func (c *Client) Connect() error {
	u, err := url.Parse(c.serverURL)
	if err != nil {
		return fmt.Errorf("parse URL: %w", err)
	}

	// Convert HTTP to WS
	switch u.Scheme {
	case "http":
		u.Scheme = "ws"
	case "https":
		u.Scheme = "wss"
	}

	u.Path = "/ws/native"
	q := u.Query()
	q.Set("token", c.token)
	u.RawQuery = q.Encode()

	header := http.Header{}
	header.Set("Authorization", "Bearer "+c.token)

	c.conn, _, err = websocket.DefaultDialer.Dial(u.String(), header)
	if err != nil {
		return fmt.Errorf("dial: %w", err)
	}

	// Start reading messages
	go c.readLoop()

	return nil
}

// Subscribe to a repository channel
func (c *Client) Subscribe(owner, repo string) error {
	msg := map[string]string{
		"type":    "subscribe",
		"channel": fmt.Sprintf("/repo/%s/%s/push", owner, repo),
	}

	return c.sendJSON(msg)
}

// RegisterHandler registers a handler for a specific message type
func (c *Client) RegisterHandler(msgType string, handler MessageHandler) {
	c.handlers[msgType] = handler
}

// Close closes the WebSocket connection
func (c *Client) Close() error {
	close(c.done)
	return c.conn.Close()
}

// readLoop continuously reads messages from the WebSocket
func (c *Client) readLoop() {
	defer c.conn.Close()

	for {
		select {
		case <-c.done:
			return
		default:
			_, message, err := c.conn.ReadMessage()
			if err != nil {
				log.Printf("read error: %v", err)
				return
			}

			var msg Message
			if err := json.Unmarshal(message, &msg); err != nil {
				log.Printf("unmarshal error: %v", err)
				continue
			}

			// Dispatch to registered handler
			if handler, ok := c.handlers[msg.Type]; ok {
				handler(msg)
			}
		}
	}
}

// sendJSON sends a JSON message
func (c *Client) sendJSON(v interface{}) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.conn.WriteJSON(v)
}

// Ping sends a ping message to keep the connection alive
func (c *Client) Ping() error {
	return c.sendJSON(map[string]string{"type": "ping"})
}
