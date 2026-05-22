"use client";

import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { formatDurationShort, formatEntryDate } from "@/lib/time-format";
import { cn } from "@/lib/utils";

interface DeleteTimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entryDate: string;
  totalSeconds: number;
  segmentCount: number;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

export function DeleteTimeEntryDialog({
  open,
  onOpenChange,
  entryDate,
  totalSeconds,
  segmentCount,
  onConfirm,
  loading = false,
}: DeleteTimeEntryDialogProps) {
  const dateLabel = formatEntryDate(entryDate);
  const timeLabel = formatDurationShort(totalSeconds);

  return (
    <AlertDialog open={open} onOpenChange={loading ? undefined : onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <AlertDialogTitle>Delete time entry</AlertDialogTitle>
              <AlertDialogDescription className="mt-1">
                This removes the day entry and all {segmentCount} segment
                {segmentCount === 1 ? "" : "s"}.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <div className="space-y-1 py-2 text-sm text-foreground">
          <p>
            <span className="text-muted-foreground">Date:</span>{" "}
            <span className="font-semibold">{dateLabel}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Total time:</span>{" "}
            <span className="font-mono tabular-nums font-semibold">
              {timeLabel}
            </span>
          </p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={cn(buttonVariants({ variant: "destructive" }))}
            onClick={() => {
              void onConfirm();
            }}
            disabled={loading}
          >
            {loading ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
