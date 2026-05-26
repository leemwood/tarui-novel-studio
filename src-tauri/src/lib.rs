mod commands;
mod db;

use commands::AppState;
use db::Database;
use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let app_dir = app.path().app_data_dir().expect("failed to get app data dir");
            std::fs::create_dir_all(&app_dir).ok();
            let db_path = app_dir.join("novel_studio.db");
            let db_path_str = db_path.to_string_lossy().to_string();

            let database = tauri::async_runtime::block_on(Database::new(&format!("sqlite:{}", db_path_str)))
                .expect("failed to initialize database");

            app.manage(AppState {
                db: Mutex::new(database),
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Projects
            commands::create_project,
            commands::list_projects,
            commands::get_project,
            commands::update_project,
            commands::delete_project,
            // Entities
            commands::create_entity,
            commands::list_entities,
            commands::get_entity,
            commands::update_entity,
            commands::delete_entity,
            // Relationships
            commands::create_relationship,
            commands::list_relationships,
            commands::delete_relationship,
            // Chapters
            commands::create_chapter,
            commands::list_chapters,
            commands::update_chapter,
            // Messages
            commands::save_message,
            commands::list_messages,
            commands::clear_messages,
            // Plans
            commands::save_plan,
            commands::list_plans,
            commands::get_plan,
            commands::delete_plan,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
