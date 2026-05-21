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
import { cn } from "@/lib/utils";

interface DeleteCaseConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseName: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

export function DeleteCaseConfirmationDialog({
  open,
  onOpenChange,
  caseName,
  onConfirm,
  loading = false,
}: DeleteCaseConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={loading ? undefined : onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <AlertDialogTitle>Delete Case</AlertDialogTitle>
              <AlertDialogDescription className="mt-1">
                This action cannot be undone.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <div className="py-4 text-sm text-foreground">
          Are you sure you want to delete{" "}
          <span className="font-semibold">{caseName}</span>? All notes,
          findings, timeline events, time entries, and ingested file metadata
          will be removed. The underlying source files on disk are not
          affected.
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
            {loading ? "Deleting..." : "Delete Case"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
