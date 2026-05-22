"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDurationShort } from "@/lib/time-format";

interface DailySummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalSeconds: number;
  billablePreview?: string;
  onSave: (summary: string) => void | Promise<void>;
}

export function DailySummaryDialog({
  open,
  onOpenChange,
  totalSeconds,
  billablePreview,
  onSave,
}: DailySummaryDialogProps) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSummary("");
      setError(null);
      setLoading(false);
    }
  }, [open]);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      await onSave(summary.trim());
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to stop timer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Daily summary</DialogTitle>
          <DialogDescription>
            Review today&apos;s time before stopping the timer.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-md border border-border/40 bg-muted/30 px-3 py-2 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Total time</span>
            <span className="font-mono tabular-nums font-medium">
              {formatDurationShort(totalSeconds)}
            </span>
          </div>
          {billablePreview ? (
            <div className="mt-1 flex justify-between gap-4">
              <span className="text-muted-foreground">Billable (est.)</span>
              <span className="font-medium">{billablePreview}</span>
            </div>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="daily-summary">Summary (optional)</Label>
          <Textarea
            id="daily-summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
            placeholder="Brief notes on today's work…"
          />
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={loading} onClick={() => void handleConfirm()}>
            {loading ? "Stopping…" : "Stop timer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
