"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  CaseFile,
  CaseSummary,
  Finding,
  Note,
  TimelineEvent,
  WorkspacePreferences,
} from "@repo/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspaceAutoSync } from "@/hooks/use-workspace-auto-sync";
import { useToast } from "@/hooks/use-toast";
import { commandClient } from "@/lib/command-client";
import { relativizeCaseFiles } from "@/lib/case-path-utils";
import { formatIngestSummary } from "@/lib/ingest-utils";
import { getFlattenedFileList } from "@/lib/file-tree-utils";
import {
  loadWorkspacePreferences,
  saveWorkspacePreferences,
} from "@/lib/workspace-preferences";
import { AddSourcesDialog } from "./add-sources-dialog";
import { CaseHeader } from "./case-header";
import { WorkspaceLayout } from "./workspace-layout";

interface CaseWorkspaceShellProps {
  caseId: string;
}

export function CaseWorkspaceShell({ caseId }: CaseWorkspaceShellProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [prefs, setPrefs] = useState<WorkspacePreferences>({});
  const [caseSummary, setCaseSummary] = useState<CaseSummary | null>(null);
  const [files, setFiles] = useState<CaseFile[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [addSourcesOpen, setAddSourcesOpen] = useState(false);

  const [viewMode, setViewMode] = useState<"split" | "board">("split");
  const [navigatorOpen, setNavigatorOpen] = useState(true);
  const [viewingFile, setViewingFile] = useState<CaseFile | null>(null);
  const [selectedFolderPath, setSelectedFolderPath] = useState<string | null>(
    null,
  );
  const [notesVisible, setNotesVisible] = useState(false);
  const [findingsVisible, setFindingsVisible] = useState(false);
  const [timelineVisible, setTimelineVisible] = useState(false);
  const [sourceRoots, setSourceRoots] = useState<string[]>([]);

  const applyFiles = useCallback((raw: CaseFile[], roots: string[]) => {
    setFiles(relativizeCaseFiles(raw, roots));
  }, []);

  const onFilesRefreshed = useCallback(
    (raw: CaseFile[]) => {
      applyFiles(raw, sourceRoots);
      setViewingFile((prev) => {
        if (!prev) return prev;
        return relativizeCaseFiles(raw, sourceRoots).find((f) => f.id === prev.id) ?? null;
      });
    },
    [applyFiles, sourceRoots],
  );

  const refreshArtifacts = useCallback(async (id: string) => {
    const [noteRes, findingRes, timelineRes] = await Promise.all([
      commandClient.listNotes(id),
      commandClient.listFindings(id),
      commandClient.listTimelineEvents(id),
    ]);
    if (noteRes.ok && noteRes.data) setNotes(noteRes.data);
    if (findingRes.ok && findingRes.data) setFindings(findingRes.data);
    if (timelineRes.ok && timelineRes.data) setTimeline(timelineRes.data);
  }, []);

  const refreshFiles = useCallback(
    async (id: string, roots: string[]) => {
      const res = await commandClient.loadCaseFiles(id);
      if (res.ok && res.data) {
        applyFiles(res.data, roots);
        setViewingFile((prev) => {
          if (!prev) return prev;
          return relativizeCaseFiles(res.data!, roots).find((f) => f.id === prev.id) ?? null;
        });
      }
    },
    [applyFiles],
  );

  const { isSyncing, syncNow } = useWorkspaceAutoSync({
    caseId,
    enabled: prefs.autoSyncEnabled ?? true,
    intervalMinutes: prefs.autoSyncIntervalMinutes ?? 5,
    preferencesLoaded: prefsLoaded,
    onFilesRefreshed,
  });

  const persistPrefs = useCallback(
    async (next: WorkspacePreferences) => {
      setPrefs(next);
      if (prefsLoaded) {
        await saveWorkspacePreferences(caseId, next);
      }
    },
    [caseId, prefsLoaded],
  );

  const loadCase = useCallback(async () => {
    setLoading(true);
    const caseRes = await commandClient.getCase(caseId);
    if (!caseRes.ok || !caseRes.data) {
      toast({
        title: "Case not found",
        description: caseRes.error?.message ?? "Unable to open case",
        variant: "destructive",
      });
      router.replace("/");
      return;
    }
    setCaseSummary(caseRes.data);
    const roots = caseRes.data.sourcePaths ?? [];
    setSourceRoots(roots);

    const loadedPrefs = await loadWorkspacePreferences(caseId);
    setPrefs(loadedPrefs);
    setPrefsLoaded(true);
    setViewMode(loadedPrefs.viewMode ?? "split");
    setNavigatorOpen(loadedPrefs.navigatorOpen ?? true);
    setNotesVisible(loadedPrefs.notesVisible ?? false);
    setFindingsVisible(loadedPrefs.findingsVisible ?? false);
    setTimelineVisible(loadedPrefs.timelineVisible ?? false);

    const syncRes = await commandClient.syncCaseAllSources(caseId, true);
    if (syncRes.ok && syncRes.data) {
      await refreshFiles(caseId, roots);
      if (
        syncRes.data.filesInserted > 0 ||
        syncRes.data.filesUpdated > 0
      ) {
        toast({
          title: "Case loaded",
          description: formatIngestSummary(syncRes.data),
        });
      }
    } else {
      await refreshFiles(caseId, roots);
    }

    await refreshArtifacts(caseId);
    setLoading(false);
  }, [caseId, refreshArtifacts, refreshFiles, router, toast]);

  useEffect(() => {
    void loadCase();
  }, [loadCase]);

  useEffect(() => {
    if (!prefsLoaded) return;
    void saveWorkspacePreferences(caseId, {
      viewMode,
      navigatorOpen,
      notesVisible,
      findingsVisible,
      timelineVisible,
      autoSyncEnabled: prefs.autoSyncEnabled,
      autoSyncIntervalMinutes: prefs.autoSyncIntervalMinutes,
    });
  }, [
    caseId,
    prefsLoaded,
    viewMode,
    navigatorOpen,
    notesVisible,
    findingsVisible,
    timelineVisible,
    prefs.autoSyncEnabled,
    prefs.autoSyncIntervalMinutes,
  ]);

  const navigationList = useMemo(
    () => getFlattenedFileList(files),
    [files],
  );

  const currentIndex = viewingFile
    ? navigationList.findIndex((f) => f.id === viewingFile.id)
    : -1;
  const hasPrevious = currentIndex > 0;
  const hasNext =
    currentIndex >= 0 && currentIndex < navigationList.length - 1;

  const handleFileSelect = useCallback((file: CaseFile) => {
    setViewingFile(file);
    if (viewMode === "board") {
      setViewMode("split");
    }
  }, [viewMode]);

  const handleStatusChange = useCallback(
    async (fileId: string, status: string) => {
      const res = await commandClient.updateFileStatus(fileId, status);
      if (!res.ok) {
        toast({
          title: "Status update failed",
          description: res.error?.message,
          variant: "destructive",
        });
        return;
      }
      await refreshFiles(caseId, sourceRoots);
    },
    [caseId, refreshFiles, sourceRoots, toast],
  );

  const handleAddSources = useCallback(
    async (paths: string[]) => {
      for (const path of paths) {
        const res = await commandClient.addCaseSource(caseId, path);
        if (!res.ok) {
          throw new Error(res.error?.message ?? `Failed to add ${path}`);
        }
      }
      const caseRes = await commandClient.getCase(caseId);
      if (caseRes.ok && caseRes.data) {
        setCaseSummary(caseRes.data);
        setSourceRoots(caseRes.data.sourcePaths ?? []);
      }
      await syncNow();
      toast({ title: "Sources added", description: "New paths synced." });
    },
    [caseId, syncNow, toast],
  );

  const handleRefreshFile = useCallback(async () => {
    if (!viewingFile) return;
    const res = await commandClient.refreshSingleFile(
      caseId,
      viewingFile.filePath,
    );
    if (res.ok && res.data) {
      setViewingFile(res.data);
      await refreshFiles(caseId, sourceRoots);
    }
  }, [caseId, refreshFiles, sourceRoots, viewingFile]);

  if (loading || !caseSummary) {
    return (
      <div className="flex h-screen flex-col gap-2 p-4">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="min-h-0 flex-1" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <CaseHeader
        caseSummary={caseSummary}
        fileCount={files.length}
        sourceCount={sourceRoots.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        notesVisible={notesVisible}
        findingsVisible={findingsVisible}
        timelineVisible={timelineVisible}
        onToggleNotes={() => setNotesVisible((v) => !v)}
        onToggleFindings={() => setFindingsVisible((v) => !v)}
        onToggleTimeline={() => setTimelineVisible((v) => !v)}
        onSyncFiles={() => void syncNow()}
        isSyncing={isSyncing}
        autoSyncEnabled={prefs.autoSyncEnabled ?? true}
        onToggleAutoSync={() =>
          void persistPrefs({
            ...prefs,
            autoSyncEnabled: !(prefs.autoSyncEnabled ?? true),
          })
        }
        onAddSources={() => setAddSourcesOpen(true)}
        onClose={() => router.push("/")}
      />
      <WorkspaceLayout
        viewMode={viewMode}
        navigatorOpen={navigatorOpen}
        files={files}
        viewingFile={viewingFile}
        selectedFolderPath={selectedFolderPath}
        notesVisible={notesVisible}
        findingsVisible={findingsVisible}
        timelineVisible={timelineVisible}
        caseId={caseId}
        notes={notes}
        findings={findings}
        timeline={timeline}
        onFileSelect={handleFileSelect}
        onFolderSelect={setSelectedFolderPath}
        onToggleNavigator={() => setNavigatorOpen(false)}
        onExpandNavigator={() => setNavigatorOpen(true)}
        onFileOpen={handleFileSelect}
        onFileClose={() => setViewingFile(null)}
        onNext={() => {
          if (hasNext) setViewingFile(navigationList[currentIndex + 1]!);
        }}
        onPrevious={() => {
          if (hasPrevious) setViewingFile(navigationList[currentIndex - 1]!);
        }}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
        onFileRefresh={() => void handleRefreshFile()}
        sourceRoots={sourceRoots}
        onStatusChange={(id, status) => void handleStatusChange(id, status)}
        onCloseNotes={() => setNotesVisible(false)}
        onCloseFindings={() => setFindingsVisible(false)}
        onCloseTimeline={() => setTimelineVisible(false)}
        onArtifactsChanged={() => void refreshArtifacts(caseId)}
      />
      <AddSourcesDialog
        open={addSourcesOpen}
        onOpenChange={setAddSourcesOpen}
        onAdd={handleAddSources}
      />
    </div>
  );
}
