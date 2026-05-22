import type { CaseFile } from "@repo/types";

export type FileTableSortKey =
  | "fileName"
  | "folderPath"
  | "status"
  | "size"
  | "modifiedAt";

export type SortDirection = "asc" | "desc";

export interface FileTableColumn {
  id: FileTableSortKey;
  label: string;
  sortKey: FileTableSortKey;
  sortable: boolean;
}

export const FILE_TABLE_COLUMNS: FileTableColumn[] = [
  { id: "fileName", label: "Name", sortKey: "fileName", sortable: true },
  { id: "folderPath", label: "Folder", sortKey: "folderPath", sortable: true },
  { id: "status", label: "Status", sortKey: "status", sortable: true },
  { id: "size", label: "Size", sortKey: "size", sortable: true },
  { id: "modifiedAt", label: "Modified", sortKey: "modifiedAt", sortable: true },
];

export function getSortValue(
  file: CaseFile,
  key: FileTableSortKey,
): string | number {
  switch (key) {
    case "fileName":
      return file.fileName.toLowerCase();
    case "folderPath":
      return (file.folderPath ?? "").toLowerCase();
    case "status":
      return file.status;
    case "size":
      return file.sizeBytes;
    case "modifiedAt":
      return file.modifiedAt;
  }
}

export function compareFiles(
  a: CaseFile,
  b: CaseFile,
  key: FileTableSortKey,
  direction: SortDirection,
): number {
  const av = getSortValue(a, key);
  const bv = getSortValue(b, key);
  let cmp = 0;
  if (typeof av === "number" && typeof bv === "number") {
    cmp = av - bv;
  } else {
    cmp = String(av).localeCompare(String(bv));
  }
  return direction === "asc" ? cmp : -cmp;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function formatModifiedAt(iso: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
