"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useReportWorkspace } from "./report-workspace-context";

interface SnapshotBrowserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SnapshotBrowserDialog({
  open,
  onOpenChange,
}: SnapshotBrowserDialogProps) {
  const { snapshots, loadSnapshots, createSnapshot, restoreSnapshot } =
    useReportWorkspace();
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (open) void loadSnapshots();
  }, [open, loadSnapshots]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Report history</DialogTitle>
          <DialogDescription>
            Save named snapshots before sending drafts to counsel.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Snapshot label (e.g. Draft v2 to counsel)"
            className="text-sm"
          />
          <Button
            type="button"
            disabled={!label.trim()}
            onClick={() => {
              void createSnapshot(label.trim()).then(() => setLabel(""));
            }}
          >
            Save
          </Button>
        </div>
        <ul className="max-h-64 space-y-2 overflow-y-auto py-2">
          {snapshots.length === 0 ? (
            <li className="text-sm text-muted-foreground">No snapshots yet.</li>
          ) : (
            snapshots.map((snap) => (
              <li
                key={snap.id}
                className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{snap.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(snap.createdAt).toLocaleString()}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void restoreSnapshot(snap.id);
                    onOpenChange(false);
                  }}
                >
                  Restore
                </Button>
              </li>
            ))
          )}
        </ul>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
