package model

import (
	"crypto/rand"
	"fmt"
	"time"
)

func newID() string {
	b := make([]byte, 16)
	rand.Read(b)
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}

// ─── Entity ─────────────────────────────────────────────────

type Entity struct {
	ID         string `json:"id"`
	ProjectID  string `json:"project_id"`
	Name       string `json:"name"`
	EntityType string `json:"entity_type"`
	Content    string `json:"content"`
	CreatedAt  string `json:"created_at"`
	UpdatedAt  string `json:"updated_at"`
}

func CreateEntity(projectID, name, entityType, content string) (*Entity, error) {
	id := newID()
	now := time.Now().UTC().Format(time.RFC3339)
	_, err := DB.Exec(
		"INSERT INTO entities (id, project_id, name, entity_type, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
		id, projectID, name, entityType, content, now, now,
	)
	if err != nil {
		return nil, err
	}
	return GetEntity(id)
}

func ListEntities(projectID string) ([]Entity, error) {
	rows, err := DB.Query("SELECT id, project_id, name, entity_type, content, created_at, updated_at FROM entities WHERE project_id = ? ORDER BY entity_type, name", projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var entities []Entity
	for rows.Next() {
		var e Entity
		if err := rows.Scan(&e.ID, &e.ProjectID, &e.Name, &e.EntityType, &e.Content, &e.CreatedAt, &e.UpdatedAt); err != nil {
			return nil, err
		}
		entities = append(entities, e)
	}
	return entities, nil
}

func GetEntity(id string) (*Entity, error) {
	var e Entity
	err := DB.QueryRow("SELECT id, project_id, name, entity_type, content, created_at, updated_at FROM entities WHERE id = ?", id).
		Scan(&e.ID, &e.ProjectID, &e.Name, &e.EntityType, &e.Content, &e.CreatedAt, &e.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &e, nil
}

func UpdateEntity(id, name, entityType, content string) (*Entity, error) {
	now := time.Now().UTC().Format(time.RFC3339)
	_, err := DB.Exec("UPDATE entities SET name = ?, entity_type = ?, content = ?, updated_at = ? WHERE id = ?", name, entityType, content, now, id)
	if err != nil {
		return nil, err
	}
	return GetEntity(id)
}

func DeleteEntity(id string) error {
	_, err := DB.Exec("DELETE FROM entities WHERE id = ?", id)
	return err
}

// ─── Relationship ────────────────────────────────────────────

type Relationship struct {
	ID               string `json:"id"`
	ProjectID        string `json:"project_id"`
	SourceEntityID   string `json:"source_entity_id"`
	TargetEntityID   string `json:"target_entity_id"`
	RelationshipType string `json:"relationship_type"`
	Description      string `json:"description"`
	CreatedAt        string `json:"created_at"`
}

func CreateRelationship(projectID, sourceID, targetID, relType, desc string) (*Relationship, error) {
	id := newID()
	now := time.Now().UTC().Format(time.RFC3339)
	_, err := DB.Exec(
		"INSERT INTO relationships (id, project_id, source_entity_id, target_entity_id, relationship_type, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
		id, projectID, sourceID, targetID, relType, desc, now,
	)
	if err != nil {
		return nil, err
	}
	return &Relationship{ID: id, ProjectID: projectID, SourceEntityID: sourceID, TargetEntityID: targetID, RelationshipType: relType, Description: desc, CreatedAt: now}, nil
}

func ListRelationships(projectID string) ([]Relationship, error) {
	rows, err := DB.Query("SELECT id, project_id, source_entity_id, target_entity_id, relationship_type, description, created_at FROM relationships WHERE project_id = ? ORDER BY created_at", projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var rels []Relationship
	for rows.Next() {
		var r Relationship
		if err := rows.Scan(&r.ID, &r.ProjectID, &r.SourceEntityID, &r.TargetEntityID, &r.RelationshipType, &r.Description, &r.CreatedAt); err != nil {
			return nil, err
		}
		rels = append(rels, r)
	}
	return rels, nil
}

func DeleteRelationship(id string) error {
	_, err := DB.Exec("DELETE FROM relationships WHERE id = ?", id)
	return err
}

// ─── Chapter ─────────────────────────────────────────────────

type Chapter struct {
	ID            string `json:"id"`
	ProjectID     string `json:"project_id"`
	Title         string `json:"title"`
	Content       string `json:"content"`
	ChapterNumber int    `json:"chapter_number"`
	CreatedAt     string `json:"created_at"`
	UpdatedAt     string `json:"updated_at"`
}

func CreateChapter(projectID, title, content string, chapterNumber int) (*Chapter, error) {
	id := newID()
	now := time.Now().UTC().Format(time.RFC3339)
	_, err := DB.Exec(
		"INSERT INTO chapters (id, project_id, title, content, chapter_number, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
		id, projectID, title, content, chapterNumber, now, now,
	)
	if err != nil {
		return nil, err
	}
	return &Chapter{ID: id, ProjectID: projectID, Title: title, Content: content, ChapterNumber: chapterNumber, CreatedAt: now, UpdatedAt: now}, nil
}

func ListChapters(projectID string) ([]Chapter, error) {
	rows, err := DB.Query("SELECT id, project_id, title, content, chapter_number, created_at, updated_at FROM chapters WHERE project_id = ? ORDER BY chapter_number", projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var chapters []Chapter
	for rows.Next() {
		var c Chapter
		if err := rows.Scan(&c.ID, &c.ProjectID, &c.Title, &c.Content, &c.ChapterNumber, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		chapters = append(chapters, c)
	}
	return chapters, nil
}

func UpdateChapter(id, title, content string) (*Chapter, error) {
	now := time.Now().UTC().Format(time.RFC3339)
	_, err := DB.Exec("UPDATE chapters SET title = ?, content = ?, updated_at = ? WHERE id = ?", title, content, now, id)
	if err != nil {
		return nil, err
	}
	return &Chapter{}, nil // simplified
}

// ─── Message ─────────────────────────────────────────────────

type Message struct {
	ID        string `json:"id"`
	ProjectID string `json:"project_id"`
	Role      string `json:"role"`
	Content   string `json:"content"`
	CreatedAt string `json:"created_at"`
}

func SaveMessage(projectID, role, content string) (*Message, error) {
	id := newID()
	now := time.Now().UTC().Format(time.RFC3339)
	_, err := DB.Exec("INSERT INTO messages (id, project_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)", id, projectID, role, content, now)
	if err != nil {
		return nil, err
	}
	return &Message{ID: id, ProjectID: projectID, Role: role, Content: content, CreatedAt: now}, nil
}

func ListMessages(projectID string) ([]Message, error) {
	rows, err := DB.Query("SELECT id, project_id, role, content, created_at FROM messages WHERE project_id = ? ORDER BY created_at", projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var msgs []Message
	for rows.Next() {
		var m Message
		if err := rows.Scan(&m.ID, &m.ProjectID, &m.Role, &m.Content, &m.CreatedAt); err != nil {
			return nil, err
		}
		msgs = append(msgs, m)
	}
	return msgs, nil
}

func ClearMessages(projectID string) error {
	_, err := DB.Exec("DELETE FROM messages WHERE project_id = ?", projectID)
	return err
}

// ─── Plan ────────────────────────────────────────────────────

type Plan struct {
	ID        string `json:"id"`
	ProjectID string `json:"project_id"`
	Title     string `json:"title"`
	Content   string `json:"content"`
	CreatedAt string `json:"created_at"`
}

func SavePlan(projectID, title, content string) (*Plan, error) {
	id := newID()
	now := time.Now().UTC().Format(time.RFC3339)
	_, err := DB.Exec("INSERT INTO plans (id, project_id, title, content, created_at) VALUES (?, ?, ?, ?, ?)", id, projectID, title, content, now)
	if err != nil {
		return nil, err
	}
	return &Plan{ID: id, ProjectID: projectID, Title: title, Content: content, CreatedAt: now}, nil
}

func ListPlans(projectID string) ([]Plan, error) {
	rows, err := DB.Query("SELECT id, project_id, title, content, created_at FROM plans WHERE project_id = ? ORDER BY created_at DESC", projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var plans []Plan
	for rows.Next() {
		var p Plan
		if err := rows.Scan(&p.ID, &p.ProjectID, &p.Title, &p.Content, &p.CreatedAt); err != nil {
			return nil, err
		}
		plans = append(plans, p)
	}
	return plans, nil
}

func GetPlan(id string) (*Plan, error) {
	var p Plan
	err := DB.QueryRow("SELECT id, project_id, title, content, created_at FROM plans WHERE id = ?", id).
		Scan(&p.ID, &p.ProjectID, &p.Title, &p.Content, &p.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func DeletePlan(id string) error {
	_, err := DB.Exec("DELETE FROM plans WHERE id = ?", id)
	return err
}
