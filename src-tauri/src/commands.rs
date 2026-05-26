use crate::db::{Database, Entity, Message, Plan, Project, Relationship, Chapter};
use tauri::State;

pub struct AppState {
    pub db: tokio::sync::Mutex<Database>,
}

// ─── Projects ───────────────────────────────────────────────────

#[tauri::command]
pub async fn create_project(state: State<'_, AppState>, name: String, description: String) -> Result<Project, String> {
    let db = state.db.lock().await;
    db.create_project(&name, &description).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_projects(state: State<'_, AppState>) -> Result<Vec<Project>, String> {
    let db = state.db.lock().await;
    db.list_projects().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_project(state: State<'_, AppState>, id: String) -> Result<Project, String> {
    let db = state.db.lock().await;
    db.get_project(&id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_project(state: State<'_, AppState>, id: String, name: String, description: String) -> Result<Project, String> {
    let db = state.db.lock().await;
    db.update_project(&id, &name, &description).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_project(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let db = state.db.lock().await;
    db.delete_project(&id).await.map_err(|e| e.to_string())
}

// ─── Entities ───────────────────────────────────────────────────

#[tauri::command]
pub async fn create_entity(
    state: State<'_, AppState>, project_id: String, name: String, entity_type: String, content: String,
) -> Result<Entity, String> {
    let db = state.db.lock().await;
    db.create_entity(&project_id, &name, &entity_type, &content)
        .await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_entities(state: State<'_, AppState>, project_id: String) -> Result<Vec<Entity>, String> {
    let db = state.db.lock().await;
    db.list_entities(&project_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_entity(state: State<'_, AppState>, id: String) -> Result<Entity, String> {
    let db = state.db.lock().await;
    db.get_entity(&id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_entity(
    state: State<'_, AppState>, id: String, name: String, entity_type: String, content: String,
) -> Result<Entity, String> {
    let db = state.db.lock().await;
    db.update_entity(&id, &name, &entity_type, &content)
        .await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_entity(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let db = state.db.lock().await;
    db.delete_entity(&id).await.map_err(|e| e.to_string())
}

// ─── Relationships ──────────────────────────────────────────────

#[tauri::command]
pub async fn create_relationship(
    state: State<'_, AppState>, project_id: String, source_entity_id: String, target_entity_id: String,
    relationship_type: String, description: String,
) -> Result<Relationship, String> {
    let db = state.db.lock().await;
    db.create_relationship(&project_id, &source_entity_id, &target_entity_id, &relationship_type, &description)
        .await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_relationships(state: State<'_, AppState>, project_id: String) -> Result<Vec<Relationship>, String> {
    let db = state.db.lock().await;
    db.list_relationships(&project_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_relationship(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let db = state.db.lock().await;
    db.delete_relationship(&id).await.map_err(|e| e.to_string())
}

// ─── Chapters ───────────────────────────────────────────────────

#[tauri::command]
pub async fn create_chapter(
    state: State<'_, AppState>, project_id: String, title: String, content: String, chapter_number: i32,
) -> Result<Chapter, String> {
    let db = state.db.lock().await;
    db.create_chapter(&project_id, &title, &content, chapter_number)
        .await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_chapters(state: State<'_, AppState>, project_id: String) -> Result<Vec<Chapter>, String> {
    let db = state.db.lock().await;
    db.list_chapters(&project_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_chapter(state: State<'_, AppState>, id: String, title: String, content: String) -> Result<Chapter, String> {
    let db = state.db.lock().await;
    db.update_chapter(&id, &title, &content).await.map_err(|e| e.to_string())
}

// ─── Messages ──────────────────────────────────────────────────

#[tauri::command]
pub async fn save_message(state: State<'_, AppState>, project_id: String, role: String, content: String) -> Result<Message, String> {
    let db = state.db.lock().await;
    db.save_message(&project_id, &role, &content).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_messages(state: State<'_, AppState>, project_id: String) -> Result<Vec<Message>, String> {
    let db = state.db.lock().await;
    db.list_messages(&project_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn clear_messages(state: State<'_, AppState>, project_id: String) -> Result<(), String> {
    let db = state.db.lock().await;
    db.clear_messages(&project_id).await.map_err(|e| e.to_string())
}

// ─── Plans ─────────────────────────────────────────────────────

#[tauri::command]
pub async fn save_plan(state: State<'_, AppState>, project_id: String, title: String, content: String) -> Result<Plan, String> {
    let db = state.db.lock().await;
    db.save_plan(&project_id, &title, &content).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_plans(state: State<'_, AppState>, project_id: String) -> Result<Vec<Plan>, String> {
    let db = state.db.lock().await;
    db.list_plans(&project_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_plan(state: State<'_, AppState>, id: String) -> Result<Plan, String> {
    let db = state.db.lock().await;
    db.get_plan(&id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_plan(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let db = state.db.lock().await;
    db.delete_plan(&id).await.map_err(|e| e.to_string())
}
