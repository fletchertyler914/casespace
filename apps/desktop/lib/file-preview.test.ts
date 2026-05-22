import { describe, expect, it } from "vitest";
import {
  fileExtension,
  getFilePreviewKind,
  isUnsupportedPreview,
  mediaMimeType,
  unsupportedPreviewLabel,
} from "./file-preview";

describe("fileExtension", () => {
  it("extracts simple extensions", () => {
    expect(fileExtension("report.pdf")).toBe("pdf");
    expect(fileExtension("photo.JPG")).toBe("jpg");
  });

  it("handles multi-dot filenames like v1", () => {
    expect(fileExtension("report.2_Sep 25.pdf")).toBe("pdf");
    expect(fileExtension("archive.tar.gz")).toBe("gz");
  });

  it("recognizes extensionless special names", () => {
    expect(fileExtension("Dockerfile")).toBe("dockerfile");
    expect(fileExtension("Makefile")).toBe("makefile");
    expect(fileExtension("README")).toBe("readme");
  });

  it("returns empty for names without extensions", () => {
    expect(fileExtension("noext")).toBe("");
    expect(fileExtension("")).toBe("");
  });
});

describe("getFilePreviewKind", () => {
  it.each([
    ["photo.png", "image"],
    ["doc.pdf", "pdf"],
    ["letter.docx", "docx"],
    ["sheet.xlsx", "xlsx"],
    ["notes.md", "markdown"],
    ["data.csv", "csv"],
    ["clip.mp4", "video"],
    ["track.mp3", "audio"],
    ["app.tsx", "code"],
    ["readme.txt", "text"],
    ["slides.pptx", "unsupported"],
  ] as const)("routes %s to %s", (fileName, kind) => {
    expect(getFilePreviewKind(fileName)).toBe(kind);
  });

  it("defaults extensionless names to text", () => {
    expect(getFilePreviewKind("LICENSE")).toBe("text");
  });
});

describe("unsupported preview helpers", () => {
  it("flags unsupported kinds", () => {
    expect(isUnsupportedPreview("unsupported")).toBe(true);
    expect(isUnsupportedPreview("pdf")).toBe(false);
  });

  it("labels unsupported types", () => {
    expect(unsupportedPreviewLabel("deck.pptx")).toBe("Presentation");
    expect(unsupportedPreviewLabel("bundle.zip")).toBe("Archive");
    expect(unsupportedPreviewLabel("setup.exe")).toBe("Installer");
  });
});

describe("mediaMimeType", () => {
  it("maps common image and media extensions", () => {
    expect(mediaMimeType("a.png")).toBe("image/png");
    expect(mediaMimeType("b.mp4")).toBe("video/mp4");
    expect(mediaMimeType("c.mp3")).toBe("audio/mpeg");
  });

  it("falls back to octet-stream for unknown types", () => {
    expect(mediaMimeType("unknown.bin")).toBe("application/octet-stream");
  });
});
