package handler

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/leemwood/tarui-novel-studio/server/model"
)

func HandleExportCursorRules(w http.ResponseWriter, r *http.Request) {
	projectID := r.URL.Query().Get("project_id")
	project, _ := model.GetProject(projectID)
	entities, _ := model.ListEntities(projectID)

	projectName := "Novel Studio"
	if project != nil {
		projectName = project.Name
	}

	content := fmt.Sprintf(`# %s - .cursorrules

## Tech Stack
- Go (backend)
- React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Zustand (state management)
- SQLite (database)

## Project Structure
`, projectName)

	content += "```\nserver/          # Go backend\n  main.go\n  handler/        # HTTP handlers\n  model/          # Data models and DB operations\n  middleware/     # JWT auth\n\n"
	content += "src/             # React frontend\n  types/          # Shared TypeScript types\n  stores/         # Zustand stores\n  components/\n    ui/           # shadcn/ui components\n    layout/       # Sidebar, TopBar\n    chat/         # ChatPanel, MessageBubble\n    entities/     # EntityList, EntityDetail, etc.\n```\n\n"

	content += "## Data Models\n"
	content += "- Project: id, name, description, timestamps\n"
	content += "- Entity: id, project_id, name, type (character/item/location/lore/plot/chapter), content (JSON)\n"
	content += "- Relationship: id, project_id, source, target, type, description\n"
	content += "- Chapter: id, project_id, title, content, number\n"
	content += "- Message: id, project_id, role, content\n"
	content += "- Plan: id, project_id, title, content (Markdown)\n\n"

	content += "## Current Entities\n"
	typeMap := map[string][]model.Entity{}
	for _, e := range entities {
		typeMap[e.EntityType] = append(typeMap[e.EntityType], e)
	}
	for t, items := range typeMap {
		content += fmt.Sprintf("- %s (%d): ", t, len(items))
		names := []string{}
		for _, e := range items {
			names = append(names, e.Name)
		}
		content += strings.Join(names, ", ") + "\n"
	}

	w.Header().Set("Content-Type", "text/markdown; charset=utf-8")
	w.Write([]byte(content))
}

func HandleExportPrompt(w http.ResponseWriter, r *http.Request) {
	projectID := r.URL.Query().Get("project_id")
	project, _ := model.GetProject(projectID)
	entities, _ := model.ListEntities(projectID)

	projectName := "Novel Studio"
	projectDesc := "这是一个小说创作项目。"
	if project != nil {
		projectName = project.Name
		if project.Description != "" {
			projectDesc = project.Description
		}
	}

	content := fmt.Sprintf(`# %s - AI 写作助手 Prompt

## 项目背景
%s

## 项目数据

`, projectName, projectDesc)

	typeMap := map[string][]model.Entity{}
	for _, e := range entities {
		typeMap[e.EntityType] = append(typeMap[e.EntityType], e)
	}

	typeLabels := map[string]string{
		"character": "角色", "item": "道具", "location": "地点",
		"lore": "设定", "plot": "剧情",
	}

	for t, items := range typeMap {
		label := typeLabels[t]
		if label == "" {
			label = t
		}
		content += fmt.Sprintf("### %s\n", label)
		for _, e := range items {
			content += fmt.Sprintf("- %s\n", e.Name)
		}
		content += "\n"
	}

	content += `## 可用的工具

1. **create_entity** - 创建新的实体（角色/道具/地点等）
2. **update_entity** - 更新已有实体信息
3. **create_relationship** - 创建实体间关系
4. **generate_plan** - 根据项目数据生成开发计划

## 输出格式

请使用 Markdown 格式回复，支持代码块、表格、列表等。
`

	w.Header().Set("Content-Type", "text/markdown; charset=utf-8")
	w.Write([]byte(content))
}
