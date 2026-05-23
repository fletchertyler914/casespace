"use client";

import { useEffect } from "react";
import type { ReportSectionId } from "@/lib/report-sections";
import type { CaseFile, CaseSummary, Finding, Note, TimelineEvent } from "@repo/types";
import { ReportWorkspaceProvider } from "./report-workspace-context";
import { ReportHeader } from "./report-header";
import { ReportCanvas } from "./report-canvas";
import { CitationInspector } from "./citation-inspector";
import { useReportWorkspace } from "./report-workspace-context";

function ReportSectionAnchor({ section }: { section: ReportSectionId }) {
  const { scrollToSection } = useReportWorkspace();
  useEffect(() => {
    scrollToSection(section);
  }, [section, scrollToSection]);
  return null;
}

export interface ReportWorkspaceProps {
  caseId: string;
  caseSummary: CaseSummary;
  files: CaseFile[];
  notes: Note[];
  findings: Finding[];
  timeline: TimelineEvent[];
  navigatorOpen: boolean;
  onExpandNavigator: () => void;
}

export function ReportWorkspace(props: ReportWorkspaceProps) {
  return (
    <ReportWorkspaceProvider
      caseId={props.caseId}
      caseSummary={props.caseSummary}
      files={props.files}
      notes={props.notes}
      findings={props.findings}
      timeline={props.timeline}
    >
      <ReportWorkspaceView {...props} />
    </ReportWorkspaceProvider>
  );
}

/** Report main panel (requires ReportWorkspaceProvider ancestor). */
export function ReportWorkspaceView({
  navigatorOpen,
  onExpandNavigator,
  anchorSection,
}: Pick<ReportWorkspaceProps, "navigatorOpen" | "onExpandNavigator"> & {
  anchorSection?: ReportSectionId;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      {anchorSection ? <ReportSectionAnchor section={anchorSection} /> : null}
      <ReportHeader
        navigatorOpen={navigatorOpen}
        onExpandNavigator={onExpandNavigator}
      />
      <div className="flex min-h-0 flex-1">
        <ReportCanvas />
        <CitationInspector />
      </div>
    </div>
  );
}
