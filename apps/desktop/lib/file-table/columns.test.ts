import { describe, expect, it } from "vitest";
import type { CaseFile } from "@repo/types";
import { compareFiles, getSortValue } from "@/lib/file-table/columns";

const base = (overrides: Partial<CaseFile>): CaseFile => ({
  id: "1",
  caseId: "c1",
  fileName: "a.txt",
  filePath: "/a.txt",
  folderPath: "",
  status: "unreviewed",
  sizeBytes: 100,
  modifiedAt: "2026-01-01T00:00:00Z",
  fileHash: "h",
  ...overrides,
});

describe("file-table columns", () => {
  it("getSortValue reads fileName case-insensitively", () => {
    expect(getSortValue(base({ fileName: "Beta.pdf" }), "fileName")).toBe(
      "beta.pdf",
    );
  });

  it("compareFiles sorts ascending and descending", () => {
    const a = base({ sizeBytes: 10 });
    const b = base({ id: "2", sizeBytes: 50 });
    expect(compareFiles(a, b, "size", "asc")).toBeLessThan(0);
    expect(compareFiles(a, b, "size", "desc")).toBeGreaterThan(0);
  });
});
