// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    tray::TrayIconBuilder,
    Manager,
    Emitter,
    ActivationPolicy,
};
use tauri_plugin_sql::{Migration, MigrationKind};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};

fn migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "create sessions table",
            sql: r#"
                CREATE TABLE IF NOT EXISTS sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    mode TEXT NOT NULL,
                    duration_seconds INTEGER NOT NULL,
                    completed_at TEXT NOT NULL,
                    completed INTEGER NOT NULL DEFAULT 1
                );
                CREATE INDEX IF NOT EXISTS idx_sessions_completed_at ON sessions(completed_at);
            "#,
            kind: MigrationKind::Up,
        }
    ]
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_sql::Builder::new()
        .add_migrations("sqlite:pomo.db", migrations())
            .build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
        // Hide from docks (works in dev mode too)
            #[cfg(target_os = "macos")]
            app.set_activation_policy(ActivationPolicy::Accessory);

            // Register global shortcuts
            let work_shortcut = "Ctrl+Alt+Shift+W".parse::<Shortcut>().unwrap();
            app.global_shortcut().on_shortcut(work_shortcut, |app, _shortcut, _event| {
                let _ = app.emit("shortcut-startWork", ());
            })?;

            let pause_shortcut = "Ctrl+Alt+Shift+P".parse::<Shortcut>().unwrap();
            app.global_shortcut().on_shortcut(pause_shortcut, |app, _shortcut, _event| {
                let _ = app.emit("shortcut-pause", ());
            })?;

            let break_shortcut = "Ctrl+Alt+Shift+B".parse::<Shortcut>().unwrap();
            app.global_shortcut().on_shortcut(break_shortcut, |app, _shortcut, _event| {
                let _ = app.emit("shortcut-startBreak", ());
            })?;

            // Build tray icon with explicit ID
            let _tray = TrayIconBuilder::with_id("main")
                .icon(app.default_window_icon().unwrap().clone())
                .title("25:00")
                .on_tray_icon_event(|tray, event| {
                    use tauri::tray::{TrayIconEvent, MouseButtonState};
                    if let TrayIconEvent::Click { button_state, .. } = event {
                        // Only toggle on button release, not press
                        if button_state == MouseButtonState::Up {
                            let app = tray.app_handle();
                            if let Some(window) = app.get_webview_window("main") {
                                if window.is_visible().unwrap_or(false) {
                                    let _ = window.hide();
                                } else {
                                    let _ = window.show();
                                    let _ = window.set_focus();
                                }
                            }
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![update_tray_title])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn update_tray_title(app: tauri::AppHandle, title: String) {
    if let Some(tray) = app.tray_by_id("main") {
        let _ = tray.set_title(Some(&title));
    }
}