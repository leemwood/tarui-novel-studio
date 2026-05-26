package handler

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/leemwood/tarui-novel-studio/server/model"
)

// Helper: write JSON response
func jsonResp(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

// Helper: write error response
func errResp(w http.ResponseWriter, msg string, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"error": msg})
}

// Helper: extract ID from URL path, e.g. /api/projects/{id}
func extractID(path, prefix string) string {
	s := strings.TrimPrefix(path, prefix)
	s = strings.TrimLeft(s, "/")
	// handle /api/projects/xxx/messages type paths
	if idx := strings.Index(s, "/"); idx > 0 {
		s = s[:idx]
	}
	return s
}

// ─── Projects ────────────────────────────────────────────────

func HandleProjects(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		projects, err := model.ListProjects()
		if err != nil {
			errResp(w, err.Error(), 500)
			return
		}
		jsonResp(w, projects)
	case http.MethodPost:
		var body struct {
			Name        string `json:"name"`
			Description string `json:"description"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			errResp(w, "invalid body", 400)
			return
		}
		project, err := model.CreateProject(body.Name, body.Description)
		if err != nil {
			errResp(w, err.Error(), 500)
			return
		}
		jsonResp(w, project)
	default:
		errResp(w, "method not allowed", 405)
	}
}

func HandleProject(w http.ResponseWriter, r *http.Request) {
	id := extractID(r.URL.Path, "/api/projects/")
	switch r.Method {
	case http.MethodGet:
		p, err := model.GetProject(id)
		if err != nil {
			errResp(w, "not found", 404)
			return
		}
		jsonResp(w, p)
	case http.MethodPut:
		var body struct {
			Name        string `json:"name"`
			Description string `json:"description"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			errResp(w, "invalid body", 400)
			return
		}
		p, err := model.UpdateProject(id, body.Name, body.Description)
		if err != nil {
			errResp(w, err.Error(), 500)
			return
		}
		jsonResp(w, p)
	case http.MethodDelete:
		if err := model.DeleteProject(id); err != nil {
			errResp(w, err.Error(), 500)
			return
		}
		jsonResp(w, map[string]string{"status": "deleted"})
	default:
		errResp(w, "method not allowed", 405)
	}
}

// ─── Entities ─────────────────────────────────────────────────

func HandleEntities(w http.ResponseWriter, r *http.Request) {
	projectID := r.URL.Query().Get("project_id")
	switch r.Method {
	case http.MethodGet:
		if projectID == "" {
			errResp(w, "project_id required", 400)
			return
		}
		entities, err := model.ListEntities(projectID)
		if err != nil {
			errResp(w, err.Error(), 500)
			return
		}
		jsonResp(w, entities)
	case http.MethodPost:
		var body struct {
			ProjectID  string `json:"project_id"`
			Name       string `json:"name"`
			EntityType string `json:"entity_type"`
			Content    string `json:"content"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			errResp(w, "invalid body", 400)
			return
		}
		e, err := model.CreateEntity(body.ProjectID, body.Name, body.EntityType, body.Content)
		if err != nil {
			errResp(w, err.Error(), 500)
			return
		}
		jsonResp(w, e)
	default:
		errResp(w, "method not allowed", 405)
	}
}

func HandleEntity(w http.ResponseWriter, r *http.Request) {
	id := extractID(r.URL.Path, "/api/entities/")
	switch r.Method {
	case http.MethodGet:
		e, err := model.GetEntity(id)
		if err != nil {
			errResp(w, "not found", 404)
			return
		}
		jsonResp(w, e)
	case http.MethodPut:
		var body struct {
			Name       string `json:"name"`
			EntityType string `json:"entity_type"`
			Content    string `json:"content"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			errResp(w, "invalid body", 400)
			return
		}
		e, err := model.UpdateEntity(id, body.Name, body.EntityType, body.Content)
		if err != nil {
			errResp(w, err.Error(), 500)
			return
		}
		jsonResp(w, e)
	case http.MethodDelete:
		if err := model.DeleteEntity(id); err != nil {
			errResp(w, err.Error(), 500)
			return
		}
		jsonResp(w, map[string]string{"status": "deleted"})
	default:
		errResp(w, "method not allowed", 405)
	}
}

// ─── Relationships ───────────────────────────────────────────

