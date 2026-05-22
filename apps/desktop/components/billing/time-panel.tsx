"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ActiveTimer, BillingSummary, TimeEntry, TimeSegment } from "@repo/types";
import { Button } from "@/components/ui/button";
import { WorkspaceSidePanel } from "@/components/workspace/workspace-side-panel";
import { commandClient } from "@/lib/command-client";
import { BillingConfigDialog } from "@/components/billing/billing-config-dialog";
import { DailySummaryDialog } from "@/components/billing/daily-summary-dialog";
import { DeleteTimeEntryDialog } from "@/components/billing/delete-time-entry-dialog";
import { SegmentEditDialog } from "@/components/billing/segment-edit-dialog";

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

function segmentElapsedMinutes(segment: TimeSegment, now: number): number {
  const start = new Date(segment.startedAt).getTime();
  const end = segment.endedAt
    ? new Date(segment.endedAt).getTime()
    : now;
  return Math.max(0, Math.floor((end - start) / 60000));
}

function entryLiveMinutes(entry: TimeEntry, now: number): number {
  if (!entry.segments?.length) return entry.billableMinutes;
  return entry.segments.reduce((sum, seg) => {
    const raw = segmentElapsedMinutes(seg, now);
    const discount = Math.min(100, Math.max(0, seg.discountPercent ?? 0));
    return sum + Math.floor(raw * (100 - discount) / 100);
  }, 0);
}

