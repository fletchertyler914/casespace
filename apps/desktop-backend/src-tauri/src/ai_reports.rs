//! Provider-backed AI report drafting.
//!
//! The model drafts section prose only. CaseSpace keeps ownership of section ids,
//! citations, compliance checks, and final validation.

use crate::{
    ai_provider, ai_settings,
    reports::{self, ReportDocument},
};
use regex::Regex;
use reqwest::header::{AUTHORIZATION, CONTENT_TYPE};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;

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

#[derive(Debug, Deserialize)]
struct AiDraftResponse {
    sections: Vec<AiSectionDraft>,
}

#[derive(Debug, Deserialize)]
struct AiSectionDraft {
    id: String,
    text: String,
}

pub struct PreparedAiReport {
    case_name: String,
    baseline: ReportDocument,
    prompt: String,
    model: String,
    base_url: String,
}

fn case_name(conn: &Connection, case_id: &str) -> Result<String, String> {
    conn.query_row(
        "SELECT name FROM cases WHERE id = ?1",
        params![case_id],
        |row| row.get(0),
    )
    .map_err(|_| "case not found".to_string())
}

fn prompt_for_report(case_name: &str, baseline: &ReportDocument) -> String {
    let sections = baseline
        .sections
        .iter()
        .map(|section| {
            let citations = section
                .citations
                .iter()
                .map(|c| format!("{}:{} ({})", c.kind, c.id, c.label))
                .collect::<Vec<_>>()
                .join("; ");
            format!(
                "SECTION id={}\nheading={}\nallowed_citations={}\ncurrent_text:\n{}\n",
                section.id, section.heading, citations, section.text
            )
        })
        .collect::<Vec<_>>()
        .join("\n---\n");

    format!(
        r#"Draft a professional fraud examination or expert-witness report for CaseSpace.

Case name: {case_name}
Template id: {template_id}

Rules:
- Return JSON only.
- Return exactly this shape: {{"sections":[{{"id":"section_id","text":"draft text"}}]}}.
- Use only the supplied section ids. Do not add, remove, or rename sections.
- Draft substantive prose from the supplied case evidence, findings, notes, and chronology.
- Do not invent facts, parties, dates, amounts, exhibits, testimony, or credentials.
- Do not include legal guilt/innocence opinions or ultimate fraud conclusions.
- Preserve professional uncertainty: say evidence is "consistent with" or "indicates" when appropriate.
- Citations are controlled by CaseSpace; do not emit citation arrays or fake citation labels.
- If a section lacks enough evidence, write a concise examiner-facing placeholder that names the missing information.

Source-grounded section packets:
{sections}
"#,
        template_id = baseline.template_id,
    )
}

pub fn redact_for_llm(text: &str) -> String {
    let mut out = text.to_string();
    for (pattern, replacement) in [
        (
            r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
            "[REDACTED_EMAIL]",
        ),
        (
            r"(?:\+?1[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}",
            "[REDACTED_PHONE]",
        ),
        (
            r#"(?:/Users/|/home/|[A-Z]:\\)[^\s"'<>]+"#,
            "[REDACTED_PATH]",
        ),
    ] {
        if let Ok(re) = Regex::new(pattern) {
            out = re.replace_all(&out, replacement).to_string();
        }
    }
    if let Ok(amount_re) = Regex::new(r"\$[\d,]+(?:\.\d{2})?") {
        out = amount_re
            .replace_all(&out, |caps: &regex::Captures<'_>| {
                let raw = caps.get(0).map(|m| m.as_str()).unwrap_or_default();
                let amount = raw.replace(['$', ','], "").parse::<f64>().unwrap_or(0.0);
                if amount >= 1000.0 {
                    "[REDACTED_AMOUNT]".to_string()
                } else {
                    raw.to_string()
                }
            })
            .to_string();
    }
    out
}

