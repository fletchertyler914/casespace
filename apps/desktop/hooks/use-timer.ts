"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ActiveTimer, TimeEntry } from "@repo/types";
import { commandClient } from "@/lib/command-client";
import {
  entryDisplaySeconds,
  formatDurationSeconds,
} from "@/lib/time-format";
import { notifyTimerChanged, subscribeTimerChanged } from "@/lib/timer-sync";

const SYNC_INTERVAL_MS = 30_000;

export interface UseTimerResult {
  isRunning: boolean;
  isPaused: boolean;
  elapsedSeconds: number;
  formattedTime: string;
  todayEntry: TimeEntry | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  start: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: (summary?: string) => Promise<TimeEntry | null>;
}

export interface UseTimerOptions {
  onOtherCaseStopped?: (otherCaseName: string) => void;
}

export function useTimer(
  caseId: string,
  options?: UseTimerOptions,
): UseTimerResult {
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [todayEntry, setTodayEntry] = useState<TimeEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastSyncRef = useRef(0);

  const refresh = useCallback(async () => {
    const [timerRes, entryRes] = await Promise.all([
      commandClient.getActiveTimer(caseId),
      commandClient.getTimeEntry(caseId, new Date().toISOString().slice(0, 10)),
    ]);
    if (timerRes.ok) setActiveTimer(timerRes.data ?? null);
    if (entryRes.ok) setTodayEntry(entryRes.data ?? null);
  }, [caseId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    return subscribeTimerChanged((id) => {
      if (id === caseId) void refresh();
    });
  }, [caseId, refresh]);

  const isRunning = Boolean(activeTimer);
  const hasOpenSegment = Boolean(
    todayEntry?.segments?.some((s) => !s.endedAt),
  );
  const isPaused =
    !isRunning &&
    Boolean(todayEntry) &&
    (todayEntry?.segments?.length ?? 0) > 0 &&
    !hasOpenSegment;

  useEffect(() => {
    if (!isRunning) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    const loop = (ts: number) => {
      // RAF gives DOMHighResTimeStamp (since page load) — only use it
      // to trigger re-renders; use Date.now() for the actual wall clock.
      setTick(Date.now());
      if (ts - lastSyncRef.current > SYNC_INTERVAL_MS) {
        lastSyncRef.current = ts;
        void refresh();
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isRunning, refresh]);

  const nowMs = tick || Date.now();
  const elapsedSeconds = todayEntry
    ? entryDisplaySeconds(todayEntry, nowMs)
    : 0;

  const run = useCallback(
    async (fn: () => Promise<void>) => {
      setLoading(true);
      setError(null);
      try {
        await fn();
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Timer action failed");
      } finally {
        setLoading(false);
      }
    },
    [refresh],
  );

  const start = useCallback(async () => {
    await run(async () => {
      let stoppedName: string | null = null;
      const casesRes = await commandClient.listCases();
      if (casesRes.ok && casesRes.data) {
        for (const c of casesRes.data) {
          if (c.id === caseId) continue;
          const t = await commandClient.getActiveTimer(c.id);
          if (t.ok && t.data) {
            stoppedName = c.name;
            break;
          }
        }
      }
      const res = await commandClient.startTimer(caseId);
      if (!res.ok) throw new Error(res.error?.message ?? "Start failed");
      if (stoppedName && options?.onOtherCaseStopped) {
        options.onOtherCaseStopped(stoppedName);
      }
      notifyTimerChanged(caseId);
    });
  }, [caseId, run, options]);

  const pause = useCallback(async () => {
    await run(async () => {
      const res = await commandClient.pauseTimer(caseId);
      if (!res.ok) throw new Error(res.error?.message ?? "Pause failed");
      notifyTimerChanged(caseId);
    });
  }, [caseId, run]);

  const resume = useCallback(async () => {
    await run(async () => {
      const res = await commandClient.resumeTimer(caseId);
      if (!res.ok) throw new Error(res.error?.message ?? "Resume failed");
      notifyTimerChanged(caseId);
    });
  }, [caseId, run]);

  const stop = useCallback(
    async (summary?: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await commandClient.stopTimer(caseId, summary);
        if (!res.ok) throw new Error(res.error?.message ?? "Stop failed");
        await refresh();
        notifyTimerChanged(caseId);
        return res.data ?? null;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Stop failed");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [caseId, refresh],
  );

  return {
    isRunning,
    isPaused,
    elapsedSeconds,
    formattedTime: formatDurationSeconds(elapsedSeconds),
    todayEntry,
    loading,
    error,
    refresh,
    start,
    pause,
    resume,
    stop,
  };
}
