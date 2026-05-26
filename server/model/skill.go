package model

import (
	"bufio"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

type Skill struct {
	Name        string `json:"name"`
	Slug        string `json:"slug"`
	Version     string `json:"version"`
	Description string `json:"description"`
	Path        string `json:"path"`
}

type SkillResult struct {
	Output  string `json:"output"`
	Success bool   `json:"success"`
}

func getSkillsDir() string {
	home, _ := os.UserHomeDir()
	return filepath.Join(home, ".qwen", "skills")
}

func ListSkills() ([]Skill, error) {
	skillsDir := getSkillsDir()
	entries, err := os.ReadDir(skillsDir)
	if err != nil {
		// Skills directory might not exist
		return []Skill{}, nil
	}

	var skills []Skill
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		skill, err := readSkill(filepath.Join(skillsDir, entry.Name()))
		if err != nil {
			continue
		}
		skills = append(skills, *skill)
	}
	if skills == nil {
		skills = []Skill{}
	}
	return skills, nil
}

func GetSkill(slug string) (*Skill, error) {
	skillsDir := getSkillsDir()
	skillPath := filepath.Join(skillsDir, slug)
	info, err := os.Stat(skillPath)
	if err != nil || !info.IsDir() {
		return nil, fmt.Errorf("skill not found: %s", slug)
	}
	return readSkill(skillPath)
}

func readSkill(skillPath string) (*Skill, error) {
	skillMd := filepath.Join(skillPath, "SKILL.md")
	data, err := os.ReadFile(skillMd)
	if err != nil {
		return nil, err
	}

	slug := filepath.Base(skillPath)
	skill := &Skill{
		Slug: slug,
		Path: skillPath,
	}

	// Parse YAML frontmatter (between --- markers)
	content := string(data)
	parts := strings.SplitN(content, "---", 3)
	if len(parts) >= 3 {
		fm := parts[1]
		scanner := bufio.NewScanner(strings.NewReader(fm))
		for scanner.Scan() {
			line := scanner.Text()
			if strings.HasPrefix(line, "name:") {
				skill.Name = strings.TrimSpace(strings.TrimPrefix(line, "name:"))
				skill.Name = strings.Trim(skill.Name, "\"")
			}
			if strings.HasPrefix(line, "version:") {
				skill.Version = strings.TrimSpace(strings.TrimPrefix(line, "version:"))
				skill.Version = strings.Trim(skill.Version, "\"")
			}
			if strings.HasPrefix(line, "description:") {
				skill.Description = strings.TrimSpace(strings.TrimPrefix(line, "description:"))
				skill.Description = strings.Trim(skill.Description, "\"")
			}
		}
	}

	if skill.Name == "" {
		skill.Name = slug
	}
	return skill, nil
}

func RunSkill(slug, input string) (*SkillResult, error) {
	skill, err := GetSkill(slug)
	if err != nil {
		return nil, err
	}

	// Check for executable scripts in the skill directory
	scripts := []string{"run.sh", "run.py", "main.sh", "main.py", "execute.sh", "execute.py"}
	var scriptPath string
	for _, s := range scripts {
		p := filepath.Join(skill.Path, s)
		if _, err := os.Stat(p); err == nil {
			scriptPath = p
			break
		}
	}

	// If no executable found, return the SKILL.md content as reference
	if scriptPath == "" {
		content, _ := os.ReadFile(filepath.Join(skill.Path, "SKILL.md"))
		return &SkillResult{
			Output:  string(content),
			Success: true,
		}, nil
	}

	// Execute the skill script, passing input via stdin or as argument
	cmd := exec.Command("bash", scriptPath)
	cmd.Stdin = strings.NewReader(input)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return &SkillResult{
			Output:  fmt.Sprintf("Error: %s\nOutput: %s", err.Error(), string(output)),
			Success: false,
		}, nil
	}
	return &SkillResult{
		Output:  string(output),
		Success: true,
	}, nil
}

// GetSkillDescriptions returns descriptions of all skills formatted as AI tool definitions
func GetSkillToolDescriptions() []map[string]interface{} {
	skills, _ := ListSkills()
	var tools []map[string]interface{}
	for _, s := range skills {
		tools = append(tools, map[string]interface{}{
			"name":        "run_skill_" + s.Slug,
			"description": fmt.Sprintf("执行技能 %s: %s", s.Name, s.Description),
			"parameters": map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"input": map[string]interface{}{
						"type":        "string",
						"description": "传递给技能的输入内容",
					},
				},
				"required": []string{"input"},
			},
		})
	}
	if tools == nil {
		tools = []map[string]interface{}{}
	}
	return tools
}
