import { describe, expect, it } from "vitest";
import { BOARD_STATUSES, normalizeBoardStatus } from "./board-status";
import type { CaseFile } from "@repo/types";

function computeProgressStats(files: CaseFile[]) {
  const total = files.length;
  const counts: Record<string, number> = {};
  for (const { value } of BOARD_STATUSES) {
    counts[value] = 0;
  }
  for (const file of files) {
    const status = normalizeBoardStatus(file.status);
    counts[status] = (counts[status] ?? 0) + 1;
  }
  const completedCount = counts.excluded ?? 0;
  const remainingCount = total - completedCount;
  const progressPercentage =
    total > 0 ? Math.round((completedCount / total) * 100) : 0;
  return { total, completedCount, remainingCount, progressPercentage };
}

describe("progress dashboard stats", () => {
  it("treats excluded as completed", () => {
    const files: CaseFile[] = [
      {
        id: "1",
        caseId: "c",
        fileName: "a.pdf",
        filePath: "/a.pdf",
        folderPath: "",
        status: "excluded",
        sizeBytes: 1,
        modifiedAt: "",
        fileHash: "h",
      },
      {
        id: "2",
        caseId: "c",
        fileName: "b.pdf",
        filePath: "/b.pdf",
        folderPath: "",
        status: "unreviewed",
        sizeBytes: 1,
        modifiedAt: "",
        fileHash: "h2",
      },
    ];
    const stats = computeProgressStats(files);
    expect(stats.completedCount).toBe(1);
    expect(stats.remainingCount).toBe(1);
    expect(stats.progressPercentage).toBe(50);
  });
});
