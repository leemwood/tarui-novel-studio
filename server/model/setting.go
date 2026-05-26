package model

import (
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type Setting struct {
	ID          int    `json:"id"`
	APIProvider string `json:"api_provider"`
	APIKey      string `json:"api_key,omitempty"`
	APIModel    string `json:"api_model"`
	APIBaseURL  string `json:"api_base_url"`
	ThinkingMode bool `json:"thinking_mode"`
}

func init() {
	// called from migrate() - add table creation
}

func GetSettings() (*Setting, error) {
	var s Setting
	err := DB.QueryRow("SELECT id, api_provider, api_key, api_model, api_base_url, thinking_mode FROM settings LIMIT 1").
		Scan(&s.ID, &s.APIProvider, &s.APIKey, &s.APIModel, &s.APIBaseURL, &s.ThinkingMode)
	if err != nil {
		return &Setting{
			APIProvider: "deepseek",
			APIModel:    "deepseek-v4-flash",
			APIBaseURL:  "https://api.deepseek.com/v1",
			ThinkingMode: false,
		}, nil
	}
	return &s, nil
}

func SaveSettings(provider, apiKey, model, baseURL string, thinkingMode bool) (*Setting, error) {
	var count int
	DB.QueryRow("SELECT COUNT(*) FROM settings").Scan(&count)
	if count == 0 {
		_, err := DB.Exec(
			"INSERT INTO settings (api_provider, api_key, api_model, api_base_url, thinking_mode) VALUES (?, ?, ?, ?, ?)",
			provider, apiKey, model, baseURL, thinkingMode,
		)
		if err != nil {
			return nil, err
		}
	} else {
		_, err := DB.Exec(
			"UPDATE settings SET api_provider = ?, api_key = ?, api_model = ?, api_base_url = ?, thinking_mode = ? WHERE id = 1",
			provider, apiKey, model, baseURL, thinkingMode,
		)
		if err != nil {
			return nil, err
		}
	}
	return GetSettings()
}

func TestConnection(provider, apiKey, model, baseURL string) error {
	url := strings.TrimRight(baseURL, "/") + "/chat/completions"
	body := fmt.Sprintf(`{
		"model": "%s",
		"messages": [{"role": "user", "content": "hi"}],
		"max_tokens": 1
	}`, model)

	req, err := http.NewRequest("POST", url, strings.NewReader(body))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("connection failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 200 {
		return fmt.Errorf("API returned %d: %s", resp.StatusCode, string(respBody))
	}

	return nil
}
