//! Day-based time entries (one row per case per UTC day) with segment tracking.

use crate::{case_exists, now_iso, with_conn, AppState};
use chrono::Utc;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimeSegment {
    pub id: String,
    pub entry_id: String,
    pub started_at: String,
    pub ended_at: Option<String>,
    pub duration_seconds: i64,
    pub rate_override: Option<f64>,
    pub discount_percent: i64,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimeEntry {
    pub id: String,
    pub case_id: String,
    pub entry_date: String,
    pub total_seconds: i64,
    pub summary: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub segments: Vec<TimeSegment>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ActiveTimer {
    pub case_id: String,
    pub entry_id: String,
    pub started_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CaseBillingConfig {
    pub case_id: String,
    pub billing_type: String,
    pub fixed_price: Option<f64>,
    pub pay_rate: f64,
    pub rate_unit: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BillingSummary {
    pub case_id: String,
    pub total_seconds: i64,
    pub total_minutes: i64,
    pub amount: f64,
    pub billing_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimeEntriesSummary {
    pub case_id: String,
    pub total_seconds: i64,
    pub total_days: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CaseBillingTotal {
    pub case_id: String,
    pub total_amount: f64,
    pub total_seconds: i64,
    pub total_days: i64,
}

fn parse_iso(ts: &str) -> Result<chrono::DateTime<chrono::FixedOffset>, String> {
    chrono::DateTime::parse_from_rfc3339(ts).map_err(|e| e.to_string())
}

pub fn utc_day_start_rfc3339(ts: &str) -> Result<String, String> {
    let dt = parse_iso(ts)?;
    let date = dt.date_naive();
    let day_start = date
        .and_hms_opt(0, 0, 0)
        .ok_or_else(|| "invalid date".to_string())?
        .and_utc()
        .fixed_offset();
    Ok(day_start.to_rfc3339())
}

fn segment_duration_seconds(started_at: &str, ended_at: Option<&str>) -> Result<i64, String> {
    let start = parse_iso(started_at)?;
    let end_ts = match ended_at {
        Some(ts) => parse_iso(ts)?.timestamp(),
        None => Utc::now().timestamp(),
    };
    Ok((end_ts - start.timestamp()).max(0))
}

fn load_segments(conn: &Connection, entry_id: &str) -> Result<Vec<TimeSegment>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, entry_id, started_at, ended_at, duration_seconds, rate_override, discount_percent, notes
             FROM time_segments WHERE entry_id = ?1 ORDER BY started_at ASC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![entry_id], |row| {
            Ok(TimeSegment {
                id: row.get(0)?,
                entry_id: row.get(1)?,
                started_at: row.get(2)?,
                ended_at: row.get(3)?,
                duration_seconds: row.get(4)?,
                rate_override: row.get(5)?,
                discount_percent: row.get(6)?,
                notes: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?;
    Ok(rows.filter_map(Result::ok).collect())
}

fn recalc_entry_total_seconds(conn: &Connection, entry_id: &str) -> Result<i64, String> {
    let segments = load_segments(conn, entry_id)?;
    let total: i64 = segments
        .iter()
        .map(|seg| {
            let raw = if seg.duration_seconds > 0 {
                seg.duration_seconds
            } else {
                segment_duration_seconds(&seg.started_at, seg.ended_at.as_deref()).unwrap_or(0)
            };
            let discount = seg.discount_percent.clamp(0, 100);
            raw * (100 - discount) / 100
        })
        .sum();
    let now = now_iso();
    conn.execute(
        "UPDATE time_entries SET total_seconds = ?1, updated_at = ?2 WHERE id = ?3",
        params![total, now, entry_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(total)
}

fn close_open_segment(conn: &Connection, entry_id: &str, ended_at: &str) -> Result<(), String> {
    let duration = conn
        .query_row(
            "SELECT started_at FROM time_segments WHERE entry_id = ?1 AND ended_at IS NULL LIMIT 1",
            params![entry_id],
            |row| row.get::<_, String>(0),
        )
        .ok();
    if let Some(started_at) = duration {
        let secs = segment_duration_seconds(&started_at, Some(ended_at))?;
        conn.execute(
            "UPDATE time_segments SET ended_at = ?1, duration_seconds = ?2
             WHERE entry_id = ?3 AND ended_at IS NULL",
            params![ended_at, secs, entry_id],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

pub fn load_time_entry(conn: &Connection, entry_id: &str) -> Result<TimeEntry, String> {
    let row: (String, String, String, i64, Option<String>, String, String) = conn
        .query_row(
            "SELECT id, case_id, entry_date, total_seconds, summary, created_at, updated_at
             FROM time_entries WHERE id = ?1",
            params![entry_id],
            |row| {
                Ok((
                    row.get(0)?,
                    row.get(1)?,
                    row.get(2)?,
                    row.get(3)?,
                    row.get(4)?,
                    row.get(5)?,
                    row.get(6)?,
                ))
            },
        )
        .map_err(|_| "time entry not found".to_string())?;
    let segments = load_segments(conn, entry_id)?;
    Ok(TimeEntry {
        id: row.0,
        case_id: row.1,
        entry_date: row.2,
        total_seconds: row.3,
        summary: row.4,
        created_at: row.5,
        updated_at: row.6,
        segments,
    })
}

fn get_or_create_day_entry(conn: &Connection, case_id: &str, day: &str) -> Result<String, String> {
    if let Ok(id) = conn.query_row(
        "SELECT id FROM time_entries WHERE case_id = ?1 AND entry_date = ?2",
        params![case_id, day],
        |row| row.get::<_, String>(0),
    ) {
        return Ok(id);
    }
    let id = Uuid::new_v4().to_string();
    let now = now_iso();
    conn.execute(
        "INSERT INTO time_entries (id, case_id, entry_date, total_seconds, summary, created_at, updated_at)
         VALUES (?1, ?2, ?3, 0, NULL, ?4, ?4)",
        params![id, case_id, day, now],
    )
    .map_err(|e| e.to_string())?;
    Ok(id)
}

fn stop_other_active_timers(
    conn: &Connection,
    except_case_id: &str,
) -> Result<Vec<String>, String> {
    let mut stmt = conn
        .prepare("SELECT case_id, entry_id FROM active_timers WHERE case_id != ?1")
        .map_err(|e| e.to_string())?;
    let rows: Vec<(String, String)> = stmt
        .query_map(params![except_case_id], |row| {
            Ok((row.get(0)?, row.get(1)?))
        })
        .map_err(|e| e.to_string())?
        .filter_map(Result::ok)
        .collect();
    let ended = now_iso();
    let mut stopped_cases = Vec::new();
    for (case_id, entry_id) in rows {
        close_open_segment(conn, &entry_id, &ended)?;
        recalc_entry_total_seconds(conn, &entry_id)?;
        conn.execute(
            "DELETE FROM active_timers WHERE case_id = ?1",
            params![case_id],
        )
        .map_err(|e| e.to_string())?;
        stopped_cases.push(case_id);
    }
    Ok(stopped_cases)
}

pub fn load_billing_config(conn: &Connection, case_id: &str) -> Result<CaseBillingConfig, String> {
    let row = conn.query_row(
        "SELECT case_id, billing_type, fixed_price, pay_rate, rate_unit
         FROM case_billing_config WHERE case_id = ?1",
        params![case_id],
        |row| {
            Ok(CaseBillingConfig {
                case_id: row.get(0)?,
                billing_type: row.get(1)?,
                fixed_price: row.get(2)?,
                pay_rate: row.get(3)?,
                rate_unit: row.get(4)?,
            })
        },
    );
    match row {
        Ok(config) => Ok(config),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(CaseBillingConfig {
            case_id: case_id.to_string(),
            billing_type: "pay_rate".to_string(),
            fixed_price: None,
            pay_rate: 150.0,
            rate_unit: "hourly".to_string(),
        }),
        Err(e) => Err(e.to_string()),
    }
}

fn segment_billable_amount(seg: &TimeSegment, config: &CaseBillingConfig) -> f64 {
    let seconds = if seg.duration_seconds > 0 {
        seg.duration_seconds
    } else {
        segment_duration_seconds(&seg.started_at, seg.ended_at.as_deref()).unwrap_or(0)
    };
    let discount = seg.discount_percent.clamp(0, 100);
    let billable_secs = seconds * (100 - discount) / 100;
    let rate = seg.rate_override.unwrap_or(config.pay_rate);
    amount_for_seconds(billable_secs, rate, &config.rate_unit)
}

fn amount_for_seconds(seconds: i64, rate: f64, unit: &str) -> f64 {
    match unit {
        "daily" => rate * (seconds as f64 / 86400.0),
        "weekly" => rate * (seconds as f64 / (86400.0 * 7.0)),
        "monthly" => rate * (seconds as f64 / (86400.0 * 30.0)),
        _ => rate * (seconds as f64 / 3600.0),
    }
}

pub fn compute_entry_pay_rate_amount(
    conn: &Connection,
    entry_id: &str,
    config: &CaseBillingConfig,
) -> Result<f64, String> {
    let segments = load_segments(conn, entry_id)?;
    Ok(segments
        .iter()
        .filter(|s| s.ended_at.is_some())
        .map(|s| segment_billable_amount(s, config))
        .sum())
}

pub fn compute_case_billing_totals(
    conn: &Connection,
    case_id: &str,
) -> Result<(i64, f64, i64), String> {
    let config = load_billing_config(conn, case_id)?;
    let total_seconds: i64 = conn
        .query_row(
            "SELECT COALESCE(SUM(total_seconds), 0) FROM time_entries WHERE case_id = ?1",
            params![case_id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;
    let total_days: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM time_entries WHERE case_id = ?1",
            params![case_id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let amount = if config.billing_type == "fixed_price" {
        config.fixed_price.unwrap_or(0.0) * total_days as f64
    } else {
        let mut stmt = conn
            .prepare("SELECT id FROM time_entries WHERE case_id = ?1")
            .map_err(|e| e.to_string())?;
        let ids: Vec<String> = stmt
            .query_map(params![case_id], |row| row.get(0))
            .map_err(|e| e.to_string())?
            .filter_map(Result::ok)
            .collect();
        ids.iter()
            .map(|id| compute_entry_pay_rate_amount(conn, id, &config).unwrap_or(0.0))
            .sum()
    };

    Ok((total_seconds, amount, total_days))
}

#[tauri::command]
pub fn start_timer(case_id: String, state: State<AppState>) -> Result<TimeEntry, String> {
    let segment_id = Uuid::new_v4().to_string();
    let started = now_iso();
    let day = utc_day_start_rfc3339(&started)?;
    with_conn(&state, |conn| {
        if !case_exists(conn, &case_id)? {
            return Err("case not found".into());
        }
        let _stopped = stop_other_active_timers(conn, &case_id)?;
        let active: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM active_timers WHERE case_id = ?1",
                params![case_id],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?;
        if active > 0 {
            return Err("timer is already running for this case".into());
        }
        let entry_id = get_or_create_day_entry(conn, &case_id, &day)?;
        conn.execute(
            "INSERT INTO time_segments (id, entry_id, started_at, ended_at, duration_seconds, rate_override, discount_percent, notes)
             VALUES (?1, ?2, ?3, NULL, 0, NULL, 0, NULL)",
            params![segment_id, entry_id, started],
        )
        .map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO active_timers (case_id, entry_id, started_at) VALUES (?1, ?2, ?3)
             ON CONFLICT(case_id) DO UPDATE SET entry_id = excluded.entry_id, started_at = excluded.started_at",
            params![case_id, entry_id, started],
        )
        .map_err(|e| e.to_string())?;
        recalc_entry_total_seconds(conn, &entry_id)?;
        load_time_entry(conn, &entry_id)
    })
}

#[tauri::command]
pub fn stop_timer(
    case_id: String,
    summary: Option<String>,
    state: State<AppState>,
) -> Result<TimeEntry, String> {
    let ended = now_iso();
    with_conn(&state, |conn| {
        let entry_id: String = conn
            .query_row(
                "SELECT entry_id FROM active_timers WHERE case_id = ?1",
                params![case_id],
                |row| row.get(0),
            )
            .map_err(|_| "no active timer for case".to_string())?;
        close_open_segment(conn, &entry_id, &ended)?;
        recalc_entry_total_seconds(conn, &entry_id)?;
        if let Some(ref text) = summary {
            conn.execute(
                "UPDATE time_entries SET summary = ?1, updated_at = ?2 WHERE id = ?3",
                params![text, ended, entry_id],
            )
            .map_err(|e| e.to_string())?;
        } else {
            conn.execute(
                "UPDATE time_entries SET updated_at = ?1 WHERE id = ?2",
                params![ended, entry_id],
            )
            .map_err(|e| e.to_string())?;
        }
        conn.execute(
            "DELETE FROM active_timers WHERE case_id = ?1",
            params![case_id],
        )
        .map_err(|e| e.to_string())?;
        load_time_entry(conn, &entry_id)
    })
}

#[tauri::command]
pub fn pause_timer(case_id: String, state: State<AppState>) -> Result<TimeEntry, String> {
    let ended = now_iso();
    with_conn(&state, |conn| {
        let entry_id: String = conn
            .query_row(
                "SELECT entry_id FROM active_timers WHERE case_id = ?1",
                params![case_id],
                |row| row.get(0),
            )
            .map_err(|_| "no active timer for case".to_string())?;
        close_open_segment(conn, &entry_id, &ended)?;
        recalc_entry_total_seconds(conn, &entry_id)?;
        conn.execute(
            "DELETE FROM active_timers WHERE case_id = ?1",
            params![case_id],
        )
        .map_err(|e| e.to_string())?;
        load_time_entry(conn, &entry_id)
    })
}

#[tauri::command]
pub fn resume_timer(case_id: String, state: State<AppState>) -> Result<TimeEntry, String> {
    let segment_id = Uuid::new_v4().to_string();
    let started = now_iso();
    let day = utc_day_start_rfc3339(&started)?;
    with_conn(&state, |conn| {
        let active: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM active_timers WHERE case_id = ?1",
                params![case_id],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?;
        if active > 0 {
            return Err("timer is already running".into());
        }
        let _stopped = stop_other_active_timers(conn, &case_id)?;
        let entry_id = get_or_create_day_entry(conn, &case_id, &day)?;
        conn.execute(
            "INSERT INTO time_segments (id, entry_id, started_at, ended_at, duration_seconds, rate_override, discount_percent, notes)
             VALUES (?1, ?2, ?3, NULL, 0, NULL, 0, NULL)",
            params![segment_id, entry_id, started],
        )
        .map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO active_timers (case_id, entry_id, started_at) VALUES (?1, ?2, ?3)
             ON CONFLICT(case_id) DO UPDATE SET entry_id = excluded.entry_id, started_at = excluded.started_at",
            params![case_id, entry_id, started],
        )
        .map_err(|e| e.to_string())?;
        load_time_entry(conn, &entry_id)
    })
}

#[tauri::command]
pub fn get_time_entries(
    case_id: String,
    limit: Option<i64>,
    offset: Option<i64>,
    state: State<AppState>,
) -> Result<Vec<TimeEntry>, String> {
    let lim = limit.unwrap_or(50).clamp(1, 500);
    let off = offset.unwrap_or(0).max(0);
    with_conn(&state, |conn| {
        let mut stmt = conn
            .prepare(
                "SELECT id FROM time_entries WHERE case_id = ?1 ORDER BY entry_date DESC LIMIT ?2 OFFSET ?3",
            )
            .map_err(|e| e.to_string())?;
        let ids: Vec<String> = stmt
            .query_map(params![case_id, lim, off], |row| row.get(0))
            .map_err(|e| e.to_string())?
            .filter_map(Result::ok)
            .collect();
        ids.iter().map(|id| load_time_entry(conn, id)).collect()
    })
}

#[tauri::command]
pub fn get_time_entry(
    case_id: String,
    date: String,
    state: State<AppState>,
) -> Result<Option<TimeEntry>, String> {
    let day = if date.len() <= 10 {
        format!("{}T00:00:00+00:00", date)
    } else {
        utc_day_start_rfc3339(&date)?
    };
    with_conn(&state, |conn| {
        let id: Option<String> = conn
            .query_row(
                "SELECT id FROM time_entries WHERE case_id = ?1 AND entry_date = ?2",
                params![case_id, day],
                |row| row.get(0),
            )
            .ok();
        match id {
            Some(entry_id) => Ok(Some(load_time_entry(conn, &entry_id)?)),
            None => Ok(None),
        }
    })
}

#[tauri::command]
pub fn get_time_entries_summary(
    case_id: String,
    state: State<AppState>,
) -> Result<TimeEntriesSummary, String> {
    with_conn(&state, |conn| {
        let total_seconds: i64 = conn
            .query_row(
                "SELECT COALESCE(SUM(total_seconds), 0) FROM time_entries WHERE case_id = ?1",
                params![case_id],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?;
        let total_days: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM time_entries WHERE case_id = ?1",
                params![case_id],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?;
        Ok(TimeEntriesSummary {
            case_id,
            total_seconds,
            total_days,
        })
    })
}

#[tauri::command]
pub fn get_active_timer(
    case_id: String,
    state: State<AppState>,
) -> Result<Option<ActiveTimer>, String> {
    with_conn(&state, |conn| {
        let row = conn.query_row(
            "SELECT case_id, entry_id, started_at FROM active_timers WHERE case_id = ?1",
            params![case_id],
            |row| {
                Ok(ActiveTimer {
                    case_id: row.get(0)?,
                    entry_id: row.get(1)?,
                    started_at: row.get(2)?,
                })
            },
        );
        match row {
            Ok(timer) => Ok(Some(timer)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.to_string()),
        }
    })
}

#[tauri::command]
pub fn update_time_entry(
    entry_id: String,
    entry_date: Option<String>,
    summary: Option<String>,
    state: State<AppState>,
) -> Result<TimeEntry, String> {
    with_conn(&state, |conn| {
        if let Some(ref day) = entry_date {
            conn.execute(
                "UPDATE time_entries SET entry_date = ?1, updated_at = ?2 WHERE id = ?3",
                params![day, now_iso(), entry_id],
            )
            .map_err(|e| e.to_string())?;
        }
        if let Some(ref text) = summary {
            conn.execute(
                "UPDATE time_entries SET summary = ?1, updated_at = ?2 WHERE id = ?3",
                params![text, now_iso(), entry_id],
            )
            .map_err(|e| e.to_string())?;
        }
        load_time_entry(conn, &entry_id)
    })
}

#[tauri::command]
pub fn create_time_segment(
    entry_id: String,
    started_at: String,
    ended_at: Option<String>,
    rate_override: Option<f64>,
    discount_percent: Option<i64>,
    notes: Option<String>,
    state: State<AppState>,
) -> Result<TimeSegment, String> {
    if let Some(ref end) = ended_at {
        if parse_iso(end)? < parse_iso(&started_at)? {
            return Err("segment end must be after start".into());
        }
    }
    let discount = discount_percent.unwrap_or(0).clamp(0, 100);
    if let Some(rate) = rate_override {
        if rate < 0.0 {
            return Err("rate must be non-negative".into());
        }
    }
    let id = Uuid::new_v4().to_string();
    let duration = segment_duration_seconds(&started_at, ended_at.as_deref())?;
    with_conn(&state, |conn| {
        conn.query_row(
            "SELECT id FROM time_entries WHERE id = ?1",
            params![entry_id],
            |_| Ok(()),
        )
        .map_err(|_| "time entry not found".to_string())?;
        conn.execute(
            "INSERT INTO time_segments (id, entry_id, started_at, ended_at, duration_seconds, rate_override, discount_percent, notes)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![id, entry_id, started_at, ended_at, duration, rate_override, discount, notes],
        )
        .map_err(|e| e.to_string())?;
        recalc_entry_total_seconds(conn, &entry_id)?;
        let segments = load_segments(conn, &entry_id)?;
        segments
            .into_iter()
            .find(|s| s.id == id)
            .ok_or_else(|| "segment not found after insert".to_string())
    })
}

#[tauri::command]
pub fn update_time_segment(
    segment_id: String,
    started_at: Option<String>,
    ended_at: Option<String>,
    rate_override: Option<f64>,
    discount_percent: Option<i64>,
    notes: Option<String>,
    state: State<AppState>,
) -> Result<TimeSegment, String> {
    with_conn(&state, |conn| {
        let entry_id: String = conn
            .query_row(
                "SELECT entry_id FROM time_segments WHERE id = ?1",
                params![segment_id],
                |row| row.get(0),
            )
            .map_err(|_| "time segment not found".to_string())?;
        if let Some(ref started) = started_at {
            conn.execute(
                "UPDATE time_segments SET started_at = ?1 WHERE id = ?2",
                params![started, segment_id],
            )
            .map_err(|e| e.to_string())?;
        }
        if ended_at.is_some() {
            conn.execute(
                "UPDATE time_segments SET ended_at = ?1 WHERE id = ?2",
                params![ended_at, segment_id],
            )
            .map_err(|e| e.to_string())?;
        }
        if rate_override.is_some() {
            if let Some(rate) = rate_override {
                if rate < 0.0 {
                    return Err("rate must be non-negative".into());
                }
            }
            conn.execute(
                "UPDATE time_segments SET rate_override = ?1 WHERE id = ?2",
                params![rate_override, segment_id],
            )
            .map_err(|e| e.to_string())?;
        }
        if let Some(discount) = discount_percent {
            conn.execute(
                "UPDATE time_segments SET discount_percent = ?1 WHERE id = ?2",
                params![discount.clamp(0, 100), segment_id],
            )
            .map_err(|e| e.to_string())?;
        }
        if notes.is_some() {
            conn.execute(
                "UPDATE time_segments SET notes = ?1 WHERE id = ?2",
                params![notes, segment_id],
            )
            .map_err(|e| e.to_string())?;
        }
        let (s, e): (String, Option<String>) = conn
            .query_row(
                "SELECT started_at, ended_at FROM time_segments WHERE id = ?1",
                params![segment_id],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .map_err(|e| e.to_string())?;
        if let Some(end) = e.as_deref() {
            if parse_iso(end)? < parse_iso(&s)? {
                return Err("segment end must be after start".into());
            }
        }
        let duration = segment_duration_seconds(&s, e.as_deref())?;
        conn.execute(
            "UPDATE time_segments SET duration_seconds = ?1 WHERE id = ?2",
            params![duration, segment_id],
        )
        .map_err(|e| e.to_string())?;
        recalc_entry_total_seconds(conn, &entry_id)?;
        let segments = load_segments(conn, &entry_id)?;
        segments
            .into_iter()
            .find(|s| s.id == segment_id)
            .ok_or_else(|| "segment not found after update".to_string())
    })
}

#[tauri::command]
pub fn delete_time_segment(segment_id: String, state: State<AppState>) -> Result<(), String> {
    with_conn(&state, |conn| {
        let entry_id: String = conn
            .query_row(
                "SELECT entry_id FROM time_segments WHERE id = ?1",
                params![segment_id],
                |row| row.get(0),
            )
            .map_err(|_| "time segment not found".to_string())?;
        conn.execute(
            "DELETE FROM time_segments WHERE id = ?1",
            params![segment_id],
        )
        .map_err(|e| e.to_string())?;
        recalc_entry_total_seconds(conn, &entry_id)?;
        Ok(())
    })
}

#[tauri::command]
pub fn delete_time_entry(entry_id: String, state: State<AppState>) -> Result<(), String> {
    with_conn(&state, |conn| {
        let case_id: String = conn
            .query_row(
                "SELECT case_id FROM time_entries WHERE id = ?1",
                params![entry_id],
                |row| row.get(0),
            )
            .map_err(|_| "time entry not found".to_string())?;
        conn.execute(
            "DELETE FROM active_timers WHERE case_id = ?1",
            params![case_id],
        )
        .ok();
        conn.execute(
            "DELETE FROM time_segments WHERE entry_id = ?1",
            params![entry_id],
        )
        .map_err(|e| e.to_string())?;
        conn.execute("DELETE FROM time_entries WHERE id = ?1", params![entry_id])
            .map_err(|e| e.to_string())?;
        Ok(())
    })
}

#[tauri::command]
pub fn get_case_billing_config(
    case_id: String,
    state: State<AppState>,
) -> Result<CaseBillingConfig, String> {
    with_conn(&state, |conn| load_billing_config(conn, &case_id))
}

#[tauri::command]
pub fn set_case_billing_config(
    case_id: String,
    billing_type: String,
    fixed_price: Option<f64>,
    pay_rate: Option<f64>,
    rate_unit: Option<String>,
    state: State<AppState>,
) -> Result<CaseBillingConfig, String> {
    let now = now_iso();
    let rate = pay_rate.unwrap_or(150.0);
    let unit = rate_unit.unwrap_or_else(|| "hourly".to_string());
    with_conn(&state, |conn| {
        if !case_exists(conn, &case_id)? {
            return Err("case not found".into());
        }
        conn.execute(
            "INSERT INTO case_billing_config (case_id, billing_type, fixed_price, pay_rate, rate_unit, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)
             ON CONFLICT(case_id) DO UPDATE SET
               billing_type = excluded.billing_type,
               fixed_price = excluded.fixed_price,
               pay_rate = excluded.pay_rate,
               rate_unit = excluded.rate_unit,
               updated_at = excluded.updated_at",
            params![case_id, billing_type, fixed_price, rate, unit, now],
        )
        .map_err(|e| e.to_string())?;
        Ok(CaseBillingConfig {
            case_id: case_id.clone(),
            billing_type,
            fixed_price,
            pay_rate: rate,
            rate_unit: unit,
        })
    })
}

#[tauri::command]
pub fn calculate_billing_amount(
    case_id: String,
    state: State<AppState>,
) -> Result<BillingSummary, String> {
    with_conn(&state, |conn| {
        let config = load_billing_config(conn, &case_id)?;
        let (total_seconds, amount, _) = compute_case_billing_totals(conn, &case_id)?;
        Ok(BillingSummary {
            case_id,
            total_seconds,
            total_minutes: total_seconds / 60,
            amount,
            billing_type: config.billing_type,
        })
    })
}

#[tauri::command]
pub fn calculate_case_total(
    case_id: String,
    state: State<AppState>,
) -> Result<CaseBillingTotal, String> {
    with_conn(&state, |conn| {
        let (total_seconds, total_amount, total_days) =
            compute_case_billing_totals(conn, &case_id)?;
        Ok(CaseBillingTotal {
            case_id,
            total_amount,
            total_seconds,
            total_days,
        })
    })
}
