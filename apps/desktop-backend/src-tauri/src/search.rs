/// Sanitize user FTS query input (ported from v1).
pub fn sanitize_fts_query(query: &str) -> String {
    let trimmed = query.trim();
    if trimmed.is_empty() {
        return String::new();
    }
    trimmed
        .replace('"', "\"\"")
        .replace('\'', "''")
        .replace('\\', "\\\\")
}

#[cfg(test)]
mod tests {
    use super::sanitize_fts_query;

    #[test]
    fn empty_query_returns_empty() {
        assert_eq!(sanitize_fts_query("   "), "");
    }

    #[test]
    fn escapes_quotes() {
        let s = sanitize_fts_query(r#"foo"bar"#);
        assert!(s.contains("\"\""));
    }
}
