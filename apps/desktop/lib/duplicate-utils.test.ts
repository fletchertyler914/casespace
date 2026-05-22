import { describe, expect, it } from "vitest";
import {
  buildDuplicateFileIdSet,
  duplicateStats,
  fileNameById,
  findGroupForFile,
} from "@/lib/duplicate-utils";

const groups = [
  { groupId: "g1", fileIds: ["a", "b"], primaryFileId: "a" },
  { groupId: "g2", fileIds: ["c"] },
];

describe("duplicate-utils", () => {
  it("buildDuplicateFileIdSet flattens all group members", () => {
    const set = buildDuplicateFileIdSet(groups);
    expect(set.size).toBe(3);
    expect(set.has("b")).toBe(true);
  });

  it("findGroupForFile returns matching group", () => {
    expect(findGroupForFile(groups, "b")?.groupId).toBe("g1");
    expect(findGroupForFile(groups, "missing")).toBeUndefined();
  });

  it("duplicateStats aggregates counts", () => {
    expect(duplicateStats(groups)).toEqual({ groupCount: 2, fileCount: 3 });
  });

  it("fileNameById resolves or falls back to id", () => {
    const files = [{ id: "a", fileName: "alpha.pdf" }];
    expect(fileNameById(files, "a")).toBe("alpha.pdf");
    expect(fileNameById(files, "z")).toBe("z");
  });
});
