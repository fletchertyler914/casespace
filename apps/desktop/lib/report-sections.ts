/** Section order follows CFE examination deliverable priority (see docs/spec/cfe-workflows.md). */
import type { ReportSectionId } from "@repo/types";

export const REPORT_SECTION_DEFS: { id: ReportSectionId; label: string }[] = [
  { id: "findings", label: "Findings" },
  { id: "timeline", label: "Chronology" },
  { id: "inventory", label: "Evidence Index" },
  { id: "overview", label: "Case Overview" },
  { id: "executive", label: "Executive Summary" },
  { id: "notes", label: "Working Notes" },
  { id: "scope", label: "Scope" },
  { id: "approach", label: "Approach" },
  { id: "methodology", label: "Methodology" },
  { id: "recommendations", label: "Recommendations" },
  { id: "qualifications", label: "Qualifications" },
  { id: "compensation", label: "Compensation" },
  { id: "prior_testimony", label: "Prior Testimony" },
  { id: "observation_log", label: "Observation Log" },
  { id: "subject_profile", label: "Subject Profile" },
  { id: "osint_findings", label: "OSINT Findings" },
  { id: "opinions", label: "Opinions and Basis" },
  { id: "exhibits", label: "Exhibits" },
  { id: "parties", label: "Parties" },
  { id: "limitations", label: "Limitations" },
  { id: "fees", label: "Fees" },
  { id: "confidentiality", label: "Confidentiality" },
];

export type { ReportSectionId };
