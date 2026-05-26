use serde::{Deserialize, Serialize};
use sqlx::sqlite::{SqlitePool, SqlitePoolOptions};
use sqlx::FromRow;

// ─── Data Models ───────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub description: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Entity {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub entity_type: String, // character / item / location / lore / plot / chapter
    pub content: String,     // JSON string with details
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Relationship {
    pub id: String,
    pub project_id: String,
    pub source_entity_id: String,
    pub target_entity_id: String,
    pub relationship_type: String,
    pub description: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Chapter {
    pub id: String,
    pub project_id: String,
    pub title: String,
    pub content: String,
    pub chapter_number: i32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Message {
    pub id: String,
    pub project_id: String,
    pub role: String,       // user / assistant / system
    pub content: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Plan {
    pub id: String,
    pub project_id: String,
    pub title: String,
    pub content: String,    // Markdown content
    pub created_at: String,
}

// ─── Database ───────────────────────────────────────────────────

pub struct Database {
    pool: SqlitePool,
}

impl Database {
    pub async fn new(db_path: &str) -> Result<Self, sqlx::Error> {
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect(db_path)
            .await?;
        let db = Database { pool };
        db.migrate().await?;
        Ok(db)
    }

    async fn migrate(&self) -> Result<(), sqlx::Error> {
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )",
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS entities (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                name TEXT NOT NULL,
                entity_type TEXT NOT NULL,
                content TEXT NOT NULL DEFAULT '{}',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id)
            )",
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS relationships (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                source_entity_id TEXT NOT NULL,
                target_entity_id TEXT NOT NULL,
                relationship_type TEXT NOT NULL DEFAULT '',
                description TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id),
                FOREIGN KEY (source_entity_id) REFERENCES entities(id),
                FOREIGN KEY (target_entity_id) REFERENCES entities(id)
            )",
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS chapters (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL DEFAULT '',
                chapter_number INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id)
            )",
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id)
            )",
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS plans (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id)
            )",
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    // ─── Projects ──────────────────────────────────────────────

    pub async fn create_project(&self, name: &str, description: &str) -> Result<Project, sqlx::Error> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        sqlx::query_as::<_, Project>(
            "INSERT INTO projects (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?) RETURNING *"
        )
        .bind(&id)
        .bind(name)
        .bind(description)
        .bind(&now)
        .bind(&now)
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_projects(&self) -> Result<Vec<Project>, sqlx::Error> {
        sqlx::query_as::<_, Project>("SELECT * FROM projects ORDER BY updated_at DESC")
            .fetch_all(&self.pool)
            .await
    }

    pub async fn get_project(&self, id: &str) -> Result<Project, sqlx::Error> {
        sqlx::query_as::<_, Project>("SELECT * FROM projects WHERE id = ?")
            .bind(id)
            .fetch_one(&self.pool)
            .await
    }

    pub async fn update_project(&self, id: &str, name: &str, description: &str) -> Result<Project, sqlx::Error> {
        let now = chrono::Utc::now().to_rfc3339();
        sqlx::query_as::<_, Project>(
            "UPDATE projects SET name = ?, description = ?, updated_at = ? WHERE id = ? RETURNING *"
        )
        .bind(name)
        .bind(description)
        .bind(&now)
        .bind(id)
        .fetch_one(&self.pool)
        .await
    }

    pub async fn delete_project(&self, id: &str) -> Result<(), sqlx::Error> {
        sqlx::query("DELETE FROM messages WHERE project_id = ?").bind(id).execute(&self.pool).await?;
        sqlx::query("DELETE FROM relationships WHERE project_id = ?").bind(id).execute(&self.pool).await?;
        sqlx::query("DELETE FROM entities WHERE project_id = ?").bind(id).execute(&self.pool).await?;
        sqlx::query("DELETE FROM chapters WHERE project_id = ?").bind(id).execute(&self.pool).await?;
        sqlx::query("DELETE FROM plans WHERE project_id = ?").bind(id).execute(&self.pool).await?;
        sqlx::query("DELETE FROM projects WHERE id = ?").bind(id).execute(&self.pool).await?;
        Ok(())
    }

    // ─── Entities ──────────────────────────────────────────────

    pub async fn create_entity(
        &self, project_id: &str, name: &str, entity_type: &str, content: &str
    ) -> Result<Entity, sqlx::Error> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        sqlx::query_as::<_, Entity>(
            "INSERT INTO entities (id, project_id, name, entity_type, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *"
        )
        .bind(&id)
        .bind(project_id)
        .bind(name)
        .bind(entity_type)
        .bind(content)
        .bind(&now)
        .bind(&now)
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_entities(&self, project_id: &str) -> Result<Vec<Entity>, sqlx::Error> {
        sqlx::query_as::<_, Entity>("SELECT * FROM entities WHERE project_id = ? ORDER BY entity_type, name")
            .bind(project_id)
            .fetch_all(&self.pool)
            .await
    }

    pub async fn get_entity(&self, id: &str) -> Result<Entity, sqlx::Error> {
        sqlx::query_as::<_, Entity>("SELECT * FROM entities WHERE id = ?")
            .bind(id)
            .fetch_one(&self.pool)
            .await
    }

    pub async fn update_entity(&self, id: &str, name: &str, entity_type: &str, content: &str) -> Result<Entity, sqlx::Error> {
        let now = chrono::Utc::now().to_rfc3339();
        sqlx::query_as::<_, Entity>(
            "UPDATE entities SET name = ?, entity_type = ?, content = ?, updated_at = ? WHERE id = ? RETURNING *"
        )
        .bind(name)
        .bind(entity_type)
        .bind(content)
        .bind(&now)
        .bind(id)
        .fetch_one(&self.pool)
        .await
    }

    pub async fn delete_entity(&self, id: &str) -> Result<(), sqlx::Error> {
        sqlx::query("DELETE FROM relationships WHERE source_entity_id = ? OR target_entity_id = ?")
            .bind(id).bind(id).execute(&self.pool).await?;
        sqlx::query("DELETE FROM entities WHERE id = ?").bind(id).execute(&self.pool).await?;
        Ok(())
    }

    // ─── Relationships ─────────────────────────────────────────

    pub async fn create_relationship(
        &self, project_id: &str, source_entity_id: &str, target_entity_id: &str,
        relationship_type: &str, description: &str
    ) -> Result<Relationship, sqlx::Error> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        sqlx::query_as::<_, Relationship>(
            "INSERT INTO relationships (id, project_id, source_entity_id, target_entity_id, relationship_type, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *"
        )
        .bind(&id)
        .bind(project_id)
        .bind(source_entity_id)
        .bind(target_entity_id)
        .bind(relationship_type)
        .bind(description)
        .bind(&now)
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_relationships(&self, project_id: &str) -> Result<Vec<Relationship>, sqlx::Error> {
        sqlx::query_as::<_, Relationship>(
            "SELECT * FROM relationships WHERE project_id = ? ORDER BY created_at"
        )
        .bind(project_id)
        .fetch_all(&self.pool)
        .await
    }

    pub async fn delete_relationship(&self, id: &str) -> Result<(), sqlx::Error> {
        sqlx::query("DELETE FROM relationships WHERE id = ?").bind(id).execute(&self.pool).await?;
        Ok(())
    }

    // ─── Chapters ──────────────────────────────────────────────

    pub async fn create_chapter(
        &self, project_id: &str, title: &str, content: &str, chapter_number: i32
    ) -> Result<Chapter, sqlx::Error> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        sqlx::query_as::<_, Chapter>(
            "INSERT INTO chapters (id, project_id, title, content, chapter_number, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *"
        )
        .bind(&id)
        .bind(project_id)
        .bind(title)
        .bind(content)
        .bind(chapter_number)
        .bind(&now)
        .bind(&now)
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_chapters(&self, project_id: &str) -> Result<Vec<Chapter>, sqlx::Error> {
        sqlx::query_as::<_, Chapter>(
            "SELECT * FROM chapters WHERE project_id = ? ORDER BY chapter_number"
        )
        .bind(project_id)
        .fetch_all(&self.pool)
        .await
    }

    pub async fn update_chapter(&self, id: &str, title: &str, content: &str) -> Result<Chapter, sqlx::Error> {
        let now = chrono::Utc::now().to_rfc3339();
        sqlx::query_as::<_, Chapter>(
            "UPDATE chapters SET title = ?, content = ?, updated_at = ? WHERE id = ? RETURNING *"
        )
        .bind(title)
        .bind(content)
        .bind(&now)
        .bind(id)
        .fetch_one(&self.pool)
        .await
    }

    // ─── Messages ──────────────────────────────────────────────

    pub async fn save_message(
        &self, project_id: &str, role: &str, content: &str
    ) -> Result<Message, sqlx::Error> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        sqlx::query_as::<_, Message>(
            "INSERT INTO messages (id, project_id, role, content, created_at) VALUES (?, ?, ?, ?, ?) RETURNING *"
        )
        .bind(&id)
        .bind(project_id)
        .bind(role)
        .bind(content)
        .bind(&now)
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_messages(&self, project_id: &str) -> Result<Vec<Message>, sqlx::Error> {
        sqlx::query_as::<_, Message>(
            "SELECT * FROM messages WHERE project_id = ? ORDER BY created_at"
        )
        .bind(project_id)
        .fetch_all(&self.pool)
        .await
    }

    pub async fn clear_messages(&self, project_id: &str) -> Result<(), sqlx::Error> {
        sqlx::query("DELETE FROM messages WHERE project_id = ?")
            .bind(project_id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    // ─── Plans ─────────────────────────────────────────────────

    pub async fn save_plan(
        &self, project_id: &str, title: &str, content: &str
    ) -> Result<Plan, sqlx::Error> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        sqlx::query_as::<_, Plan>(
            "INSERT INTO plans (id, project_id, title, content, created_at) VALUES (?, ?, ?, ?, ?) RETURNING *"
        )
        .bind(&id)
        .bind(project_id)
        .bind(title)
        .bind(content)
        .bind(&now)
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_plans(&self, project_id: &str) -> Result<Vec<Plan>, sqlx::Error> {
        sqlx::query_as::<_, Plan>(
            "SELECT * FROM plans WHERE project_id = ? ORDER BY created_at DESC"
        )
        .bind(project_id)
        .fetch_all(&self.pool)
        .await
    }

    pub async fn get_plan(&self, id: &str) -> Result<Plan, sqlx::Error> {
        sqlx::query_as::<_, Plan>("SELECT * FROM plans WHERE id = ?")
            .bind(id)
            .fetch_one(&self.pool)
            .await
    }

    pub async fn delete_plan(&self, id: &str) -> Result<(), sqlx::Error> {
        sqlx::query("DELETE FROM plans WHERE id = ?").bind(id).execute(&self.pool).await?;
        Ok(())
    }
}
