package handler

import (
	"encoding/json"
	"net/http"

	"github.com/leemwood/tarui-novel-studio/server/model"
)

type sessionBody struct {
	ProjectID string `json:"project_id"`
	Title     string `json:"title"`
}

func HandleListSessions(w http.ResponseWriter, r *http.Request) {
	projectID := r.URL.Query().Get("project_id")
	if projectID == "" {
		errResp(w, "project_id required", 400)
		return
	}
	sessions, err := model.ListSessions(projectID)
	if err != nil {
		errResp(w, err.Error(), 500)
		return
	}
	jsonResp(w, sessions)
}

func HandleCreateSession(w http.ResponseWriter, r *http.Request) {
	var body sessionBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		errResp(w, "invalid body", 400)
		return
	}
	if body.ProjectID == "" {
		errResp(w, "project_id required", 400)
		return
	}
	if body.Title == "" {
		body.Title = "新会话"
	}
	s, err := model.CreateSession(body.ProjectID, body.Title)
	if err != nil {
		errResp(w, err.Error(), 500)
		return
	}
	jsonResp(w, s)
}

func HandleRenameSession(w http.ResponseWriter, r *http.Request) {
	id := extractID(r.URL.Path, "/api/sessions/")
	var body struct {
		Title string `json:"title"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		errResp(w, "invalid body", 400)
		return
	}
	s, err := model.RenameSession(id, body.Title)
	if err != nil {
		errResp(w, err.Error(), 500)
		return
	}
	jsonResp(w, s)
}

func HandleDeleteSession(w http.ResponseWriter, r *http.Request) {
	id := extractID(r.URL.Path, "/api/sessions/")
	if err := model.DeleteSession(id); err != nil {
		errResp(w, err.Error(), 500)
		return
	}
	jsonResp(w, map[string]string{"status": "deleted"})
}

type searchBody struct {
	ProjectID string `json:"project_id"`
	Query     string `json:"query"`
}

func HandleSearchMessages(w http.ResponseWriter, r *http.Request) {
	var body searchBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		errResp(w, "invalid body", 400)
		return
	}
	if body.ProjectID == "" || body.Query == "" {
		errResp(w, "project_id and query required", 400)
		return
	}
	msgs, err := model.SearchMessages(body.ProjectID, body.Query)
	if err != nil {
		errResp(w, err.Error(), 500)
		return
	}
	jsonResp(w, msgs)
}
