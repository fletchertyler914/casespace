import { describe, expect, it } from "vitest";
import {
  getFileStatusDotClass,
  getFileStatusLabel,
} from "@/lib/file-status";

describe("file-status", () => {
  it("maps known statuses to dot classes", () => {
    expect(getFileStatusDotClass("reviewed")).toContain("green");
    expect(getFileStatusDotClass("in_review")).toContain("blue");
  });

  it("defaults unknown status to unreviewed styling", () => {
    expect(getFileStatusDotClass("unknown")).toContain("amber");
  });

  it("formats labels with spaces", () => {
    expect(getFileStatusLabel("in_review")).toBe("in review");
    expect(getFileStatusLabel(undefined)).toBe("unreviewed");
  });
});
