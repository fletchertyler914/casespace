import { FILE_TABLE_COLUMNS } from "@/lib/file-table/columns";

export type DataSourceType =
  | "file_name"
  | "folder_name"
  | "folder_path";

export type ExtractionMethod =
  | "direct"
  | "pattern"
  | "date"
  | "number"
  | "text_before"
  | "text_after"
  | "text_between";

export interface PatternConfig {
  pattern: string;
  flags?: string;
  group?: number;
  format?: string;
  endPattern?: string;
}

export interface FieldMapping {
  id: string;
  columnId: string;
  sourceType: DataSourceType;
  extractionMethod: ExtractionMethod;
  patternConfig?: PatternConfig;
  enabled: boolean;
  description?: string;
}

export interface MappingConfig {
  mappings: FieldMapping[];
  version: number;
}

export interface TableColumn {
  id: string;
  label: string;
  visible: boolean;
  order: number;
  custom?: boolean;
}

export interface TableColumnConfig {
  columns: TableColumn[];
  version: number;
}

export const DEFAULT_COLUMN_CONFIG: TableColumnConfig = {
  version: 1,
  columns: FILE_TABLE_COLUMNS.map((col, index) => ({
    id: col.id,
    label: col.label,
    visible: true,
    order: index,
  })),
};

export const DEFAULT_MAPPING_CONFIG: MappingConfig = {
  version: 1,
  mappings: [],
};

export function parseColumnConfig(raw: string | null | undefined): TableColumnConfig {
  if (!raw) return DEFAULT_COLUMN_CONFIG;
  try {
    const parsed = JSON.parse(raw) as TableColumnConfig;
    if (!Array.isArray(parsed.columns)) return DEFAULT_COLUMN_CONFIG;
    return { ...DEFAULT_COLUMN_CONFIG, ...parsed };
  } catch {
    return DEFAULT_COLUMN_CONFIG;
  }
}

export function parseMappingConfig(raw: string | null | undefined): MappingConfig {
  if (!raw) return DEFAULT_MAPPING_CONFIG;
  try {
    const parsed = JSON.parse(raw) as MappingConfig;
    if (!Array.isArray(parsed.mappings)) return DEFAULT_MAPPING_CONFIG;
    return { ...DEFAULT_MAPPING_CONFIG, ...parsed };
  } catch {
    return DEFAULT_MAPPING_CONFIG;
  }
}

export function slugifyColumnId(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || `field_${Date.now()}`
  );
}

export function methodNeedsPattern(method: ExtractionMethod): boolean {
  return (
    method === "pattern" ||
    method === "text_before" ||
    method === "text_after" ||
    method === "text_between"
  );
}

export function methodNeedsEndPattern(method: ExtractionMethod): boolean {
  return method === "text_between";
}
