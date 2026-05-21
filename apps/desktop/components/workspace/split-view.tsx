"use client";

import { memo } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { FileText, PanelLeft } from "lucide-react";
import type { CaseFile, Finding, Note, TimelineEvent } from "@repo/types";
import { Button } from "@/components/ui/button";
import { useWorkspacePanels } from "@/hooks/use-workspace-panels";
import { FindingsPanel } from "@/components/artifacts/findings-panel";
import { NotesPanel } from "@/components/artifacts/notes-panel";
import { TimelinePanel } from "@/components/artifacts/timeline-panel";
import { FileViewerPane } from "./file-viewer-pane";

function ResizeHandle() {
  return (
    <PanelResizeHandle className="group relative flex w-1.5 cursor-col-resize items-center justify-center bg-transparent transition-colors hover:bg-border/30">
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border transition-colors group-hover:bg-primary/60" />
    </PanelResizeHandle>
  );
}

interface SplitViewProps {
  viewingFile: CaseFile | null;
  caseId: string;
  notesVisible: boolean;
  findingsVisible: boolean;
  timelineVisible: boolean;
  notes: Note[];
  findings: Finding[];
  timeline: TimelineEvent[];
  navigatorOpen: boolean;
  onExpandNavigator: () => void;
  onFileClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
  onFileRefresh: () => void;
  onStatusChange: (fileId: string, status: string) => void;
  onCloseNotes: () => void;
  onCloseFindings: () => void;
  onCloseTimeline: () => void;
  onArtifactsChanged: () => void;
  sourceRoots: string[];
}

export const SplitView = memo(function SplitView({
  viewingFile,
  caseId,
  notesVisible,
  findingsVisible,
  timelineVisible,
  notes,
  findings,
  timeline,
  navigatorOpen,
  onExpandNavigator,
  onFileClose,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
  onFileRefresh,
  onStatusChange,
  onCloseNotes,
  onCloseFindings,
  onCloseTimeline,
  onArtifactsChanged,
  sourceRoots,
}: SplitViewProps) {
  const panelSizes = useWorkspacePanels({
    notesVisible,
    findingsVisible,
    timelineVisible,
  });

  return (
    <PanelGroup direction="horizontal" className="min-h-0 flex-1 overflow-hidden">
      <Panel defaultSize={panelSizes.fileViewerSize} minSize={35}>
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
          {viewingFile ? (
            <FileViewerPane
              file={viewingFile}
              caseId={caseId}
              navigatorOpen={navigatorOpen}
              onExpandNavigator={onExpandNavigator}
              onClose={onFileClose}
              onNext={onNext}
              onPrevious={onPrevious}
              hasNext={hasNext}
              hasPrevious={hasPrevious}
              onStatusChange={onStatusChange}
              onRefresh={onFileRefresh}
              sourceRoots={sourceRoots}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
              {!navigatorOpen && (
                <Button variant="outline" size="sm" onClick={onExpandNavigator}>
                  <PanelLeft className="mr-2 h-4 w-4" />
                  Show navigator
                </Button>
              )}
              <FileText className="h-10 w-10 opacity-40" />
              <p className="text-sm font-medium">No file selected</p>
              <p className="text-xs">Choose a file from the navigator or board</p>
            </div>
          )}
        </div>
      </Panel>

      {notesVisible && (
        <>
          <ResizeHandle />
          <Panel defaultSize={panelSizes.sidePanelSize} minSize={15} maxSize={40}>
            <NotesPanel
              caseId={caseId}
              notes={notes}
              onClose={onCloseNotes}
              onChanged={onArtifactsChanged}
            />
          </Panel>
        </>
      )}

      {findingsVisible && (
        <>
          <ResizeHandle />
          <Panel defaultSize={panelSizes.sidePanelSize} minSize={15} maxSize={40}>
            <FindingsPanel
              caseId={caseId}
              findings={findings}
              onClose={onCloseFindings}
              onChanged={onArtifactsChanged}
            />
          </Panel>
        </>
      )}

      {timelineVisible && (
        <>
          <ResizeHandle />
          <Panel defaultSize={panelSizes.sidePanelSize} minSize={15} maxSize={40}>
            <TimelinePanel
              caseId={caseId}
              events={timeline}
              onClose={onCloseTimeline}
              onChanged={onArtifactsChanged}
            />
          </Panel>
        </>
      )}
    </PanelGroup>
  );
});
