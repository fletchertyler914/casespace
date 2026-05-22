import { describe, expect, it } from "vitest";
import {
  extractExtension,
  getFilenameWithoutExtension,
  validateFilename,
} from "./file-validation";

describe("extractExtension", () => {
  it("returns extension including dot", () => {
    expect(extractExtension("report.pdf")).toBe(".pdf");
    expect(extractExtension("archive.tar.gz")).toBe(".gz");
  });

  it("returns empty when no extension", () => {
    expect(extractExtension("README")).toBe("");
  });
});

describe("getFilenameWithoutExtension", () => {
  it("strips the last extension segment", () => {
    expect(getFilenameWithoutExtension("report.pdf")).toBe("report");
    expect(getFilenameWithoutExtension("archive.tar.gz")).toBe("archive.tar");
  });

  it("returns the full name when no extension", () => {
    expect(getFilenameWithoutExtension("README")).toBe("README");
  });
});

describe("validateFilename", () => {
  it("accepts valid names", () => {
    expect(validateFilename("evidence.pdf")).toEqual({ valid: true });
    expect(validateFilename("  notes.txt  ")).toEqual({ valid: true });
  });

  it("rejects empty names", () => {
    expect(validateFilename("")).toEqual({
      valid: false,
      error: "Name cannot be empty",
    });
    expect(validateFilename("   ")).toEqual({
      valid: false,
      error: "Name cannot be empty",
    });
  });

  it("rejects path separators", () => {
    expect(validateFilename("a/b.txt")).toEqual({
      valid: false,
      error: "Name cannot contain path separators",
    });
    expect(validateFilename("a\\b.txt")).toEqual({
      valid: false,
      error: "Name cannot contain path separators",
    });
  });

  it("rejects dot-only names", () => {
    expect(validateFilename(".")).toEqual({
      valid: false,
      error: "Invalid name",
    });
    expect(validateFilename("..")).toEqual({
      valid: false,
      error: "Invalid name",
    });
  });
});
