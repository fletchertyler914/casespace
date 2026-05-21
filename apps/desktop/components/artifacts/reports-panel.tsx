"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkspaceSidePanel } from "@/components/workspace/workspace-side-panel";
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

export function ReportsPanel({ caseId, onClose }: ReportsPanelProps) {
  const [preview, setPreview] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [exportingType, setExportingType] = useState<string | null>(null);
  const [lastExportPath, setLastExportPath] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [history, setHistory] = useState<
    Array<{ type: string; path: string; generatedAt: string }>
  >([]);

  async function loadNarrativePreview() {
    setLoadingPreview(true);
    const res = await commandClient.generateCaseReport(caseId);
    setLoadingPreview(false);
    if (res.ok && res.data) {
      setPreview(res.data);
    } else {
      setPreview("Failed to load report preview.");
    }
  }

  async function exportReport(reportType: string) {
    setExportingType(reportType);
    const res = await commandClient.exportCaseReport(caseId, reportType);
    setExportingType(null);
    if (res.ok && res.data) {
      const data = res.data;
      setLastExportPath(data.filePath);
      setHistory((prev) => [
        {
          type: data.reportType,
          path: data.filePath,
          generatedAt: data.generatedAt,
        },
        ...prev,
      ]);
      await openInShell(data.filePath);
    }
  }

  return (
    <WorkspaceSidePanel title="Reports" onClose={onClose}>
      <div className="space-y-3 p-3">
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          disabled={loadingPreview}
          onClick={() => void loadNarrativePreview()}
        >
          {loadingPreview ? "Loading preview…" : "Load narrative preview"}
        </Button>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">Filter</p>
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
          {REPORT_TYPES.filter((type) => typeFilter === "all" || typeFilter === type.value).map((type) => (
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
        {history.length > 0 ? (
          <div className="space-y-1 rounded-md border border-border/50 p-2">
            <p className="text-xs font-medium">Recent exports</p>
            {history.slice(0, 5).map((item) => (
              <button
                key={`${item.path}-${item.generatedAt}`}
                type="button"
                className="flex w-full items-center justify-between rounded px-1 py-1 text-left text-[11px] hover:bg-muted/30"
                onClick={() => void openInShell(item.path)}
              >
                <span className="truncate text-muted-foreground">{item.type}</span>
                <span className="ml-2 shrink-0 text-muted-foreground">
                  {new Date(item.generatedAt).toLocaleTimeString()}
                </span>
              </button>
            ))}
          </div>
        ) : null}
        <pre className="max-h-64 overflow-auto rounded-md border border-border/50 bg-muted/20 p-2 text-[11px] leading-relaxed whitespace-pre-wrap">
          {preview || "Narrative preview appears here."}
        </pre>
      </div>
    </WorkspaceSidePanel>
  );
}
