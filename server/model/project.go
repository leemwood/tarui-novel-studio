package model

import "time"

type Project struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}

func CreateProject(name, description string) (*Project, error) {
	id := newID()
	now := time.Now().UTC().Format(time.RFC3339)
	_, err := DB.Exec(
		"INSERT INTO projects (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
		id, name, description, now, now,
	)
	if err != nil {
		return nil, err
	}
	return GetProject(id)
}

func ListProjects() ([]Project, error) {
	rows, err := DB.Query("SELECT id, name, description, created_at, updated_at FROM projects ORDER BY updated_at DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var projects []Project
	for rows.Next() {
		var p Project
		if err := rows.Scan(&p.ID, &p.Name, &p.Description, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		projects = append(projects, p)
	}
	return projects, nil
}

func GetProject(id string) (*Project, error) {
	var p Project
	err := DB.QueryRow(
		"SELECT id, name, description, created_at, updated_at FROM projects WHERE id = ?", id,
	).Scan(&p.ID, &p.Name, &p.Description, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func UpdateProject(id, name, description string) (*Project, error) {
	now := time.Now().UTC().Format(time.RFC3339)
	_, err := DB.Exec(
		"UPDATE projects SET name = ?, description = ?, updated_at = ? WHERE id = ?",
		name, description, now, id,
	)
	if err != nil {
		return nil, err
	}
	return GetProject(id)
}

func DeleteProject(id string) error {
	_, err := DB.Exec("DELETE FROM projects WHERE id = ?", id)
	return err
}
