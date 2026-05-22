"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  CaseFile,
  CaseSummary,
  Finding,
  IngestResult,
  Note,
  TimelineEvent,
  WorkspacePreferences,
} from "@repo/types";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { BillingConfigDialog } from "@/components/billing/billing-config-dialog";
import { TimeManagementPage } from "@/components/billing/time-management/time-management-page";
import { useWorkspaceAutoSync } from "@/hooks/use-workspace-auto-sync";
import { useToast } from "@/hooks/use-toast";
import { commandClient } from "@/lib/command-client";
import { notifyTimerChanged } from "@/lib/timer-sync";
import { relativizeCaseFiles } from "@/lib/case-path-utils";
import { formatIngestSummary, ingestHadChanges } from "@/lib/ingest-utils";
import {
  buildDuplicateFileIdSet,
  duplicateStats,
  type DuplicateGroup,
} from "@/lib/duplicate-utils";
import { DuplicateIngestionNotification } from "@/components/ingestion/duplicate-ingestion-notification";
import { SyncProgressBanner } from "@/components/ingestion/sync-progress-banner";
import { getFlattenedFileList } from "@/lib/file-tree-utils";
import {
  loadWorkspacePreferences,
  saveWorkspacePreferences,
} from "@/lib/workspace-preferences";
import {
  normalizeWorkspaceViewMode,
  type WorkspaceViewMode,
} from "@/lib/workspace-view";
import type { ReportSectionId } from "@/lib/report-sections";
import { AddSourcesDialog } from "./add-sources-dialog";
import { CaseHeader } from "./case-header";
import { SettingsDialog } from "./settings-dialog";
import { ColumnsMappingDialog } from "./columns-mapping-dialog";
import { AppSettingsDialog } from "@/components/settings/app-settings-dialog";
import { WorkspaceLayout } from "./workspace-layout";
import { SearchDialog } from "@/components/search/search-dialog";

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

  const [viewMode, setViewMode] = useState<WorkspaceViewMode>("split");
  const [reportSection, setReportSection] = useState<ReportSectionId>("findings");
  const [navigatorOpen, setNavigatorOpen] = useState(true);
  const [viewingFile, setViewingFile] = useState<CaseFile | null>(null);
  const [selectedFolderPath, setSelectedFolderPath] = useState<string | null>(
    null,
  );
  const [notesVisible, setNotesVisible] = useState(false);
  const [findingsVisible, setFindingsVisible] = useState(false);
  const [timelineVisible, setTimelineVisible] = useState(false);
  const [duplicatesVisible, setDuplicatesVisible] = useState(false);
  const [timeVisible, setTimeVisible] = useState(false);
  const [sourceRoots, setSourceRoots] = useState<string[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [appSettingsOpen, setAppSettingsOpen] = useState(false);
  const [columnsMappingOpen, setColumnsMappingOpen] = useState(false);
  const [timeManagementOpen, setTimeManagementOpen] = useState(false);
  const [billingConfigOpen, setBillingConfigOpen] = useState(false);
  const [startTimerPromptOpen, setStartTimerPromptOpen] = useState(false);
  const [closeTimerPromptOpen, setCloseTimerPromptOpen] = useState(false);
  const [closeTimerLoading, setCloseTimerLoading] = useState(false);
  const [startTimerLoading, setStartTimerLoading] = useState(false);
  const startTimerPromptChecked = useRef(false);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [duplicateIngestNotice, setDuplicateIngestNotice] = useState<{
    groupCount: number;
    fileCount: number;
  } | null>(null);
  const prevDuplicateGroupCountRef = useRef(0);
  const autoSyncIntervals = [1, 5, 15] as const;

  const applyFiles = useCallback((raw: CaseFile[], roots: string[]) => {
    setFiles(relativizeCaseFiles(raw, roots));
  }, []);

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

  const refreshDuplicateGroups = useCallback(async (id: string) => {
    const res = await commandClient.findDuplicateFiles(id);
    if (res.ok && res.data) {
      setDuplicateGroups(res.data);
      prevDuplicateGroupCountRef.current = res.data.length;
    }
  }, []);

  const handleSyncComplete = useCallback(
    async (result: IngestResult) => {
      if (!ingestHadChanges(result)) return;
      const prevCount = prevDuplicateGroupCountRef.current;
      const res = await commandClient.findDuplicateFiles(caseId);
      if (!res.ok || !res.data) return;
      const stats = duplicateStats(res.data);
      setDuplicateGroups(res.data);
      prevDuplicateGroupCountRef.current = stats.groupCount;
      if (
        stats.groupCount > 0 &&
        (result.filesInserted > 0 || stats.groupCount > prevCount)
      ) {
        setDuplicateIngestNotice(stats);
      }
    },
    [caseId],
  );

  const onFilesRefreshed = useCallback(
    (raw: CaseFile[]) => {
      applyFiles(raw, sourceRoots);
      setViewingFile((prev) => {
        if (!prev) return prev;
        return relativizeCaseFiles(raw, sourceRoots).find((f) => f.id === prev.id) ?? null;
      });
      void refreshDuplicateGroups(caseId);
    },
    [applyFiles, caseId, refreshDuplicateGroups, sourceRoots],
  );

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
    onSyncComplete: (result) => void handleSyncComplete(result),
  });

  const duplicateFileIds = useMemo(
    () => buildDuplicateFileIdSet(duplicateGroups),
    [duplicateGroups],
  );

  const persistPrefs = useCallback(
    async (next: WorkspacePreferences) => {
      setPrefs(next);
      if (prefsLoaded) {
        await saveWorkspacePreferences(caseId, next);
      }
    },
    [caseId, prefsLoaded],
  );

  const applyPrefs = useCallback(
    async (next: WorkspacePreferences) => {
      setViewMode(normalizeWorkspaceViewMode(next));
      setNavigatorOpen(next.navigatorOpen ?? true);
      setNotesVisible(next.notesVisible ?? false);
      setFindingsVisible(next.findingsVisible ?? false);
      setTimelineVisible(next.timelineVisible ?? false);
      setDuplicatesVisible(next.duplicatesVisible ?? false);
      setTimeVisible(next.timeVisible ?? false);
      await persistPrefs(next);
    },
    [persistPrefs],
  );

  const SKIP_START_TIMER_KEY = "casespace.skipStartTimerPrompt";

  useEffect(() => {
    startTimerPromptChecked.current = false;
  }, [caseId]);

  useEffect(() => {
    if (!prefsLoaded || loading || startTimerPromptChecked.current) return;
    startTimerPromptChecked.current = true;
    if (typeof window !== "undefined" && localStorage.getItem(SKIP_START_TIMER_KEY)) {
      return;
    }
    void (async () => {
      const [timerRes, entryRes] = await Promise.all([
        commandClient.getActiveTimer(caseId),
        commandClient.getTimeEntry(caseId, new Date().toISOString().slice(0, 10)),
      ]);
      if (timerRes.ok && timerRes.data) return;
      if (entryRes.ok && entryRes.data) return;
      setStartTimerPromptOpen(true);
    })();
  }, [caseId, loading, prefsLoaded]);

  const handleCloseCase = useCallback(async () => {
    const timerRes = await commandClient.getActiveTimer(caseId);
    if (timerRes.ok && timerRes.data) {
      setCloseTimerPromptOpen(true);
      return;
    }
    router.push("/");
  }, [caseId, router]);

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
    setViewMode(normalizeWorkspaceViewMode(loadedPrefs));
    setNavigatorOpen(loadedPrefs.navigatorOpen ?? true);
    setNotesVisible(loadedPrefs.notesVisible ?? false);
    setFindingsVisible(loadedPrefs.findingsVisible ?? false);
    setTimelineVisible(loadedPrefs.timelineVisible ?? false);
    setDuplicatesVisible(loadedPrefs.duplicatesVisible ?? false);
    setTimeVisible(loadedPrefs.timeVisible ?? false);

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
    await refreshDuplicateGroups(caseId);
    setLoading(false);
  }, [
    caseId,
    refreshArtifacts,
    refreshDuplicateGroups,
    refreshFiles,
    router,
    toast,
  ]);

  useEffect(() => {
    void loadCase();
  }, [loadCase]);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  useEffect(() => {
    if (!prefsLoaded) return;
    void saveWorkspacePreferences(caseId, {
      viewMode,
      navigatorOpen,
      notesVisible,
      findingsVisible,
      timelineVisible,
      duplicatesVisible,
      timeVisible,
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
    duplicatesVisible,
    timeVisible,
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
      <SyncProgressBanner visible={isSyncing} />
      <CaseHeader
        caseId={caseId}
        caseSummary={caseSummary}
        fileCount={files.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        notesVisible={notesVisible}
        findingsVisible={findingsVisible}
        timelineVisible={timelineVisible}
        duplicatesVisible={duplicatesVisible}
        timeVisible={timeVisible}
        onToggleNotes={() => setNotesVisible((v) => !v)}
        onToggleFindings={() => setFindingsVisible((v) => !v)}
        onToggleTimeline={() => setTimelineVisible((v) => !v)}
        onToggleDuplicates={() => setDuplicatesVisible((v) => !v)}
        onToggleTime={() => setTimeVisible((v) => !v)}
        onSyncFiles={() => void syncNow()}
        isSyncing={isSyncing}
        autoSyncEnabled={prefs.autoSyncEnabled ?? true}
        onToggleAutoSync={() =>
          void persistPrefs({
            ...prefs,
            autoSyncEnabled: !(prefs.autoSyncEnabled ?? true),
          })
        }
        autoSyncIntervalMinutes={prefs.autoSyncIntervalMinutes ?? 5}
        onCycleAutoSyncInterval={() => {
          const current = prefs.autoSyncIntervalMinutes ?? 5;
          const idx = autoSyncIntervals.indexOf(current as (typeof autoSyncIntervals)[number]);
          const next = autoSyncIntervals[(idx + 1 + autoSyncIntervals.length) % autoSyncIntervals.length];
          void persistPrefs({
            ...prefs,
            autoSyncIntervalMinutes: next,
          });
        }}
        onAddSources={() => setAddSourcesOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenAppSettings={() => setAppSettingsOpen(true)}
        onOpenColumnsMapping={() => setColumnsMappingOpen(true)}
        onOpenTimeManagement={() => setTimeManagementOpen(true)}
        onOpenBillingConfig={() => setBillingConfigOpen(true)}
        onClose={() => void handleCloseCase()}
      />
      {duplicateIngestNotice && (
        <DuplicateIngestionNotification
          groupCount={duplicateIngestNotice.groupCount}
          fileCount={duplicateIngestNotice.fileCount}
          onReview={() => {
            setDuplicatesVisible(true);
            setDuplicateIngestNotice(null);
          }}
          onDismiss={() => setDuplicateIngestNotice(null)}
        />
      )}
      <WorkspaceLayout
        viewMode={viewMode}
        navigatorOpen={navigatorOpen}
        files={files}
        viewingFile={viewingFile}
        selectedFolderPath={selectedFolderPath}
        caseSummary={caseSummary}
        notesVisible={notesVisible}
        findingsVisible={findingsVisible}
        timelineVisible={timelineVisible}
        duplicatesVisible={duplicatesVisible}
        timeVisible={timeVisible}
        caseId={caseId}
        notes={notes}
        findings={findings}
        timeline={timeline}
        duplicateGroups={duplicateGroups}
        duplicateFileIds={duplicateFileIds}
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
        onFileRemoved={() => {
          setViewingFile(null);
          void refreshFiles(caseId, sourceRoots);
        }}
        onFileRenamed={(updated) => {
          setViewingFile(updated);
          void refreshFiles(caseId, sourceRoots);
        }}
        sourceRoots={sourceRoots}
        onStatusChange={(id, status) => void handleStatusChange(id, status)}
        onFilesChanged={() => void refreshFiles(caseId, sourceRoots)}
        onCloseNotes={() => setNotesVisible(false)}
        onCloseFindings={() => setFindingsVisible(false)}
        onCloseTimeline={() => setTimelineVisible(false)}
        onCloseDuplicates={() => setDuplicatesVisible(false)}
        onCloseTime={() => setTimeVisible(false)}
        onOpenTimeManagement={() => setTimeManagementOpen(true)}
        onArtifactsChanged={() => {
          void refreshArtifacts(caseId);
          void refreshDuplicateGroups(caseId);
        }}
        reportSection={reportSection}
        onReportSectionChange={setReportSection}
      />
      <AddSourcesDialog
        open={addSourcesOpen}
        onOpenChange={setAddSourcesOpen}
        onAdd={handleAddSources}
      />
      <SearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        caseId={caseId}
        files={files}
        findings={findings}
        timeline={timeline}
        onFileOpen={handleFileSelect}
        onOpenEntityPanel={(entityType) => {
          const normalized = entityType.toLowerCase();
          if (normalized.includes("note")) setNotesVisible(true);
          if (normalized.includes("finding")) setFindingsVisible(true);
          if (normalized.includes("timeline")) setTimelineVisible(true);
          if (normalized.includes("duplicate")) setDuplicatesVisible(true);
          if (normalized.includes("report")) {
            setViewMode("reports");
            if (normalized.includes("finding")) setReportSection("findings");
            else if (normalized.includes("timeline")) setReportSection("timeline");
            else if (normalized.includes("note")) setReportSection("notes");
          }
          if (normalized.includes("time")) setTimeVisible(true);
        }}
      />
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        prefs={{
          ...prefs,
          viewMode,
          navigatorOpen,
          notesVisible,
          findingsVisible,
          timelineVisible,
          duplicatesVisible,
          timeVisible,
        }}
        onSave={(next) => {
          void applyPrefs(next);
        }}
      />
      <AppSettingsDialog
        open={appSettingsOpen}
        onOpenChange={setAppSettingsOpen}
      />
      <ColumnsMappingDialog
        open={columnsMappingOpen}
        onOpenChange={setColumnsMappingOpen}
        caseId={caseId}
        onSaved={() => void refreshFiles(caseId, sourceRoots)}
      />
      <TimeManagementPage
        open={timeManagementOpen}
        onOpenChange={setTimeManagementOpen}
        caseId={caseId}
      />
      <BillingConfigDialog
        open={billingConfigOpen}
        onOpenChange={setBillingConfigOpen}
        caseId={caseId}
      />
      <AlertDialog
        open={startTimerPromptOpen}
        onOpenChange={setStartTimerPromptOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start timer for this case?</AlertDialogTitle>
            <AlertDialogDescription>
              No time has been recorded today. Start tracking now?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                if (typeof window !== "undefined") {
                  localStorage.setItem(SKIP_START_TIMER_KEY, "1");
                }
              }}
            >
              Don&apos;t ask again
            </AlertDialogCancel>
            <AlertDialogCancel>Not now</AlertDialogCancel>
            <AlertDialogAction
              disabled={startTimerLoading}
              onClick={(e) => {
                e.preventDefault();
                void (async () => {
                  setStartTimerLoading(true);
                  const res = await commandClient.startTimer(caseId);
                  setStartTimerLoading(false);
                  if (!res.ok) {
                    toast({
                      title: "Could not start timer",
                      description:
                        res.error?.message ?? "Start timer failed",
                      variant: "destructive",
                    });
                    return;
                  }
                  notifyTimerChanged(caseId);
                  setStartTimerPromptOpen(false);
                  toast({ title: "Timer started" });
                })();
              }}
            >
              {startTimerLoading ? "Starting…" : "Start timer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={closeTimerPromptOpen}
        onOpenChange={setCloseTimerPromptOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Timer is running</AlertDialogTitle>
            <AlertDialogDescription>
              Stop the timer and close this case, or keep it running in the
              background.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel disabled={closeTimerLoading}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="outline"
              disabled={closeTimerLoading}
              onClick={() => {
                setCloseTimerPromptOpen(false);
                router.push("/");
              }}
            >
              Keep running
            </Button>
            <AlertDialogAction
              disabled={closeTimerLoading}
              onClick={() => {
                void (async () => {
                  setCloseTimerLoading(true);
                  const res = await commandClient.stopTimer(caseId);
                  setCloseTimerLoading(false);
                  if (res.ok) notifyTimerChanged(caseId);
                  setCloseTimerPromptOpen(false);
                  router.push("/");
                })();
              }}
            >
              {closeTimerLoading ? "Stopping…" : "Stop & close"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
