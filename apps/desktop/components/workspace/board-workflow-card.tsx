"use client";

import { memo } from "react";
import { Folder } from "lucide-react";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import type { CaseFile } from "@repo/types";
import { Badge } from "@/components/ui/badge";
import { DuplicateBadge } from "@/components/artifacts/duplicate-badge";
import { getFileIcon } from "@/lib/file-icon-utils";
import { cn } from "@/lib/utils";

function fileExtensionLabel(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  if (dot <= 0) return "FILE";
  return fileName.slice(dot + 1).toUpperCase();
}

function relativeFolderPath(
  file: CaseFile,
  selectedFolderPath: string | null,
): string | null {
  const folder = (file.folderPath ?? "").trim();
  if (!selectedFolderPath) {
    return folder && folder !== "-" ? folder : null;
  }
  const base = selectedFolderPath.trim();
  if (folder === base) return null;
  if (folder.startsWith(`${base}/`)) {
    return folder.slice(base.length + 1);
  }
  return folder || null;
}

export interface BoardWorkflowCardProps {
  file: CaseFile;
  isSelected?: boolean;
  isDragging?: boolean;
  isDuplicate?: boolean;
  isPrimaryDuplicate?: boolean;
  selectedFolderPath?: string | null;
  onSelect?: (event: React.MouseEvent) => void;
  onFileOpen?: (file: CaseFile) => void;
  dragListeners?: SyntheticListenerMap;
  dragAttributes?: DraggableAttributes;
}

export const BoardWorkflowCard = memo(function BoardWorkflowCard({
  file,
  isSelected = false,
  isDragging = false,
  isDuplicate = false,
  isPrimaryDuplicate = false,
  selectedFolderPath = null,
  onSelect,
  onFileOpen,
  dragListeners,
  dragAttributes,
}: BoardWorkflowCardProps) {
  const Icon = getFileIcon(file.fileName);
  const relativePath = relativeFolderPath(file, selectedFolderPath);

  const handleClick = (event: React.MouseEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    const modifierKey = isMac ? event.metaKey : event.ctrlKey;
    const shiftKey = event.shiftKey;

    if ((modifierKey || shiftKey) && onSelect) {
      event.preventDefault();
      event.stopPropagation();
      onSelect(event);
      return;
    }

    if (!modifierKey && !shiftKey && onFileOpen) {
      onFileOpen(file);
    }
  };

  return (
    <div
      data-workflow-card
      {...dragListeners}
      {...dragAttributes}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleClick(event as unknown as React.MouseEvent);
        }
      }}
      className={cn(
        "group relative flex w-full max-w-full cursor-grab flex-col gap-2 overflow-hidden rounded-lg border bg-card p-2.5 shadow-sm transition-all duration-200 select-none active:cursor-grabbing",
        "border-border/30 hover:border-primary/60 hover:shadow-md",
        isSelected &&
          "border-primary/40 bg-primary/5 ring-1 ring-primary/60",
        isDragging && "scale-95 opacity-50",
      )}
    >
      <div className="flex w-full min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
          <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <h4
            className="truncate text-xs leading-tight font-medium text-foreground"
            title={file.fileName}
          >
            {file.fileName}
          </h4>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {isDuplicate && (
            <DuplicateBadge
              isPrimary={isPrimaryDuplicate}
              className="h-1.5 w-1.5"
            />
          )}
          <Badge
            variant="outline"
            className="pointer-events-none h-4 px-1.5 py-0 text-[9px] font-medium"
          >
            {fileExtensionLabel(file.fileName)}
          </Badge>
        </div>
      </div>

      {relativePath && (
        <div className="flex min-w-0 items-center gap-1.5 pl-[22px] text-[10px] text-muted-foreground">
          <Folder className="h-3 w-3 shrink-0" />
          <span className="min-w-0 truncate" title={relativePath}>
            {relativePath}
          </span>
        </div>
      )}
    </div>
  );
});
