"use client";

import { useEffect, useState } from "react";
import type { TimeSegment } from "@repo/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { commandClient } from "@/lib/command-client";

interface SegmentEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segment: TimeSegment | null;
  onSaved?: () => void;
}

function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInputValue(value: string): string {
  return new Date(value).toISOString();
}

export function SegmentEditDialog({
  open,
  onOpenChange,
  segment,
  onSaved,
}: SegmentEditDialogProps) {
  const [startedAt, setStartedAt] = useState("");
  const [endedAt, setEndedAt] = useState("");
  const [rateOverride, setRateOverride] = useState("");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !segment) return;
    setStartedAt(toLocalInputValue(segment.startedAt));
    setEndedAt(segment.endedAt ? toLocalInputValue(segment.endedAt) : "");
    setRateOverride(
      segment.rateOverride != null ? String(segment.rateOverride) : "",
    );
    setDiscountPercent(String(segment.discountPercent ?? 0));
    setNotes(segment.notes ?? "");
    setError(null);
    setLoading(false);
  }, [open, segment]);

  async function handleSave() {
    if (!segment) return;
    setLoading(true);
    setError(null);
    const res = await commandClient.updateTimeSegment(segment.id, {
      startedAt: fromLocalInputValue(startedAt),
      endedAt: endedAt ? fromLocalInputValue(endedAt) : undefined,
      rateOverride: rateOverride ? Number.parseFloat(rateOverride) : undefined,
      discountPercent: Number.parseInt(discountPercent, 10) || 0,
      notes: notes.trim() || undefined,
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error?.message ?? "Failed to update segment");
      return;
    }
    onSaved?.();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit time segment</DialogTitle>
          <DialogDescription>
            Adjust start/end times, rate override, discount, or notes.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="seg-start">Started</Label>
            <Input
              id="seg-start"
              type="datetime-local"
              value={startedAt}
              onChange={(e) => setStartedAt(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seg-end">Ended</Label>
            <Input
              id="seg-end"
              type="datetime-local"
              value={endedAt}
              onChange={(e) => setEndedAt(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="seg-rate">Rate override ($)</Label>
              <Input
                id="seg-rate"
                type="number"
                min="0"
                step="0.01"
                value={rateOverride}
                onChange={(e) => setRateOverride(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seg-discount">Discount (%)</Label>
              <Input
                id="seg-discount"
                type="number"
                min="0"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="seg-notes">Notes</Label>
            <Textarea
              id="seg-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={loading || !segment} onClick={() => void handleSave()}>
            {loading ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
