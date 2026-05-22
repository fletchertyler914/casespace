import { describe, expect, it } from "vitest";
import { formatIngestSummary, ingestHadChanges } from "@/lib/ingest-utils";

describe("ingest-utils", () => {
  it("formatIngestSummary joins counts", () => {
    expect(
      formatIngestSummary({
        filesInserted: 2,
        filesUpdated: 1,
        filesSkipped: 5,
      }),
    ).toBe("2 new, 1 updated, 5 unchanged");
  });

  it("formatIngestSummary handles empty", () => {
    expect(
      formatIngestSummary({
        filesInserted: 0,
        filesUpdated: 0,
        filesSkipped: 0,
      }),
    ).toBe("No changes");
  });

  it("ingestHadChanges detects mutations", () => {
    expect(
      ingestHadChanges({
        filesInserted: 0,
        filesUpdated: 1,
        filesSkipped: 0,
      }),
    ).toBe(true);
    expect(
      ingestHadChanges({
        filesInserted: 0,
        filesUpdated: 0,
        filesSkipped: 3,
        filesDeleted: 0,
      }),
    ).toBe(false);
  });
});
