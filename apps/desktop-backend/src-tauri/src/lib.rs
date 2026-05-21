use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    fs,
    path::{Path, PathBuf},
    sync::Mutex,
};
use tauri::{AppHandle, Manager, State};
use uuid::Uuid;
use walkdir::WalkDir;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct CaseSummary {
    id: String,
    name: String,
    status: String,
    source_paths: Vec<String>,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Note {
    id: String,
    case_id: String,
    content: String,
    created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Finding {
    id: String,
    case_id: String,
    title: String,
    description: String,
    created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct TimelineEvent {
    id: String,
    case_id: String,
    description: String,
    occurred_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct TimeEntry {
    id: String,
    case_id: String,
    started_at: String,
    ended_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct InventoryItem {
    id: String,
    case_id: String,
    file_name: String,
    file_path: String,
    size_bytes: u64,
    modified_at: String,
}

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
struct Store {
    cases: HashMap<String, CaseSummary>,
    notes: Vec<Note>,
    findings: Vec<Finding>,
    timeline_events: Vec<TimelineEvent>,
    time_entries: Vec<TimeEntry>,
    inventory_items: Vec<InventoryItem>,
}

#[derive(Default)]
struct AppState {
    store: Mutex<Store>,
}

fn now_iso() -> String {
    Utc::now().to_rfc3339()
}

fn store_path(app: &AppHandle) -> Result<PathBuf, String> {
    let mut path = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("failed to resolve app data dir: {e}"))?;
    fs::create_dir_all(&path).map_err(|e| format!("failed to create app data dir: {e}"))?;
    path.push("casespace-v2-store.json");
    Ok(path)
}

fn load_store(app: &AppHandle) -> Store {
    let Ok(path) = store_path(app) else {
        return Store::default();
    };
    let Ok(contents) = fs::read_to_string(path) else {
        return Store::default();
    };
    serde_json::from_str(&contents).unwrap_or_default()
}

fn persist_store(app: &AppHandle, store: &Store) -> Result<(), String> {
    let path = store_path(app)?;
    let payload =
        serde_json::to_string_pretty(store).map_err(|e| format!("serialize store failed: {e}"))?;
    fs::write(path, payload).map_err(|e| format!("persist store failed: {e}"))
}

fn is_path_string_safe(path: &str) -> bool {
    !path.contains('\0') && !path.contains("..")
}

fn validate_safe_path(path: &str, roots: &[String]) -> Result<PathBuf, String> {
    if !is_path_string_safe(path) {
        return Err("path failed safety validation".to_string());
    }
    let canonical = Path::new(path)
        .canonicalize()
        .map_err(|e| format!("failed canonicalize path: {e}"))?;
    if roots.is_empty() {
        return Err("no case source roots configured for path access".to_string());
    }

    let allowed = roots.iter().any(|root| {
        Path::new(root)
            .canonicalize()
            .map(|root_path| canonical.starts_with(root_path))
            .unwrap_or(false)
    });
    if !allowed {
        return Err("path outside configured case source roots".to_string());
    }
    Ok(canonical)
}

fn collect_roots(store: &Store, case_id: Option<&str>) -> Vec<String> {
    match case_id {
        Some(id) => store
            .cases
            .get(id)
            .map(|case_| case_.source_paths.clone())
            .unwrap_or_default(),
        None => store
            .cases
            .values()
            .flat_map(|case_| case_.source_paths.clone())
            .collect(),
    }
}

#[tauri::command]
fn create_case(
    name: String,
    source_paths: Vec<String>,
    app: AppHandle,
    state: State<AppState>,
) -> Result<CaseSummary, String> {
    if name.trim().is_empty() {
        return Err("case name cannot be empty".into());
    }
    let mut store = state.store.lock().map_err(|_| "state lock poisoned")?;
    let now = now_iso();
    let case = CaseSummary {
        id: Uuid::new_v4().to_string(),
        name,
        status: "active".to_string(),
        source_paths,
        created_at: now.clone(),
        updated_at: now,
    };
    store.cases.insert(case.id.clone(), case.clone());
    persist_store(&app, &store)?;
    Ok(case)
}

#[tauri::command]
fn list_cases(state: State<AppState>) -> Result<Vec<CaseSummary>, String> {
    let store = state.store.lock().map_err(|_| "state lock poisoned")?;
    Ok(store.cases.values().cloned().collect())
}

#[tauri::command]
fn delete_case(case_id: String, app: AppHandle, state: State<AppState>) -> Result<(), String> {
    let mut store = state.store.lock().map_err(|_| "state lock poisoned")?;
    store.cases.remove(&case_id);
    store.notes.retain(|note| note.case_id != case_id);
    store.findings.retain(|finding| finding.case_id != case_id);
    store.timeline_events.retain(|event| event.case_id != case_id);
    store.time_entries.retain(|entry| entry.case_id != case_id);
    store.inventory_items.retain(|item| item.case_id != case_id);
    persist_store(&app, &store)?;
    Ok(())
}

#[tauri::command]
fn create_note(
    case_id: String,
    content: String,
    app: AppHandle,
    state: State<AppState>,
) -> Result<Note, String> {
    let mut store = state.store.lock().map_err(|_| "state lock poisoned")?;
    if !store.cases.contains_key(&case_id) {
        return Err("case not found".into());
    }
    let note = Note {
        id: Uuid::new_v4().to_string(),
        case_id,
        content,
        created_at: now_iso(),
    };
    store.notes.push(note.clone());
    persist_store(&app, &store)?;
    Ok(note)
}

#[tauri::command]
fn list_notes(case_id: String, state: State<AppState>) -> Result<Vec<Note>, String> {
    let store = state.store.lock().map_err(|_| "state lock poisoned")?;
    Ok(store
        .notes
        .iter()
        .filter(|note| note.case_id == case_id)
        .cloned()
        .collect())
}

#[tauri::command]
fn create_finding(
    case_id: String,
    title: String,
    description: String,
    app: AppHandle,
    state: State<AppState>,
) -> Result<Finding, String> {
    let mut store = state.store.lock().map_err(|_| "state lock poisoned")?;
    if !store.cases.contains_key(&case_id) {
        return Err("case not found".into());
    }
    let finding = Finding {
        id: Uuid::new_v4().to_string(),
        case_id,
        title,
        description,
        created_at: now_iso(),
    };
    store.findings.push(finding.clone());
    persist_store(&app, &store)?;
    Ok(finding)
}

#[tauri::command]
fn list_findings(case_id: String, state: State<AppState>) -> Result<Vec<Finding>, String> {
    let store = state.store.lock().map_err(|_| "state lock poisoned")?;
    Ok(store
        .findings
        .iter()
        .filter(|finding| finding.case_id == case_id)
        .cloned()
        .collect())
}

#[tauri::command]
fn create_timeline_event(
    case_id: String,
    description: String,
    occurred_at: Option<String>,
    app: AppHandle,
    state: State<AppState>,
) -> Result<TimelineEvent, String> {
    let mut store = state.store.lock().map_err(|_| "state lock poisoned")?;
    if !store.cases.contains_key(&case_id) {
        return Err("case not found".into());
    }
    let event = TimelineEvent {
        id: Uuid::new_v4().to_string(),
        case_id,
        description,
        occurred_at: occurred_at.unwrap_or_else(now_iso),
    };
    store.timeline_events.push(event.clone());
    persist_store(&app, &store)?;
    Ok(event)
}

#[tauri::command]
fn list_timeline_events(
    case_id: String,
    state: State<AppState>,
) -> Result<Vec<TimelineEvent>, String> {
    let store = state.store.lock().map_err(|_| "state lock poisoned")?;
    Ok(store
        .timeline_events
        .iter()
        .filter(|event| event.case_id == case_id)
        .cloned()
        .collect())
}

#[tauri::command]
fn start_timer(case_id: String, app: AppHandle, state: State<AppState>) -> Result<TimeEntry, String> {
    let mut store = state.store.lock().map_err(|_| "state lock poisoned")?;
    if !store.cases.contains_key(&case_id) {
        return Err("case not found".into());
    }
    let entry = TimeEntry {
        id: Uuid::new_v4().to_string(),
        case_id,
        started_at: now_iso(),
        ended_at: None,
    };
    store.time_entries.push(entry.clone());
    persist_store(&app, &store)?;
    Ok(entry)
}

#[tauri::command]
fn stop_timer(entry_id: String, app: AppHandle, state: State<AppState>) -> Result<TimeEntry, String> {
    let mut store = state.store.lock().map_err(|_| "state lock poisoned")?;
    let entry = store
        .time_entries
        .iter_mut()
        .find(|entry| entry.id == entry_id)
        .ok_or("timer entry not found")?;
    entry.ended_at = Some(now_iso());
    let output = entry.clone();
    persist_store(&app, &store)?;
    Ok(output)
}

#[tauri::command]
fn get_time_entries(case_id: String, state: State<AppState>) -> Result<Vec<TimeEntry>, String> {
    let store = state.store.lock().map_err(|_| "state lock poisoned")?;
    Ok(store
        .time_entries
        .iter()
        .filter(|entry| entry.case_id == case_id)
        .cloned()
        .collect())
}

#[tauri::command]
fn scan_directory(case_id: String, path: String, state: State<AppState>) -> Result<Vec<InventoryItem>, String> {
    let mut items = Vec::new();
    let _ = case_id;
    if !is_path_string_safe(&path) {
        return Err("unsafe path supplied".to_string());
    }
    for entry in WalkDir::new(path).into_iter().filter_map(Result::ok).take(5000) {
        let Ok(metadata) = entry.metadata() else {
            continue;
        };
        if metadata.is_file() {
            items.push(InventoryItem {
                id: Uuid::new_v4().to_string(),
                case_id: case_id.clone(),
                file_name: entry.file_name().to_string_lossy().to_string(),
                file_path: entry.path().to_string_lossy().to_string(),
                size_bytes: metadata.len(),
                modified_at: now_iso(),
            });
        }
    }
    let _store = state.store.lock().map_err(|_| "state lock poisoned")?;
    Ok(items)
}

#[tauri::command]
fn search_all(case_id: String, query: String, state: State<AppState>) -> Result<Vec<String>, String> {
    let query_lower = query.trim().to_lowercase();
    if query_lower.is_empty() {
        return Ok(vec![]);
    }
    let store = state.store.lock().map_err(|_| "state lock poisoned")?;
    let mut results = Vec::new();

    for note in store.notes.iter().filter(|note| note.case_id == case_id) {
        if note.content.to_lowercase().contains(&query_lower) {
            results.push(format!("note:{}", note.id));
        }
    }
    for finding in store.findings.iter().filter(|finding| finding.case_id == case_id) {
        if finding.title.to_lowercase().contains(&query_lower)
            || finding.description.to_lowercase().contains(&query_lower)
        {
            results.push(format!("finding:{}", finding.id));
        }
    }
    for event in store
        .timeline_events
        .iter()
        .filter(|event| event.case_id == case_id)
    {
        if event.description.to_lowercase().contains(&query_lower) {
            results.push(format!("timeline:{}", event.id));
        }
    }
    Ok(results)
}

#[tauri::command]
fn read_file_text(
    case_id: String,
    path: String,
    state: State<AppState>,
) -> Result<String, String> {
    let store = state.store.lock().map_err(|_| "state lock poisoned")?;
    let roots = collect_roots(&store, Some(&case_id));
    let safe = validate_safe_path(&path, &roots)?;
    fs::read_to_string(safe).map_err(|e| format!("failed to read file: {e}"))
}

#[tauri::command]
fn write_file_text(
    case_id: String,
    path: String,
    content: String,
    state: State<AppState>,
) -> Result<(), String> {
    let store = state.store.lock().map_err(|_| "state lock poisoned")?;
    let roots = collect_roots(&store, Some(&case_id));
    let safe = validate_safe_path(&path, &roots)?;
    fs::write(safe, content).map_err(|e| format!("failed to write file: {e}"))
}

#[tauri::command]
fn open_file(case_id: String, path: String, state: State<AppState>) -> Result<String, String> {
    let store = state.store.lock().map_err(|_| "state lock poisoned")?;
    let roots = collect_roots(&store, Some(&case_id));
    let safe = validate_safe_path(&path, &roots)?;
    Ok(safe.to_string_lossy().to_string())
}

#[tauri::command]
fn run_ocr_preview(
    case_id: String,
    file_path: String,
    state: State<AppState>,
) -> Result<String, String> {
    let store = state.store.lock().map_err(|_| "state lock poisoned")?;
    let roots = collect_roots(&store, Some(&case_id));
    let safe = validate_safe_path(&file_path, &roots)?;
    let fallback = format!(
        "OCR fallback preview for {}. Connect a provider to enable full extraction.",
        safe.to_string_lossy()
    );
    Ok(fallback)
}

#[tauri::command]
fn generate_case_report(case_id: String, state: State<AppState>) -> Result<String, String> {
    let store = state.store.lock().map_err(|_| "state lock poisoned")?;
    let case_ = store
        .cases
        .get(&case_id)
        .ok_or("case not found for report generation")?;
    let notes = store.notes.iter().filter(|note| note.case_id == case_id).count();
    let findings = store
        .findings
        .iter()
        .filter(|finding| finding.case_id == case_id)
        .count();
    let timeline = store
        .timeline_events
        .iter()
        .filter(|event| event.case_id == case_id)
        .count();
    Ok(format!(
        "Case report for '{}': {} notes, {} findings, {} timeline events. Generated at {}.",
        case_.name,
        notes,
        findings,
        timeline,
        now_iso()
    ))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let loaded = load_store(&app.handle());
            app.manage(AppState {
                store: Mutex::new(loaded),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            create_case,
            list_cases,
            delete_case,
            create_note,
            list_notes,
            create_finding,
            list_findings,
            create_timeline_event,
            list_timeline_events,
            start_timer,
            stop_timer,
            get_time_entries,
            scan_directory,
            search_all,
            read_file_text,
            write_file_text,
            open_file,
            run_ocr_preview,
            generate_case_report
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::is_path_string_safe;

    #[test]
    fn rejects_traversal_paths() {
        assert!(!is_path_string_safe("../secret.txt"));
        assert!(!is_path_string_safe("..\\secret.txt"));
    }

    #[test]
    fn accepts_normal_absolute_path_string() {
        assert!(is_path_string_safe("/tmp/casespace-file.txt"));
    }
}
