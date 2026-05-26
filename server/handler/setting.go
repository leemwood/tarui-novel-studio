package handler

import (
	"encoding/json"
	"net/http"

	"github.com/leemwood/tarui-novel-studio/server/model"
)

type settingBody struct {
	APIProvider string `json:"api_provider"`
	APIKey      string `json:"api_key"`
	APIModel    string `json:"api_model"`
	APIBaseURL  string `json:"api_base_url"`
}

func HandleGetSettings(w http.ResponseWriter, r *http.Request) {
	s, err := model.GetSettings()
	if err != nil {
		errResp(w, err.Error(), 500)
		return
	}
	// Never return the actual API key to frontend
	s.APIKey = ""
	jsonResp(w, s)
}

func HandleSaveSettings(w http.ResponseWriter, r *http.Request) {
	var body settingBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		errResp(w, "invalid body", 400)
		return
	}
	s, err := model.SaveSettings(body.APIProvider, body.APIKey, body.APIModel, body.APIBaseURL)
	if err != nil {
		errResp(w, err.Error(), 500)
		return
	}
	s.APIKey = "" // never return key
	jsonResp(w, s)
}
