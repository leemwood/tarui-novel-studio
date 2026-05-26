package model

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// ─── Request/Response Types ────────────────────────────────────

type ChatRequest struct {
	ProjectID string `json:"project_id"`
	Message   string `json:"message"`
}

type ChatMessage struct {
	Role       string     `json:"role"`
	Content    string     `json:"content"`
	ToolCalls  []ToolCall `json:"tool_calls,omitempty"`
	ToolCallID string     `json:"tool_call_id,omitempty"`
}

type ToolCall struct {
	ID       string       `json:"id"`
	Type     string       `json:"type"`
	Function ToolFunction `json:"function"`
}

type ToolFunction struct {
	Name      string `json:"name"`
	Arguments string `json:"arguments"` // JSON string
}

type ChatResponse struct {
	Message ChatMessage `json:"message"`
}

// ─── OpenAI API Types ──────────────────────────────────────────

type openAIMessage struct {
	Role       string           `json:"role"`
	Content    string           `json:"content"`
	ToolCallID string           `json:"tool_call_id,omitempty"`
	ToolCalls  []openAIToolCall `json:"tool_calls,omitempty"`
	Name       string           `json:"name,omitempty"`
}

type openAIToolCall struct {
	ID       string         `json:"id"`
	Type     string         `json:"type"`
	Function openAIFunction `json:"function"`
}

type openAIFunction struct {
	Name      string `json:"name"`
	Arguments string `json:"arguments"`
}

type openAIRequest struct {
	Model    string          `json:"model"`
	Messages []openAIMessage `json:"messages"`
	Tools    []openAITool    `json:"tools,omitempty"`
}

type openAITool struct {
	Type     string        `json:"type"`
	Function openAIToolDef `json:"function"`
}

type openAIToolDef struct {
	Name        string      `json:"name"`
	Description string      `json:"description"`
	Parameters  interface{} `json:"parameters"`
}

type openAIResponse struct {
	Choices []openAIChoice `json:"choices"`
}

type openAIChoice struct {
	Message openAIMessage `json:"message"`
}

// ─── Tool Definitions ──────────────────────────────────────────

var chatTools = []openAITool{
	{
		Type: "function",
		Function: openAIToolDef{
			Name:        "create_entity",
			Description: "创建新实体（角色/道具/地点/设定/剧情）",
			Parameters: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"name":        map[string]interface{}{"type": "string", "description": "实体名称"},
					"entity_type": map[string]interface{}{"type": "string", "enum": []string{"character", "item", "location", "lore", "plot", "chapter"}, "description": "实体类型"},
					"content":     map[string]interface{}{"type": "string", "description": "实体详细内容（JSON 格式）"},
				},
				"required": []string{"name", "entity_type"},
			},
		},
	},
	{
		Type: "function",
		Function: openAIToolDef{
			Name:        "update_entity",
			Description: "更新已有实体的信息",
			Parameters: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"entity_id":   map[string]interface{}{"type": "string", "description": "实体ID"},
					"name":        map[string]interface{}{"type": "string", "description": "新的名称"},
					"entity_type": map[string]interface{}{"type": "string", "enum": []string{"character", "item", "location", "lore", "plot", "chapter"}},
					"content":     map[string]interface{}{"type": "string", "description": "新的内容（JSON）"},
				},
				"required": []string{"entity_id"},
			},
		},
	},
	{
		Type: "function",
		Function: openAIToolDef{
			Name:        "create_relationship",
			Description: "创建两个实体之间的关系",
			Parameters: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"source_entity_id":   map[string]interface{}{"type": "string", "description": "源实体ID"},
					"target_entity_id":   map[string]interface{}{"type": "string", "description": "目标实体ID"},
					"relationship_type": map[string]interface{}{"type": "string", "description": "关系类型，如：朋友、宿敌、家人"},
					"description":       map[string]interface{}{"type": "string", "description": "关系描述"},
				},
				"required": []string{"source_entity_id", "target_entity_id"},
			},
		},
	},
	{
		Type: "function",
		Function: openAIToolDef{
			Name:        "generate_plan",
			Description: "根据项目数据生成开发计划",
			Parameters: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"title":   map[string]interface{}{"type": "string", "description": "计划标题"},
					"content": map[string]interface{}{"type": "string", "description": "计划内容"},
				},
				"required": []string{"title"},
			},
		},
	},
}

// ─── Main Chat Function ────────────────────────────────────────

func ProcessChat(projectID, userMessage string, history []ChatMessage) (*ChatMessage, error) {
	settings, err := GetSettings()
	if err != nil {
		return nil, fmt.Errorf("failed to get settings: %w", err)
	}

	// Build message list from history + new message
	msgs := buildMessages(history, userMessage)

	// Call AI API with tool support (up to 5 rounds for tool calls)
	maxRounds := 5
	for round := 0; round < maxRounds; round++ {
		resp, err := callAI(settings, msgs)
		if err != nil {
			return nil, fmt.Errorf("AI call failed: %w", err)
		}

		if len(resp.ToolCalls) == 0 {
			// Final response - no more tool calls
			msg := ChatMessage{Role: "assistant", Content: resp.Content}
			if resp.Content == "" {
				msg.Content = "已执行完成。"
			}
			// Save to DB
			SaveMessage(projectID, "assistant", msg.Content)
			return &msg, nil
		}

		// Process tool calls
		assistantMsg := openAIMessage{Role: "assistant", Content: resp.Content, ToolCalls: resp.ToolCalls}
		msgs = append(msgs, assistantMsg)

		for _, tc := range resp.ToolCalls {
			result := executeTool(projectID, tc.Function.Name, tc.Function.Arguments)
			msgs = append(msgs, openAIMessage{
				Role:       "tool",
				ToolCallID: tc.ID,
				Content:    result,
			})
		}
	}

	return &ChatMessage{Role: "assistant", Content: "已达最大工具调用轮次，请简化你的请求。"}, nil
}

