//! Singleton examiner profile — fill once, every report reuses boilerplate sections.

use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Default, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ExaminerProfile {
    pub full_name: String,
    pub credentials: String,
    pub firm_name: String,
    pub qualifications_md: String,
    pub prior_testimony_md: String,
    pub compensation_disclosure: String,
    pub signature_block: String,
    pub confidentiality_clause: String,
    pub limitations_clause: String,
    pub updated_at: String,
}

impl ExaminerProfile {
    pub fn is_complete_for_compliance(&self) -> bool {
        !self.qualifications_md.trim().is_empty()
            && !self.prior_testimony_md.trim().is_empty()
            && !self.compensation_disclosure.trim().is_empty()
    }

    pub fn persona_section_text(&self, section_id: &str) -> Option<String> {
        match section_id {
            "qualifications" if !self.qualifications_md.trim().is_empty() => {
                Some(format!("{}\n", self.qualifications_md.trim()))
            }
            "prior_testimony" if !self.prior_testimony_md.trim().is_empty() => {
                Some(format!("{}\n", self.prior_testimony_md.trim()))
            }
            "compensation" if !self.compensation_disclosure.trim().is_empty() => {
                Some(format!("{}\n", self.compensation_disclosure.trim()))
            }
            "confidentiality" if !self.confidentiality_clause.trim().is_empty() => {
                Some(format!("{}\n", self.confidentiality_clause.trim()))
            }
            "limitations" if !self.limitations_clause.trim().is_empty() => {
                Some(format!("{}\n", self.limitations_clause.trim()))
            }
            _ => None,
        }
    }
}

pub fn get_profile(conn: &Connection) -> Result<ExaminerProfile, String> {
    Ok(conn
        .query_row(
            "SELECT full_name, credentials, firm_name, qualifications_md, prior_testimony_md,
                compensation_disclosure, signature_block, confidentiality_clause,
                limitations_clause, updated_at
         FROM examiner_profile WHERE id = 1",
            [],
            |row| {
                Ok(ExaminerProfile {
                    full_name: row.get(0)?,
                    credentials: row.get(1)?,
                    firm_name: row.get(2)?,
                    qualifications_md: row.get(3)?,
                    prior_testimony_md: row.get(4)?,
                    compensation_disclosure: row.get(5)?,
                    signature_block: row.get(6)?,
                    confidentiality_clause: row.get(7)?,
                    limitations_clause: row.get(8)?,
                    updated_at: row.get(9)?,
                })
            },
        )
        .optional()
        .map_err(|e| e.to_string())?
        .unwrap_or_default())
}

pub fn save_profile(conn: &Connection, profile: &ExaminerProfile) -> Result<ExaminerProfile, String> {
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO examiner_profile (
            id, full_name, credentials, firm_name, qualifications_md, prior_testimony_md,
            compensation_disclosure, signature_block, confidentiality_clause,
            limitations_clause, updated_at
        ) VALUES (1, ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
        ON CONFLICT(id) DO UPDATE SET
            full_name = excluded.full_name,
            credentials = excluded.credentials,
            firm_name = excluded.firm_name,
            qualifications_md = excluded.qualifications_md,
            prior_testimony_md = excluded.prior_testimony_md,
            compensation_disclosure = excluded.compensation_disclosure,
            signature_block = excluded.signature_block,
            confidentiality_clause = excluded.confidentiality_clause,
            limitations_clause = excluded.limitations_clause,
            updated_at = excluded.updated_at",
        params![
            profile.full_name,
            profile.credentials,
            profile.firm_name,
            profile.qualifications_md,
            profile.prior_testimony_md,
            profile.compensation_disclosure,
            profile.signature_block,
            profile.confidentiality_clause,
            profile.limitations_clause,
            now,
        ],
    )
    .map_err(|e| e.to_string())?;
    get_profile(conn)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::Database;
    use std::path::PathBuf;

    fn temp_db() -> (PathBuf, Database) {
        let dir = std::env::temp_dir().join(format!("casespace-profile-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join("casespace.db");
        let db = Database::open(&path).expect("open db");
        (dir, db)
    }

    #[test]
    fn save_and_load_profile_round_trip() {
        let (_dir, db) = temp_db();
        db.with_connection(|conn| {
            let saved = save_profile(
                conn,
                &ExaminerProfile {
                    full_name: "Jane Doe, CFE".into(),
                    qualifications_md: "CFE since 2010".into(),
                    ..Default::default()
                },
            )?;
            assert_eq!(saved.full_name, "Jane Doe, CFE");
            assert!(!saved.updated_at.is_empty());
            Ok(())
        })
        .unwrap();
    }
}