export function TimePanel({ caseId, onClose }: TimePanelProps) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [billing, setBilling] = useState<BillingSummary | null>(null);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [billingOpen, setBillingOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [editSegment, setEditSegment] = useState<TimeSegment | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<TimeEntry | null>(null);

  const openEntry = useMemo(
    () => entries.find((entry) => !entry.endedAt),
    [entries],
  );
  const isRunning = !!activeTimer;
  const isPaused = !!openEntry && !isRunning;

  const activeElapsedLabel = useMemo(() => {
    if (!openEntry) return "00h 00m";
    return formatMinutes(entryLiveMinutes(openEntry, now));
  }, [openEntry, now]);

  const dailyTotals = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const entry of entries) {
      const key = dayKey(entry.startedAt);
      const minutes =
        !entry.endedAt && openEntry?.id === entry.id
          ? entryLiveMinutes(entry, now)
          : entry.billableMinutes;
      byDay.set(key, (byDay.get(key) ?? 0) + minutes);
    }
    return Array.from(byDay.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [entries, now, openEntry]);

  const refresh = useCallback(async () => {
    const [entriesRes, billingRes, timerRes] = await Promise.all([
      commandClient.getTimeEntries(caseId),
      commandClient.calculateBillingAmount(caseId),
      commandClient.getActiveTimer(caseId),
    ]);
    if (entriesRes.ok && entriesRes.data) {
      setEntries(entriesRes.data);
    }
    if (billingRes.ok && billingRes.data) {
      setBilling(billingRes.data);
    }
    if (timerRes.ok) {
      setActiveTimer(timerRes.data ?? null);
    }
  }, [caseId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!openEntry || !isRunning) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [openEntry, isRunning]);

  async function run(action: "start" | "pause" | "resume") {
    setLoading(true);
    if (action === "start") {
      await commandClient.startTimer(caseId);
    } else if (action === "pause") {
      await commandClient.pauseTimer(caseId);
    } else if (action === "resume") {
      await commandClient.resumeTimer(caseId);
    }
    await refresh();
    setLoading(false);
  }

  async function confirmStop(summary?: string) {
    if (!openEntry) return;
    setLoading(true);
    await commandClient.stopTimer(openEntry.id, summary);
    await refresh();
    setLoading(false);
  }

  async function handleDeleteSegment(segmentId: string) {
    setLoading(true);
    await commandClient.deleteTimeSegment(segmentId);
    await refresh();
    setLoading(false);
  }

  async function handleDeleteEntry() {
    if (!deleteEntry) return;
    setLoading(true);
    await commandClient.deleteTimeEntry(deleteEntry.id);
    setDeleteEntry(null);
    await refresh();
    setLoading(false);
  }

  return (
    <>
      <WorkspaceSidePanel title="Time" onClose={onClose}>
        <div className="space-y-3 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="rounded-md border border-border/50 p-2 text-xs flex-1">
              <p className="font-medium">Billing summary</p>
              <p className="text-muted-foreground">
                Total minutes: {billing?.totalMinutes ?? 0}
              </p>
              <p className="text-muted-foreground">
                Amount: ${billing?.amount?.toFixed(2) ?? "0.00"}
              </p>
              <p className="text-muted-foreground">
                Status:{" "}
                {isRunning
                  ? `Running · ${activeElapsedLabel}`
                  : isPaused
                    ? `Paused · ${activeElapsedLabel}`
                    : "No active timer"}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => setBillingOpen(true)}
            >
              Billing
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              disabled={loading || !!openEntry}
              onClick={() => void run("start")}
            >
              Start
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={loading || !isRunning}
              onClick={() => void run("pause")}
            >
              Pause
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={loading || !isPaused}
              onClick={() => void run("resume")}
            >
              Resume
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={loading || !openEntry}
              onClick={() => setSummaryOpen(true)}
            >
              Stop
            </Button>
          </div>

          <ul className="space-y-2">
            {entries.length === 0 ? (
              <li className="text-xs text-muted-foreground">No time entries yet.</li>
            ) : (
              entries.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-md border border-border/50 p-2 text-xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        {entry.endedAt
                          ? "Completed"
                          : isRunning && openEntry?.id === entry.id
                            ? "Running"
                            : "Paused"}{" "}
                        · {formatMinutes(
                          !entry.endedAt && openEntry?.id === entry.id
                            ? entryLiveMinutes(entry, now)
                            : entry.billableMinutes,
                        )}
                      </p>
                      <p className="text-muted-foreground">
                        Start: {new Date(entry.startedAt).toLocaleString()}
                      </p>
                      <p className="text-muted-foreground">
                        End:{" "}
                        {entry.endedAt
                          ? new Date(entry.endedAt).toLocaleString()
                          : "—"}
                      </p>
                      {entry.summary ? (
                        <p className="text-muted-foreground mt-1">{entry.summary}</p>
                      ) : null}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-destructive"
                      disabled={loading}
                      onClick={() => setDeleteEntry(entry)}
                    >
                      Delete
                    </Button>
                  </div>

                  {(entry.segments?.length ?? 0) > 0 ? (
                    <ul className="space-y-1 border-t border-border/40 pt-2">
                      <p className="text-[11px] font-medium text-muted-foreground">
                        Segments
                      </p>
                      {entry.segments!.map((segment) => (
                        <li
                          key={segment.id}
                          className="flex items-center justify-between gap-2 rounded border border-border/30 px-2 py-1"
                        >
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(segment.startedAt).toLocaleTimeString()} –{" "}
                            {segment.endedAt
                              ? new Date(segment.endedAt).toLocaleTimeString()
                              : "open"}{" "}
                            ({formatMinutes(segmentElapsedMinutes(segment, now))})
                          </span>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-[11px]"
                              disabled={loading}
                              onClick={() => setEditSegment(segment)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-[11px] text-destructive"
                              disabled={loading || (!segment.endedAt && isRunning)}
                              onClick={() => void handleDeleteSegment(segment.id)}
                            >
                              Del
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : null}
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

      <BillingConfigDialog
        open={billingOpen}
        onOpenChange={setBillingOpen}
        caseId={caseId}
        onSaved={() => void refresh()}
      />
      <DailySummaryDialog
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
        onConfirm={confirmStop}
      />
      <SegmentEditDialog
        open={!!editSegment}
        onOpenChange={(open) => {
          if (!open) setEditSegment(null);
        }}
        segment={editSegment}
        onSaved={() => void refresh()}
      />
      <DeleteTimeEntryDialog
        open={!!deleteEntry}
        onOpenChange={(open) => {
          if (!open) setDeleteEntry(null);
        }}
        entryLabel={
          deleteEntry
            ? new Date(deleteEntry.startedAt).toLocaleString()
            : ""
        }
        loading={loading}
        onConfirm={handleDeleteEntry}
      />
    </>
  );
}
