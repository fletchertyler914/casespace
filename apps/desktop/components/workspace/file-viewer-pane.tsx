"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Hash,
  Maximize2,
  Minimize2,
  MoreVertical,
  PanelLeft,
  Pencil,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import type { CaseFile } from "@repo/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeleteFileDialog } from "@/components/ui/delete-file-dialog";
import { RenameFileDialog } from "@/components/ui/rename-file-dialog";
import { FileViewer } from "@/components/viewer/file-viewer";
import { FileChangeWarning } from "@/components/viewer/file-change-warning";
import { ViewerChromeDivider } from "@/components/viewer/viewer-chrome";
import { DuplicateFileDialog } from "@/components/viewer/duplicate-file-dialog";
import { DuplicateBadge } from "@/components/artifacts/duplicate-badge";
import { MetadataPanel } from "@/components/viewer/metadata-panel";
import { findGroupForFile, type DuplicateGroup } from "@/lib/duplicate-utils";
import { commandClient } from "@/lib/command-client";
import { displayFilePath } from "@/lib/case-path-utils";
import { getFilePreviewKind, isUnsupportedPreview } from "@/lib/file-preview";
import { openCaseFile } from "@/lib/open-file";

const FILE_STATUSES = [
  "unreviewed",
  "in_review",
  "reviewed",
  "flagged",
  "excluded",
] as const;

