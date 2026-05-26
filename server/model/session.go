package model

import "time"

type Session struct {
	ID        string `json:"id"`
	ProjectID string `json:"project_id"`
	Title     string `json:"title"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

func CreateSession(projectID, title string) (*Session, error) {
	id := newID()
	now := time.Now().UTC().Format(time.RFC3339)
	_, err := DB.Exec(
		"INSERT INTO sessions (id, project_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
		id, projectID, title, now, now,
	)
	if err != nil {
		return nil, err
	}
	return GetSession(id)
}

func GetSession(id string) (*Session, error) {
	var s Session
	err := DB.QueryRow("SELECT id, project_id, title, created_at, updated_at FROM sessions WHERE id = ?", id).
		Scan(&s.ID, &s.ProjectID, &s.Title, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func ListSessions(projectID string) ([]Session, error) {
	rows, err := DB.Query("SELECT id, project_id, title, created_at, updated_at FROM sessions WHERE project_id = ? ORDER BY updated_at DESC", projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var sessions []Session
	for rows.Next() {
		var s Session
		if err := rows.Scan(&s.ID, &s.ProjectID, &s.Title, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, err
		}
		sessions = append(sessions, s)
	}
	if sessions == nil {
		sessions = []Session{}
	}
	return sessions, nil
}

func RenameSession(id, title string) (*Session, error) {
	now := time.Now().UTC().Format(time.RFC3339)
	_, err := DB.Exec("UPDATE sessions SET title = ?, updated_at = ? WHERE id = ?", title, now, id)
	if err != nil {
		return nil, err
	}
	return GetSession(id)
}

func DeleteSession(id string) error {
	DB.Exec("DELETE FROM messages WHERE session_id = ?", id)
	_, err := DB.Exec("DELETE FROM sessions WHERE id = ?", id)
	return err
}

func SearchMessages(projectID, query string) ([]Message, error) {
	rows, err := DB.Query(
		`SELECT m.id, m.project_id, m.role, m.content, m.created_at, COALESCE(m.session_id, '') 
		 FROM messages m WHERE m.project_id = ? AND m.content LIKE ? 
		 ORDER BY m.created_at DESC LIMIT 50`,
		projectID, "%"+query+"%",
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var msgs []Message
	for rows.Next() {
		var m Message
		var sessionID string
		if err := rows.Scan(&m.ID, &m.ProjectID, &m.Role, &m.Content, &m.CreatedAt, &sessionID); err != nil {
			return nil, err
		}
		msgs = append(msgs, m)
	}
	if msgs == nil {
		msgs = []Message{}
	}
	return msgs, nil
}
