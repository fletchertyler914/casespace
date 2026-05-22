"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CaseFile, IngestResult } from "@repo/types";
import { commandClient } from "@/lib/command-client";
import {
  formatIngestSummary,
  ingestHadChanges,
} from "@/lib/ingest-utils";
import { useToast } from "@/hooks/use-toast";

interface UseWorkspaceAutoSyncOptions {
  caseId: string;
  enabled: boolean;
  intervalMinutes: number;
  preferencesLoaded: boolean;
  onFilesRefreshed: (files: CaseFile[]) => void;
  onSyncComplete?: (result: IngestResult) => void;
}

export function useWorkspaceAutoSync({
  caseId,
  enabled,
  intervalMinutes,
  preferencesLoaded,
  onFilesRefreshed,
  onSyncComplete,
}: UseWorkspaceAutoSyncOptions) {
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const lastSyncRef = useRef<number | null>(null);

  const reloadFiles = useCallback(async () => {
    const res = await commandClient.loadCaseFiles(caseId);
    if (res.ok && res.data) {
      onFilesRefreshed(res.data);
    }
  }, [caseId, onFilesRefreshed]);

  const runSync = useCallback(
    async (options?: { quiet?: boolean }) => {
      setIsSyncing(true);
      try {
        const res = await commandClient.syncCaseAllSources(caseId, true);
        if (!res.ok || !res.data) {
          if (!options?.quiet) {
            toast({
              title: "Sync failed",
              description: res.error?.message ?? "Unknown error",
              variant: "destructive",
            });
          }
          return;
        }
        await reloadFiles();
        lastSyncRef.current = Date.now();
        onSyncComplete?.(res.data);

        if (!options?.quiet && ingestHadChanges(res.data)) {
          toast({
            title: "Files synced",
            description: formatIngestSummary(res.data),
          });
        }
        if (res.data.errors && res.data.errors.length > 0 && !options?.quiet) {
          toast({
            title: "Sync completed with warnings",
            description: res.data.errors.slice(0, 2).join("; "),
            variant: "destructive",
          });
        }
      } finally {
        setIsSyncing(false);
      }
    },
    [caseId, onSyncComplete, reloadFiles, toast],
  );

  useEffect(() => {
    if (!enabled || !preferencesLoaded) return;

    const intervalMs = Math.max(1, intervalMinutes) * 60 * 1000;

    const tick = () => {
      if (document.hidden || isSyncing) return;
      const now = Date.now();
      if (lastSyncRef.current && now - lastSyncRef.current < 60_000) {
        return;
      }
      void runSync({ quiet: true });
    };

    const initial = setTimeout(tick, intervalMs);
    const handle = setInterval(tick, intervalMs);
    return () => {
      clearTimeout(initial);
      clearInterval(handle);
    };
  }, [
    enabled,
    intervalMinutes,
    preferencesLoaded,
    isSyncing,
    runSync,
  ]);

  return { isSyncing, syncNow: runSync };
}
