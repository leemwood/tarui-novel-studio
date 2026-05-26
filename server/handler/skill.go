package handler

import (
	"encoding/json"
	"net/http"
	"os/exec"

	"github.com/leemwood/tarui-novel-studio/server/model"
)

func HandleListSkills(w http.ResponseWriter, r *http.Request) {
	skills, err := model.ListSkills()
	if err != nil {
		errResp(w, err.Error(), 500)
		return
	}
	jsonResp(w, skills)
}

type installSkillBody struct {
	Slug string `json:"slug"`
}

func HandleInstallSkill(w http.ResponseWriter, r *http.Request) {
	var body installSkillBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		errResp(w, "invalid body", 400)
		return
	}
	if body.Slug == "" {
		errResp(w, "slug required", 400)
		return
	}

	// Find skillhub binary
	skillhubPaths := []string{
		"/data/data/com.termux/files/home/.local/bin/skillhub",
		"skillhub",
	}
	var cmd *exec.Cmd
	for _, p := range skillhubPaths {
		if _, err := exec.LookPath(p); err == nil {
			cmd = exec.Command(p, "install", body.Slug)
			break
		}
	}
	if cmd == nil {
		errResp(w, "skillhub not found", 500)
		return
	}

	output, err := cmd.CombinedOutput()
	if err != nil {
		errResp(w, string(output), 500)
		return
	}

	jsonResp(w, map[string]string{"status": "installed", "slug": body.Slug, "output": string(output)})
}

type runSkillBody struct {
	Slug  string `json:"slug"`
	Input string `json:"input"`
}

func HandleRunSkill(w http.ResponseWriter, r *http.Request) {
	var body runSkillBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		errResp(w, "invalid body", 400)
		return
	}
	if body.Slug == "" {
		errResp(w, "slug required", 400)
		return
	}

	result, err := model.RunSkill(body.Slug, body.Input)
	if err != nil {
		errResp(w, err.Error(), 500)
		return
	}

	jsonResp(w, result)
}

func HandleSearchSkills(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		errResp(w, "query required", 400)
		return
	}

	skillhubPaths := []string{
		"/data/data/com.termux/files/home/.local/bin/skillhub",
		"skillhub",
	}
	var cmd *exec.Cmd
	for _, p := range skillhubPaths {
		if _, err := exec.LookPath(p); err == nil {
			cmd = exec.Command(p, "search", query)
			break
		}
	}
	if cmd == nil {
		errResp(w, "skillhub not found", 500)
		return
	}

	output, err := cmd.CombinedOutput()
	if err != nil {
		errResp(w, string(output), 500)
		return
	}

	jsonResp(w, map[string]string{"output": string(output)})
}
