"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock3 } from "lucide-react";
import type { ActiveTimer, TimeEntry } from "@repo/types";
import { Button } from "@/components/ui/button";
import { commandClient } from "@/lib/command-client";

interface TimerWidgetProps {
  caseId: string;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => n.toString().padStart(2, "0")).join(":");
}

function entryElapsedMs(entry: TimeEntry, now: number): number {
  if (!entry.segments?.length) {
    return Math.max(0, now - new Date(entry.startedAt).getTime());
  }
  return entry.segments.reduce((sum, seg) => {
    const start = new Date(seg.startedAt).getTime();
    const end = seg.endedAt ? new Date(seg.endedAt).getTime() : now;
    return sum + Math.max(0, end - start);
  }, 0);
}

export function TimerWidget({ caseId }: TimerWidgetProps) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const refresh = useCallback(async () => {
    const [entriesRes, timerRes] = await Promise.all([
      commandClient.getTimeEntries(caseId),
      commandClient.getActiveTimer(caseId),
    ]);
    if (entriesRes.ok && entriesRes.data) {
      setEntries(entriesRes.data);
    }
    if (timerRes.ok) {
      setActiveTimer(timerRes.data ?? null);
    }
  }, [caseId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!activeTimer) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [activeTimer]);

  const openEntry = useMemo(
    () => entries.find((entry) => !entry.endedAt),
    [entries],
  );

  const elapsedMs = useMemo(() => {
    if (!openEntry) return 0;
    return entryElapsedMs(openEntry, now);
  }, [openEntry, now]);

  async function startTimer() {
    setLoading(true);
    await commandClient.startTimer(caseId);
    await refresh();
    setLoading(false);
  }

  async function stopTimer() {
    if (!openEntry) return;
    setLoading(true);
    await commandClient.stopTimer(openEntry.id);
    await refresh();
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-border/40 px-2 py-1">
      <Clock3 className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs tabular-nums text-muted-foreground">
        {openEntry ? formatDuration(elapsedMs) : "00:00:00"}
      </span>
      {openEntry ? (
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2 text-[11px]"
          disabled={loading}
          onClick={() => void stopTimer()}
        >
          Stop
        </Button>
      ) : (
        <Button
          size="sm"
          className="h-7 px-2 text-[11px]"
          disabled={loading}
          onClick={() => void startTimer()}
        >
          Start
        </Button>
      )}
    </div>
  );
}
