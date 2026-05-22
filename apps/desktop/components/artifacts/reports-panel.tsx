"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, LayoutTemplate } from "lucide-react";
import type { ReportExportHistoryEntry } from "@repo/types";
import { Button } from "@/components/ui/button";
import { WorkspaceSidePanel } from "@/components/workspace/workspace-side-panel";
import { ReportsWorkspace } from "@/components/artifacts/reports-workspace";
import { commandClient } from "@/lib/command-client";
import { openInShell } from "@/lib/tauri-dialog";

interface ReportsPanelProps {
  caseId: string;
  onClose: () => void;
}

const REPORT_TYPES = [
  { value: "narrative", label: "Narrative" },
  { value: "executive", label: "Executive summary" },
  { value: "evidence_index", label: "Evidence index" },
  { value: "financial", label: "Financial package" },
  { value: "billing_invoice", label: "Billing invoice" },
] as const;

const TYPE_PREVIEW_HINTS: Record<string, string> = {
  narrative: "Full case narrative synthesizing findings, timeline, and inventory.",
  executive: "High-level summary with file counts, findings, and billing.",
  evidence_index: "Indexed list of all evidence files with paths and status.",
  financial: "Billable minutes, hourly rate, and computed amount.",
  billing_invoice: "Invoice-style billing summary for client delivery.",
};

export function ReportsPanel({ caseId, onClose }: ReportsPanelProps) {
  const [workspaceMode, setWorkspaceMode] = useState(false);
  const [preview, setPreview] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [exportingType, setExportingType] = useState<string | null>(null);
  const [lastExportPath, setLastExportPath] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("narrative");
  const [history, setHistory] = useState<ReportExportHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    const res = await commandClient.listReportExports(caseId);
    if (res.ok && res.data) {
      setHistory(res.data);
    }
    setHistoryLoading(false);
  }, [caseId]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  async function loadPreview(reportType: string) {
    setLoadingPreview(true);
    setSelectedType(reportType);
    if (reportType === "narrative") {
      const res = await commandClient.generateCaseReport(caseId);
      setLoadingPreview(false);
      if (res.ok && res.data) {
        setPreview(res.data);
      } else {
        setPreview("Failed to load report preview.");
      }
      return;
    }
    setLoadingPreview(false);
    const label =
      REPORT_TYPES.find((t) => t.value === reportType)?.label ?? reportType;
    setPreview(
      `# ${label}\n\n${TYPE_PREVIEW_HINTS[reportType] ?? ""}\n\nUse Export to generate the full markdown report, or open the full report workspace for structured sections.`,
    );
  }

  async function exportReport(reportType: string) {
    setExportingType(reportType);
    const res = await commandClient.exportCaseReport(caseId, reportType);
    setExportingType(null);
    if (res.ok && res.data) {
      const data = res.data;
      setLastExportPath(data.filePath);
      await loadHistory();
      await openInShell(data.filePath);
    }
  }

  if (workspaceMode) {
    return (
      <WorkspaceSidePanel title="Reports" onClose={onClose}>
        <ReportsWorkspace caseId={caseId} onBack={() => setWorkspaceMode(false)} />
      </WorkspaceSidePanel>
    );
  }

  const filteredHistory =
    typeFilter === "all"
      ? history
      : history.filter((item) => item.reportType === typeFilter);

  return (
    <WorkspaceSidePanel title="Reports" onClose={onClose}>
      <div className="space-y-3 p-3">
        <Button
          size="sm"
          variant="outline"
          className="w-full justify-start"
          onClick={() => setWorkspaceMode(true)}
        >
          <LayoutTemplate className="mr-2 h-3.5 w-3.5" />
          Open full report workspace
        </Button>

        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">Preview type</p>
          <select
            className="h-7 flex-1 rounded-md border border-border/50 bg-background px-2 text-xs"
            value={selectedType}
            onChange={(event) => void loadPreview(event.target.value)}
          >
            {REPORT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {TYPE_PREVIEW_HINTS[selectedType] ?? "Report preview."}
        </p>

        <Button
          size="sm"
          variant="outline"
          className="w-full"
          disabled={loadingPreview}
          onClick={() => void loadPreview(selectedType)}
        >
          {loadingPreview ? "Loading preview…" : "Load preview"}
        </Button>

        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">Export filter</p>
          <select
            className="h-7 rounded-md border border-border/50 bg-background px-2 text-xs"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            <option value="all">All</option>
            {REPORT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {REPORT_TYPES.filter(
            (type) => typeFilter === "all" || typeFilter === type.value,
          ).map((type) => (
            <Button
              key={type.value}
              size="sm"
              className="justify-start"
              disabled={exportingType !== null}
              onClick={() => void exportReport(type.value)}
            >
              {exportingType === type.value ? "Exporting…" : `Export ${type.label}`}
            </Button>
          ))}
        </div>

        {lastExportPath ? (
          <Button
            size="sm"
            variant="ghost"
            className="w-full justify-start text-xs"
            onClick={() => void openInShell(lastExportPath)}
          >
            <ExternalLink className="mr-2 h-3.5 w-3.5" />
            Open last export
          </Button>
        ) : null}

        <div className="space-y-1 rounded-md border border-border/50 p-2">
          <p className="text-xs font-medium">Export history</p>
          {historyLoading ? (
            <p className="text-[11px] text-muted-foreground">Loading…</p>
          ) : filteredHistory.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">No exports yet.</p>
          ) : (
            filteredHistory.slice(0, 10).map((item) => (
              <button
                key={item.id}
                type="button"
                className="flex w-full items-center justify-between rounded px-1 py-1 text-left text-[11px] hover:bg-muted/30"
                onClick={() => void openInShell(item.filePath)}
              >
                <span className="truncate text-muted-foreground">
                  {item.reportType}
                </span>
                <span className="ml-2 shrink-0 text-muted-foreground">
                  {new Date(item.generatedAt).toLocaleString()}
                </span>
              </button>
            ))
          )}
        </div>

        <pre className="max-h-48 overflow-auto rounded-md border border-border/50 bg-muted/20 p-2 text-[11px] leading-relaxed whitespace-pre-wrap">
          {preview || "Report preview appears here after loading."}
        </pre>
      </div>
    </WorkspaceSidePanel>
  );
}
