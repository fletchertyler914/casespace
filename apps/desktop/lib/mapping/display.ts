import type { FieldMapping } from "@/lib/mapping/types";

export interface MappingFieldDisplay {
  columnId: string;
  label: string;
  value: unknown;
}

export function parseMetadataJson(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function formatMappingValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return String(value);
}

/** Top N mapping fields with values for board/table cards. */
export function getKeyMappingFields(
  metadata: Record<string, unknown>,
  mappings: FieldMapping[],
  maxFields = 2,
): MappingFieldDisplay[] {
  const enabled = mappings.filter((m) => m.enabled);
  const withValues: MappingFieldDisplay[] = [];
  for (const mapping of enabled) {
    const value = metadata[mapping.columnId];
    if (value === undefined || value === null || value === "") continue;
    withValues.push({
      columnId: mapping.columnId,
      label:
        mapping.description ??
        mapping.columnId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      value,
    });
    if (withValues.length >= maxFields) break;
  }
  return withValues;
}
