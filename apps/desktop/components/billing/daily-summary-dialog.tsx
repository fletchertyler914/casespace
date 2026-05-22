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

interface DailySummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (summary?: string) => Promise<void>;
}

export function DailySummaryDialog({
  open,
  onOpenChange,
  onConfirm,
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
      const text = summary.trim();
      await onConfirm(text || undefined);
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
            Optionally describe what you worked on before stopping the timer.
          </DialogDescription>
        </DialogHeader>
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
