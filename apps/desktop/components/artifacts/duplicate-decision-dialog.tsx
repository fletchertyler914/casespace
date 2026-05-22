"use client";

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

export type DuplicateDecisionAction = "merge" | "remove";

interface DuplicateDecisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: DuplicateDecisionAction;
  primaryFileName: string;
  targetFileName: string;
  onConfirm: () => void | Promise<void>;
}

export function DuplicateDecisionDialog({
  open,
  onOpenChange,
  action,
  primaryFileName,
  targetFileName,
  onConfirm,
}: DuplicateDecisionDialogProps) {
  const isMerge = action === "merge";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isMerge ? "Merge duplicate metadata?" : "Remove duplicate from case?"}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">
              {isMerge ? (
                <>
                  <p>
                    Metadata from <span className="font-medium">{targetFileName}</span> will be
                    merged into the primary file{" "}
                    <span className="font-medium">{primaryFileName}</span>.
                  </p>
                  <p>
                    The duplicate file will be removed from the case inventory. Files on disk are
                    not deleted.
                  </p>
                </>
              ) : (
                <p>
                  <span className="font-medium">{targetFileName}</span> will be removed from this
                  case inventory. The file on disk is not deleted.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={
              isMerge
                ? undefined
                : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            }
            onClick={() => void onConfirm()}
          >
            {isMerge ? "Merge" : "Remove"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
