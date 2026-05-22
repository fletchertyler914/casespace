import type { CaseFile } from "@repo/types";
import type { BoardStatus } from "@/lib/board-status";
import { normalizeBoardStatus } from "@/lib/board-status";

export function filterSwimlaneFiles(
  files: CaseFile[],
  query: string,
): CaseFile[] {
  const q = query.trim().toLowerCase();
  if (!q) return files;
  return files.filter((file) => {
    const folder = file.folderPath ?? "";
    return (
      file.fileName.toLowerCase().includes(q) ||
      folder.toLowerCase().includes(q)
    );
  });
}

export function groupFilesByBoardStatus(
  files: CaseFile[],
): Map<BoardStatus, CaseFile[]> {
  const grouped = new Map<BoardStatus, CaseFile[]>(
    [
      ["unreviewed", []],
      ["in_review", []],
      ["reviewed", []],
      ["flagged", []],
      ["excluded", []],
    ],
  );
  for (const file of files) {
    grouped.get(normalizeBoardStatus(file.status))!.push(file);
  }
  for (const [, lane] of grouped) {
    lane.sort((a, b) => a.fileName.localeCompare(b.fileName));
  }
  return grouped;
}
