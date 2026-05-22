"use client";

import { useState } from "react";
import { Bot, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WorkspaceSidePanel } from "@/components/workspace/workspace-side-panel";
import { ApprovalsQueue } from "./approvals-queue";

interface AgentPanelProps {
  caseId: string;
  onClose: () => void;
}

interface RunLogEntry {
  id: string;
  message: string;
  at: string;
}

export function AgentPanel({ caseId, onClose }: AgentPanelProps) {
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<RunLogEntry[]>([]);
  const [pending, setPending] = useState<
    { id: string; tool: string; summary: string }[]
  >([]);

  async function startReportRun() {
    setRunning(true);
    const entry: RunLogEntry = {
      id: crypto.randomUUID(),
      message: `Report generation run started for case ${caseId}`,
      at: new Date().toISOString(),
    };
    setLog((prev) => [entry, ...prev]);
    setRunning(false);
  }

  return (
    <WorkspaceSidePanel title="Agent" onClose={onClose}>
      <div className="flex h-full flex-col">
        <div className="space-y-2 border-b border-border/40 p-3">
          <p className="text-xs text-muted-foreground">
            Assists routine examination steps (search, drafts, report sections) via
            CaseSpace MCP tools. Destructive actions require your approval below.
          </p>
          <Button
            size="sm"
            className="w-full"
            disabled={running}
            onClick={() => void startReportRun()}
          >
            <Play className="mr-2 h-3.5 w-3.5" />
            {running ? "Running…" : "Run report agent"}
          </Button>
        </div>
        <ApprovalsQueue
          items={pending}
          onApprove={(id) => {
            setPending((items) => items.filter((i) => i.id !== id));
            setLog((prev) => [
              {
                id: crypto.randomUUID(),
                message: `Approved: ${id}`,
                at: new Date().toISOString(),
              },
              ...prev,
            ]);
          }}
          onReject={(id) => {
            setPending((items) => items.filter((i) => i.id !== id));
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
