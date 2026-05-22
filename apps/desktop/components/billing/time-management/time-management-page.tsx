"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, List, Clock, DollarSign, Loader2 } from "lucide-react";
import type { CaseBillingConfig, TimeEntry, TimeSegment } from "@repo/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useTimeEntries } from "@/hooks/use-time-entries";
import { commandClient } from "@/lib/command-client";
import { formatCurrency } from "@/lib/billing-calc";
import { formatDurationShort } from "@/lib/time-format";
import { BillingConfigDialog } from "@/components/billing/billing-config-dialog";
import { DeleteTimeEntryDialog } from "@/components/billing/delete-time-entry-dialog";
import { SegmentEditDialog } from "@/components/billing/segment-edit-dialog";
import { TimeManagementList } from "./time-management-list";
import { TimeManagementCalendar } from "./time-management-calendar";

interface TimeManagementPageProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
}

type ViewMode = "list" | "calendar";

function matchesSearch(entry: TimeEntry, query: string): boolean {
  const q = query.toLowerCase();
  if (entry.summary?.toLowerCase().includes(q)) return true;
  if (entry.entryDate.toLowerCase().includes(q)) return true;
  for (const seg of entry.segments ?? []) {
    if (seg.notes?.toLowerCase().includes(q)) return true;
  }
  return false;
}

export function TimeManagementPage({
  open,
  onOpenChange,
  caseId,
}: TimeManagementPageProps) {
  const {
    entries,
    loading,
    hasMore,
    refresh,
    loadMore,
    updateEntrySummary,
    deleteEntry,
    deleteSegment,
  } = useTimeEntries(caseId);

  const [view, setView] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [billingConfig, setBillingConfig] = useState<CaseBillingConfig | null>(
    null,
  );
  const [summaryStats, setSummaryStats] = useState({
    totalSeconds: 0,
    totalDays: 0,
  });
  const [caseTotal, setCaseTotal] = useState(0);
  const [billingOpen, setBillingOpen] = useState(false);
  const [segmentEdit, setSegmentEdit] = useState<{
    entry: TimeEntry;
    segment: TimeSegment | null;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TimeEntry | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const loadMeta = useCallback(async () => {
    const [cfgRes, sumRes, totRes] = await Promise.all([
      commandClient.getCaseBillingConfig(caseId),
      commandClient.getTimeEntriesSummary(caseId),
      commandClient.calculateCaseTotal(caseId),
    ]);
    if (cfgRes.ok && cfgRes.data) setBillingConfig(cfgRes.data);
    if (sumRes.ok && sumRes.data) {
      setSummaryStats({
        totalSeconds: sumRes.data.totalSeconds,
        totalDays: sumRes.data.totalDays,
      });
    }
    if (totRes.ok && totRes.data) setCaseTotal(totRes.data.totalAmount);
  }, [caseId]);

  useEffect(() => {
    if (!open) return;
    void refresh();
    void loadMeta();
  }, [open, refresh, loadMeta]);

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return entries;
    return entries.filter((e) => matchesSearch(e, q));
  }, [entries, search]);

  const handleSaved = useCallback(() => {
    void refresh();
    void loadMeta();
  }, [refresh, loadMeta]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[min(85vh,720px)] max-w-[min(96vw,1100px)] flex-col gap-0 p-0">
          <DialogHeader className="shrink-0 border-b border-border/40 px-4 py-3">
            <DialogTitle>Time management</DialogTitle>
          </DialogHeader>

          <div className="grid shrink-0 grid-cols-3 gap-3 border-b border-border/40 px-4 py-3">
            <div className="rounded-md border border-border/40 bg-muted/20 px-3 py-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Total time
              </div>
              <p className="font-mono text-lg tabular-nums">
                {formatDurationShort(summaryStats.totalSeconds)}
              </p>
            </div>
            <div className="rounded-md border border-border/40 bg-muted/20 px-3 py-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Days tracked
              </div>
              <p className="text-lg font-semibold">{summaryStats.totalDays}</p>
            </div>
            <div className="rounded-md border border-border/40 bg-muted/20 px-3 py-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5" />
                Total billing
              </div>
              <p className="text-lg font-semibold">
                {formatCurrency(caseTotal)}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 border-b border-border/40 px-4 py-2">
            <Input
              placeholder="Search summaries, dates, notes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 max-w-sm text-sm"
            />
            <div className="ml-auto flex rounded-md border border-border/40 p-0.5">
              <Button
                variant={view === "list" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => setView("list")}
              >
                <List className="h-3.5 w-3.5" />
                List
              </Button>
              <Button
                variant={view === "calendar" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => setView("calendar")}
              >
                <Calendar className="h-3.5 w-3.5" />
                Calendar
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setBillingOpen(true)}
            >
              Billing config
            </Button>
          </div>

          <div className="relative min-h-0 flex-1 overflow-auto px-4 py-2">
            {loading && !entries.length ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : view === "list" ? (
              <TimeManagementList
                entries={filtered}
                billingConfig={billingConfig}
                onEditSegment={(entry, segment) =>
                  setSegmentEdit({ entry, segment })
                }
                onAddSegment={(entry) =>
                  setSegmentEdit({ entry, segment: null })
                }
                onDeleteSegment={(entry, segment) => {
                  void deleteSegment(entry.id, segment.id).then(() =>
                    handleSaved(),
                  );
                }}
                onDeleteEntry={(entry) => setDeleteTarget(entry)}
                onUpdateSummary={async (id, summary) => {
                  await updateEntrySummary(id, summary);
                  void loadMeta();
                }}
              />
            ) : (
              <TimeManagementCalendar
                entries={filtered}
                billingConfig={billingConfig}
                onEditSegment={(entry, segment) =>
                  setSegmentEdit({ entry, segment })
                }
                onAddSegment={(entry) =>
                  setSegmentEdit({ entry, segment: null })
                }
                onDeleteSegment={(entry, segment) => {
                  void deleteSegment(entry.id, segment.id).then(() =>
                    handleSaved(),
                  );
                }}
              />
            )}
            {hasMore && view === "list" ? (
              <div className="flex justify-center py-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  onClick={() => void loadMore()}
                >
                  {loading ? "Loading…" : "Load more"}
                </Button>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <BillingConfigDialog
        open={billingOpen}
        onOpenChange={setBillingOpen}
        caseId={caseId}
        onSaved={() => void loadMeta()}
      />

      {segmentEdit ? (
        <SegmentEditDialog
          open
          onOpenChange={(o) => {
            if (!o) setSegmentEdit(null);
          }}
          entryId={segmentEdit.entry.id}
          segment={segmentEdit.segment}
          onSaved={handleSaved}
        />
      ) : null}

      <DeleteTimeEntryDialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
        entryDate={deleteTarget?.entryDate ?? ""}
        totalSeconds={deleteTarget?.totalSeconds ?? 0}
        segmentCount={deleteTarget?.segments?.length ?? 0}
        loading={deleteLoading}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setDeleteLoading(true);
          await deleteEntry(deleteTarget.id);
          setDeleteLoading(false);
          setDeleteTarget(null);
          void loadMeta();
        }}
      />

    </>
  );
}
