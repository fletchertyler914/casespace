import { Annotation, END, START, StateGraph } from "@langchain/langgraph";

export interface SupervisorState {
  caseId: string;
  intent?: "triage" | "artifacts" | "report";
  pendingApproval?: { tool: string; args: Record<string, unknown> };
}

const SupervisorStateAnn = Annotation.Root({
  caseId: Annotation<string>,
  intent: Annotation<SupervisorState["intent"] | undefined>,
  pendingApproval: Annotation<SupervisorState["pendingApproval"] | undefined>,
});

/** Supervisor routes to subgraphs; confirm_required tools set pendingApproval for desktop UI. */
export function createSupervisorGraph() {
  const graph = new StateGraph(SupervisorStateAnn)
    .addNode("route", async (state) => state)
    .addEdge(START, "route")
    .addEdge("route", END);

  return graph.compile();
}
