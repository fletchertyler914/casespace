import { describe, expect, it } from "vitest";
import type { CaseFile } from "@repo/types";
import { groupFilesByBoardStatus, filterSwimlaneFiles } from "./swimlane-filter";

function file(id: string, status: string): CaseFile {
  return {
    id,
    caseId: "c1",
    fileName: `${id}.txt`,
    filePath: `/tmp/${id}.txt`,
    sizeBytes: 1,
    modifiedAt: "2026-01-01",
    status,
  };
}

describe("swimlane-filter", () => {
  it("groups unknown statuses into unreviewed", () => {
    const grouped = groupFilesByBoardStatus([
      file("a", "bogus"),
      file("b", "reviewed"),
    ]);
    expect(grouped.get("unreviewed")).toHaveLength(1);
    expect(grouped.get("reviewed")).toHaveLength(1);
  });

  it("filters by name and folder", () => {
    const results = filterSwimlaneFiles(
      [
        { ...file("a", "unreviewed"), fileName: "report.pdf", folderPath: "docs" },
        { ...file("b", "unreviewed"), fileName: "notes.txt", folderPath: "misc" },
      ],
      "report",
    );
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe("a");
  });
});
