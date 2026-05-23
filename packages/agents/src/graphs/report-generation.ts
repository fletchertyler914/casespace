import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import type {
  AiDraftsBundle,
  ExtractCaseTextSummary,
  ReportDocument,
  ReportTemplateId,
} from "@repo/types";
import { redactForLlm } from "../policy/redaction.js";

export interface ReportGenerationState {
  caseId: string;
  templateId: ReportTemplateId;
  status:
    | "extracting"
    | "analyzing"
    | "aggregating"
    | "awaiting_review"
    | "drafting"
    | "done"
    | "failed";
  fileIds?: string[];
  extractSummary?: ExtractCaseTextSummary;
  analysisDraftCount?: number;
  mergedDraftCount?: number;
  pendingDrafts?: AiDraftsBundle;
  artifactContext?: string;
  draft?: ReportDocument;
  error?: string;
}

export type ReportGraphDeps = {
  listCaseFileIds: (caseId: string) => Promise<string[]>;
  extractCaseText: (
    caseId: string,
    force?: boolean,
  ) => Promise<ExtractCaseTextSummary>;
  analyzeFileWithAi: (caseId: string, fileId: string) => Promise<number>;
  analyzeCaseWithAi: (caseId: string) => Promise<number>;
  listAiDrafts: (caseId: string) => Promise<AiDraftsBundle>;
  loadArtifacts: (caseId: string) => Promise<string>;
  draftReport: (
    caseId: string,
    templateId: ReportTemplateId,
  ) => Promise<ReportDocument>;
  composeFallbackReport?: (
    caseId: string,
    templateId: ReportTemplateId,
  ) => Promise<ReportDocument>;
};

const ReportState = Annotation.Root({
  caseId: Annotation<string>,
  templateId: Annotation<ReportTemplateId>,
  status: Annotation<ReportGenerationState["status"]>,
  fileIds: Annotation<string[] | undefined>,
  extractSummary: Annotation<ExtractCaseTextSummary | undefined>,
  analysisDraftCount: Annotation<number | undefined>,
  mergedDraftCount: Annotation<number | undefined>,
  pendingDrafts: Annotation<AiDraftsBundle | undefined>,
  artifactContext: Annotation<string | undefined>,
  draft: Annotation<ReportDocument | undefined>,
  error: Annotation<string | undefined>,
});

/** Evidence-to-report pipeline: extract → per-file analyze → aggregate → review → draft. */
export function createReportGenerationGraph(deps: ReportGraphDeps) {
  const graph = new StateGraph(ReportState)
    .addNode("extract", async (state) => {
      try {
        const fileIds = await deps.listCaseFileIds(state.caseId);
        const extractSummary = await deps.extractCaseText(state.caseId, false);
        return {
          ...state,
          status: "analyzing" as const,
          fileIds,
          extractSummary,
        };
      } catch (e) {
        return {
          ...state,
          status: "failed" as const,
          error: e instanceof Error ? e.message : "extract failed",
        };
      }
    })
    .addNode("analyzeFiles", async (state) => {
      if (state.status === "failed") return state;
      try {
        let draftCount = 0;
        for (const fileId of state.fileIds ?? []) {
          draftCount += await deps.analyzeFileWithAi(state.caseId, fileId);
        }
        return {
          ...state,
          status: "aggregating" as const,
          analysisDraftCount: draftCount,
        };
      } catch (e) {
        return {
          ...state,
          status: "failed" as const,
          error: e instanceof Error ? e.message : "per-file analysis failed",
        };
      }
    })
    .addNode("aggregate", async (state) => {
      if (state.status === "failed") return state;
      try {
        const mergedDraftCount = await deps.analyzeCaseWithAi(state.caseId);
        const pendingDrafts = await deps.listAiDrafts(state.caseId);
        return {
          ...state,
          status: "awaiting_review" as const,
          mergedDraftCount,
          pendingDrafts,
        };
      } catch (e) {
        return {
          ...state,
          status: "failed" as const,
          error: e instanceof Error ? e.message : "corpus aggregation failed",
        };
      }
    })
    .addNode("review", async (state) => ({
      ...state,
      status: "awaiting_review" as const,
    }))
    .addNode("load", async (state) => {
      if (state.status === "failed") return state;
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
        const draft = await deps.draftReport(state.caseId, state.templateId);
        return {
          ...state,
          status: "done" as const,
          draft,
        };
      } catch (e) {
        if (deps.composeFallbackReport) {
          try {
            const draft = await deps.composeFallbackReport(
              state.caseId,
              state.templateId,
            );
            return {
              ...state,
              status: "done" as const,
              draft,
              error: e instanceof Error
                ? `AI draft failed; using local fallback: ${e.message}`
                : "AI draft failed; using local fallback",
            };
          } catch {
            /* preserve original AI failure */
          }
        }
        return {
          ...state,
          status: "failed" as const,
          error: e instanceof Error ? e.message : "draft failed",
        };
      }
    })
    .addEdge(START, "extract")
    .addEdge("extract", "analyzeFiles")
    .addEdge("analyzeFiles", "aggregate")
    .addEdge("aggregate", "review")
    .addEdge("review", "load")
    .addEdge("load", "draft")
    .addEdge("draft", END);

  return graph.compile();
}