// ─── Build Messages ────────────────────────────────────────────

func buildMessages(history []ChatMessage, userMessage string) []openAIMessage {
	var msgs []openAIMessage
	msgs = append(msgs, openAIMessage{
		Role:    "system",
		Content: `你是一个小说创作助手。你可以帮助用户管理小说项目中的角色、道具、地点、设定、剧情等元素。

你可以使用以下工具：
1. create_entity - 创建新的实体（角色/道具/地点/设定/剧情）
2. update_entity - 更新已有实体信息
3. create_relationship - 创建实体间关系
4. generate_plan - 生成开发计划

请根据用户的需求主动使用工具。每次对话请使用中文回复，保持简洁有建设性。`,
	})

	for _, h := range history {
		msgs = append(msgs, openAIMessage{Role: h.Role, Content: h.Content})
	}

	msgs = append(msgs, openAIMessage{Role: "user", Content: userMessage})
	return msgs
}

// ─── Call AI API ───────────────────────────────────────────────

func callAI(settings *Setting, messages []openAIMessage) (*openAIMessage, error) {
	url := strings.TrimRight(settings.APIBaseURL, "/") + "/chat/completions"

	reqBody := openAIRequest{
		Model:    settings.APIModel,
		Messages: messages,
		Tools:    chatTools,
	}

	body, _ := json.Marshal(reqBody)
	httpReq, err := http.NewRequest("POST", url, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+settings.APIKey)

	client := &http.Client{Timeout: 120 * time.Second}
	httpResp, err := client.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer httpResp.Body.Close()

	respBody, _ := io.ReadAll(httpResp.Body)
	if httpResp.StatusCode != 200 {
		return nil, fmt.Errorf("API error %d: %s", httpResp.StatusCode, string(respBody))
	}

	var resp openAIResponse
	if err := json.Unmarshal(respBody, &resp); err != nil {
		return nil, err
	}

	if len(resp.Choices) == 0 {
		return nil, fmt.Errorf("no choices in response")
	}

	return &resp.Choices[0].Message, nil
}

// ─── Execute Tool ──────────────────────────────────────────────

func executeTool(projectID, toolName, argsJSON string) string {
	var args map[string]interface{}
	if err := json.Unmarshal([]byte(argsJSON), &args); err != nil {
		return fmt.Sprintf(`{"error":"invalid arguments: %s"}`, err.Error())
	}

	switch toolName {
	case "create_entity":
		name, _ := args["name"].(string)
		entityType, _ := args["entity_type"].(string)
		content, _ := args["content"].(string)
		if content == "" {
			content = "{}"
		}
		e, err := CreateEntity(projectID, name, entityType, content)
		if err != nil {
			return fmt.Sprintf(`{"error":"%s"}`, err.Error())
		}
		data, _ := json.Marshal(e)
		return fmt.Sprintf(`{"success":true,"entity":%s}`, string(data))

	case "update_entity":
		entityID, _ := args["entity_id"].(string)
		name, _ := args["name"].(string)
		entityType, _ := args["entity_type"].(string)
		content, _ := args["content"].(string)
		if name == "" && entityType == "" && content == "" {
			return `{"error":"no fields to update"}`
		}
		// Get existing entity first
		existing, err := GetEntity(entityID)
		if err != nil {
			return fmt.Sprintf(`{"error":"entity not found: %s"}`, err.Error())
		}
		if name == "" {
			name = existing.Name
		}
		if entityType == "" {
			entityType = existing.EntityType
		}
		if content == "" {
			content = existing.Content
		}
		e, err := UpdateEntity(entityID, name, entityType, content)
		if err != nil {
			return fmt.Sprintf(`{"error":"%s"}`, err.Error())
		}
		data, _ := json.Marshal(e)
		return fmt.Sprintf(`{"success":true,"entity":%s}`, string(data))

	case "create_relationship":
		sourceID, _ := args["source_entity_id"].(string)
		targetID, _ := args["target_entity_id"].(string)
		relType, _ := args["relationship_type"].(string)
		desc, _ := args["description"].(string)
		r, err := CreateRelationship(projectID, sourceID, targetID, relType, desc)
		if err != nil {
			return fmt.Sprintf(`{"error":"%s"}`, err.Error())
		}
		data, _ := json.Marshal(r)
		return fmt.Sprintf(`{"success":true,"relationship":%s}`, string(data))

	case "generate_plan":
		title, _ := args["title"].(string)
		if title == "" {
			title = "开发计划"
		}
		content := GeneratePlan(projectID, title)
		data, _ := json.Marshal(map[string]string{"title": title, "content": content})
		return fmt.Sprintf(`{"success":true,"plan":%s}`, string(data))

	default:
		return fmt.Sprintf(`{"error":"unknown tool: %s"}`, toolName)
	}
}
