//! Demo fraud examination case for first-run PMF conversion flow.

use crate::{now_iso, CaseSummary};
use rusqlite::{params, Connection, OptionalExtension};
use uuid::Uuid;

pub const SAMPLE_CASE_ID: &str = "sample-fraud-examination";

pub fn seed_sample_fraud_case(conn: &Connection) -> Result<CaseSummary, String> {
    let existing: Option<String> = conn
        .query_row(
            "SELECT id FROM cases WHERE id = ?1",
            params![SAMPLE_CASE_ID],
            |row| row.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;

    if existing.is_some() {
        return load_case_summary(conn, SAMPLE_CASE_ID);
    }

    let now = now_iso();
    conn.execute(
        "INSERT INTO cases (id, name, status, created_at, updated_at) VALUES (?1, ?2, 'active', ?3, ?3)",
        params![
            SAMPLE_CASE_ID,
            "Sample — Asset Misappropriation Examination",
            now
        ],
    )
    .map_err(|e| e.to_string())?;

    let file_ids: Vec<String> = (1..=12)
        .map(|i| {
            let id = format!("sample-file-{i:02}");
            let name = match i {
                1 => "2023-Q1-bank-statement.pdf",
                2 => "2023-Q2-bank-statement.pdf",
                3 => "vendor-invoice-1042.pdf",
                4 => "email-thread-approvals.eml",
                5 => "expense-report-march.xlsx",
                6 => "contract-services-agreement.pdf",
                7 => "wire-transfer-confirmation.pdf",
                8 => "interview-notes-controller.docx",
                9 => "duplicate-invoice-scan.pdf",
                10 => "ledger-extract.csv",
                11 => "policy-approval-matrix.pdf",
                12 => "site-visit-photos.zip",
                _ => "evidence-file.pdf",
            };
            conn.execute(
                "INSERT INTO files (id, case_id, file_name, folder_path, absolute_path, file_size, modified_at, status)
                 VALUES (?1, ?2, ?3, '/sample', ?4, 1024, ?5, ?6)",
                params![
                    id,
                    SAMPLE_CASE_ID,
                    name,
                    format!("/sample/evidence/{name}"),
                    now,
                    if i <= 4 { "reviewed" } else { "unreviewed" }
                ],
            )
            .map_err(|e| e.to_string())?;
            Ok(id)
        })
        .collect::<Result<Vec<_>, String>>()?;

    let finding_specs = [
        (
            "Duplicate vendor payments",
            "Multiple payments to Vendor X for invoice 1042 without corresponding goods receipt.",
            "critical",
            vec![file_ids[2].clone(), file_ids[8].clone()],
        ),
        (
            "Segregation of duties weakness",
            "Same employee initiated and approved wire transfers above threshold.",
            "high",
            vec![file_ids[6].clone(), file_ids[10].clone()],
        ),
        (
            "Unsupported expense reimbursements",
            "Expense reports lack required receipt attachments for Q1 travel.",
            "medium",
            vec![file_ids[4].clone(), file_ids[5].clone()],
        ),
        (
            "Policy exception — informational",
            "One-time policy exception documented for emergency vendor payment.",
            "low",
            vec![file_ids[11].clone()],
        ),
    ];

    for (title, desc, severity, linked) in finding_specs {
        let fid = Uuid::new_v4().to_string();
        let linked_json = serde_json::to_string(&linked).map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO findings (id, case_id, title, description, severity, linked_files, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?7)",
            params![fid, SAMPLE_CASE_ID, title, desc, severity, linked_json, now],
        )
        .map_err(|e| e.to_string())?;
    }

    let timeline_specs = [
        (
            "2023-01-15T09:00:00Z",
            "Initial complaint received from controller",
            None,
        ),
        (
            "2023-01-20T14:00:00Z",
            "Bank statements obtained for Q1-Q2",
            Some(file_ids[0].clone()),
        ),
        (
            "2023-02-01T10:30:00Z",
            "Interview with accounts payable clerk",
            Some(file_ids[7].clone()),
        ),
        (
            "2023-02-10T16:00:00Z",
            "Duplicate invoice identified in AP system",
            Some(file_ids[2].clone()),
        ),
        (
            "2023-02-15T11:00:00Z",
            "Wire transfer to Vendor X confirmed",
            Some(file_ids[6].clone()),
        ),
        (
            "2023-03-01T09:00:00Z",
            "Site visit — document collection",
            Some(file_ids[11].clone()),
        ),
        (
            "2023-03-10T13:00:00Z",
            "Ledger extract analyzed",
            Some(file_ids[9].clone()),
        ),
        (
            "2023-03-20T15:00:00Z",
            "Email approval thread reviewed",
            Some(file_ids[3].clone()),
        ),
        (
            "2023-04-01T10:00:00Z",
            "Draft findings circulated internally",
            None,
        ),
        (
            "2023-04-15T14:00:00Z",
            "Management response meeting scheduled",
            None,
        ),
    ];

    for (occurred, desc, source) in timeline_specs {
        let tid = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO timeline_events (id, case_id, description, occurred_at, source_file_id, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![tid, SAMPLE_CASE_ID, desc, occurred, source, now],
        )
        .map_err(|e| e.to_string())?;
    }

    let note_specs = [
        (
            "<p>Interview memo — AP clerk stated dual approval was bypassed during month-end close.</p>",
            Some(file_ids[7].clone()),
        ),
        (
            "<p>Field observation: vendor master file contained duplicate entries for Vendor X.</p>",
            Some(file_ids[2].clone()),
        ),
        (
            "<p>Site visit note: physical invoice copies matched digital duplicates in evidence set.</p>",
            Some(file_ids[11].clone()),
        ),
    ];

    for (content, file_id) in note_specs {
        let nid = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO notes (id, case_id, file_id, content, pinned, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, 0, ?5, ?5)",
            params![nid, SAMPLE_CASE_ID, file_id, content, now],
        )
        .map_err(|e| e.to_string())?;
    }

    load_case_summary(conn, SAMPLE_CASE_ID)
}

fn load_case_summary(conn: &Connection, case_id: &str) -> Result<CaseSummary, String> {
    conn.query_row(
        "SELECT id, name, status, created_at, updated_at FROM cases WHERE id = ?1",
        params![case_id],
        |row| {
            Ok(CaseSummary {
                id: row.get(0)?,
                name: row.get(1)?,
                status: row.get(2)?,
                source_paths: vec![],
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        },
    )
    .map_err(|_| "case not found".to_string())
}
