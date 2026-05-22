use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractionPattern {
    pub pattern: String,
    pub flags: Option<String>,
    pub group: Option<usize>,
    pub format: Option<String>,
    #[serde(rename = "endPattern")]
    pub end_pattern: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ExtractionMethod {
    Direct,
    Pattern,
    Date,
    Number,
    TextBefore,
    TextAfter,
    TextBetween,
}

impl ExtractionMethod {
    pub fn from_str(s: &str) -> Self {
        match s {
            "pattern" => Self::Pattern,
            "date" => Self::Date,
            "number" => Self::Number,
            "text_before" => Self::TextBefore,
            "text_after" => Self::TextAfter,
            "text_between" => Self::TextBetween,
            _ => Self::Direct,
        }
    }
}

#[derive(Debug, Clone)]
pub struct FieldMappingRule {
    pub source_type: String,
    pub extraction_method: ExtractionMethod,
    pub pattern: Option<ExtractionPattern>,
    pub target_field: String,
}

pub struct RegexCache {
    patterns: HashMap<String, Regex>,
}

impl RegexCache {
    pub fn new() -> Self {
        Self {
            patterns: HashMap::new(),
        }
    }

    fn get_or_compile(&mut self, pattern: &str, flags: Option<&str>) -> Result<&Regex, String> {
        let cache_key = format!("{pattern}{}", flags.unwrap_or(""));

        if !self.patterns.contains_key(&cache_key) {
            let mut regex_pattern = pattern.to_string();
            if let Some(flags_str) = flags {
                if flags_str.contains('i') {
                    regex_pattern = format!("(?i){regex_pattern}");
                }
            }
            let compiled = Regex::new(&regex_pattern)
                .map_err(|e| format!("Invalid regex pattern '{pattern}': {e}"))?;
            self.patterns.insert(cache_key.clone(), compiled);
        }

        Ok(self.patterns.get(&cache_key).unwrap())
    }
}

pub fn extract_with_pattern(
    text: &str,
    pattern: &ExtractionPattern,
    cache: &mut RegexCache,
) -> Result<Option<String>, String> {
    let regex = cache.get_or_compile(&pattern.pattern, pattern.flags.as_deref())?;
    let group = pattern.group.unwrap_or(0);

    if let Some(captures) = regex.captures(text) {
        if let Some(matched) = captures.get(group) {
            return Ok(Some(matched.as_str().to_string()));
        }
    }

    Ok(None)
}

pub fn extract_date(text: &str, pattern: Option<&ExtractionPattern>) -> Option<String> {
    if let Some(pat) = pattern {
        let mut cache = RegexCache::new();
        if let Ok(Some(date)) = extract_with_pattern(text, pat, &mut cache) {
            return Some(date);
        }
    }

    let date_patterns = [
        r"\d{4}-\d{2}-\d{2}",
        r"\d{1,2}[/-]\d{1,2}[/-]\d{2,4}",
        r"[A-Za-z]+\s+\d{2,4}",
        r"\d{10}",
    ];

    for pattern_str in date_patterns {
        if let Ok(regex) = Regex::new(pattern_str) {
            if let Some(captures) = regex.captures(text) {
                if let Some(matched) = captures.get(0) {
                    return Some(matched.as_str().to_string());
                }
            }
        }
    }

    None
}

pub fn extract_number(text: &str, pattern: Option<&ExtractionPattern>) -> Option<String> {
    if let Some(pat) = pattern {
        let mut cache = RegexCache::new();
        if let Ok(Some(num)) = extract_with_pattern(text, pat, &mut cache) {
            return Some(num);
        }
    }

    if let Ok(regex) = Regex::new(r"-?\d+(?:\.\d+)?") {
        if let Some(captures) = regex.captures(text) {
            if let Some(matched) = captures.get(0) {
                return Some(matched.as_str().to_string());
            }
        }
    }

    None
}

pub fn extract_text_before(
    text: &str,
    pattern: &ExtractionPattern,
    cache: &mut RegexCache,
) -> Result<Option<String>, String> {
    let regex = cache.get_or_compile(&pattern.pattern, pattern.flags.as_deref())?;

    if let Some(mat) = regex.find(text) {
        let before = &text[..mat.start()];
        return Ok(Some(before.trim().to_string()));
    }

    Ok(None)
}

pub fn extract_text_after(
    text: &str,
    pattern: &ExtractionPattern,
    cache: &mut RegexCache,
) -> Result<Option<String>, String> {
    let regex = cache.get_or_compile(&pattern.pattern, pattern.flags.as_deref())?;

    if let Some(mat) = regex.find(text) {
        let after = &text[mat.end()..];
        return Ok(Some(after.trim().to_string()));
    }

    Ok(None)
}

pub fn extract_text_between(
    text: &str,
    start_pattern: &ExtractionPattern,
    end_pattern: &ExtractionPattern,
    cache: &mut RegexCache,
) -> Result<Option<String>, String> {
    let start_regex =
        cache.get_or_compile(&start_pattern.pattern, start_pattern.flags.as_deref())?;
    let start_match = start_regex.find(text);
    let end_regex = cache.get_or_compile(&end_pattern.pattern, end_pattern.flags.as_deref())?;

    if let Some(start_mat) = start_match {
        let search_start = start_mat.end();
        let remaining = &text[search_start..];

        if let Some(end_mat) = end_regex.find(remaining) {
            let between = &remaining[..end_mat.start()];
            return Ok(Some(between.trim().to_string()));
        }
    }

    Ok(None)
}

pub fn apply_mapping_rule(
    rule: &FieldMappingRule,
    file_name: &str,
    folder_name: &str,
    folder_path: &str,
    metadata: &HashMap<String, String>,
    cache: &mut RegexCache,
) -> Result<Option<String>, String> {
    let source_text = match rule.source_type.as_str() {
        "file_name" => file_name,
        "folder_name" => folder_name,
        "folder_path" => folder_path,
        other => metadata.get(other).map(String::as_str).unwrap_or(""),
    };

    if source_text.is_empty() {
        return Ok(None);
    }

    match rule.extraction_method {
        ExtractionMethod::Direct => Ok(Some(source_text.to_string())),
        ExtractionMethod::Pattern => {
            if let Some(ref pattern) = rule.pattern {
                extract_with_pattern(source_text, pattern, cache)
            } else {
                Ok(Some(source_text.to_string()))
            }
        }
        ExtractionMethod::Date => Ok(extract_date(source_text, rule.pattern.as_ref())),
        ExtractionMethod::Number => Ok(extract_number(source_text, rule.pattern.as_ref())),
        ExtractionMethod::TextBefore => {
            let pattern = rule
                .pattern
                .as_ref()
                .ok_or("Pattern required for text_before extraction".to_string())?;
            extract_text_before(source_text, pattern, cache)
        }
        ExtractionMethod::TextAfter => {
            let pattern = rule
                .pattern
                .as_ref()
                .ok_or("Pattern required for text_after extraction".to_string())?;
            extract_text_after(source_text, pattern, cache)
        }
        ExtractionMethod::TextBetween => {
            let start = rule
                .pattern
                .as_ref()
                .ok_or("Pattern required for text_between extraction".to_string())?;
            let end_str = start
                .end_pattern
                .as_ref()
                .ok_or("endPattern required for text_between extraction".to_string())?;
            let end = ExtractionPattern {
                pattern: end_str.clone(),
                flags: start.flags.clone(),
                group: None,
                format: None,
                end_pattern: None,
            };
            extract_text_between(source_text, start, &end, cache)
        }
    }
}

pub fn parse_pattern_config(value: &serde_json::Value) -> Option<ExtractionPattern> {
    let pattern = value.get("pattern")?.as_str()?.to_string();
    Some(ExtractionPattern {
        pattern,
        flags: value
            .get("flags")
            .and_then(|f| f.as_str())
            .filter(|s| !s.is_empty())
            .map(str::to_string),
        group: value.get("group").and_then(|g| g.as_u64()).map(|g| g as usize),
        format: value
            .get("format")
            .and_then(|f| f.as_str())
            .map(str::to_string),
        end_pattern: value
            .get("endPattern")
            .and_then(|f| f.as_str())
            .map(str::to_string),
    })
}

pub fn parse_mapping_rule(mapping: &serde_json::Value) -> Option<FieldMappingRule> {
    let enabled = mapping.get("enabled").and_then(|e| e.as_bool()).unwrap_or(true);
    if !enabled {
        return None;
    }

    let column_id = mapping.get("columnId").and_then(|c| c.as_str())?;
    let source_type = mapping.get("sourceType").and_then(|s| s.as_str())?;
    let extraction_method = mapping
        .get("extractionMethod")
        .and_then(|e| e.as_str())
        .map(ExtractionMethod::from_str)
        .unwrap_or(ExtractionMethod::Direct);

    let pattern = mapping
        .get("patternConfig")
        .and_then(parse_pattern_config);

    Some(FieldMappingRule {
        source_type: source_type.to_string(),
        extraction_method,
        pattern,
        target_field: column_id.to_string(),
    })
}

pub fn folder_name_from_path(folder_path: &str) -> String {
    folder_path
        .rsplit('/')
        .find(|s| !s.is_empty())
        .unwrap_or("")
        .to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_date() {
        assert!(extract_date("2024-01-15", None).is_some());
        assert!(extract_date("Jan 2024", None).is_some());
        assert!(extract_date("01/15/2024", None).is_some());
    }

    #[test]
    fn test_extract_number() {
        assert_eq!(
            extract_number("Price: $123.45", None),
            Some("123.45".to_string())
        );
        assert_eq!(extract_number("Count: 42", None), Some("42".to_string()));
    }

    #[test]
    fn test_extract_with_pattern() {
        let mut cache = RegexCache::new();
        let pattern = ExtractionPattern {
            pattern: r"\d{4}".to_string(),
            flags: None,
            group: Some(0),
            format: None,
            end_pattern: None,
        };

        let result = extract_with_pattern("Year 2024", &pattern, &mut cache).unwrap();
        assert_eq!(result, Some("2024".to_string()));
    }

    #[test]
    fn test_apply_mapping_direct() {
        let mut cache = RegexCache::new();
        let rule = FieldMappingRule {
            source_type: "file_name".to_string(),
            extraction_method: ExtractionMethod::Direct,
            pattern: None,
            target_field: "file_name".to_string(),
        };
        let result = apply_mapping_rule(
            &rule,
            "doc.pdf",
            "folder",
            "path/folder",
            &HashMap::new(),
            &mut cache,
        )
        .unwrap();
        assert_eq!(result, Some("doc.pdf".to_string()));
    }

    #[test]
    fn test_folder_name_from_path() {
        assert_eq!(folder_name_from_path("a/b/c"), "c");
        assert_eq!(folder_name_from_path(""), "");
    }

}

/// Extract ISO-like date strings from file names or text (ingest timeline hints).
pub fn extract_dates_from_text(text: &str) -> Vec<String> {
    let mut dates = Vec::new();
    let patterns = [
        r"\d{4}-\d{2}-\d{2}",
        r"\d{1,2}/\d{1,2}/\d{4}",
        r"\d{1,2}-\d{1,2}-\d{4}",
    ];
    for pat in patterns {
        if let Ok(re) = Regex::new(pat) {
            for m in re.find_iter(text) {
                let raw = m.as_str().to_string();
                if !dates.contains(&raw) {
                    dates.push(raw);
                }
            }
        }
    }
    dates
}

#[cfg(test)]
mod date_tests {
    use super::extract_dates_from_text;

    #[test]
    fn test_extract_dates_from_text() {
        let dates = extract_dates_from_text("report_2024-03-15_final.pdf");
        assert!(dates.iter().any(|d| d.contains("2024")));
    }
}
