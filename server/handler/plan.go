package handler

import (
	"encoding/json"
	"net/http"

	"github.com/leemwood/tarui-novel-studio/server/model"
)

type planGenBody struct {
	ProjectID string `json:"project_id"`
	Title     string `json:"title"`
}

type planGenResponse struct {
	ID      string `json:"id"`
	Title   string `json:"title"`
	Content string `json:"content"`
}

func HandleGeneratePlan(w http.ResponseWriter, r *http.Request) {
	var body planGenBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		errResp(w, "invalid body", 400)
		return
	}
	if body.ProjectID == "" {
		errResp(w, "project_id required", 400)
		return
	}
	if body.Title == "" {
		body.Title = "开发计划"
	}

	content := model.GeneratePlan(body.ProjectID, body.Title)
	plan, err := model.SavePlan(body.ProjectID, body.Title, content)
	if err != nil {
		errResp(w, err.Error(), 500)
		return
	}

	jsonResp(w, planGenResponse{
		ID:      plan.ID,
		Title:   plan.Title,
		Content: plan.Content,
	})
}
