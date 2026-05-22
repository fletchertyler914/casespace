import { describe, expect, it } from "vitest";
import {
  DEFAULT_COLUMN_CONFIG,
  DEFAULT_MAPPING_CONFIG,
  methodNeedsEndPattern,
  methodNeedsPattern,
  parseColumnConfig,
  parseMappingConfig,
  slugifyColumnId,
} from "@/lib/mapping/types";

describe("mapping types", () => {
  it("parseColumnConfig returns defaults for invalid JSON", () => {
    expect(parseColumnConfig("not-json").columns.length).toBe(
      DEFAULT_COLUMN_CONFIG.columns.length,
    );
  });

  it("parseColumnConfig merges valid config", () => {
    const raw = JSON.stringify({
      version: 2,
      columns: [{ id: "fileName", label: "Name", visible: true, order: 0 }],
    });
    const parsed = parseColumnConfig(raw);
    expect(parsed.version).toBe(2);
    expect(parsed.columns[0]?.id).toBe("fileName");
  });

  it("parseMappingConfig rejects non-array mappings", () => {
    expect(parseMappingConfig('{"mappings":{}}').mappings).toEqual(
      DEFAULT_MAPPING_CONFIG.mappings,
    );
  });

  it("slugifyColumnId normalizes labels", () => {
    expect(slugifyColumnId("  Client Name  ")).toBe("client_name");
  });

  it("methodNeedsPattern and methodNeedsEndPattern", () => {
    expect(methodNeedsPattern("pattern")).toBe(true);
    expect(methodNeedsPattern("direct")).toBe(false);
    expect(methodNeedsEndPattern("text_between")).toBe(true);
    expect(methodNeedsEndPattern("text_before")).toBe(false);
  });
});
