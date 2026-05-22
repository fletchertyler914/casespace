import { Annotation, END, START, StateGraph } from "@langchain/langgraph";

export interface ReportGenerationState {
  caseId: string;
  draft?: string;
  status: "loading" | "drafting" | "awaiting_review" | "done";
}

const ReportState = Annotation.Root({
  caseId: Annotation<string>,
  draft: Annotation<string | undefined>,
  status: Annotation<ReportGenerationState["status"]>,
});

/** Minimal report subgraph — desktop invokes tools; graph coordinates steps + review interrupt. */
export function createReportGenerationGraph() {
  const graph = new StateGraph(ReportState)
    .addNode("load", async (state) => ({
      ...state,
      status: "loading" as const,
    }))
    .addNode("draft", async (state) => ({
      ...state,
      status: "drafting" as const,
      draft: state.draft ?? "",
    }))
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
