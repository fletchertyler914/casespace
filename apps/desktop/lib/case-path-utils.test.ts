import { describe, expect, it } from "vitest";
import {
  displayFilePath,
  normalizePath,
  relativizeCaseFiles,
} from "@/lib/case-path-utils";
import { mockFiles } from "@/test/fixtures/mock-data";

describe("case-path-utils", () => {
  it("normalizePath converts backslashes and trims slash", () => {
    expect(normalizePath("/foo/bar/")).toBe("/foo/bar");
    expect(normalizePath("C:\\case\\file")).toBe("C:/case/file");
  });

  it("relativizeCaseFiles strips source root from folderPath", () => {
    const [file] = relativizeCaseFiles(mockFiles, ["/data/case-root"]);
    expect(file?.folderPath).toBe("docs");
  });

  it("displayFilePath shows path relative to root", () => {
    const file = mockFiles[0]!;
    expect(displayFilePath(file, ["/data/case-root"])).toBe(
      "docs/alpha.pdf",
    );
  });
});
