package model

import (
	"encoding/json"
	"fmt"
	"strings"
)

func GeneratePlan(projectID, title string) string {
	project, _ := GetProject(projectID)
	entities, _ := ListEntities(projectID)
	relationships, _ := ListRelationships(projectID)
	chapters, _ := ListChapters(projectID)

	var b strings.Builder

	projectName := "未命名项目"
	projectDesc := ""
	if project != nil {
		projectName = project.Name
		projectDesc = project.Description
	}

	b.WriteString(fmt.Sprintf("# %s - %s\n\n", projectName, title))
	if projectDesc != "" {
		b.WriteString(fmt.Sprintf("> %s\n\n", projectDesc))
	}

	// Entity summary by type
	typeMap := map[string][]Entity{}
	for _, e := range entities {
		typeMap[e.EntityType] = append(typeMap[e.EntityType], e)
	}

	typeLabels := map[string]string{
		"character": "角色", "item": "道具", "location": "地点",
		"lore": "设定", "plot": "剧情", "chapter": "章节",
	}

	b.WriteString("## 数据概览\n\n")
	b.WriteString("| 类型 | 数量 |\n|------|------|\n")
	for _, t := range []string{"character", "item", "location", "lore", "plot", "chapter"} {
		label := typeLabels[t]
		count := len(typeMap[t])
		b.WriteString(fmt.Sprintf("| %s | %d |\n", label, count))
	}
	b.WriteString("\n")

	// Detail by type
	for _, t := range []string{"character", "item", "location", "lore", "plot"} {
		items := typeMap[t]
		if len(items) == 0 {
			continue
		}
		label := typeLabels[t]
		b.WriteString(fmt.Sprintf("## %s (%d)\n\n", label, len(items)))
		for _, item := range items {
			b.WriteString(fmt.Sprintf("- **%s**\n", item.Name))
			// Try to extract description from content JSON
			var contentMap map[string]interface{}
			if json.Unmarshal([]byte(item.Content), &contentMap) == nil {
				if desc, ok := contentMap["description"].(string); ok && desc != "" {
					b.WriteString(fmt.Sprintf("  - %s\n", desc))
				}
				if personality, ok := contentMap["personality"].(string); ok && personality != "" {
					b.WriteString(fmt.Sprintf("  - 性格: %s\n", personality))
				}
				if bg, ok := contentMap["background"].(string); ok && bg != "" {
					b.WriteString(fmt.Sprintf("  - 背景: %s\n", bg))
				}
			}
		}
		b.WriteString("\n")
	}

	// Chapters
	if len(chapters) > 0 {
		b.WriteString("## 章节\n\n")
		for _, c := range chapters {
			b.WriteString(fmt.Sprintf("- 第%d章: %s\n", c.ChapterNumber, c.Title))
		}
		b.WriteString("\n")
	}

	// Relationships
	if len(relationships) > 0 {
		b.WriteString("## 关系网络\n\n")
		entityMap := map[string]string{}
		for _, e := range entities {
			entityMap[e.ID] = e.Name
		}
		for _, r := range relationships {
			src := entityMap[r.SourceEntityID]
			if src == "" {
				src = r.SourceEntityID[:8]
			}
			tgt := entityMap[r.TargetEntityID]
			if tgt == "" {
				tgt = r.TargetEntityID[:8]
			}
			b.WriteString(fmt.Sprintf("- %s → %s", src, tgt))
			if r.RelationshipType != "" {
				b.WriteString(fmt.Sprintf(" (%s)", r.RelationshipType))
			}
			b.WriteString("\n")
		}
		b.WriteString("\n")
	}

	return b.String()
}
