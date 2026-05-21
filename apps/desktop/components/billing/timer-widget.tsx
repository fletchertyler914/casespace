"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock3 } from "lucide-react";
import type { TimeEntry } from "@repo/types";
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

export function TimerWidget({ caseId }: TimerWidgetProps) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const refresh = useCallback(async () => {
    const res = await commandClient.getTimeEntries(caseId);
    if (res.ok && res.data) {
      setEntries(res.data);
    }
  }, [caseId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const activeEntry = useMemo(
    () => entries.find((entry) => !entry.endedAt),
    [entries],
  );

  const elapsedMs = useMemo(() => {
    if (!activeEntry) return 0;
    return now - new Date(activeEntry.startedAt).getTime();
  }, [activeEntry, now]);

  async function startTimer() {
    setLoading(true);
    await commandClient.startTimer(caseId);
    await refresh();
    setLoading(false);
  }

  async function stopTimer() {
    if (!activeEntry) return;
    setLoading(true);
    await commandClient.stopTimer(activeEntry.id);
    await refresh();
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-border/40 px-2 py-1">
      <Clock3 className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs tabular-nums text-muted-foreground">
        {activeEntry ? formatDuration(elapsedMs) : "00:00:00"}
      </span>
      {activeEntry ? (
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
