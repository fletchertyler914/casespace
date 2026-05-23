"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bot, Play } from "lucide-react";
import type {
  AiDraftsBundle,
  CaseFile,
  ReportDocument,
  ReportTemplateId,
} from "@repo/types";
import {
  createAgentCheckpointStore,
  createReportGenerationGraph,
} from "@repo/agents";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WorkspaceSidePanel } from "@/components/workspace/workspace-side-panel";
import { useAiAvailability } from "@/hooks/use-ai-availability";
import { commandClient } from "@/lib/command-client";
import { DEFAULT_REPORT_TEMPLATE_ID } from "@/lib/report-templates";
import {
  ApprovalsQueue,
  type AiDraftApprovalItem,
  type ApprovalItem,
} from "./approvals-queue";
import { AnalyzeCaseButton } from "./analyze-case-button";

interface AgentPanelProps {
  caseId: string;
  onClose: () => void;
  onReportDraft?: (doc: ReportDocument) => void;
}

interface RunLogEntry {
  id: string;
  message: string;
  at: string;
}

function draftsToApprovalItems(bundle: AiDraftsBundle): AiDraftApprovalItem[] {
  const items: AiDraftApprovalItem[] = [];
  for (const draft of bundle.findingDrafts) {
    items.push({ kind: "finding", draft });
  }
  for (const draft of bundle.timelineDrafts) {
    items.push({ kind: "timeline", draft });
  }
  for (const draft of bundle.entityDrafts) {
    items.push({ kind: "entity", draft });
  }
  return items;
}

