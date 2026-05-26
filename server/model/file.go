package model

import (
	"fmt"
	"os"
	"path/filepath"
	"time"
)

type FileRecord struct {
	ID        string `json:"id"`
	ProjectID string `json:"project_id"`
	Name      string `json:"name"`
	Size      int64  `json:"size"`
	MimeType  string `json:"mime_type"`
	Path      string `json:"-"`
	CreatedAt string `json:"created_at"`
}

func getUploadDir() string {
	home, _ := os.UserHomeDir()
	dir := filepath.Join(home, ".tarui-novel-studio", "uploads")
	os.MkdirAll(dir, 0755)
	return dir
}

func SaveUploadedFile(projectID, fileName, mimeType string, data []byte) (*FileRecord, error) {
	id := newID()
	ext := filepath.Ext(fileName)
	diskName := id + ext
	uploadDir := getUploadDir()
	diskPath := filepath.Join(uploadDir, diskName)

	if err := os.WriteFile(diskPath, data, 0644); err != nil {
		return nil, fmt.Errorf("failed to save file: %w", err)
	}

	now := time.Now().UTC().Format(time.RFC3339)
	_, err := DB.Exec(
		"INSERT INTO files (id, project_id, name, size, mime_type, path, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
		id, projectID, fileName, int64(len(data)), mimeType, diskPath, now,
	)
	if err != nil {
		os.Remove(diskPath)
		return nil, err
	}

	return &FileRecord{
		ID:        id,
		ProjectID: projectID,
		Name:      fileName,
		Size:      int64(len(data)),
		MimeType:  mimeType,
		CreatedAt: now,
	}, nil
}

func ListFiles(projectID string) ([]FileRecord, error) {
	rows, err := DB.Query("SELECT id, project_id, name, size, mime_type, created_at FROM files WHERE project_id = ? ORDER BY created_at DESC", projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var files []FileRecord
	for rows.Next() {
		var f FileRecord
		if err := rows.Scan(&f.ID, &f.ProjectID, &f.Name, &f.Size, &f.MimeType, &f.CreatedAt); err != nil {
			return nil, err
		}
		files = append(files, f)
	}
	if files == nil {
		files = []FileRecord{}
	}
	return files, nil
}

func GetFile(id string) (*FileRecord, error) {
	var f FileRecord
	err := DB.QueryRow("SELECT id, project_id, name, size, mime_type, path, created_at FROM files WHERE id = ?", id).
		Scan(&f.ID, &f.ProjectID, &f.Name, &f.Size, &f.MimeType, &f.Path, &f.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &f, nil
}

func DeleteFile(id string) error {
	f, err := GetFile(id)
	if err != nil {
		return err
	}
	os.Remove(f.Path)
	_, err = DB.Exec("DELETE FROM files WHERE id = ?", id)
	return err
}

func ReadFileContent(id string) (string, error) {
	f, err := GetFile(id)
	if err != nil {
		return "", err
	}
	data, err := os.ReadFile(f.Path)
	if err != nil {
		return "", err
	}
	return string(data), nil
}
