package handler

import (
	"io"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/leemwood/tarui-novel-studio/server/model"
)

func HandleUploadFile(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(32 << 20); err != nil { // 32MB max
		errResp(w, "file too large", 400)
		return
	}

	projectID := r.FormValue("project_id")
	if projectID == "" {
		errResp(w, "project_id required", 400)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		errResp(w, "file required", 400)
		return
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		errResp(w, "failed to read file", 500)
		return
	}

	// Validate file extension
	ext := strings.ToLower(filepath.Ext(header.Filename))
	allowed := map[string]string{
		".txt":  "text/plain",
		".md":   "text/markdown",
		".json": "application/json",
		".yaml": "text/yaml",
		".yml":  "text/yaml",
		".csv":  "text/csv",
		".xml":  "text/xml",
		".js":   "text/javascript",
		".ts":   "text/typescript",
		".py":   "text/x-python",
		".go":   "text/x-go",
		".rs":   "text/x-rust",
		".html": "text/html",
		".css":  "text/css",
	}
	mimeType, ok := allowed[ext]
	if !ok {
		mimeType = "text/plain"
	}

	record, err := model.SaveUploadedFile(projectID, header.Filename, mimeType, data)
	if err != nil {
		errResp(w, err.Error(), 500)
		return
	}

	jsonResp(w, record)
}

func HandleListFiles(w http.ResponseWriter, r *http.Request) {
	projectID := r.URL.Query().Get("project_id")
	if projectID == "" {
		errResp(w, "project_id required", 400)
		return
	}
	files, err := model.ListFiles(projectID)
	if err != nil {
		errResp(w, err.Error(), 500)
		return
	}
	jsonResp(w, files)
}

func HandleDeleteFile(w http.ResponseWriter, r *http.Request) {
	id := extractID(r.URL.Path, "/api/files/")
	if err := model.DeleteFile(id); err != nil {
		errResp(w, err.Error(), 500)
		return
	}
	jsonResp(w, map[string]string{"status": "deleted"})
}

func HandleGetFileContent(w http.ResponseWriter, r *http.Request) {
	id := extractID(r.URL.Path, "/api/files/")
	f, err := model.GetFile(id)
	if err != nil {
		errResp(w, "not found", 404)
		return
	}
	content, err := model.ReadFileContent(id)
	if err != nil {
		errResp(w, "failed to read", 500)
		return
	}
	w.Header().Set("Content-Type", f.MimeType+"; charset=utf-8")
	w.Write([]byte(content))
}
