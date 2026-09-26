use std::fs::{self, File};
use std::io::Write;
use std::path::PathBuf;
use tauri::Manager;

const DATA_FILE: &str = "goals.json";

fn data_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join(DATA_FILE))
}

/// Returns the saved goals as raw JSON, or None on first run.
#[tauri::command]
fn load_goals(app: tauri::AppHandle) -> Result<Option<String>, String> {
    match fs::read_to_string(data_path(&app)?) {
        Ok(s) => Ok(Some(s)),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

/// Writes to a temp file and renames it over the old one, so a crash mid-save
/// never leaves a half-written file. The previous version is kept as goals.json.bak.
#[tauri::command]
fn save_goals(app: tauri::AppHandle, data: String) -> Result<(), String> {
    serde_json::from_str::<serde_json::Value>(&data).map_err(|e| format!("refusing to save invalid JSON: {e}"))?;
    let path = data_path(&app)?;
    let tmp = path.with_extension("json.tmp");
    {
        let mut f = File::create(&tmp).map_err(|e| e.to_string())?;
        f.write_all(data.as_bytes()).map_err(|e| e.to_string())?;
        f.sync_all().map_err(|e| e.to_string())?;
    }
    if path.exists() {
        let _ = fs::copy(&path, path.with_extension("json.bak"));
    }
    fs::rename(&tmp, &path).map_err(|e| e.to_string())
}

#[tauri::command]
fn data_location(app: tauri::AppHandle) -> Result<String, String> {
    Ok(data_path(&app)?.display().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.unminimize();
                let _ = w.show();
                let _ = w.set_focus();
            }
        }))
        .invoke_handler(tauri::generate_handler![load_goals, save_goals, data_location])
        .run(tauri::generate_context!())
        .expect("error while running Goal Ladder");
}
