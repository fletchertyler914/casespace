"use client";

import { memo } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import type { CaseFile, CaseSummary, Finding, Note, TimelineEvent } from "@repo/types";
import { FileNavigator } from "./file-navigator";
import { SplitView } from "./split-view";
import { BoardView } from "./board-view";
import { ReportSectionNavigator } from "@/components/artifacts/report-section-navigator";
import { ReportsView } from "@/components/artifacts/reports-view";
import { filterFilesByFolder } from "@/lib/file-tree-utils";
import type { DuplicateGroup } from "@/lib/duplicate-utils";
import {
  REPORT_SECTION_DEFS,
  type ReportSectionId,
} from "@/lib/report-sections";
import type { WorkspaceViewMode } from "@/lib/workspace-view";

function ResizeHandle() {
  return (
    <PanelResizeHandle className="group relative flex w-1.5 cursor-col-resize items-center justify-center bg-transparent transition-colors hover:bg-border/30">
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border transition-colors group-hover:bg-primary/60" />
    </PanelResizeHandle>
  );
}

interface WorkspaceLayoutProps {
  viewMode: WorkspaceViewMode;
  navigatorOpen: boolean;
  files: CaseFile[];
  viewingFile: CaseFile | null;
  selectedFolderPath: string | null;
  caseSummary: CaseSummary;
  notesVisible: boolean;
  findingsVisible: boolean;
  timelineVisible: boolean;
  duplicatesVisible: boolean;
  timeVisible: boolean;
  caseId: string;
  notes: Note[];
  findings: Finding[];
  timeline: TimelineEvent[];
  duplicateGroups: DuplicateGroup[];
  duplicateFileIds: Set<string>;
  onFileSelect: (file: CaseFile) => void;
  onFolderSelect: (folderPath: string | null) => void;
  onToggleNavigator: () => void;
  onExpandNavigator: () => void;
  onFileOpen: (file: CaseFile) => void;
  onFileClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
  onFileRefresh: () => void;
  onFileRemoved?: () => void;
  onFileRenamed?: (file: CaseFile) => void;
  onStatusChange: (fileId: string, status: string) => void;
  onFilesChanged: () => void;
  onCloseNotes: () => void;
  onCloseFindings: () => void;
  onCloseTimeline: () => void;
  onCloseDuplicates: () => void;
  onCloseTime: () => void;
  onOpenTimeManagement?: () => void;
  sourceRoots: string[];
  onArtifactsChanged: () => void;
  reportSection: ReportSectionId;
  onReportSectionChange: (section: ReportSectionId) => void;
}

export const WorkspaceLayout = memo(function WorkspaceLayout({
  viewMode,
  navigatorOpen,
  files,
  viewingFile,
  selectedFolderPath,
  caseSummary,
  notesVisible,
  findingsVisible,
  timelineVisible,
  duplicatesVisible,
  timeVisible,
  caseId,
  notes,
  findings,
  timeline,
  duplicateGroups,
  duplicateFileIds,
  onFileSelect,
  onFolderSelect,
  onToggleNavigator,
  onExpandNavigator,
  onFileOpen,
  onFileClose,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
  onFileRefresh,
  onFileRemoved,
  onFileRenamed,
  onStatusChange,
  onFilesChanged,
  onCloseNotes,
  onCloseFindings,
  onCloseTimeline,
  onCloseDuplicates,
  onCloseTime,
  onOpenTimeManagement,
  sourceRoots,
  onArtifactsChanged,
  reportSection,
  onReportSectionChange,
}: WorkspaceLayoutProps) {
  const scopedFiles = filterFilesByFolder(files, selectedFolderPath);

  const reportSections = REPORT_SECTION_DEFS.map((s) => ({
    id: s.id,
    label: s.label,
    count:
      s.id === "findings"
        ? findings.length
        : s.id === "timeline"
          ? timeline.length
          : s.id === "inventory"
            ? files.length
            : s.id === "notes"
              ? notes.length
              : undefined,
  }));

  return (
    <PanelGroup
      direction="horizontal"
      className="min-h-0 flex-1 overflow-hidden"
      id="workspace-shell"
    >
      {navigatorOpen && (
        <>
          <Panel
            id="navigator"
            order={0}
            defaultSize={28}
            minSize={18}
            maxSize={45}
            className="flex min-h-0 flex-col"
          >
            {viewMode === "reports" ? (
              <ReportSectionNavigator
                sections={reportSections}
                activeSectionId={reportSection}
                onSectionSelect={(id) =>
                  onReportSectionChange(id as ReportSectionId)
                }
                onToggleNavigator={onToggleNavigator}
              />
            ) : (
              <FileNavigator
                caseId={caseId}
                files={files}
                currentFile={viewingFile}
                duplicateGroups={duplicateGroups}
                duplicateFileIds={duplicateFileIds}
                onFileSelect={onFileSelect}
                onStatusChange={onStatusChange}
                onFilesChanged={onFilesChanged}
                selectedFolderPath={selectedFolderPath}
                onFolderSelect={onFolderSelect}
                onToggleNavigator={onToggleNavigator}
              />
            )}
          </Panel>
          <ResizeHandle />
        </>
      )}

      <Panel
        id="workspace-main"
        order={1}
        className="relative flex min-h-0 flex-col overflow-hidden"
      >
        {viewMode === "split" ? (
          <SplitView
            viewingFile={viewingFile}
            caseId={caseId}
            notesVisible={notesVisible}
            findingsVisible={findingsVisible}
            timelineVisible={timelineVisible}
            duplicatesVisible={duplicatesVisible}
            timeVisible={timeVisible}
            notes={notes}
            findings={findings}
            timeline={timeline}
            duplicateGroups={duplicateGroups}
            duplicateFileIds={duplicateFileIds}
            files={files}
            navigatorOpen={navigatorOpen}
            onExpandNavigator={onExpandNavigator}
            onFileClose={onFileClose}
            onNext={onNext}
            onPrevious={onPrevious}
            hasNext={hasNext}
            hasPrevious={hasPrevious}
            onFileRefresh={onFileRefresh}
            onFileRemoved={onFileRemoved}
            onFileRenamed={onFileRenamed}
            onStatusChange={onStatusChange}
            onCloseNotes={onCloseNotes}
            onCloseFindings={onCloseFindings}
            onCloseTimeline={onCloseTimeline}
            onCloseDuplicates={onCloseDuplicates}
            onCloseTime={onCloseTime}
            onOpenTimeManagement={onOpenTimeManagement}
            sourceRoots={sourceRoots}
            onArtifactsChanged={onArtifactsChanged}
            onFileSelect={onFileSelect}
          />
        ) : viewMode === "board" ? (
          <BoardView
            caseId={caseId}
            files={scopedFiles}
            totalFileCount={files.length}
            viewingFile={viewingFile}
            navigatorOpen={navigatorOpen}
            selectedFolderPath={selectedFolderPath}
            duplicateGroups={duplicateGroups}
            onExpandNavigator={onExpandNavigator}
            onFileOpen={onFileOpen}
            onStatusChange={onStatusChange}
          />
        ) : (
          <ReportsView
            caseId={caseId}
            caseSummary={caseSummary}
            activeSection={reportSection}
            files={files}
            notes={notes}
            findings={findings}
            timeline={timeline}
            navigatorOpen={navigatorOpen}
            onExpandNavigator={onExpandNavigator}
          />
        )}
      </Panel>
    </PanelGroup>
  );
});
