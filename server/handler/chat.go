package handler

import (
	"encoding/json"
	"net/http"

	"github.com/leemwood/tarui-novel-studio/server/model"
)

type chatBody struct {
	ProjectID string `json:"project_id"`
	Message   string `json:"message"`
}

type chatHistoryBody struct {
	ProjectID string              `json:"project_id"`
	Message   string              `json:"message"`
	History   []model.ChatMessage `json:"history"`
}

func HandleChat(w http.ResponseWriter, r *http.Request) {
	// First try with history, then without
	var body chatHistoryBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		errResp(w, "invalid body", 400)
		return
	}
	if body.ProjectID == "" || body.Message == "" {
		errResp(w, "project_id and message required", 400)
		return
	}

	// Save user message
	model.SaveMessage(body.ProjectID, "user", body.Message, "")

	// Process chat
	result, err := model.ProcessChat(body.ProjectID, body.Message, body.History)
	if err != nil {
		errResp(w, err.Error(), 500)
		return
	}

	jsonResp(w, result)
}
