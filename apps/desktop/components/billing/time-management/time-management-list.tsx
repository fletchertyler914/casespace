"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import type { CaseBillingConfig, TimeEntry, TimeSegment } from "@repo/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { entryBillableAmount, formatCurrency, segmentBillableAmount } from "@/lib/billing-calc";
import {
  entryDisplaySeconds,
  formatDurationShort,
  formatEntryDate,
} from "@/lib/time-format";
import { cn } from "@/lib/utils";

interface TimeManagementListProps {
  entries: TimeEntry[];
  billingConfig: CaseBillingConfig | null;
  onEditSegment: (entry: TimeEntry, segment: TimeSegment) => void;
  onAddSegment: (entry: TimeEntry) => void;
  onDeleteSegment: (entry: TimeEntry, segment: TimeSegment) => void;
  onDeleteEntry: (entry: TimeEntry) => void;
  onUpdateSummary: (entryId: string, summary: string) => Promise<void>;
}

export function TimeManagementList({
  entries,
  billingConfig,
  onEditSegment,
  onAddSegment,
  onDeleteSegment,
  onDeleteEntry,
  onUpdateSummary,
}: TimeManagementListProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editingSummary, setEditingSummary] = useState<string | null>(null);
  const [summaryDraft, setSummaryDraft] = useState("");

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function startEditSummary(entry: TimeEntry) {
    setEditingSummary(entry.id);
    setSummaryDraft(entry.summary ?? "");
  }

  async function saveSummary(entryId: string) {
    await onUpdateSummary(entryId, summaryDraft.trim());
    setEditingSummary(null);
  }

  if (!entries.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No time entries yet. Start the timer to track time.
      </p>
    );
  }

  const nowMs = Date.now();

  return (
    <ul className="divide-y divide-border/40">
      {entries.map((entry) => {
        const isOpen = expanded.has(entry.id);
        const seconds = entryDisplaySeconds(entry, nowMs);
        const hasRunning = entry.segments?.some((s) => !s.endedAt);
        const billable =
          billingConfig != null
            ? formatCurrency(entryBillableAmount(entry, billingConfig, nowMs))
            : "—";
        const segCount = entry.segments?.length ?? 0;

        return (
          <li key={entry.id} className="py-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                aria-label={isOpen ? "Collapse day" : "Expand day"}
                onClick={() => toggleExpand(entry.id)}
              >
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
              <span
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  hasRunning ? "bg-info" : seconds > 0 ? "bg-success" : "bg-muted",
                )}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {formatEntryDate(entry.entryDate)}
                </p>
                {editingSummary === entry.id ? (
                  <div className="mt-1 space-y-1">
                    <Textarea
                      value={summaryDraft}
                      onChange={(e) => setSummaryDraft(e.target.value)}
                      rows={2}
                      className="text-xs"
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setEditingSummary(null);
                        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                          void saveSummary(entry.id);
                        }
                      }}
                    />
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => void saveSummary(entry.id)}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs"
                        onClick={() => setEditingSummary(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="mt-0.5 flex items-center gap-1 text-left text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => startEditSummary(entry)}
                  >
                    {entry.summary || "Add summary…"}
                    <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                  </button>
                )}
              </div>
              <div className="shrink-0 text-right text-xs">
                <p className="font-mono tabular-nums">
                  {formatDurationShort(seconds)}
                </p>
                <p className="text-muted-foreground">{billable}</p>
                <p className="text-muted-foreground">
                  {segCount} seg{segCount === 1 ? "" : "s"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 hover:text-destructive"
                title="Delete entry"
                aria-label="Delete entry"
                onClick={() => onDeleteEntry(entry)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {isOpen ? (
              <div className="ml-9 mt-2 space-y-1.5 border-l border-border/30 pl-3">
                {entry.segments?.map((seg) => (
                  <div
                    key={seg.id}
                    className="group flex items-start justify-between gap-2 rounded-md bg-muted/20 px-2 py-1.5 text-xs"
                  >
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
                      {billingConfig && seg.endedAt ? (
                        <p className="text-muted-foreground">
                          {formatCurrency(
                            segmentBillableAmount(seg, billingConfig, nowMs),
                          )}
                        </p>
                      ) : null}
                      {seg.notes ? (
                        <p className="text-foreground/80">{seg.notes}</p>
                      ) : null}
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        title="Edit segment"
                        aria-label="Edit segment"
                        onClick={() => onEditSegment(entry, seg)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:text-destructive"
                        title="Delete segment"
                        aria-label="Delete segment"
                        onClick={() => onDeleteSegment(entry, seg)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => onAddSegment(entry)}
                >
                  <Plus className="h-3 w-3" />
                  Add segment
                </Button>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
