"use client";

import { useState } from "react";
import { AlertTriangle, RefreshCw, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface FileChangeWarningProps {
  changed: boolean;
  onRefresh: () => Promise<void>;
  onDismiss: () => void;
}

export function FileChangeWarning({
  changed,
  onRefresh,
  onDismiss,
}: FileChangeWarningProps) {
  const [refreshing, setRefreshing] = useState(false);

  if (!changed) return null;

  return (
    <Alert className="mx-3 mt-2 shrink-0">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>File changed on disk</AlertTitle>
      <AlertDescription className="flex flex-wrap items-center gap-2">
        <span className="text-xs">
          This file was modified outside CaseSpace. Refresh to update metadata.
        </span>
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1"
          disabled={refreshing}
          onClick={async () => {
            setRefreshing(true);
            try {
              await onRefresh();
              onDismiss();
            } finally {
              setRefreshing(false);
            }
          }}
        >
          <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7"
          onClick={onDismiss}
        >
          <X className="h-3 w-3" />
          Dismiss
        </Button>
      </AlertDescription>
    </Alert>
  );
}
