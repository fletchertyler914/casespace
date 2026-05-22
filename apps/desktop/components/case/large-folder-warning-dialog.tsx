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

export const LARGE_FOLDER_THRESHOLD = 5000;

interface LargeFolderWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileCount: number;
  onConfirm: () => void;
  loading?: boolean;
}

export function LargeFolderWarningDialog({
  open,
  onOpenChange,
  fileCount,
  onConfirm,
  loading = false,
}: LargeFolderWarningDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={loading ? undefined : onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Large source detected
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                The selected source{fileCount === 1 ? "" : "s"} contain{" "}
                <strong className="text-foreground">
                  {fileCount.toLocaleString()} files
                </strong>
                , which exceeds the recommended limit of{" "}
                {LARGE_FOLDER_THRESHOLD.toLocaleString()}.
              </p>
              <p>
                Ingesting a large number of files may take significant time and
                use substantial disk space. Continue only if you intend to import
                all files.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={loading}>
            {loading ? "Processing…" : "Continue anyway"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