function formatFileStatus(status: string): string {
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

interface FileViewerPaneProps {
  file: CaseFile;
  caseId: string;
  files: CaseFile[];
  duplicateGroups: DuplicateGroup[];
  duplicateFileIds: Set<string>;
  navigatorOpen: boolean;
  onExpandNavigator: () => void;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
  onStatusChange: (fileId: string, status: string) => void;
  onRefresh: () => void;
  onFileRemoved?: () => void;
  onFileRenamed?: (file: CaseFile) => void;
  onNavigateToFile?: (file: CaseFile) => void;
  sourceRoots: string[];
}

export const FileViewerPane = memo(function FileViewerPane({
  file,
  caseId,
  files,
  duplicateGroups,
  duplicateFileIds,
  navigatorOpen,
  onExpandNavigator,
  onClose,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
  onStatusChange,
  onRefresh,
  onFileRemoved,
  onFileRenamed,
  onNavigateToFile,
  sourceRoots,
}: FileViewerPaneProps) {
  const previewKind = getFilePreviewKind(file.fileName);
  const showOpenExternal = isUnsupportedPreview(previewKind);
  const fillsPane = previewKind === "pdf";
  const pathLabel = displayFilePath(file, sourceRoots);
  const showPathSubtitle = pathLabel !== file.fileName;
  const isDuplicate = duplicateFileIds.has(file.id);
  const duplicateGroup = isDuplicate ? findGroupForFile(duplicateGroups, file.id) : undefined;

  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [metadataOpen, setMetadataOpen] = useState(false);
  const [fileChanged, setFileChanged] = useState(false);
  const [changeDismissed, setChangeDismissed] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = useCallback(async () => {
    const el = previewRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen();
      setFullscreen(true);
    } else {
      await document.exitFullscreen();
      setFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => {
      setFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const checkChange = useCallback(async () => {
    const res = await commandClient.checkFileChanged(caseId, file.id);
    if (res.ok && res.data) {
      setFileChanged(res.data.changed);
    }
  }, [caseId, file.id]);

  useEffect(() => {
    setChangeDismissed(false);
    void checkChange();
    const interval = setInterval(() => void checkChange(), 60_000);
    return () => clearInterval(interval);
  }, [checkChange, file.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const editable =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        target.closest('[role="dialog"]');
      if (editable) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft" && hasPrevious) {
        e.preventDefault();
        onPrevious();
      } else if (e.key === "ArrowRight" && hasNext) {
        e.preventDefault();
        onNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasNext, hasPrevious, onClose, onNext, onPrevious]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <header className="flex h-11 shrink-0 items-center gap-2 border-b border-border/40 px-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {!navigatorOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              title="Show navigator"
              onClick={onExpandNavigator}
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="min-w-0 flex-1 leading-tight">
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate text-sm font-medium">{file.fileName}</p>
              {isDuplicate && (
                <DuplicateBadge
                  isPrimary={duplicateGroup?.primaryFileId === file.id}
                />
              )}
            </div>
            {showPathSubtitle ? (
              <p className="truncate text-[11px] text-muted-foreground">
                {pathLabel}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center">
          <Select
            value={file.status}
            onValueChange={(v) => onStatusChange(file.id, v)}
          >
            <SelectTrigger className="h-8 w-[7.5rem] shrink-0 text-xs capitalize">
              <SelectValue>{formatFileStatus(file.status)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {FILE_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {formatFileStatus(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(isDuplicate || showOpenExternal) && <ViewerChromeDivider />}

          {isDuplicate && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 shrink-0 gap-1 px-2 text-xs"
              onClick={() => setDuplicateDialogOpen(true)}
            >
              <Copy className="h-3.5 w-3.5" />
              Duplicates
            </Button>
          )}
          {showOpenExternal && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 shrink-0 gap-1 px-2 text-xs"
              onClick={() => void openCaseFile(caseId, file.filePath)}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open
            </Button>
          )}

          <ViewerChromeDivider />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                title="File actions"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setMetadataOpen(true)}>
                <Hash className="mr-2 h-4 w-4" />
                Metadata
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove from case
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ViewerChromeDivider />

          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              title={fullscreen ? "Exit fullscreen" : "Fullscreen preview"}
              onClick={() => void toggleFullscreen()}
            >
              {fullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              title="Refresh file"
              onClick={onRefresh}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              title="Previous file"
              disabled={!hasPrevious}
              onClick={onPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              title="Next file"
              disabled={!hasNext}
              onClick={onNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              title="Close preview"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {!changeDismissed && fileChanged ? (
        <FileChangeWarning
          changed={fileChanged}
          onRefresh={async () => {
            await onRefresh();
            setFileChanged(false);
          }}
          onDismiss={() => setChangeDismissed(true)}
        />
      ) : null}

      <div
        ref={previewRef}
        className={
          fillsPane
            ? "min-h-0 flex-1 overflow-hidden bg-background"
            : "min-h-0 flex-1 overflow-hidden bg-background"
        }
      >
        {fillsPane ? (
          <FileViewer caseId={caseId} file={file} className="h-full" />
        ) : (
          <ScrollArea className="h-full">
            <FileViewer caseId={caseId} file={file} />
          </ScrollArea>
        )}
      </div>

      <DuplicateFileDialog
        open={duplicateDialogOpen}
        onOpenChange={setDuplicateDialogOpen}
        file={file}
        files={files}
        duplicateGroups={duplicateGroups}
        sourceRoots={sourceRoots}
        onNavigate={(target) => onNavigateToFile?.(target)}
      />

      <RenameFileDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        currentFileName={file.fileName}
        onConfirm={async (newName) => {
          const res = await commandClient.renameFile(caseId, file.id, newName);
          if (!res.ok) throw new Error(res.error?.message ?? "Rename failed");
          if (res.data) onFileRenamed?.(res.data);
          await onRefresh();
        }}
      />

      <DeleteFileDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        fileName={file.fileName}
        onConfirm={async () => {
          const res = await commandClient.removeFileFromCase(caseId, file.id);
          if (!res.ok) throw new Error(res.error?.message ?? "Remove failed");
          onFileRemoved?.();
          onClose();
        }}
      />

      <Popover open={metadataOpen} onOpenChange={setMetadataOpen}>
        <PopoverTrigger asChild>
          <span className="sr-only">Metadata anchor</span>
        </PopoverTrigger>
        <PopoverContent className="w-[28rem] p-0" align="end">
          <div className="border-b border-border/40 px-3 py-2">
            <p className="text-sm font-semibold">Metadata</p>
          </div>
          <MetadataPanel caseId={caseId} fileId={file.id} />
        </PopoverContent>
      </Popover>
    </div>
  );
});
