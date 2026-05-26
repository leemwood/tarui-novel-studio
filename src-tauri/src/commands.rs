use crate::db::{Database, Entity, Message, Plan, Project, Relationship, Chapter};
use tauri::State;
use std::sync::Mutex;

pub struct AppState {
    pub db: Mutex<Database>,
}

// ─── Projects ───────────────────────────────────────────────────

#[tauri::command]
pub fn create_project(state: State<AppState>, name: String, description: String) -> Result<Project, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    tauri::async_runtime::block_on(db.create_project(&name, &description)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_projects(state: State<AppState>) -> Result<Vec<Project>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    tauri::async_runtime::block_on(db.list_projects()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_project(state: State<AppState>, id: String) -> Result<Project, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    tauri::async_runtime::block_on(db.get_project(&id)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_project(state: State<AppState>, id: String, name: String, description: String) -> Result<Project, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    tauri::async_runtime::block_on(db.update_project(&id, &name, &description)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_project(state: State<AppState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    tauri::async_runtime::block_on(db.delete_project(&id)).map_err(|e| e.to_string())
}

// ─── Entities ───────────────────────────────────────────────────

#[tauri::command]
pub fn create_entity(
    state: State<AppState>, project_id: String, name: String, entity_type: String, content: String,
) -> Result<Entity, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    tauri::async_runtime::block_on(db.create_entity(&project_id, &name, &entity_type, &content))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_entities(state: State<AppState>, project_id: String) -> Result<Vec<Entity>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    tauri::async_runtime::block_on(db.list_entities(&project_id)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_entity(state: State<AppState>, id: String) -> Result<Entity, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    tauri::async_runtime::block_on(db.get_entity(&id)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_entity(
    state: State<AppState>, id: String, name: String, entity_type: String, content: String,
) -> Result<Entity, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    tauri::async_runtime::block_on(db.update_entity(&id, &name, &entity_type, &content))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_entity(state: State<AppState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    tauri::async_runtime::block_on(db.delete_entity(&id)).map_err(|e| e.to_string())
}

// ─── Relationships ──────────────────────────────────────────────

#[tauri::command]
pub fn create_relationship(
    state: State<AppState>, project_id: String, source_entity_id: String, target_entity_id: String,
    relationship_type: String, description: String,
) -> Result<Relationship, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    tauri::async_runtime::block_on(
        db.create_relationship(&project_id, &source_entity_id, &target_entity_id, &relationship_type, &description)
    ).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_relationships(state: State<AppState>, project_id: String) -> Result<Vec<Relationship>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    tauri::async_runtime::block_on(db.list_relationships(&project_id)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_relationship(state: State<AppState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    tauri::async_runtime::block_on(db.delete_relationship(&id)).map_err(|e| e.to_string())
}

// ─── Chapters ───────────────────────────────────────────────────

#[tauri::command]
pub fn create_chapter(
    state: State<AppState>, project_id: String, title: String, content: String, chapter_number: i32,
) -> Result<Chapter, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    tauri::async_runtime::block_on(db.create_chapter(&project_id, &title, &content, chapter_number))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_chapters(state: State<AppState>, project_id: String) -> Result<Vec<Chapter>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    tauri::async_runtime::block_on(db.list_chapters(&project_id)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_chapter(state: State<AppState>, id: String, title: String, content: String) -> Result<Chapter, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    tauri::async_runtime::block_on(db.update_chapter(&id, &title, &content)).map_err(|e| e.to_string())
}

// ─── Messages ──────────────────────────────────────────────────

#[tauri::command]
pub fn save_message(state: State<AppState>, project_id: String, role: String, content: String) -> Result<Message, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    tauri::async_runtime::block_on(db.save_message(&project_id, &role, &content)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_messages(state: State<AppState>, project_id: String) -> Result<Vec<Message>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    tauri::async_runtime::block_on(db.list_messages(&project_id)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn clear_messages(state: State<AppState>, project_id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    tauri::async_runtime::block_on(db.clear_messages(&project_id)).map_err(|e| e.to_string())
}

// ─── Plans ─────────────────────────────────────────────────────

#[tauri::command]
pub fn save_plan(state: State<AppState>, project_id: String, title: String, content: String) -> Result<Plan, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    tauri::async_runtime::block_on(db.save_plan(&project_id, &title, &content)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_plans(state: State<AppState>, project_id: String) -> Result<Vec<Plan>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    tauri::async_runtime::block_on(db.list_plans(&project_id)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_plan(state: State<AppState>, id: String) -> Result<Plan, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    tauri::async_runtime::block_on(db.get_plan(&id)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_plan(state: State<AppState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    tauri::async_runtime::block_on(db.delete_plan(&id)).map_err(|e| e.to_string())
}
