"use client";

import { useState } from "react";
import {
  ChevronDown,
  Download,
  History,
  KeyRound,
  Loader2,
  PanelLeft,
  Sparkles,
} from "lucide-react";
import type { ReportTemplateId } from "@repo/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReportTemplatePicker } from "@/components/artifacts/report-template-picker";
import { AnalyzeCaseButton } from "@/components/agents/analyze-case-button";
import { useReportWorkspace } from "./report-workspace-context";
import { FinalizeChecklistDialog } from "./finalize-checklist-dialog";
import { SnapshotBrowserDialog } from "./snapshot-browser-dialog";

interface ReportHeaderProps {
  navigatorOpen: boolean;
  onExpandNavigator: () => void;
}

export function ReportHeader({
  navigatorOpen,
  onExpandNavigator,
}: ReportHeaderProps) {
  const {
    caseId,
    caseSummary,
    templateId,
    setTemplateId,
    draft,
    generating,
    aiAvailable,
    aiAvailabilityLoading,
    files,
    findings,
    billingAmount,
    approvedAiFindings,
    generateFirstDraft,
    regenerate,
    exportMarkdown,
    exportDocx,
  } = useReportWorkspace();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const reviewedCount = draft
    ? Object.values(draft.sectionStatus).filter(
        (s) => s === "reviewed" || s === "locked",
      ).length
    : 0;
  const totalSections = draft?.document.sections.length ?? 0;
  const allReviewed = totalSections > 0 && reviewedCount === totalSections;

  const primaryLabel = !draft
    ? "Generate first draft"
    : allReviewed
      ? "Finalize & export"
      : "Regenerate draft";

  const handlePrimary = () => {
    if (!draft) {
      void generateFirstDraft();
      return;
    }
    if (allReviewed) {
      setFinalizeOpen(true);
      return;
    }
    void regenerate("unreviewed");
  };

  const handleExportMarkdown = async () => {
    const md = await exportMarkdown();
    if (!md) return;
    try {
      await navigator.clipboard.writeText(md);
    } catch {
      /* fallback download */
      const blob = new Blob([md], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${caseSummary.name.replace(/\s+/g, "-")}-report.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleExportDocx = async () => {
    try {
      const { save } = await import("@tauri-apps/plugin-dialog");
      const path = await save({
        defaultPath: `${caseSummary.name.replace(/\s+/g, "-")}-report.docx`,
        filters: [{ name: "Word Document", extensions: ["docx"] }],
      });
      if (path) await exportDocx(path);
    } catch {
      /* browser dev — skip */
    }
  };

  return (
    <>
      <div className="shrink-0 border-b border-border/40 px-4 pt-3 pb-3">
        <div className="mb-3 flex items-start gap-2">
          {!navigatorOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              title="Show outline"
              onClick={onExpandNavigator}
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold">Examination report</h2>
            <p className="text-xs text-muted-foreground">
              {caseSummary.name} — draft workspace
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                  aiAvailable
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "border-border/60 bg-muted text-muted-foreground"
                }`}
              >
                {aiAvailable ? (
                  <Sparkles className="h-3 w-3" />
                ) : (
                  <KeyRound className="h-3 w-3" />
                )}
                {aiAvailable ? "AI connected" : "AI not connected"}
              </span>
              {approvedAiFindings > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  {approvedAiFindings} approved AI finding
                  {approvedAiFindings === 1 ? "" : "s"}
                </span>
              )}
              {draft && totalSections > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  {reviewedCount}/{totalSections} sections reviewed
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setPickerOpen(true)}
            >
              Template: {templateId}
            </Button>
            <Button
              size="sm"
              className="h-8"
              disabled={generating || aiAvailabilityLoading || !aiAvailable}
              onClick={handlePrimary}
            >
              {generating ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              )}
              {generating ? "Working…" : primaryLabel}
            </Button>
            <AnalyzeCaseButton caseId={caseId} fullWidth={false} className="shrink-0" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <Download className="h-3.5 w-3.5" />
                  Export
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  disabled={!draft}
                  onClick={() => void handleExportMarkdown()}
                >
                  Copy / download Markdown
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!draft}
                  onClick={() => void handleExportDocx()}
                >
                  Export DOCX
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.print()}>
                  Print (PDF via browser)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              onClick={() => setHistoryOpen(true)}
            >
              <History className="h-3.5 w-3.5" />
              History
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <Stat label="Evidence files" value={files.length} />
          <Stat label="Findings" value={findings.length} />
          {billingAmount != null ? (
            <Stat label="Billable" value={`$${billingAmount.toFixed(2)}`} />
          ) : null}
        </div>
      </div>

      <ReportTemplatePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        selectedId={templateId}
        onSelect={(id: ReportTemplateId) => {
          setTemplateId(id);
          setPickerOpen(false);
        }}
      />
      <FinalizeChecklistDialog open={finalizeOpen} onOpenChange={setFinalizeOpen} />
      <SnapshotBrowserDialog open={historyOpen} onOpenChange={setHistoryOpen} />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
