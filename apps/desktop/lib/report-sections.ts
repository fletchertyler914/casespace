/** Section order follows CFE examination deliverable priority (see docs/spec/cfe-workflows.md). */
export const REPORT_SECTION_DEFS = [
  { id: "findings", label: "Findings" },
  { id: "timeline", label: "Chronology" },
  { id: "inventory", label: "Evidence Index" },
  { id: "overview", label: "Case Overview" },
  { id: "executive", label: "Executive Summary" },
  { id: "notes", label: "Working Notes" },
] as const;

export type ReportSectionId = (typeof REPORT_SECTION_DEFS)[number]["id"];