func HandleRelationships(w http.ResponseWriter, r *http.Request) {
	projectID := r.URL.Query().Get("project_id")
	switch r.Method {
	case http.MethodGet:
		if projectID == "" {
			errResp(w, "project_id required", 400)
			return
		}
		rels, err := model.ListRelationships(projectID)
		if err != nil {
			errResp(w, err.Error(), 500)
			return
		}
		jsonResp(w, rels)
	case http.MethodPost:
		var body struct {
			ProjectID      string `json:"project_id"`
			SourceEntityID string `json:"source_entity_id"`
			TargetEntityID string `json:"target_entity_id"`
			Type           string `json:"relationship_type"`
			Description    string `json:"description"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			errResp(w, "invalid body", 400)
			return
		}
		rel, err := model.CreateRelationship(body.ProjectID, body.SourceEntityID, body.TargetEntityID, body.Type, body.Description)
		if err != nil {
			errResp(w, err.Error(), 500)
			return
		}
		jsonResp(w, rel)
	default:
		errResp(w, "method not allowed", 405)
	}
}

// ─── Chapters ────────────────────────────────────────────────

func HandleChapters(w http.ResponseWriter, r *http.Request) {
	projectID := r.URL.Query().Get("project_id")
	switch r.Method {
	case http.MethodGet:
		if projectID == "" {
			errResp(w, "project_id required", 400)
			return
		}
		chapters, err := model.ListChapters(projectID)
		if err != nil {
			errResp(w, err.Error(), 500)
			return
		}
		jsonResp(w, chapters)
	case http.MethodPost:
		var body struct {
			ProjectID     string `json:"project_id"`
			Title         string `json:"title"`
			Content       string `json:"content"`
			ChapterNumber int    `json:"chapter_number"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			errResp(w, "invalid body", 400)
			return
		}
		c, err := model.CreateChapter(body.ProjectID, body.Title, body.Content, body.ChapterNumber)
		if err != nil {
			errResp(w, err.Error(), 500)
			return
		}
		jsonResp(w, c)
	default:
		errResp(w, "method not allowed", 405)
	}
}

// ─── Messages ────────────────────────────────────────────────

func HandleMessages(w http.ResponseWriter, r *http.Request) {
	projectID := r.URL.Query().Get("project_id")
	switch r.Method {
	case http.MethodGet:
		if projectID == "" {
			errResp(w, "project_id required", 400)
			return
		}
		sessionID := r.URL.Query().Get("session_id")
		if sessionID != "" {
			msgs, err := model.ListMessages(projectID)
			if err != nil {
				errResp(w, err.Error(), 500)
				return
			}
			var filtered []model.Message
			for _, m := range msgs {
				if m.SessionID == sessionID {
					filtered = append(filtered, m)
				}
			}
			if filtered == nil {
				filtered = []model.Message{}
			}
			jsonResp(w, filtered)
			return
		}
		msgs, err := model.ListMessages(projectID)
		if err != nil {
			errResp(w, err.Error(), 500)
			return
		}
		jsonResp(w, msgs)
	case http.MethodPost:
		var body struct {
			ProjectID string `json:"project_id"`
			Role      string `json:"role"`
			Content   string `json:"content"`
			SessionID string `json:"session_id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			errResp(w, "invalid body", 400)
			return
		}
		m, err := model.SaveMessage(body.ProjectID, body.Role, body.Content, body.SessionID)
		if err != nil {
			errResp(w, err.Error(), 500)
			return
		}
		jsonResp(w, m)
	case http.MethodDelete:
		if projectID == "" {
			errResp(w, "project_id required", 400)
			return
		}
		if err := model.ClearMessages(projectID); err != nil {
			errResp(w, err.Error(), 500)
			return
		}
		jsonResp(w, map[string]string{"status": "cleared"})
	default:
		errResp(w, "method not allowed", 405)
	}
}

// ─── Plans ───────────────────────────────────────────────────

func HandlePlans(w http.ResponseWriter, r *http.Request) {
	projectID := r.URL.Query().Get("project_id")
	switch r.Method {
	case http.MethodGet:
		if projectID == "" {
			errResp(w, "project_id required", 400)
			return
		}
		plans, err := model.ListPlans(projectID)
		if err != nil {
			errResp(w, err.Error(), 500)
			return
		}
		jsonResp(w, plans)
	case http.MethodPost:
		var body struct {
			ProjectID string `json:"project_id"`
			Title     string `json:"title"`
			Content   string `json:"content"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			errResp(w, "invalid body", 400)
			return
		}
		p, err := model.SavePlan(body.ProjectID, body.Title, body.Content)
		if err != nil {
			errResp(w, err.Error(), 500)
			return
		}
		jsonResp(w, p)
	default:
		errResp(w, "method not allowed", 405)
	}
}
