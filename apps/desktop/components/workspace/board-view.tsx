"use client";

import { memo } from "react";
import { LayoutGrid, PanelLeft } from "lucide-react";
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
import { cn } from "@/lib/utils";

const FILE_STATUSES = [
  "unreviewed",
  "in_review",
  "reviewed",
  "flagged",
  "excluded",
] as const;

interface BoardViewProps {
  files: CaseFile[];
  viewingFile: CaseFile | null;
  navigatorOpen: boolean;
  onExpandNavigator: () => void;
  onFileOpen: (file: CaseFile) => void;
  onStatusChange: (fileId: string, status: string) => void;
}

export const BoardView = memo(function BoardView({
  files,
  viewingFile,
  navigatorOpen,
  onExpandNavigator,
  onFileOpen,
  onStatusChange,
}: BoardViewProps) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border/40 px-3">
        {!navigatorOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onExpandNavigator}
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        )}
        <LayoutGrid className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">File board</span>
        <span className="text-xs text-muted-foreground">{files.length} files</span>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-border/40 bg-card text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Folder</th>
              <th className="px-4 py-2 font-medium w-36">Status</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr
                key={file.id}
                className={cn(
                  "cursor-pointer border-b border-border/20 hover:bg-muted/40",
                  viewingFile?.id === file.id && "bg-primary/5",
                )}
                onClick={() => onFileOpen(file)}
              >
                <td className="max-w-[280px] truncate px-4 py-2 font-medium">
                  {file.fileName}
                </td>
                <td className="max-w-[200px] truncate px-4 py-2 text-muted-foreground">
                  {file.folderPath || "—"}
                </td>
                <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={file.status}
                    onValueChange={(v) => onStatusChange(file.id, v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {files.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No files in this case. Sync sources from the header menu.
          </p>
        )}
      </ScrollArea>
    </div>
  );
});
