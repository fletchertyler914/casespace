"use client";

import { Copy } from "lucide-react";
import type { CaseFile } from "@repo/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DuplicateBadge } from "@/components/artifacts/duplicate-badge";
import { displayFilePath } from "@/lib/case-path-utils";
import {
  fileNameById,
  findGroupForFile,
  type DuplicateGroup,
} from "@/lib/duplicate-utils";
import { cn } from "@/lib/utils";

interface DuplicateFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: CaseFile;
  files: CaseFile[];
  duplicateGroups: DuplicateGroup[];
  sourceRoots: string[];
  onNavigate: (file: CaseFile) => void;
}

export function DuplicateFileDialog({
  open,
  onOpenChange,
  file,
  files,
  duplicateGroups,
  sourceRoots,
  onNavigate,
}: DuplicateFileDialogProps) {
  const group = findGroupForFile(duplicateGroups, file.id);
  const duplicates =
    group?.fileIds
      .map((id) => files.find((f) => f.id === id))
      .filter((f): f is CaseFile => f != null) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-4 w-4" />
            Duplicate files
          </DialogTitle>
          <DialogDescription>
            {group
              ? `${duplicates.length} files share the same content hash in this case.`
              : "No duplicate group found for this file."}
          </DialogDescription>
        </DialogHeader>
        {!group ? (
          <p className="text-sm text-muted-foreground">
            This file is not part of a duplicate group.
          </p>
        ) : (
          <ul className="max-h-72 space-y-2 overflow-y-auto">
            {duplicates.map((dup) => {
              const isCurrent = dup.id === file.id;
              const isPrimary = group.primaryFileId === dup.id;
              return (
                <li
                  key={dup.id}
                  className={cn(
                    "flex items-start gap-2 rounded-md border border-border/50 px-3 py-2",
                    isCurrent && "border-primary/40 bg-primary/5",
                  )}
                >
                  <DuplicateBadge isPrimary={isPrimary} className="mt-1.5" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{dup.fileName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {displayFilePath(dup, sourceRoots)}
                    </p>
                    {isPrimary && (
                      <span className="text-[11px] font-medium text-primary">Primary</span>
                    )}
                    {isCurrent && !isPrimary && (
                      <span className="text-[11px] text-muted-foreground">Current file</span>
                    )}
                  </div>
                  {!isCurrent && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 shrink-0 text-xs"
                      onClick={() => {
                        onNavigate(dup);
                        onOpenChange(false);
                      }}
                    >
                      Open
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {group && (
          <p className="text-xs text-muted-foreground">
            Primary: {fileNameById(files, group.primaryFileId ?? group.fileIds[0]!)}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
