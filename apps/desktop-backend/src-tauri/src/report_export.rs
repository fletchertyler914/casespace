//! Report export — Markdown and DOCX delivery formats.

use crate::reports::{ReportDocument, ReportSection};
use docx_rs::*;
use std::path::Path;

pub fn export_markdown(document: &ReportDocument, case_name: &str) -> String {
    crate::reports::sections_to_markdown(
        &document.template_id,
        case_name,
        &document.generated_at,
        &document.sections,
        &document.compliance,
    )
}

fn section_paragraphs(section: &ReportSection) -> Vec<Paragraph> {
    let mut out = vec![Paragraph::new()
        .style("Heading2")
        .add_run(Run::new().add_text(&section.heading))];
    for line in section.text.lines() {
        if line.trim().is_empty() {
            continue;
        }
        out.push(Paragraph::new().add_run(Run::new().add_text(line)));
    }
    if !section.citations.is_empty() {
        let cites = section
            .citations
            .iter()
            .map(|c| c.label.as_str())
            .collect::<Vec<_>>()
            .join("; ");
        out.push(
            Paragraph::new().add_run(
                Run::new()
                    .italic()
                    .add_text(format!("Citations: {cites}")),
            ),
        );
    }
    out
}

pub fn export_docx(document: &ReportDocument, case_name: &str, save_path: &Path) -> Result<(), String> {
    let mut docx = Docx::new().add_paragraph(
        Paragraph::new()
            .style("Heading1")
            .add_run(Run::new().add_text(format!("Examination Report — {case_name}"))),
    );
    docx = docx.add_paragraph(
        Paragraph::new().add_run(Run::new().add_text(format!(
            "Template: {} | Generated: {}",
            document.template_id, document.generated_at
        ))),
    );

    for section in &document.sections {
        for para in section_paragraphs(section) {
            docx = docx.add_paragraph(para);
        }
    }

    if !document.compliance.is_empty() {
        docx = docx.add_paragraph(
            Paragraph::new()
                .style("Heading2")
                .add_run(Run::new().add_text("Standards Compliance")),
        );
        for check in &document.compliance {
            let status = match check.status.as_str() {
                "verified" => "Verified",
                "not_applicable" => "N/A",
                _ => "Review required",
            };
            docx = docx.add_paragraph(
                Paragraph::new().add_run(Run::new().add_text(format!(
                    "[{status}] {} — {}",
                    check.id, check.label
                ))),
            );
        }
    }

    let file = std::fs::File::create(save_path).map_err(|e| format!("create docx file: {e}"))?;
    docx.build()
        .pack(file)
        .map_err(|e| format!("write docx: {e}"))?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::reports::{ReportDocument, ReportSection, StandardsComplianceCheck};

    #[test]
    fn docx_export_writes_valid_zip() {
        let doc = ReportDocument {
            template_id: "cfe-long".into(),
            case_id: "case-1".into(),
            generated_at: "2026-01-01".into(),
            sections: vec![ReportSection {
                id: "executive".into(),
                heading: "Executive Summary".into(),
                text: "Summary text.\n".into(),
                citations: vec![],
                standards_tags: vec![],
            }],
            compliance: vec![StandardsComplianceCheck {
                id: "ACFE-III.C.2".into(),
                label: "Language scan".into(),
                status: "verified".into(),
                detail: None,
            }],
            markdown: String::new(),
        };
        let dir = std::env::temp_dir().join(format!("casespace-docx-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join("report.docx");
        export_docx(&doc, "Test Case", &path).unwrap();
        let bytes = std::fs::read(&path).unwrap();
        assert!(bytes.starts_with(b"PK"));
    }
}
