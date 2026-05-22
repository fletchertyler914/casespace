"use client";

import { useCallback, useState } from "react";
import { Bot, Play } from "lucide-react";
import type { ReportDocument, ReportTemplateId } from "@repo/types";
import {
  createAgentCheckpointStore,
  createReportGenerationGraph,
} from "@repo/agents";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WorkspaceSidePanel } from "@/components/workspace/workspace-side-panel";
import { commandClient } from "@/lib/command-client";
import { DEFAULT_REPORT_TEMPLATE_ID } from "@/lib/report-templates";
import { ApprovalsQueue } from "./approvals-queue";

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

export function AgentPanel({ caseId, onClose, onReportDraft }: AgentPanelProps) {
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<RunLogEntry[]>([]);
  const [pending, setPending] = useState<
    { id: string; tool: string; summary: string }[]
  >([]);
  const [draft, setDraft] = useState<ReportDocument | null>(null);
  const [templateId] = useState<ReportTemplateId>(DEFAULT_REPORT_TEMPLATE_ID);

  const appendLog = useCallback((message: string) => {
    setLog((prev) => [
      { id: crypto.randomUUID(), message, at: new Date().toISOString() },
      ...prev,
    ]);
  }, []);

  const runReportAgent = useCallback(async () => {
    setRunning(true);
    appendLog(`Report agent started (${templateId}) for case ${caseId}`);
    const store = createAgentCheckpointStore();
    const runId = crypto.randomUUID();

    const graph = createReportGenerationGraph({
      loadArtifacts: async (cid) => {
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
      composeReport: async (cid, tid) => {
        const res = await commandClient.generateCaseReport(cid, tid);
        if (!res.ok || !res.data) {
          throw new Error(res.error?.message ?? "generate_case_report failed");
        }
        return JSON.parse(res.data) as ReportDocument;
      },
    });

    try {
      const result = await graph.invoke({
        caseId,
        templateId,
        status: "loading",
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

      if (result.draft) {
        setDraft(result.draft);
        setPending([
          {
            id: runId,
            tool: "persist_report",
            summary: `Approve ${templateId} report draft (${result.draft.sections.length} sections)`,
          },
        ]);
        appendLog("Draft ready — awaiting your approval");
      } else if (result.error) {
        appendLog(`Run failed: ${result.error}`);
      }
    } catch (e) {
      appendLog(e instanceof Error ? e.message : "Agent run failed");
    } finally {
      setRunning(false);
    }
  }, [appendLog, caseId, templateId]);

  return (
    <WorkspaceSidePanel title="Agent" onClose={onClose}>
      <div className="flex h-full flex-col">
        <div className="space-y-2 border-b border-border/40 p-3">
          <p className="text-xs text-muted-foreground">
            Runs citation-backed report generation via CaseSpace native commands.
            Destructive actions require approval below.
          </p>
          <Button
            size="sm"
            className="w-full"
            disabled={running}
            onClick={() => void runReportAgent()}
          >
            <Play className="mr-2 h-3.5 w-3.5" />
            {running ? "Running…" : `Run report agent (${templateId})`}
          </Button>
        </div>
        <ApprovalsQueue
          items={pending}
          onApprove={(id) => {
            setPending((items) => items.filter((i) => i.id !== id));
            if (draft) {
              onReportDraft?.(draft);
              appendLog("Report draft approved and sent to workspace");
            }
            setDraft(null);
          }}
          onReject={(id) => {
            setPending((items) => items.filter((i) => i.id !== id));
            setDraft(null);
            appendLog(`Rejected run ${id}`);
          }}
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
