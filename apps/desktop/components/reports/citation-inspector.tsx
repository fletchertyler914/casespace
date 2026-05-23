"use client";

import type { Citation } from "@repo/types";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useReportWorkspace } from "./report-workspace-context";

export function CitationInspector() {
  const {
    selectedCitation,
    setSelectedCitation,
    files,
    findings,
    notes,
    timeline,
  } = useReportWorkspace();

  if (!selectedCitation) return null;

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-border/40 bg-muted/10">
      <div className="flex items-center justify-between border-b border-border/40 px-3 py-2">
        <p className="text-xs font-medium">Citation source</p>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setSelectedCitation(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1 p-3">
        <CitationDetail
          citation={selectedCitation}
          files={files}
          findings={findings}
          notes={notes}
          timeline={timeline}
        />
      </ScrollArea>
    </aside>
  );
}

function CitationDetail({
  citation,
  files,
  findings,
  notes,
  timeline,
}: {
  citation: Citation;
  files: { id: string; fileName: string; absolutePath?: string }[];
  findings: { id: string; title: string; description: string }[];
  notes: { id: string; content: string }[];
  timeline: { id: string; description: string; occurredAt: string }[];
}) {
  return (
    <div className="space-y-2 text-xs">
      <p className="font-medium">{citation.label}</p>
      <p className="text-muted-foreground">
        {citation.kind} · {citation.id}
      </p>
      {citation.anchor ? (
        <p className="text-muted-foreground">Anchor: {citation.anchor}</p>
      ) : null}
      {citation.kind === "file" && (
        <p className="rounded-md border border-border/50 bg-background p-2">
          {files.find((f) => f.id === citation.id)?.fileName ?? citation.id}
        </p>
      )}
      {citation.kind === "finding" && (
        <p className="rounded-md border border-border/50 bg-background p-2">
          {findings.find((f) => f.id === citation.id)?.title ?? citation.id}
        </p>
      )}
      {citation.kind === "note" && (
        <p className="rounded-md border border-border/50 bg-background p-2 line-clamp-6">
          {notes.find((n) => n.id === citation.id)?.content.replace(/<[^>]+>/g, " ") ??
            citation.id}
        </p>
      )}
      {citation.kind === "timeline" && (
        <p className="rounded-md border border-border/50 bg-background p-2">
          {timeline.find((t) => t.id === citation.id)?.description ?? citation.id}
        </p>
      )}
    </div>
  );
}