fn merge_ai_sections(
    mut baseline: ReportDocument,
    case_name: &str,
    raw_json: &str,
) -> Result<ReportDocument, String> {
    let draft: AiDraftResponse = serde_json::from_str(raw_json)
        .map_err(|e| format!("AI provider returned invalid report JSON: {e}"))?;
    let expected_ids: HashSet<String> = baseline.sections.iter().map(|s| s.id.clone()).collect();
    let returned_ids: HashSet<String> = draft.sections.iter().map(|s| s.id.clone()).collect();
    let missing: Vec<String> = expected_ids.difference(&returned_ids).cloned().collect();
    if !missing.is_empty() {
        return Err(format!(
            "AI provider omitted required report section(s): {}",
            missing.join(", ")
        ));
    }

    for ai_section in draft.sections {
        let Some(section) = baseline.sections.iter_mut().find(|s| s.id == ai_section.id) else {
            return Err(format!(
                "AI provider returned unknown section id: {}",
                ai_section.id
            ));
        };
        let text = ai_section.text.trim();
        if text.is_empty() {
            return Err(format!(
                "AI provider returned empty text for section {}",
                ai_section.id
            ));
        }
        if !reports::language_scan_passes(text) {
            return Err(format!(
                "AI draft failed ACFE III.C.2 / SSFS language scan in section {}",
                ai_section.id
            ));
        }
        section.text = format!("{text}\n");
    }

    baseline.markdown = reports::sections_to_markdown(
        &baseline.template_id,
        case_name,
        &baseline.generated_at,
        &baseline.sections,
        &baseline.compliance,
    );

    if !reports::language_scan_passes(&baseline.markdown) {
        return Err(
            "AI draft failed ACFE III.C.2 / SSFS language scan: prohibited language detected"
                .into(),
        );
    }

    Ok(baseline)
}

async fn call_openai(prepared: &PreparedAiReport) -> Result<String, String> {
    let key = ai_provider::api_key()?;
    let req = OpenAiRequest {
        model: prepared.model.clone(),
        temperature: 0.2,
        response_format: serde_json::json!({ "type": "json_object" }),
        messages: vec![
            ChatMessage {
                role: "system".to_string(),
                content: "You are a careful CFE report drafting assistant. You only draft from provided facts and you return strict JSON.".to_string(),
            },
            ChatMessage {
                role: "user".to_string(),
                content: redact_for_llm(&prepared.prompt),
            },
        ],
    };

    let client = reqwest::Client::new();
    let response = client
        .post(&prepared.base_url)
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

pub fn prepare_ai_report_document(
    case_id: &str,
    template_id: &str,
    generated_at: &str,
    conn: &Connection,
) -> Result<PreparedAiReport, String> {
    let name = case_name(conn, case_id)?;
    let baseline = reports::build_report_document(case_id, template_id, generated_at, conn)?;
    let prompt = prompt_for_report(&name, &baseline);
    let model = ai_settings::model_name(Some(conn));
    let base_url = ai_settings::base_url(Some(conn));
    Ok(PreparedAiReport {
        case_name: name,
        baseline,
        prompt,
        model,
        base_url,
    })
}

pub async fn generate_ai_report_document(
    prepared: PreparedAiReport,
) -> Result<ReportDocument, String> {
    let raw = call_openai(&prepared).await?;
    let PreparedAiReport {
        case_name,
        baseline,
        ..
    } = prepared;
    merge_ai_sections(baseline, &case_name, &raw)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn merge_rejects_unknown_section_ids() {
        let baseline = ReportDocument {
            template_id: "cfe-long".to_string(),
            case_id: "case-1".to_string(),
            generated_at: "2026-01-01T00:00:00Z".to_string(),
            sections: vec![reports::ReportSection {
                id: "executive".to_string(),
                heading: "Executive Summary".to_string(),
                text: "Baseline\n".to_string(),
                citations: vec![],
                standards_tags: vec![],
            }],
            compliance: vec![],
            markdown: String::new(),
        };

        let err = merge_ai_sections(
            baseline,
            "Case",
            r#"{"sections":[{"id":"executive","text":"Draft"},{"id":"fake","text":"Draft"}]}"#,
        )
        .unwrap_err();
        assert!(err.contains("unknown section id"));
    }
}