export function AgentPanel({ caseId, onClose, onReportDraft }: AgentPanelProps) {
  const { aiAvailable, loading: aiAvailabilityLoading } = useAiAvailability();
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<RunLogEntry[]>([]);
  const [toolPending, setToolPending] = useState<ApprovalItem[]>([]);
  const [aiDrafts, setAiDrafts] = useState<AiDraftApprovalItem[]>([]);
  const [fileNames, setFileNames] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<ReportDocument | null>(null);
  const [templateId] = useState<ReportTemplateId>(DEFAULT_REPORT_TEMPLATE_ID);

  const appendLog = useCallback((message: string) => {
    setLog((prev) => [
      { id: crypto.randomUUID(), message, at: new Date().toISOString() },
      ...prev,
    ]);
  }, []);

  const refreshDrafts = useCallback(async () => {
    const res = await commandClient.listAiDrafts(caseId);
    if (res.ok && res.data) {
      setAiDrafts(draftsToApprovalItems(res.data));
    }
  }, [caseId]);

  useEffect(() => {
    void commandClient.loadCaseFiles(caseId).then((res) => {
      if (res.ok && res.data) {
        const map: Record<string, string> = {};
        for (const f of res.data as CaseFile[]) {
          map[f.id] = f.fileName;
        }
        setFileNames(map);
      }
    });
    void refreshDrafts();
  }, [caseId, refreshDrafts]);

  const graphDeps = useMemo(
    () => ({
      listCaseFileIds: async (cid: string) => {
        const res = await commandClient.loadCaseFiles(cid);
        return (res.data ?? []).map((f) => f.id);
      },
      extractCaseText: async (cid: string, force?: boolean) => {
        const res = await commandClient.extractCaseText(cid, force);
        if (!res.ok || !res.data) {
          throw new Error(res.error?.message ?? "extract_case_text failed");
        }
        return res.data;
      },
      analyzeFileWithAi: async (cid: string, fileId: string) => {
        const res = await commandClient.analyzeFileWithAi(cid, fileId);
        if (!res.ok) {
          throw new Error(res.error?.message ?? "analyze_file_with_ai failed");
        }
        return res.data ?? 0;
      },
      analyzeCaseWithAi: async (cid: string) => {
        const res = await commandClient.analyzeCaseWithAi(cid);
        if (!res.ok) {
          throw new Error(res.error?.message ?? "analyze_case_with_ai failed");
        }
        return res.data ?? 0;
      },
      listAiDrafts: async (cid: string) => {
        const res = await commandClient.listAiDrafts(cid);
        if (!res.ok || !res.data) {
          throw new Error(res.error?.message ?? "list_ai_drafts failed");
        }
        return res.data;
      },
      loadArtifacts: async (cid: string) => {
        const files = await commandClient.loadCaseFiles(cid);
        const notes = await commandClient.listNotes(cid);
        const findings = await commandClient.listFindings(cid);
        const timeline = await commandClient.listTimelineEvents(cid);
        return JSON.stringify({
          files: files.data ?? [],
          notes: notes.data ?? [],
          findings: findings.data ?? [],
          timeline: timeline.data ?? [],
        });
      },
      draftReport: async (cid: string, tid: ReportTemplateId) => {
        const res = await commandClient.generateAiCaseReport(cid, tid);
        if (!res.ok || !res.data) {
          throw new Error(res.error?.message ?? "generate_ai_case_report failed");
        }
        return JSON.parse(res.data) as ReportDocument;
      },
      composeFallbackReport: async (cid: string, tid: ReportTemplateId) => {
        const res = await commandClient.generateCaseReport(cid, tid);
        if (!res.ok || !res.data) {
          throw new Error(res.error?.message ?? "generate_case_report failed");
        }
        return JSON.parse(res.data) as ReportDocument;
      },
    }),
    [],
  );

  const runReportAgent = useCallback(async () => {
    if (!aiAvailable) {
      appendLog("Add an OpenAI API key in Settings to enable AI features.");
      return;
    }
    setRunning(true);
    appendLog(`Evidence-to-report pipeline started (${templateId})`);
    const store = createAgentCheckpointStore();
    const runId = crypto.randomUUID();
    const graph = createReportGenerationGraph(graphDeps);

    try {
      const result = await graph.invoke({
        caseId,
        templateId,
        status: "extracting",
      });

      await store.save({
        runId,
        caseId,
        graphName: "report_generation",
        templateId,
        status: "interrupted",
        checkpointJson: JSON.stringify(result),
        updatedAt: new Date().toISOString(),
      });

      if (result.pendingDrafts) {
        setAiDrafts(draftsToApprovalItems(result.pendingDrafts));
        appendLog(
          `Analysis complete — ${result.pendingDrafts.findingDrafts.length} finding drafts awaiting review`,
        );
      }

      if (result.draft) {
        setDraft(result.draft);
        setToolPending([
          {
            id: runId,
            tool: "persist_report",
            summary: `Approve ${templateId} report draft (${result.draft.sections.length} sections)`,
          },
        ]);
        appendLog(result.error ?? "Report draft ready — awaiting approval");
      } else if (result.error) {
        appendLog(`Run failed: ${result.error}`);
      }
    } catch (e) {
      appendLog(e instanceof Error ? e.message : "Agent run failed");
    } finally {
      setRunning(false);
    }
  }, [aiAvailable, appendLog, caseId, graphDeps, templateId]);

  const handleApprove = useCallback(
    async (item: AiDraftApprovalItem | ApprovalItem) => {
      if ("tool" in item && "summary" in item) {
        setToolPending((items) => items.filter((i) => i.id !== item.id));
        if (draft) {
          onReportDraft?.(draft);
          appendLog("Report draft approved and sent to workspace");
        }
        setDraft(null);
        return;
      }

      const entry = item as AiDraftApprovalItem;
      if (entry.kind === "finding") {
        await commandClient.approveAiFindingDraft(entry.draft.id);
        appendLog(`Approved finding draft: ${entry.draft.title}`);
      } else if (entry.kind === "timeline") {
        await commandClient.approveAiTimelineDraft(entry.draft.id);
        appendLog("Approved timeline draft");
      } else if (entry.kind === "entity") {
        await commandClient.approveAiEntityDraft(entry.draft.id);
        appendLog(`Approved entity: ${entry.draft.value}`);
      }
      await refreshDrafts();
    },
    [appendLog, draft, onReportDraft, refreshDrafts],
  );

  const handleReject = useCallback(
    async (item: AiDraftApprovalItem | ApprovalItem) => {
      if ("tool" in item && "summary" in item) {
        setToolPending((items) => items.filter((i) => i.id !== item.id));
        setDraft(null);
        appendLog(`Rejected run ${item.id}`);
        return;
      }

      const entry = item as AiDraftApprovalItem;
      if (entry.kind === "finding") {
        await commandClient.rejectAiFindingDraft(entry.draft.id);
      } else if (entry.kind === "timeline") {
        await commandClient.rejectAiTimelineDraft(entry.draft.id);
      } else if (entry.kind === "entity") {
        await commandClient.rejectAiEntityDraft(entry.draft.id);
      }
      appendLog("Rejected AI draft");
      await refreshDrafts();
    },
    [appendLog, refreshDrafts],
  );

  return (
    <WorkspaceSidePanel title="Agent" onClose={onClose}>
      <div className="flex h-full flex-col">
        <div className="space-y-2 border-b border-border/40 p-3">
          <p className="text-xs text-muted-foreground">
            Extract evidence text, analyze with AI, review drafts, then generate
            a citation-backed report.
          </p>
          <AnalyzeCaseButton
            caseId={caseId}
            onComplete={({ draftsCreated, merged }) => {
              appendLog(
                `Analyze case finished — ${draftsCreated} drafts, ${merged} merged`,
              );
              void refreshDrafts();
            }}
          />
          <Button
            size="sm"
            className="w-full"
            disabled={running || aiAvailabilityLoading || !aiAvailable}
            title={
              aiAvailable
                ? undefined
                : "Add an OpenAI API key in Settings to enable AI features."
            }
            onClick={() => void runReportAgent()}
          >
            <Play className="mr-2 h-3.5 w-3.5" />
            {running ? "Running full pipeline…" : `Full pipeline → report (${templateId})`}
          </Button>
        </div>
        <ApprovalsQueue
          items={toolPending}
          aiDrafts={aiDrafts}
          fileNames={fileNames}
          onApprove={(item) => void handleApprove(item)}
          onReject={(item) => void handleReject(item)}
        />
        <ScrollArea className="flex-1 p-3">
          {log.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-xs text-muted-foreground">
              <Bot className="h-8 w-8 opacity-40" />
              No agent runs yet.
            </div>
          ) : (
            <ul className="space-y-2">
              {log.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-md border border-border/50 p-2 text-[11px]"
                >
                  <p>{entry.message}</p>
                  <p className="mt-1 text-muted-foreground">
                    {new Date(entry.at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </div>
    </WorkspaceSidePanel>
  );
}
