use std::path::{Path, PathBuf};

pub fn is_path_string_safe(path: &str) -> bool {
    !path.contains('\0') && !path.contains("..")
}

pub fn validate_safe_path(path: &str, roots: &[String]) -> Result<PathBuf, String> {
    if !is_path_string_safe(path) {
        return Err("path failed safety validation".to_string());
    }
    let canonical = Path::new(path)
        .canonicalize()
        .map_err(|e| format!("failed canonicalize path: {e}"))?;
    if roots.is_empty() {
        return Err("no case source roots configured for path access".to_string());
    }

    let allowed = roots.iter().any(|root| {
        Path::new(root)
            .canonicalize()
            .map(|root_path| canonical.starts_with(root_path))
            .unwrap_or(false)
    });
    if !allowed {
        return Err("path outside configured case source roots".to_string());
    }
    Ok(canonical)
}

#[cfg(test)]
mod tests {
    use super::is_path_string_safe;

    #[test]
    fn rejects_traversal_paths() {
        assert!(!is_path_string_safe("../secret.txt"));
        assert!(!is_path_string_safe("..\\secret.txt"));
    }

    #[test]
    fn accepts_normal_absolute_path_string() {
        assert!(is_path_string_safe("/tmp/casespace-file.txt"));
    }
}
