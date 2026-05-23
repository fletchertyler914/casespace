import { z } from "zod";

/** MCP tool definitions for CaseSpace native commands (invoke via desktop command-client). */
export function createCaseSpaceMcpToolDefinitions() {
  return [
    {
      name: "load_case_files",
      description: "Load all files for a case",
      inputSchema: z.object({ caseId: z.string() }),
      tier: "autonomous" as const,
    },
    {
      name: "generate_case_report",
      description: "Generate deterministic narrative case report from SQLite artifacts",
      inputSchema: z.object({ caseId: z.string(), templateId: z.string().optional() }),
      tier: "autonomous" as const,
    },
    {
      name: "generate_ai_case_report",
      description: "Generate provider-backed AI report draft from SQLite artifacts",
      inputSchema: z.object({ caseId: z.string(), templateId: z.string().optional() }),
      tier: "autonomous" as const,
    },
    {
      name: "search_all",
      description: "Full-text search across case content",
      inputSchema: z.object({
        caseId: z.string(),
        query: z.string(),
        limit: z.number().optional(),
      }),
      tier: "autonomous" as const,
    },
    {
      name: "delete_case",
      description: "Permanently delete a case (requires human approval)",
      inputSchema: z.object({ caseId: z.string() }),
      tier: "confirm_required" as const,
    },
  ];
}
