import type { ReportTemplateId } from "@repo/types";
import { createCaseSpaceMcpToolDefinitions } from "./tools.js";
import { requiresConfirmation } from "../policy/tool-policy.js";

export type McpToolInvoke = (
  name: string,
  args: Record<string, unknown>,
) => Promise<unknown>;

/** CaseSpace MCP bridge — invokes native commands via desktop-provided handler. */
export class CaseSpaceMcpServer {
  constructor(private readonly invoke: McpToolInvoke) {}

  listTools() {
    return createCaseSpaceMcpToolDefinitions();
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    if (requiresConfirmation(name)) {
      throw new Error(`confirm_required:${name}`);
    }
    return this.invoke(name, args);
  }

  async loadCaseArtifacts(caseId: string) {
    const [files, notes, findings, timeline] = await Promise.all([
      this.invoke("load_case_files", { caseId }),
      this.invoke("list_notes", { caseId }),
      this.invoke("list_findings", { caseId }),
      this.invoke("list_timeline_events", { caseId }),
    ]);
    return { files, notes, findings, timeline };
  }

  async generateReport(caseId: string, templateId: ReportTemplateId) {
    return this.invoke("generate_case_report", { caseId, templateId });
  }
}

export function createCaseSpaceMcpServer(invoke: McpToolInvoke) {
  return new CaseSpaceMcpServer(invoke);
}
