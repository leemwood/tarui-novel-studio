package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/leemwood/tarui-novel-studio/server/handler"
	"github.com/leemwood/tarui-novel-studio/server/middleware"
	"github.com/leemwood/tarui-novel-studio/server/model"
)

func main() {
	// Database path
	dbDir := os.Getenv("NOVEL_DB_DIR")
	if dbDir == "" {
		home, _ := os.UserHomeDir()
		dbDir = filepath.Join(home, ".tarui-novel-studio")
	}
	os.MkdirAll(dbDir, 0755)
	dbPath := filepath.Join(dbDir, "novel_studio.db")

	if err := model.InitDB(dbPath); err != nil {
		log.Fatalf("database init failed: %v", err)
	}

	r := chi.NewRouter()
	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)
	r.Use(middleware.CORS)

	// Public routes
	r.Get("/api/health", handler.HealthCheck)
	r.Post("/api/setup", handler.Setup)
	r.Post("/api/login", handler.Login)

	// Protected routes
	r.Group(func(r chi.Router) {
		r.Use(middleware.AuthMiddleware)

		r.Get("/api/projects", handler.HandleProjects)
		r.Post("/api/projects", handler.HandleProjects)
		r.Get("/api/projects/{id}", handler.HandleProject)
		r.Put("/api/projects/{id}", handler.HandleProject)
		r.Delete("/api/projects/{id}", handler.HandleProject)

		r.Get("/api/entities", handler.HandleEntities)
		r.Post("/api/entities", handler.HandleEntities)
		r.Get("/api/entities/{id}", handler.HandleEntity)
		r.Put("/api/entities/{id}", handler.HandleEntity)
		r.Delete("/api/entities/{id}", handler.HandleEntity)

		r.Get("/api/relationships", handler.HandleRelationships)
		r.Post("/api/relationships", handler.HandleRelationships)

		r.Get("/api/chapters", handler.HandleChapters)
		r.Post("/api/chapters", handler.HandleChapters)

		r.Get("/api/messages", handler.HandleMessages)
		r.Post("/api/messages", handler.HandleMessages)
		r.Delete("/api/messages", handler.HandleMessages)

		r.Get("/api/plans", handler.HandlePlans)
		r.Post("/api/plans", handler.HandlePlans)

		// Chat
		r.Post("/api/chat", handler.HandleChat)

		// Plan generation
		r.Post("/api/plans/generate", handler.HandleGeneratePlan)

		// Settings
		r.Get("/api/settings", handler.HandleGetSettings)
		r.Put("/api/settings", handler.HandleSaveSettings)
		r.Post("/api/settings/test", handler.HandleTestConnection)

		// Export
		r.Get("/api/export/cursorrules", handler.HandleExportCursorRules)
		r.Get("/api/export/prompt", handler.HandleExportPrompt)

		// Skills
		r.Get("/api/skills", handler.HandleListSkills)
		r.Post("/api/skills/install", handler.HandleInstallSkill)
		r.Post("/api/skills/run", handler.HandleRunSkill)
		r.Get("/api/skills/search", handler.HandleSearchSkills)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("server starting on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}
