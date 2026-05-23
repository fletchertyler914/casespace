"use client";

import { Sparkles, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReportWorkspace } from "./report-workspace-context";

export function ReportEmptyState() {
  const {
    aiAvailable,
    aiAvailabilityLoading,
    generating,
    generateFirstDraft,
    files,
    findings,
    timeline,
  } = useReportWorkspace();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 py-12 text-center">
      <div className="max-w-md space-y-2">
        <h2 className="text-xl font-semibold">Build your examination report</h2>
        <p className="text-sm text-muted-foreground">
          CaseSpace drafts a citation-backed report from your evidence, findings,
          and chronology. Review each section, edit inline, then export to Word.
        </p>
      </div>

      <div className="grid gap-2 rounded-lg border border-border/50 bg-muted/20 px-6 py-4 text-left text-xs">
        <p>
          <span className="font-medium">{files.length}</span> evidence files
        </p>
        <p>
          <span className="font-medium">{findings.length}</span> findings
        </p>
        <p>
          <span className="font-medium">{timeline.length}</span> timeline events
        </p>
      </div>

      {!aiAvailable && !aiAvailabilityLoading && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <KeyRound className="h-3.5 w-3.5" />
          Connect an AI provider in Settings to generate your first draft.
        </p>
      )}

      <Button
        size="lg"
        disabled={!aiAvailable || aiAvailabilityLoading || generating}
        onClick={() => void generateFirstDraft().catch(() => {})}
      >
        <Sparkles className="mr-2 h-4 w-4" />
        {generating ? "Generating first draft…" : "Generate first draft"}
      </Button>
    </div>
  );
}
