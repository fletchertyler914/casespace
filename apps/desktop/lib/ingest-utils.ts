import type { IngestResult } from "@repo/types";

export function formatIngestSummary(result: IngestResult): string {
  const parts: string[] = [];
  if (result.filesInserted > 0) {
    parts.push(`${result.filesInserted} new`);
  }
  if (result.filesUpdated > 0) {
    parts.push(`${result.filesUpdated} updated`);
  }
  if (result.filesSkipped > 0) {
    parts.push(`${result.filesSkipped} unchanged`);
  }
  if ((result.filesDeleted ?? 0) > 0) {
    parts.push(`${result.filesDeleted} removed`);
  }
  if ((result.filesProtected ?? 0) > 0) {
    parts.push(`${result.filesProtected} protected`);
  }
  return parts.length > 0 ? parts.join(", ") : "No changes";
}

export function ingestHadChanges(result: IngestResult): boolean {
  return (
    result.filesInserted > 0 ||
    result.filesUpdated > 0 ||
    (result.filesDeleted ?? 0) > 0
  );
}
