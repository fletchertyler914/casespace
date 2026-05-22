import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import type { ReportDocument, ReportTemplateId } from "@repo/types";
import { redactForLlm } from "../policy/redaction.js";

export interface ReportGenerationState {
  caseId: string;
  templateId: ReportTemplateId;
  status: "loading" | "drafting" | "awaiting_review" | "done" | "failed";
  artifactContext?: string;
  draft?: ReportDocument;
  error?: string;
}

export type ReportGraphDeps = {
  loadArtifacts: (caseId: string) => Promise<string>;
  composeReport: (
    caseId: string,
    templateId: ReportTemplateId,
  ) => Promise<ReportDocument>;
};

const ReportState = Annotation.Root({
  caseId: Annotation<string>,
  templateId: Annotation<ReportTemplateId>,
  status: Annotation<ReportGenerationState["status"]>,
  artifactContext: Annotation<string | undefined>,
  draft: Annotation<ReportDocument | undefined>,
  error: Annotation<string | undefined>,
});

/** Report subgraph: load artifacts → compose deterministic draft → await review interrupt. */
export function createReportGenerationGraph(deps: ReportGraphDeps) {
  const graph = new StateGraph(ReportState)
    .addNode("load", async (state) => {
      try {
        const raw = await deps.loadArtifacts(state.caseId);
        return {
          ...state,
          status: "drafting" as const,
          artifactContext: redactForLlm(raw),
        };
      } catch (e) {
        return {
          ...state,
          status: "failed" as const,
          error: e instanceof Error ? e.message : "load failed",
        };
      }
    })
    .addNode("draft", async (state) => {
      if (state.status === "failed") return state;
      try {
        const draft = await deps.composeReport(state.caseId, state.templateId);
        return {
          ...state,
          status: "awaiting_review" as const,
          draft,
        };
      } catch (e) {
        return {
          ...state,
          status: "failed" as const,
          error: e instanceof Error ? e.message : "draft failed",
        };
      }
    })
    .addNode("review", async (state) => ({
      ...state,
      status: "awaiting_review" as const,
    }))
    .addEdge(START, "load")
    .addEdge("load", "draft")
    .addEdge("draft", "review")
    .addEdge("review", END);

  return graph.compile();
}
