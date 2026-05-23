//! Per-file text extraction.
//!
//! Local extractors handle digital documents (PDF text layer, DOCX, XLSX, CSV, plain text).
//! Image files are OCR'd via a pluggable `OcrFn` so the AI provider transport (and tests)
//! can be swapped without entangling this module with `reqwest` or the keychain.

use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use calamine::{open_workbook_auto, Reader};
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::path::Path;

const MIN_PDF_TEXT_CHARS: usize = 50;
const MAX_EXTRACT_CHARS: usize = 500_000;

pub const SCANNED_PDF_NOT_SUPPORTED: &str =
    "This PDF has no extractable text layer (likely a scan). CaseSpace OCR currently supports image files (jpg/png/tiff/heic/webp). Convert PDF pages to images and re-ingest to OCR them.";

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

/// Pluggable OCR transport. Returns extracted text given `(image_b64, mime)`.
///
/// In production this wraps `ai_provider::vision_ocr` with the user's BYOK settings.
/// Tests inject a deterministic closure to avoid network and credentials.
pub type OcrFn<'a> = Box<dyn Fn(&str, &str) -> Result<String, String> + Send + Sync + 'a>;

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

fn image_mime_for_ext(ext: &str) -> Option<&'static str> {
    match ext {
        "png" => Some("image/png"),
        "jpg" | "jpeg" => Some("image/jpeg"),
        "tif" | "tiff" => Some("image/tiff"),
        "bmp" => Some("image/bmp"),
        "gif" => Some("image/gif"),
        "webp" => Some("image/webp"),
        "heic" | "heif" => Some("image/heic"),
        _ => None,
    }
}

fn ocr_image_file(path: &Path, mime: &str, ocr: &OcrFn<'_>) -> Result<String, String> {
    let bytes = std::fs::read(path).map_err(|e| format!("image read: {e}"))?;
    let encoded = BASE64.encode(&bytes);
    let text = ocr(&encoded, mime)?;
    Ok(truncate_text(text))
}

/// Run text extraction for a file. AI-dependent paths (image OCR) require `ocr` to
/// be `Some(...)`. When `ocr` is `None`, image files return a structured error
/// indicating the user must configure an AI provider.
pub fn extract_text_from_path(
    path: &Path,
    ocr: Option<&OcrFn<'_>>,
) -> (String, String, bool, Option<String>) {
    let ext = extension_lower(path);

    if let Some(mime) = image_mime_for_ext(&ext) {
        let Some(ocr) = ocr else {
            return (
                String::new(),
                "vision-llm".into(),
                true,
                Some(
                    "OCR requires an AI provider key. Open Settings -> AI provider to add one."
                        .to_string(),
                ),
            );
        };
        return match ocr_image_file(path, mime, ocr) {
            Ok(t) => (t, "vision-llm".into(), true, None),
            Err(e) => (String::new(), "vision-llm".into(), true, Some(e)),
        };
    }

    if ext == "pdf" {
        return match extract_pdf_text_layer(path) {
            Ok(t) if t.trim().len() >= MIN_PDF_TEXT_CHARS => {
                (truncate_text(t), "pdf-text-layer".into(), false, None)
            }
            Ok(t) if !t.trim().is_empty() => (
                truncate_text(t),
                "pdf-text-layer-partial".into(),
                false,
                None,
            ),
            Ok(_) | Err(_) => (
                String::new(),
                "pdf-scan-skipped".into(),
                false,
                Some(SCANNED_PDF_NOT_SUPPORTED.to_string()),
            ),
        };
    }

    if ext == "docx" {
        return match extract_docx(path) {
            Ok(t) => (t, "docx".into(), false, None),
            Err(e) => (String::new(), "docx".into(), false, Some(e)),
        };
    }

    if matches!(ext.as_str(), "xlsx" | "xls" | "ods") {
        return match extract_xlsx(path) {
            Ok(t) => (t, "calamine".into(), false, None),
            Err(e) => (String::new(), "calamine".into(), false, Some(e)),
        };
    }

    if matches!(ext.as_str(), "txt" | "md" | "json" | "xml" | "html" | "htm") {
        return match read_plain_text(path) {
            Ok(t) => (t, "plain".into(), false, None),
            Err(e) => (String::new(), "plain".into(), false, Some(e)),
        };
    }

    if matches!(ext.as_str(), "csv" | "tsv") {
        return match extract_csv(path) {
            Ok(t) => (t, "csv".into(), false, None),
            Err(e) => (String::new(), "csv".into(), false, Some(e)),
        };
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

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    #[test]
    fn truncate_respects_max() {
        let s = "a".repeat(MAX_EXTRACT_CHARS + 100);
        assert_eq!(truncate_text(s).len(), MAX_EXTRACT_CHARS);
    }

    #[test]
    fn image_extract_uses_injected_ocr() {
        let dir = std::env::temp_dir().join(format!("text-extract-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&dir).unwrap();
        let img = dir.join("scan.png");
        let mut f = std::fs::File::create(&img).unwrap();
        f.write_all(b"\x89PNG\r\n\x1a\nfake-bytes").unwrap();

        let ocr: OcrFn<'_> = Box::new(|b64: &str, mime: &str| {
            assert!(!b64.is_empty());
            assert_eq!(mime, "image/png");
            Ok("mocked vision text".to_string())
        });

        let (text, extractor, ocr_used, err) = extract_text_from_path(&img, Some(&ocr));
        assert!(err.is_none());
        assert!(ocr_used);
        assert_eq!(extractor, "vision-llm");
        assert_eq!(text, "mocked vision text");
    }

    #[test]
    fn image_extract_without_ocr_returns_actionable_error() {
        let dir = std::env::temp_dir().join(format!("text-extract-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&dir).unwrap();
        let img = dir.join("scan.jpg");
        std::fs::write(&img, b"jpeg-bytes").unwrap();

        let (text, extractor, ocr_used, err) = extract_text_from_path(&img, None);
        assert!(text.is_empty());
        assert_eq!(extractor, "vision-llm");
        assert!(ocr_used);
        let msg = err.expect("error");
        assert!(msg.contains("AI provider"), "error should mention provider: {msg}");
    }

    #[test]
    fn scanned_pdf_returns_actionable_message() {
        // Construct a minimal "PDF" that has no extractable text. pdf_extract may
        // return an error or empty string; either way we should land in the scan branch.
        let dir = std::env::temp_dir().join(format!("text-extract-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&dir).unwrap();
        let pdf = dir.join("scan.pdf");
        std::fs::write(&pdf, b"%PDF-1.4\n%%EOF\n").unwrap();

        let (text, extractor, _ocr_used, err) = extract_text_from_path(&pdf, None);
        assert!(text.is_empty());
        assert_eq!(extractor, "pdf-scan-skipped");
        assert!(err.unwrap_or_default().contains("scan"));
    }
}
