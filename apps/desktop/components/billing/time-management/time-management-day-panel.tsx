"use client";

import { Plus, Pencil, Trash2, X } from "lucide-react";
import type { CaseBillingConfig, TimeEntry, TimeSegment } from "@repo/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { entryBillableAmount, formatCurrency, segmentBillableAmount } from "@/lib/billing-calc";
import {
  entryDisplaySeconds,
  formatDurationShort,
  formatEntryDate,
} from "@/lib/time-format";
interface TimeManagementDayPanelProps {
  entry: TimeEntry | null;
  entryDate: string;
  billingConfig: CaseBillingConfig | null;
  onClose: () => void;
  onEditSegment: (segment: TimeSegment) => void;
  onAddSegment: () => void;
  onDeleteSegment: (segment: TimeSegment) => void;
}

function segmentDurationLabel(seg: TimeSegment, nowMs: number): string {
  const start = new Date(seg.startedAt).getTime();
  const end = seg.endedAt ? new Date(seg.endedAt).getTime() : nowMs;
  const secs = Math.max(0, Math.floor((end - start) / 1000));
  return formatDurationShort(seg.durationSeconds > 0 ? seg.durationSeconds : secs);
}

export function TimeManagementDayPanel({
  entry,
  entryDate,
  billingConfig,
  onClose,
  onEditSegment,
  onAddSegment,
  onDeleteSegment,
}: TimeManagementDayPanelProps) {
  const nowMs = Date.now();
  const totalSeconds = entry ? entryDisplaySeconds(entry, nowMs) : 0;
  const billable =
    entry && billingConfig
      ? formatCurrency(entryBillableAmount(entry, billingConfig, nowMs))
      : "—";

  return (
    <div className="flex h-full min-h-0 w-72 shrink-0 flex-col border-l border-border/40 bg-card">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border/40 px-3">
        <span className="text-sm font-medium">{formatEntryDate(entryDate)}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title="Close day panel"
          aria-label="Close day panel"
          onClick={onClose}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="shrink-0 space-y-1 border-b border-border/40 px-3 py-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total</span>
          <span className="font-mono tabular-nums">{formatDurationShort(totalSeconds)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Billable</span>
          <span>{billable}</span>
        </div>
        {entry?.summary ? (
          <p className="pt-1 text-xs text-muted-foreground">{entry.summary}</p>
        ) : null}
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-2 p-3">
          {entry?.segments?.length ? (
            entry.segments.map((seg) => (
              <div
                key={seg.id}
                className="group rounded-md border border-border/40 p-2 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono tabular-nums">
                      {new Date(seg.startedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {" – "}
                      {seg.endedAt
                        ? new Date(seg.endedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "running"}
                    </p>
                    <p className="text-muted-foreground">
                      {segmentDurationLabel(seg, nowMs)}
                      {billingConfig && seg.endedAt
                        ? ` · ${formatCurrency(segmentBillableAmount(seg, billingConfig, nowMs))}`
                        : null}
                    </p>
                    {(seg.rateOverride != null || (seg.discountPercent ?? 0) > 0) && (
                      <p className="text-muted-foreground">
                        {seg.rateOverride != null
                          ? `Rate $${seg.rateOverride}`
                          : null}
                        {(seg.discountPercent ?? 0) > 0
                          ? ` · ${seg.discountPercent}% off`
                          : null}
                      </p>
                    )}
                    {seg.notes ? (
                      <p className="mt-1 text-foreground/80">{seg.notes}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      title="Edit segment"
                      aria-label="Edit segment"
                      onClick={() => onEditSegment(seg)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:text-destructive"
                      title="Delete segment"
                      aria-label="Delete segment"
                      onClick={() => onDeleteSegment(seg)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No segments for this day.</p>
          )}
        </div>
      </ScrollArea>
      {entry ? (
        <div className="shrink-0 border-t border-border/40 p-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1 text-xs"
            onClick={onAddSegment}
          >
            <Plus className="h-3.5 w-3.5" />
            Add segment
          </Button>
        </div>
      ) : null}
    </div>
  );
}
