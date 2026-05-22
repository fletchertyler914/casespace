"use client";

import { Copy, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface DuplicateIngestionNotificationProps {
  groupCount: number;
  fileCount: number;
  onReview: () => void;
  onDismiss: () => void;
}

export function DuplicateIngestionNotification({
  groupCount,
  fileCount,
  onReview,
  onDismiss,
}: DuplicateIngestionNotificationProps) {
  if (groupCount === 0) return null;

  return (
    <Alert className="mx-4 mt-2 shrink-0 border-amber-500/30 bg-amber-500/5">
      <Copy className="h-4 w-4 text-amber-600" />
      <AlertTitle>Duplicate files detected</AlertTitle>
      <AlertDescription className="flex flex-wrap items-center gap-2">
        <span className="text-xs">
          Sync found {groupCount} duplicate group{groupCount === 1 ? "" : "s"} ({fileCount} file
          {fileCount === 1 ? "" : "s"}).
        </span>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onReview}>
          Review duplicates
        </Button>
        <Button size="sm" variant="ghost" className="h-7" onClick={onDismiss}>
          <X className="h-3 w-3" />
          Dismiss
        </Button>
      </AlertDescription>
    </Alert>
  );
}
