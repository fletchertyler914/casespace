import type { CaseFile } from "@repo/types";

/** Normalize path separators and trim trailing slashes. */
export function normalizePath(p: string): string {
  return p.replace(/\\/g, "/").replace(/\/+$/, "");
}

/**
 * Rewrites `folderPath` relative to case source root(s). `filePath` stays absolute
 * for backend read/refresh commands.
 */
export function relativizeCaseFiles(
  files: CaseFile[],
  sourceRoots: string[],
): CaseFile[] {
  if (sourceRoots.length === 0) return files;

  const roots = [...sourceRoots]
    .map(normalizePath)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  return files.map((file) => {
    const abs = normalizePath(file.filePath);

    for (const root of roots) {
      if (abs === root) {
        return { ...file, folderPath: "" };
      }
      if (abs.startsWith(`${root}/`)) {
        const rel = abs.slice(root.length + 1);
        const slash = rel.lastIndexOf("/");
        const folderPath = slash >= 0 ? rel.slice(0, slash) : "";
        return { ...file, folderPath };
      }
    }

    const folder = file.folderPath ?? "";
    if (!folder) return file;
    const normFolder = normalizePath(folder);

    for (const root of roots) {
      if (normFolder === root) {
        return { ...file, folderPath: "" };
      }
      if (normFolder.startsWith(`${root}/`)) {
        return {
          ...file,
          folderPath: normFolder.slice(root.length + 1),
        };
      }
    }

    return file;
  });
}

/** Display path under case root (not full filesystem path). */
export function displayFilePath(file: CaseFile, sourceRoots: string[]): string {
  const abs = normalizePath(file.filePath);
  const roots = [...sourceRoots]
    .map(normalizePath)
    .sort((a, b) => b.length - a.length);

  for (const root of roots) {
    if (abs.startsWith(`${root}/`)) {
      return abs.slice(root.length + 1);
    }
    if (abs === root) {
      return file.fileName;
    }
  }

  if (file.folderPath) {
    return `${file.folderPath}/${file.fileName}`;
  }
  return file.fileName;
}
