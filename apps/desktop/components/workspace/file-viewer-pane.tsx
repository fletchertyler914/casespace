"use client";

import { memo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  PanelLeft,
  RefreshCw,
  X,
} from "lucide-react";
import type { CaseFile } from "@repo/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileViewer } from "@/components/viewer/file-viewer";
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

interface FileViewerPaneProps {
  file: CaseFile;
  caseId: string;
  navigatorOpen: boolean;
  onExpandNavigator: () => void;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
  onStatusChange: (fileId: string, status: string) => void;
  onRefresh: () => void;
  sourceRoots: string[];
}

export const FileViewerPane = memo(function FileViewerPane({
  file,
  caseId,
  navigatorOpen,
  onExpandNavigator,
  onClose,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
  onStatusChange,
  onRefresh,
  sourceRoots,
}: FileViewerPaneProps) {
  const previewKind = getFilePreviewKind(file.fileName);
  const showOpenExternal = isUnsupportedPreview(previewKind);
  const fillsPane = previewKind === "pdf";

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border/40 px-3">
        {!navigatorOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Show navigator"
            onClick={onExpandNavigator}
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{file.fileName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {displayFilePath(file, sourceRoots)}
          </p>
        </div>
        <Select
          value={file.status}
          onValueChange={(v) => onStatusChange(file.id, v)}
        >
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {showOpenExternal && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 px-2 text-xs"
            onClick={() => void openCaseFile(caseId, file.filePath)}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={!hasPrevious}
          onClick={onPrevious}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={!hasNext}
          onClick={onNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      {fillsPane ? (
        <div className="min-h-0 flex-1 overflow-hidden">
          <FileViewer caseId={caseId} file={file} className="h-full" />
        </div>
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          <FileViewer caseId={caseId} file={file} />
        </ScrollArea>
      )}
    </div>
  );
});
