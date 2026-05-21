export type FilePreviewKind =
  | "image"
  | "text"
  | "markdown"
  | "csv"
  | "pdf"
  | "docx"
  | "xlsx"
  | "unsupported";

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
]);

const TEXT_EXT = new Set([
  "txt",
  "log",
  "json",
  "xml",
  "html",
  "htm",
  "css",
  "js",
  "jsx",
  "ts",
  "tsx",
  "py",
  "rs",
  "go",
  "java",
  "c",
  "cpp",
  "h",
  "sh",
  "yaml",
  "yml",
  "toml",
  "ini",
  "cfg",
  "conf",
  "sql",
]);

const MARKDOWN_EXT = new Set(["md", "markdown"]);

const CSV_EXT = new Set(["csv", "tsv"]);

/** In-app preview supported */
const PDF_EXT = new Set(["pdf"]);
const DOCX_EXT = new Set(["doc", "docx"]);
const XLSX_EXT = new Set(["xls", "xlsx"]);

/** No in-app preview — open externally only as fallback */
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
  "mp3",
  "mp4",
  "mov",
  "avi",
  "mkv",
  "webm",
  "dmg",
  "exe",
  "bin",
  "heic",
  "woff",
  "woff2",
  "ttf",
]);

export function fileExtension(fileName: string): string {
  const i = fileName.lastIndexOf(".");
  if (i < 0) return "";
  return fileName.slice(i + 1).toLowerCase();
}

export function getFilePreviewKind(fileName: string): FilePreviewKind {
  const ext = fileExtension(fileName);
  if (IMAGE_EXT.has(ext)) return "image";
  if (PDF_EXT.has(ext)) return "pdf";
  if (DOCX_EXT.has(ext)) return "docx";
  if (XLSX_EXT.has(ext)) return "xlsx";
  if (MARKDOWN_EXT.has(ext)) return "markdown";
  if (CSV_EXT.has(ext)) return "csv";
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
  if (["mp3", "mp4", "mov", "avi", "mkv", "webm"].includes(ext)) {
    return "Media file";
  }
  if (["zip", "gz", "tar", "7z", "rar"].includes(ext)) return "Archive";
  return "This file type";
}
