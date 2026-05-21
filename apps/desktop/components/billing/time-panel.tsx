"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { BillingSummary, TimeEntry } from "@repo/types";
import { Button } from "@/components/ui/button";
import { WorkspaceSidePanel } from "@/components/workspace/workspace-side-panel";
import { commandClient } from "@/lib/command-client";

interface TimePanelProps {
  caseId: string;
  onClose: () => void;
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function dayKey(ts: string): string {
  return new Date(ts).toISOString().slice(0, 10);
}

export function TimePanel({ caseId, onClose }: TimePanelProps) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [billing, setBilling] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const activeEntry = useMemo(
    () => entries.find((entry) => !entry.endedAt),
    [entries],
  );
  const activeElapsedLabel = useMemo(() => {
    if (!activeEntry) return "00h 00m";
    const ms = Math.max(0, now - new Date(activeEntry.startedAt).getTime());
    const minutes = Math.floor(ms / 60000);
    return formatMinutes(minutes);
  }, [activeEntry, now]);

  const dailyTotals = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const entry of entries) {
      const key = dayKey(entry.startedAt);
      byDay.set(key, (byDay.get(key) ?? 0) + entry.billableMinutes);
    }
    return Array.from(byDay.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [entries]);

  const refresh = useCallback(async () => {
    const [entriesRes, billingRes] = await Promise.all([
      commandClient.getTimeEntries(caseId),
      commandClient.calculateBillingAmount(caseId),
    ]);
    if (entriesRes.ok && entriesRes.data) {
      setEntries(entriesRes.data);
    }
    if (billingRes.ok && billingRes.data) {
      setBilling(billingRes.data);
    }
  }, [caseId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!activeEntry) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [activeEntry]);

  async function run(action: "start" | "pause" | "resume" | "stop") {
    setLoading(true);
    if (action === "start") {
      await commandClient.startTimer(caseId);
    } else if (action === "pause") {
      await commandClient.pauseTimer(caseId);
    } else if (action === "resume") {
      await commandClient.resumeTimer(caseId);
    } else if (action === "stop" && activeEntry) {
      await commandClient.stopTimer(activeEntry.id);
    }
    await refresh();
    setLoading(false);
  }

  return (
    <WorkspaceSidePanel title="Time" onClose={onClose}>
      <div className="space-y-3 p-3">
        <div className="rounded-md border border-border/50 p-2 text-xs">
          <p className="font-medium">Billing summary</p>
          <p className="text-muted-foreground">
            Total minutes: {billing?.totalMinutes ?? 0}
          </p>
          <p className="text-muted-foreground">
            Amount: ${billing?.amount?.toFixed(2) ?? "0.00"}
          </p>
          <p className="text-muted-foreground">
            Active: {activeEntry ? activeElapsedLabel : "No active timer"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            disabled={loading || !!activeEntry}
            onClick={() => void run("start")}
          >
            Start
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={loading || !activeEntry}
            onClick={() => void run("pause")}
          >
            Pause
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={loading || !!activeEntry}
            onClick={() => void run("resume")}
          >
            Resume
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={loading || !activeEntry}
            onClick={() => void run("stop")}
          >
            Stop
          </Button>
        </div>

        <ul className="space-y-2">
          {entries.length === 0 ? (
            <li className="text-xs text-muted-foreground">No time entries yet.</li>
          ) : (
            entries.slice().reverse().map((entry) => (
              <li
                key={entry.id}
                className="rounded-md border border-border/50 p-2 text-xs"
              >
                <p className="font-medium">
                  {entry.endedAt ? "Completed" : "Active"} ·{" "}
                  {formatMinutes(entry.billableMinutes)}
                </p>
                <p className="text-muted-foreground">
                  Start: {new Date(entry.startedAt).toLocaleString()}
                </p>
                <p className="text-muted-foreground">
                  End:{" "}
                  {entry.endedAt ? new Date(entry.endedAt).toLocaleString() : "—"}
                </p>
              </li>
            ))
          )}
        </ul>
        <div className="space-y-1 rounded-md border border-border/50 p-2">
          <p className="text-xs font-medium">Daily totals</p>
          {dailyTotals.length === 0 ? (
            <p className="text-xs text-muted-foreground">No tracked days yet.</p>
          ) : (
            dailyTotals.map(([day, minutes]) => (
              <p key={day} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{day}</span>
                <span>{formatMinutes(minutes)}</span>
              </p>
            ))
          )}
        </div>
      </div>
    </WorkspaceSidePanel>
  );
}
