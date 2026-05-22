"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import type { CaseBillingConfig, TimeEntry, TimeSegment } from "@repo/types";
import { Button } from "@/components/ui/button";
import { WorkspaceSidePanel } from "@/components/workspace/workspace-side-panel";
import { useTimeEntries } from "@/hooks/use-time-entries";
import { commandClient } from "@/lib/command-client";
import { formatCurrency } from "@/lib/billing-calc";
import { formatDurationShort } from "@/lib/time-format";
import { SegmentEditDialog } from "@/components/billing/segment-edit-dialog";
import { DeleteTimeEntryDialog } from "@/components/billing/delete-time-entry-dialog";
import { TimeManagementList } from "@/components/billing/time-management/time-management-list";

interface TimePanelProps {
  caseId: string;
  onClose: () => void;
  onOpenManagement?: () => void;
}

export function TimePanel({
  caseId,
  onClose,
  onOpenManagement,
}: TimePanelProps) {
  const { entries, loading, refresh, updateEntrySummary, deleteEntry, deleteSegment } =
    useTimeEntries(caseId);
  const [billingConfig, setBillingConfig] = useState<CaseBillingConfig | null>(
    null,
  );
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [caseTotal, setCaseTotal] = useState(0);
  const [segmentEdit, setSegmentEdit] = useState<{
    entry: TimeEntry;
    segment: TimeSegment | null;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TimeEntry | null>(null);

  const loadMeta = useCallback(async () => {
    const [cfgRes, sumRes, totRes] = await Promise.all([
      commandClient.getCaseBillingConfig(caseId),
      commandClient.getTimeEntriesSummary(caseId),
      commandClient.calculateCaseTotal(caseId),
    ]);
    if (cfgRes.ok && cfgRes.data) setBillingConfig(cfgRes.data);
    if (sumRes.ok && sumRes.data) setTotalSeconds(sumRes.data.totalSeconds);
    if (totRes.ok && totRes.data) setCaseTotal(totRes.data.totalAmount);
  }, [caseId]);

  useEffect(() => {
    void refresh();
    void loadMeta();
  }, [refresh, loadMeta]);

  const handleSaved = () => {
    void refresh();
    void loadMeta();
  };

  return (
    <WorkspaceSidePanel title="Time" onClose={onClose}>
      <div className="space-y-3 p-3">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-mono tabular-nums">
            {formatDurationShort(totalSeconds)}
          </span>
          <span className="text-muted-foreground">
            {formatCurrency(caseTotal)}
          </span>
          {onOpenManagement ? (
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={onOpenManagement}
            >
              <ExternalLink className="h-3 w-3" />
              Manage
            </Button>
          ) : null}
        </div>
        {loading && !entries.length ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : (
          <TimeManagementList
            entries={entries.slice(0, 10)}
            billingConfig={billingConfig}
            onEditSegment={(entry, segment) =>
              setSegmentEdit({ entry, segment })
            }
            onAddSegment={(entry) => setSegmentEdit({ entry, segment: null })}
            onDeleteSegment={(entry, segment) => {
              void deleteSegment(entry.id, segment.id).then(handleSaved);
            }}
            onDeleteEntry={(entry) => setDeleteTarget(entry)}
            onUpdateSummary={async (id, summary) => {
              await updateEntrySummary(id, summary);
              void loadMeta();
            }}
          />
        )}
      </div>

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
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteEntry(deleteTarget.id);
          setDeleteTarget(null);
          handleSaved();
        }}
      />
    </WorkspaceSidePanel>
  );
}
