mod commands;
mod db;

use commands::AppState;
use db::Database;
use tauri::Manager;

fn init_database(app: &tauri::App) -> Database {
    let app_dir = app.path().app_data_dir().expect("failed to get app data dir");
    std::fs::create_dir_all(&app_dir).ok();
    let db_path = app_dir.join("novel_studio.db");
    let db_path_str = db_path.to_string_lossy();

    tauri::async_runtime::block_on(
        Database::new(&format!("sqlite:///{}", db_path_str))
    ).expect("failed to initialize database")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let database = init_database(app);
            app.manage(AppState {
                db: tokio::sync::Mutex::new(database),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::create_project,
            commands::list_projects,
            commands::get_project,
            commands::update_project,
            commands::delete_project,
            commands::create_entity,
            commands::list_entities,
            commands::get_entity,
            commands::update_entity,
            commands::delete_entity,
            commands::create_relationship,
            commands::list_relationships,
            commands::delete_relationship,
            commands::create_chapter,
            commands::list_chapters,
            commands::update_chapter,
            commands::save_message,
            commands::list_messages,
            commands::clear_messages,
            commands::save_plan,
            commands::list_plans,
            commands::get_plan,
            commands::delete_plan,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
