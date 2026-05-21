export type FilePreviewKind =
  | "image"
  | "text"
  | "code"
  | "markdown"
  | "csv"
  | "pdf"
  | "docx"
  | "xlsx"
  | "video"
  | "audio"
  | "unsupported";

/** Bitmap + vector images we can render in-app via <img>. */
const IMAGE_EXT = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "bmp",
  "svg",
  "ico",
  "tiff",
  "tif",
  "avif",
]);

/** Plain text / data files rendered as monospace pre. */
const TEXT_EXT = new Set([
  "txt",
  "log",
  "readme",
  "license",
  "changelog",
  "rtf",
]);

/** Source code rendered with syntax-aware viewer (currently plain mono fallback). */
const CODE_EXT = new Set([
  "js",
  "jsx",
  "ts",
  "tsx",
  "mjs",
  "cjs",
  "json",
  "jsonc",
  "yaml",
  "yml",
  "toml",
  "ini",
  "cfg",
  "conf",
  "env",
  "xml",
  "html",
  "htm",
  "css",
  "scss",
  "sass",
  "less",
  "sh",
  "bash",
  "zsh",
  "fish",
  "bat",
  "cmd",
  "ps1",
  "py",
  "rs",
  "go",
  "java",
  "c",
  "cc",
  "cpp",
  "cxx",
  "h",
  "hh",
  "hpp",
  "hxx",
  "cs",
  "kt",
  "kts",
  "swift",
  "rb",
  "php",
  "pl",
  "lua",
  "r",
  "m",
  "mm",
  "dart",
  "vim",
  "sql",
  "graphql",
  "gql",
  "proto",
  "tf",
  "hcl",
  "dockerfile",
  "makefile",
  "gradle",
  "patch",
  "diff",
]);

const MARKDOWN_EXT = new Set(["md", "markdown", "mdx"]);

const CSV_EXT = new Set(["csv", "tsv"]);

/** Rich document viewers (in-app). */
const PDF_EXT = new Set(["pdf"]);
const DOCX_EXT = new Set(["doc", "docx"]);
const XLSX_EXT = new Set(["xls", "xlsx"]);

/** HTML5 native media playback. */
const VIDEO_EXT = new Set([
  "mp4",
  "webm",
  "ogv",
  "mov",
  "m4v",
  "mkv",
  "avi",
  "wmv",
  "flv",
  "3gp",
  "mpeg",
  "mpg",
  "ts",
  "mts",
  "m2ts",
]);

const AUDIO_EXT = new Set([
  "mp3",
  "wav",
  "ogg",
  "oga",
  "aac",
  "flac",
  "m4a",
  "wma",
  "opus",
  "amr",
  "aiff",
  "aif",
]);

/** No in-app preview — fall back to "Open externally". */
const UNSUPPORTED_EXT = new Set([
  "ppt",
  "pptx",
  "odt",
  "ods",
  "odp",
  "zip",
  "gz",
  "tar",
  "7z",
  "rar",
  "bz2",
  "xz",
  "dmg",
  "iso",
  "exe",
  "msi",
  "bin",
  "heic",
  "heif",
  "woff",
  "woff2",
  "ttf",
  "otf",
  "eot",
]);

/**
 * Extract a clean extension, handling names with multiple dots
 * (e.g. "report.2_Sep 25.pdf" or "archive.tar.gz") the same way v1 does:
 * walk from the right looking for the last 1–5 char alphanumeric token.
 */
export function fileExtension(fileName: string): string {
  if (!fileName) return "";
  const lower = fileName.toLowerCase();
  // Special-case for bare names commonly used without extensions.
  const base = lower.includes("/") ? (lower.split("/").pop() ?? "") : lower;
  if (base === "dockerfile") return "dockerfile";
  if (base === "makefile") return "makefile";
  if (base === "readme") return "readme";
  if (base === "license") return "license";
  if (base === "changelog") return "changelog";

  const parts = base.split(".");
  if (parts.length <= 1) return "";
  for (let i = parts.length - 1; i > 0; i--) {
    const candidate = (parts[i] ?? "").trim();
    if (
      candidate.length >= 1 &&
      candidate.length <= 10 &&
      /^[a-z0-9]+$/.test(candidate)
    ) {
      return candidate;
    }
  }
  return "";
}

export function getFilePreviewKind(fileName: string): FilePreviewKind {
  const ext = fileExtension(fileName);
  if (!ext) return "text";
  if (IMAGE_EXT.has(ext)) return "image";
  if (PDF_EXT.has(ext)) return "pdf";
  if (DOCX_EXT.has(ext)) return "docx";
  if (XLSX_EXT.has(ext)) return "xlsx";
  if (MARKDOWN_EXT.has(ext)) return "markdown";
  if (CSV_EXT.has(ext)) return "csv";
  if (VIDEO_EXT.has(ext)) return "video";
  if (AUDIO_EXT.has(ext)) return "audio";
  if (CODE_EXT.has(ext)) return "code";
  if (TEXT_EXT.has(ext)) return "text";
  if (UNSUPPORTED_EXT.has(ext)) return "unsupported";
  return "text";
}

export function isUnsupportedPreview(kind: FilePreviewKind): boolean {
  return kind === "unsupported";
}

export function unsupportedPreviewLabel(fileName: string): string {
  const ext = fileExtension(fileName);
  if (["ppt", "pptx", "odp"].includes(ext)) return "Presentation";
  if (["odt"].includes(ext)) return "OpenDocument";
  if (["ods"].includes(ext)) return "OpenDocument spreadsheet";
  if (["zip", "gz", "tar", "7z", "rar", "bz2", "xz"].includes(ext)) {
    return "Archive";
  }
  if (["dmg", "iso", "exe", "msi", "bin"].includes(ext)) return "Installer";
  if (["heic", "heif"].includes(ext)) return "HEIC image";
  if (["woff", "woff2", "ttf", "otf", "eot"].includes(ext)) return "Font";
  return "This file type";
}

/** MIME type lookups for blob-URL playback / preview. */
export function mediaMimeType(fileName: string): string {
  const ext = fileExtension(fileName);
  switch (ext) {
    // images
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "svg":
      return "image/svg+xml";
    case "bmp":
      return "image/bmp";
    case "avif":
      return "image/avif";
    case "tiff":
    case "tif":
      return "image/tiff";
    case "ico":
      return "image/x-icon";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    // video
    case "mp4":
    case "m4v":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "ogv":
      return "video/ogg";
    case "mov":
      return "video/quicktime";
    case "mkv":
      return "video/x-matroska";
    case "avi":
      return "video/x-msvideo";
    case "wmv":
      return "video/x-ms-wmv";
    case "flv":
      return "video/x-flv";
    case "3gp":
      return "video/3gpp";
    case "mpeg":
    case "mpg":
    case "ts":
    case "mts":
    case "m2ts":
      return "video/mp2t";
    // audio
    case "mp3":
      return "audio/mpeg";
    case "wav":
      return "audio/wav";
    case "ogg":
    case "oga":
    case "opus":
      return "audio/ogg";
    case "aac":
      return "audio/aac";
    case "flac":
      return "audio/flac";
    case "m4a":
      return "audio/mp4";
    case "wma":
      return "audio/x-ms-wma";
    case "amr":
      return "audio/amr";
    case "aiff":
    case "aif":
      return "audio/aiff";
    default:
      return "application/octet-stream";
  }
}
