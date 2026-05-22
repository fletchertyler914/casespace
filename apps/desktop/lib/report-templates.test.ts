import { describe, expect, it } from "vitest";
import {
  DEFAULT_REPORT_TEMPLATE_ID,
  REPORT_TEMPLATES,
  waveATemplates,
  waveBTemplates,
} from "./report-templates";

describe("report-templates", () => {
  it("includes Wave A CFE and expert witness templates", () => {
    const waveA = waveATemplates();
    const ids = waveA.map((t) => t.id);
    expect(ids).toContain("cfe-long");
    expect(ids).toContain("cfe-short");
    expect(ids).toContain("expert-witness-frcp26");
    expect(ids).toContain("engagement-letter");
  });

  it("Wave B templates are gated behind PMF", () => {
    const waveB = waveBTemplates();
    expect(waveB.every((t) => t.wave === "B")).toBe(true);
    expect(waveB.map((t) => t.id)).toContain("pi-surveillance");
  });

  it("defaults to cfe-long", () => {
    expect(DEFAULT_REPORT_TEMPLATE_ID).toBe("cfe-long");
  });

  it("every template has sections", () => {
    for (const t of REPORT_TEMPLATES) {
      expect(t.sections.length).toBeGreaterThan(0);
    }
  });
});
