//! AI provider transport + run logging.

use crate::ai_settings;
use reqwest::header::{AUTHORIZATION, CONTENT_TYPE};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Debug, Serialize)]
struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Debug, Serialize)]
struct OpenAiRequest {
    model: String,
    messages: Vec<ChatMessage>,
    temperature: f32,
    response_format: serde_json::Value,
}

#[derive(Debug, Serialize)]
struct VisionMessage {
    role: String,
    content: Vec<serde_json::Value>,
}

#[derive(Debug, Serialize)]
struct VisionRequest {
    model: String,
    messages: Vec<VisionMessage>,
    temperature: f32,
}

#[derive(Debug, Deserialize)]
struct OpenAiResponse {
    choices: Vec<OpenAiChoice>,
}

#[derive(Debug, Deserialize)]
struct OpenAiChoice {
    message: OpenAiMessage,
}

#[derive(Debug, Deserialize)]
struct OpenAiMessage {
    content: String,
}

pub fn api_key() -> Result<String, String> {
    ai_settings::lookup_api_key().ok_or_else(|| {
        "No OpenAI API key configured. Open Settings -> AI provider to add one.".to_string()
    })
}

pub fn analysis_max_chars() -> usize {
    std::env::var("CASESPACE_ANALYSIS_MAX_CHARS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(60_000)
}

pub fn analysis_token_ceiling() -> usize {
    std::env::var("CASESPACE_ANALYSIS_TOKEN_CEILING")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(1_000_000)
}

pub fn start_run_log(
    conn: &Connection,
    case_id: &str,
    command: &str,
    model: &str,
    prompt_chars: usize,
) -> Result<String, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO ai_run_log (id, case_id, command, model, prompt_chars, response_chars, started_at, status)
         VALUES (?1, ?2, ?3, ?4, ?5, 0, ?6, 'running')",
        params![id, case_id, command, model, prompt_chars as i64, now],
    )
    .map_err(|e| e.to_string())?;
    Ok(id)
}

pub fn finish_run_log(
    conn: &Connection,
    run_id: &str,
    response_chars: usize,
    status: &str,
    error: Option<&str>,
) -> Result<(), String> {
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "UPDATE ai_run_log SET response_chars = ?1, ended_at = ?2, status = ?3, error = ?4 WHERE id = ?5",
        params![response_chars as i64, now, status, error, run_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub async fn call_openai_json_file_with_settings(
    system: &str,
    user_prompt: String,
    model: String,
    api_url: String,
) -> Result<String, String> {
    call_openai_json_with_timeout_and_settings(system, user_prompt, 60, model, api_url).await
}

pub async fn call_openai_json_corpus_with_settings(
    system: &str,
    user_prompt: String,
    model: String,
    api_url: String,
) -> Result<String, String> {
    call_openai_json_with_timeout_and_settings(system, user_prompt, 300, model, api_url).await
}

pub async fn call_openai_json_with_timeout_and_settings(
    system: &str,
    user_prompt: String,
    timeout_secs: u64,
    model: String,
    api_url: String,
) -> Result<String, String> {
    let key = api_key()?;
    let req = OpenAiRequest {
        model: model.clone(),
        temperature: 0.2,
        response_format: serde_json::json!({ "type": "json_object" }),
        messages: vec![
            ChatMessage {
                role: "system".to_string(),
                content: system.to_string(),
            },
            ChatMessage {
                role: "user".to_string(),
                content: user_prompt,
            },
        ],
    };

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(timeout_secs))
        .build()
        .map_err(|e| e.to_string())?;

    let response = client
        .post(api_url)
        .header(AUTHORIZATION, format!("Bearer {key}"))
        .header(CONTENT_TYPE, "application/json")
        .json(&req)
        .send()
        .await
        .map_err(|e| format!("AI provider request failed: {e}"))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("AI provider returned {status}: {body}"));
    }

    let body: OpenAiResponse = response
        .json()
        .await
        .map_err(|e| format!("AI provider response parse failed: {e}"))?;
    body.choices
        .into_iter()
        .next()
        .map(|choice| choice.message.content)
        .ok_or_else(|| "AI provider returned no choices".to_string())
}

const VISION_OCR_SYSTEM_PROMPT: &str = "You are a forensic OCR assistant. Extract all visible text from the provided image verbatim. Preserve line breaks and reading order. Do not summarize, translate, or interpret. If the image contains no readable text, return an empty string. Return plain text only — no markdown, no commentary.";

/// OCR an image via the BYOK provider's chat completions endpoint with vision content.
///
/// `image_b64` must be unpadded raw base64 (no `data:` prefix). `mime` is the original
/// image content type, e.g. `image/png`.
pub async fn vision_ocr(
    image_b64: &str,
    mime: &str,
    model: &str,
    api_url: &str,
) -> Result<String, String> {
    let key = api_key()?;
    let data_url = format!("data:{mime};base64,{image_b64}");

    let req = VisionRequest {
        model: model.to_string(),
        temperature: 0.0,
        messages: vec![
            VisionMessage {
                role: "system".to_string(),
                content: vec![serde_json::json!({
                    "type": "text",
                    "text": VISION_OCR_SYSTEM_PROMPT,
                })],
            },
            VisionMessage {
                role: "user".to_string(),
                content: vec![
                    serde_json::json!({
                        "type": "text",
                        "text": "Extract all visible text from this image.",
                    }),
                    serde_json::json!({
                        "type": "image_url",
                        "image_url": { "url": data_url },
                    }),
                ],
            },
        ],
    };

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(120))
        .build()
        .map_err(|e| e.to_string())?;

    let response = client
        .post(api_url)
        .header(AUTHORIZATION, format!("Bearer {key}"))
        .header(CONTENT_TYPE, "application/json")
        .json(&req)
        .send()
        .await
        .map_err(|e| format!("AI vision request failed: {e}"))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("AI vision returned {status}: {body}"));
    }

    let body: OpenAiResponse = response
        .json()
        .await
        .map_err(|e| format!("AI vision response parse failed: {e}"))?;
    body.choices
        .into_iter()
        .next()
        .map(|choice| choice.message.content)
        .ok_or_else(|| "AI vision returned no choices".to_string())
}
