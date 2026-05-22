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
  /** Omit for create mode */
  segment?: TimeSegment | null;
  entryId: string;
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

function validateSegmentInput(
  startedAt: string,
  endedAt: string,
  rateOverride: string,
  discountPercent: string,
): string | null {
  if (!startedAt) return "Start time is required";
  if (endedAt) {
    const startMs = new Date(fromLocalInputValue(startedAt)).getTime();
    const endMs = new Date(fromLocalInputValue(endedAt)).getTime();
    if (endMs <= startMs) return "End time must be after start time";
  }
  if (rateOverride) {
    const rate = Number.parseFloat(rateOverride);
    if (Number.isNaN(rate) || rate < 0) return "Rate must be zero or greater";
  }
  const discount = Number.parseInt(discountPercent, 10);
  if (Number.isNaN(discount) || discount < 0 || discount > 100) {
    return "Discount must be between 0 and 100";
  }
  return null;
}

export function SegmentEditDialog({
  open,
  onOpenChange,
  segment,
  entryId,
  onSaved,
}: SegmentEditDialogProps) {
  const isCreate = !segment;
  const [startedAt, setStartedAt] = useState("");
  const [endedAt, setEndedAt] = useState("");
  const [rateOverride, setRateOverride] = useState("");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (segment) {
      setStartedAt(toLocalInputValue(segment.startedAt));
      setEndedAt(segment.endedAt ? toLocalInputValue(segment.endedAt) : "");
      setRateOverride(
        segment.rateOverride != null ? String(segment.rateOverride) : "",
      );
      setDiscountPercent(String(segment.discountPercent ?? 0));
      setNotes(segment.notes ?? "");
    } else {
      const now = new Date();
      setStartedAt(toLocalInputValue(now.toISOString()));
      setEndedAt("");
      setRateOverride("");
      setDiscountPercent("0");
      setNotes("");
    }
    setError(null);
    setLoading(false);
  }, [open, segment]);

  async function handleSave() {
    const validation = validateSegmentInput(
      startedAt,
      endedAt,
      rateOverride,
      discountPercent,
    );
    if (validation) {
      setError(validation);
      return;
    }
    setLoading(true);
    setError(null);
    const payload = {
      startedAt: fromLocalInputValue(startedAt),
      endedAt: endedAt ? fromLocalInputValue(endedAt) : undefined,
      rateOverride: rateOverride ? Number.parseFloat(rateOverride) : undefined,
      discountPercent: Number.parseInt(discountPercent, 10) || 0,
      notes: notes.trim() || undefined,
    };
    const res = isCreate
      ? await commandClient.createTimeSegment(entryId, payload)
      : await commandClient.updateTimeSegment(segment!.id, payload);
    setLoading(false);
    if (!res.ok) {
      setError(res.error?.message ?? "Failed to save segment");
      return;
    }
    onSaved?.();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isCreate ? "Add time segment" : "Edit time segment"}
          </DialogTitle>
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
          <Button disabled={loading} onClick={() => void handleSave()}>
            {loading ? "Saving…" : isCreate ? "Add segment" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
