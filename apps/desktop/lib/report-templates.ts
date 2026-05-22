import type { ReportTemplate, ReportTemplateId } from "@repo/types";
import templatesJson from "@repo/types/report-templates.json";

/** Canonical report template library (see packages/types/report-templates.json). */
export const REPORT_TEMPLATES = templatesJson as ReportTemplate[];

export const DEFAULT_REPORT_TEMPLATE_ID: ReportTemplateId = "cfe-long";

export function getReportTemplate(id: ReportTemplateId): ReportTemplate | undefined {
  return REPORT_TEMPLATES.find((t) => t.id === id);
}

export function waveATemplates(): ReportTemplate[] {
  return REPORT_TEMPLATES.filter((t) => t.wave === "A");
}

export function waveBTemplates(): ReportTemplate[] {
  return REPORT_TEMPLATES.filter((t) => t.wave === "B");
}

export function templatesForTier(tier: "free" | "pro" | "pro_plus"): ReportTemplate[] {
  const order = { free: 0, pro: 1, pro_plus: 2 };
  const userLevel = order[tier];
  return REPORT_TEMPLATES.filter((t) => order[t.tier] <= userLevel);
}

/** Compliance check definitions for footer rendering. */
export const COMPLIANCE_CHECK_DEFS: Record<
  string,
  { label: string; description: string }
> = {
  "ACFE-III.C.2": {
    label: "ACFE Code III.C.2 — No guilt/innocence opinion",
    description: "Report language must not opine on legal guilt or innocence.",
  },
  "ACFE-EVIDENCE": {
    label: "ACFE Evidence Standards — Findings cite evidence",
    description: "Findings with linked files must retain citation references.",
  },
  "FRCP-26-B": {
    label: "FRCP 26(a)(2)(B) — Expert disclosure sections",
    description: "Required expert witness sections are present.",
  },
  "FRE-702": {
    label: "FRE 702 — Methodology disclosed",
    description: "Expert methodology section is present and substantive.",
  },
  "SSFS-NO-ULTIMATE": {
    label: "AICPA SSFS No. 1 — No ultimate fraud opinion",
    description: "Report must not state fraud occurred as ultimate legal conclusion.",
  },
};
