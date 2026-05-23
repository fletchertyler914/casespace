//! Per-file text extraction with optional Tesseract OCR fallback.

use calamine::{open_workbook_auto, Reader};
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::process::Command;

const MIN_PDF_TEXT_CHARS: usize = 50;
const MAX_EXTRACT_CHARS: usize = 500_000;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileTextExtractResult {
    pub file_id: String,
    pub char_count: usize,
    pub extractor: String,
    pub ocr_used: bool,
    pub extracted_at: String,
    pub extract_error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TextExtractProgress {
    pub file_id: String,
    pub ok: bool,
    pub ocr_used: bool,
    pub char_count: usize,
    pub error: Option<String>,
}

fn extension_lower(path: &Path) -> String {
    path.extension()
        .map(|e| e.to_string_lossy().to_lowercase())
        .unwrap_or_default()
}

fn read_plain_text(path: &Path) -> Result<String, String> {
    let bytes = std::fs::read(path).map_err(|e| format!("read failed: {e}"))?;
    if let Ok(s) = String::from_utf8(bytes.clone()) {
        return Ok(truncate_text(s));
    }
    let (encoding, _bom_len) =
        encoding_rs::Encoding::for_bom(&bytes).unwrap_or((encoding_rs::UTF_8, 0));
    let (cow, _, _) = encoding.decode(&bytes);
    Ok(truncate_text(cow.into_owned()))
}

fn truncate_text(s: String) -> String {
    if s.len() <= MAX_EXTRACT_CHARS {
        s
    } else {
        s.chars().take(MAX_EXTRACT_CHARS).collect()
    }
}

fn extract_pdf_text_layer(path: &Path) -> Result<String, String> {
    let bytes = std::fs::read(path).map_err(|e| format!("pdf read: {e}"))?;
    pdf_extract::extract_text_from_mem(&bytes).map_err(|e| format!("pdf extract: {e}"))
}

fn tesseract_available() -> bool {
    Command::new("tesseract")
        .arg("--version")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

fn ocr_with_tesseract(path: &Path) -> Result<String, String> {
    if !tesseract_available() {
        return Err("OCR unavailable: install tesseract (brew install tesseract)".into());
    }
    let out_base = std::env::temp_dir().join(format!("casespace-ocr-{}", uuid::Uuid::new_v4()));
    let status = Command::new("tesseract")
        .arg(path)
        .arg(out_base.to_string_lossy().as_ref())
        .arg("-l")
        .arg("eng")
        .status()
        .map_err(|e| format!("tesseract spawn failed: {e}"))?;
    if !status.success() {
        return Err("tesseract OCR failed".into());
    }
    let txt_path = PathBuf::from(format!("{}.txt", out_base.display()));
    let text = std::fs::read_to_string(&txt_path).map_err(|e| format!("ocr output read: {e}"))?;
    let _ = std::fs::remove_file(&txt_path);
    Ok(truncate_text(text))
}

fn extract_docx(path: &Path) -> Result<String, String> {
    let file = std::fs::File::open(path).map_err(|e| format!("docx open: {e}"))?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| format!("docx zip: {e}"))?;
    let mut xml = archive
        .by_name("word/document.xml")
        .map_err(|e| format!("docx document.xml: {e}"))?;
    let mut buf = String::new();
    std::io::Read::read_to_string(&mut xml, &mut buf).map_err(|e| format!("docx read: {e}"))?;
    let mut out = String::new();
    let mut reader = quick_xml::Reader::from_str(&buf);
    reader.config_mut().trim_text(true);
    loop {
        match reader.read_event() {
            Ok(quick_xml::events::Event::Text(t)) => {
                out.push_str(&t.decode().unwrap_or_default());
                out.push(' ');
            }
            Ok(quick_xml::events::Event::Eof) => break,
            Err(e) => return Err(format!("docx xml: {e}")),
            _ => {}
        }
    }
    Ok(truncate_text(out))
}

fn extract_xlsx(path: &Path) -> Result<String, String> {
    let mut workbook = open_workbook_auto(path).map_err(|e| format!("xlsx open: {e}"))?;
    let mut out = String::new();
    for sheet_name in workbook.sheet_names().to_vec() {
        if let Ok(range) = workbook.worksheet_range(&sheet_name) {
            out.push_str(&format!("## {sheet_name}\n"));
            for row in range.rows() {
                let cells: Vec<String> = row.iter().map(|c| c.to_string()).collect();
                out.push_str(&cells.join("\t"));
                out.push('\n');
            }
        }
    }
    Ok(truncate_text(out))
}

fn extract_csv(path: &Path) -> Result<String, String> {
    let mut rdr = csv::ReaderBuilder::new()
        .flexible(true)
        .from_path(path)
        .map_err(|e| format!("csv open: {e}"))?;
    let mut out = String::new();
    for result in rdr.records() {
        let record = result.map_err(|e| format!("csv row: {e}"))?;
        out.push_str(&record.iter().collect::<Vec<_>>().join(","));
        out.push('\n');
    }
    Ok(truncate_text(out))
}

pub fn extract_text_from_path(path: &Path) -> (String, String, bool, Option<String>) {
    let ext = extension_lower(path);
    let image_exts = ["png", "jpg", "jpeg", "tif", "tiff", "bmp", "gif", "webp"];

    if image_exts.contains(&ext.as_str()) {
        match ocr_with_tesseract(path) {
            Ok(t) => return (t, "ocr-tesseract".into(), true, None),
            Err(e) => return (String::new(), "ocr-tesseract".into(), true, Some(e)),
        }
    }

    if ext == "pdf" {
        match extract_pdf_text_layer(path) {
            Ok(t) if t.trim().len() >= MIN_PDF_TEXT_CHARS => {
                return (truncate_text(t), "pdf-text-layer".into(), false, None);
            }
            Ok(t) if !t.trim().is_empty() => {
                return (
                    truncate_text(t),
                    "pdf-text-layer-partial".into(),
                    false,
                    None,
                );
            }
            Ok(_) | Err(_) => match ocr_with_tesseract(path) {
                Ok(t) => return (t, "pdf-ocr".into(), true, None),
                Err(e) => {
                    return (
                        String::new(),
                        "pdf-ocr".into(),
                        true,
                        Some(format!("{e}; text layer empty or unavailable")),
                    );
                }
            },
        }
    }

    if ext == "docx" {
        match extract_docx(path) {
            Ok(t) => return (t, "docx".into(), false, None),
            Err(e) => return (String::new(), "docx".into(), false, Some(e)),
        }
    }

    if matches!(ext.as_str(), "xlsx" | "xls" | "ods") {
        match extract_xlsx(path) {
            Ok(t) => return (t, "calamine".into(), false, None),
            Err(e) => return (String::new(), "calamine".into(), false, Some(e)),
        }
    }

    if matches!(ext.as_str(), "txt" | "md" | "json" | "xml" | "html" | "htm") {
        match read_plain_text(path) {
            Ok(t) => return (t, "plain".into(), false, None),
            Err(e) => return (String::new(), "plain".into(), false, Some(e)),
        }
    }

    if matches!(ext.as_str(), "csv" | "tsv") {
        match extract_csv(path) {
            Ok(t) => return (t, "csv".into(), false, None),
            Err(e) => return (String::new(), "csv".into(), false, Some(e)),
        }
    }

    (
        String::new(),
        "unsupported".into(),
        false,
        Some(format!("unsupported file type: .{ext}")),
    )
}

pub fn persist_extract(
    conn: &Connection,
    file_id: &str,
    text: &str,
    page_offsets: Option<&str>,
    extractor: &str,
    ocr_used: bool,
    extract_error: Option<&str>,
    extracted_at: &str,
) -> Result<FileTextExtractResult, String> {
    let char_count = text.len();
    conn.execute(
        "INSERT INTO file_text_extracts (file_id, text, page_offsets, char_count, extractor, ocr_used, extracted_at, extract_error)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
         ON CONFLICT(file_id) DO UPDATE SET
           text = excluded.text,
           page_offsets = excluded.page_offsets,
           char_count = excluded.char_count,
           extractor = excluded.extractor,
           ocr_used = excluded.ocr_used,
           extracted_at = excluded.extracted_at,
           extract_error = excluded.extract_error",
        params![
            file_id,
            text,
            page_offsets,
            char_count as i64,
            extractor,
            if ocr_used { 1 } else { 0 },
            extracted_at,
            extract_error
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(FileTextExtractResult {
        file_id: file_id.to_string(),
        char_count,
        extractor: extractor.to_string(),
        ocr_used,
        extracted_at: extracted_at.to_string(),
        extract_error: extract_error.map(|s| s.to_string()),
    })
}

pub fn load_extract_text(conn: &Connection, file_id: &str) -> Result<Option<String>, String> {
    conn.query_row(
        "SELECT text FROM file_text_extracts WHERE file_id = ?1",
        params![file_id],
        |row| row.get(0),
    )
    .optional()
    .map_err(|e| e.to_string())
}

pub fn tesseract_is_available() -> bool {
    tesseract_available()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn truncate_respects_max() {
        let s = "a".repeat(MAX_EXTRACT_CHARS + 100);
        assert_eq!(truncate_text(s).len(), MAX_EXTRACT_CHARS);
    }
}
