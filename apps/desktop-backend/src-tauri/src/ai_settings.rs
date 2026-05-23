//! User-configurable AI provider settings.

use keyring::{Entry, Error as KeyringError};
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};

pub const DEFAULT_OPENAI_URL: &str = "https://api.openai.com/v1/chat/completions";
pub const DEFAULT_OPENAI_MODEL: &str = "gpt-4o-mini";

const KEYRING_SERVICE: &str = "com.casespace.desktop";
const KEYRING_ACCOUNT: &str = "openai_api_key";
const MODEL_SETTING_KEY: &str = "ai_provider_model";
const BASE_URL_SETTING_KEY: &str = "ai_provider_base_url";

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum ApiKeySource {
    Keychain,
    Env,
    None,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiSettings {
    pub api_key_set: bool,
    pub api_key_source: ApiKeySource,
    pub model: String,
    pub base_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiConnectionTestResult {
    pub ok: bool,
    pub message: String,
    pub latency_ms: u128,
}

pub fn env_api_key() -> Option<String> {
    std::env::var("OPENAI_API_KEY")
        .or_else(|_| std::env::var("CASESPACE_OPENAI_API_KEY"))
        .ok()
        .map(|v| v.trim().to_string())
        .filter(|v| !v.is_empty())
}

pub fn env_model_name() -> Option<String> {
    std::env::var("CASESPACE_ANALYSIS_MODEL")
        .or_else(|_| std::env::var("CASESPACE_OPENAI_MODEL"))
        .or_else(|_| std::env::var("OPENAI_MODEL"))
        .ok()
        .map(|v| v.trim().to_string())
        .filter(|v| !v.is_empty())
}

pub fn env_base_url() -> Option<String> {
    std::env::var("CASESPACE_OPENAI_API_URL")
        .ok()
        .map(|v| v.trim().to_string())
        .filter(|v| !v.is_empty())
}

pub fn lookup_api_key() -> Option<String> {
    lookup_keychain_api_key().or_else(env_api_key)
}

pub fn model_name(conn: Option<&Connection>) -> String {
    conn.and_then(|c| read_setting(c, MODEL_SETTING_KEY).ok().flatten())
        .or_else(env_model_name)
        .unwrap_or_else(|| DEFAULT_OPENAI_MODEL.to_string())
}

pub fn base_url(conn: Option<&Connection>) -> String {
    conn.and_then(|c| read_setting(c, BASE_URL_SETTING_KEY).ok().flatten())
        .or_else(env_base_url)
        .unwrap_or_else(|| DEFAULT_OPENAI_URL.to_string())
}

pub fn load(conn: &Connection) -> Result<AiSettings, String> {
    let keychain_key = lookup_keychain_api_key();
    let env_key = env_api_key();
    let api_key_source = if keychain_key.is_some() {
        ApiKeySource::Keychain
    } else if env_key.is_some() {
        ApiKeySource::Env
    } else {
        ApiKeySource::None
    };

    Ok(AiSettings {
        api_key_set: !matches!(api_key_source, ApiKeySource::None),
        api_key_source,
        model: model_name(Some(conn)),
        base_url: base_url(Some(conn)),
    })
}

pub fn save(
    conn: &Connection,
    api_key: Option<String>,
    model: String,
    base_url: String,
) -> Result<(), String> {
    let cleaned_model = model.trim();
    let cleaned_base_url = base_url.trim();

    if cleaned_model.is_empty() {
        return Err("AI model cannot be empty".to_string());
    }
    if cleaned_base_url.is_empty() {
        return Err("AI provider base URL cannot be empty".to_string());
    }
    if !(cleaned_base_url.starts_with("https://") || cleaned_base_url.starts_with("http://")) {
        return Err("AI provider base URL must start with http:// or https://".to_string());
    }

    if let Some(raw_key) = api_key {
        let key = raw_key.trim();
        if !key.is_empty() {
            keyring_entry()?.set_password(key).map_err(keyring_error)?;
        }
    }

    write_setting(conn, MODEL_SETTING_KEY, cleaned_model)?;
    write_setting(conn, BASE_URL_SETTING_KEY, cleaned_base_url)?;
    Ok(())
}

pub fn clear_api_key() -> Result<(), String> {
    match keyring_entry()?.delete_credential() {
        Ok(()) | Err(KeyringError::NoEntry) => Ok(()),
        Err(e) => Err(keyring_error(e)),
    }
}

fn lookup_keychain_api_key() -> Option<String> {
    match keyring_entry().and_then(|entry| entry.get_password().map_err(keyring_error)) {
        Ok(key) => {
            let trimmed = key.trim().to_string();
            if trimmed.is_empty() {
                None
            } else {
                Some(trimmed)
            }
        }
        Err(_) => None,
    }
}

fn keyring_entry() -> Result<Entry, String> {
    Entry::new(KEYRING_SERVICE, KEYRING_ACCOUNT).map_err(keyring_error)
}

fn keyring_error(error: KeyringError) -> String {
    format!("AI keychain access failed: {error}")
}

fn read_setting(conn: &Connection, key: &str) -> Result<Option<String>, String> {
    conn.query_row(
        "SELECT value FROM app_settings WHERE key = ?1",
        params![key],
        |row| row.get::<_, String>(0),
    )
    .optional()
    .map_err(|e| e.to_string())
}

fn write_setting(conn: &Connection, key: &str, value: &str) -> Result<(), String> {
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO app_settings (key, value, updated_at) VALUES (?1, ?2, ?3)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
        params![key, value, now],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::Database;
    use std::path::PathBuf;
    use std::sync::Once;

    static KEYRING_MOCK: Once = Once::new();

    fn db() -> (PathBuf, Database) {
        let dir =
            std::env::temp_dir().join(format!("casespace-ai-settings-{}", uuid::Uuid::new_v4()));
        let db_path = dir.join("test.sqlite");
        let db = Database::open(&db_path).expect("db");
        (dir, db)
    }

    fn enable_mock_keyring() {
        KEYRING_MOCK.call_once(|| {
            keyring::set_default_credential_builder(keyring::mock::default_credential_builder());
        });
    }

    #[test]
    fn save_and_load_non_secret_provider_settings() {
        let (_dir, db) = db();
        db.with_connection(|conn| {
            save(
                conn,
                None,
                "gpt-4o-mini".to_string(),
                "https://api.openai.com/v1/chat/completions".to_string(),
            )?;

            let settings = load(conn)?;
            assert_eq!(settings.model, "gpt-4o-mini");
            assert_eq!(
                settings.base_url,
                "https://api.openai.com/v1/chat/completions"
            );
            Ok(())
        })
        .expect("db op");
    }

    #[test]
    fn rejects_empty_model_or_invalid_url() {
        let (_dir, db) = db();
        db.with_connection(|conn| {
            assert!(save(
                conn,
                None,
                "".to_string(),
                "https://example.com".to_string()
            )
            .is_err());
            assert!(save(
                conn,
                None,
                "gpt-4o-mini".to_string(),
                "not-a-url".to_string(),
            )
            .is_err());
            Ok(())
        })
        .expect("db op");
    }

    #[test]
    fn keyring_mock_accepts_clear_without_real_os_store() {
        enable_mock_keyring();
        clear_api_key().expect("clear missing key");
    }
}
