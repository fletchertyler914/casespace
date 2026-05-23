"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReportSection, ReportSectionStatus } from "@repo/types";
import { Button } from "@/components/ui/button";
import { Lock, RefreshCw, CheckCircle2 } from "lucide-react";
import { CitationPillList } from "@/components/artifacts/citation-pill";
import { useReportWorkspace } from "./report-workspace-context";
import { ReportSectionStatusBadge } from "./report-section-status-badge";
import { ReportSectionEditor } from "./report-section-editor";

interface ReportSectionBlockProps {
  section: ReportSection;
  status: ReportSectionStatus;
}

export function ReportSectionBlock({ section, status }: ReportSectionBlockProps) {
  const {
    registerSectionRef,
    updateSection,
    regenerate,
    markSectionReviewed,
    toggleSectionLock,
    generating,
    setSelectedCitation,
  } = useReportWorkspace();
  const [localText, setLocalText] = useState(section.text);
  const locked = status === "locked";

  useEffect(() => {
    setLocalText(section.text);
  }, [section.text]);

  const setRef = useCallback(
    (el: HTMLElement | null) => registerSectionRef(section.id, el),
    [registerSectionRef, section.id],
  );

  const handleChange = (text: string) => {
    setLocalText(text);
    const nextStatus: ReportSectionStatus =
      status === "aiDrafted" || status === "empty" ? "edited" : status;
    updateSection(section.id, text, nextStatus);
  };

  return (
    <section
      ref={setRef}
      id={`report-section-${section.id}`}
      className="scroll-mt-4 border-b border-border/30 pb-8 last:border-b-0"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold tracking-tight">{section.heading}</h2>
          <ReportSectionStatusBadge status={status} />
        </div>
        <div className="flex flex-wrap gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            disabled={generating || locked}
            onClick={() => void regenerate("section", section.id)}
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            Regenerate
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            disabled={locked}
            onClick={() => markSectionReviewed(section.id)}
          >
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Mark reviewed
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => toggleSectionLock(section.id)}
          >
            <Lock className="mr-1 h-3 w-3" />
            {locked ? "Unlock" : "Lock"}
          </Button>
        </div>
      </div>

      <ReportSectionEditor value={localText} disabled={locked} onChange={handleChange} />

      <CitationPillList
        citations={section.citations}
        onNavigate={(citation) => setSelectedCitation(citation)}
      />
    </section>
  );
}
