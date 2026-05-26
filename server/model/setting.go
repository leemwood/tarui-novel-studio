package model

type Setting struct {
	ID          int    `json:"id"`
	APIProvider string `json:"api_provider"`
	APIKey      string `json:"api_key,omitempty"`
	APIModel    string `json:"api_model"`
	APIBaseURL  string `json:"api_base_url"`
}

func init() {
	// called from migrate() - add table creation
}

func GetSettings() (*Setting, error) {
	var s Setting
	err := DB.QueryRow("SELECT id, api_provider, api_key, api_model, api_base_url FROM settings LIMIT 1").
		Scan(&s.ID, &s.APIProvider, &s.APIKey, &s.APIModel, &s.APIBaseURL)
	if err != nil {
		// Return defaults if no settings row
		return &Setting{
			APIProvider: "openai",
			APIModel:    "gpt-4o",
			APIBaseURL:  "https://api.openai.com/v1",
		}, nil
	}
	return &s, nil
}

func SaveSettings(provider, apiKey, model, baseURL string) (*Setting, error) {
	// Upsert - always update the single row
	var count int
	DB.QueryRow("SELECT COUNT(*) FROM settings").Scan(&count)
	if count == 0 {
		_, err := DB.Exec(
			"INSERT INTO settings (api_provider, api_key, api_model, api_base_url) VALUES (?, ?, ?, ?)",
			provider, apiKey, model, baseURL,
		)
		if err != nil {
			return nil, err
		}
	} else {
		_, err := DB.Exec(
			"UPDATE settings SET api_provider = ?, api_key = ?, api_model = ?, api_base_url = ? WHERE id = 1",
			provider, apiKey, model, baseURL,
		)
		if err != nil {
			return nil, err
		}
	}
	return GetSettings()
}
