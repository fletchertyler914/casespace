"use client";

import { memo, useMemo, useState } from "react";
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
  const [draggingFileId, setDraggingFileId] = useState<string | null>(null);
  const [dropStatus, setDropStatus] = useState<string | null>(null);

  const lanes = useMemo(() => {
    const grouped = new Map<string, CaseFile[]>();
    for (const status of FILE_STATUSES) {
      grouped.set(status, []);
    }
    for (const file of files) {
      const key = FILE_STATUSES.includes(file.status as (typeof FILE_STATUSES)[number])
        ? file.status
        : "unreviewed";
      grouped.get(key)?.push(file);
    }
    for (const [status, lane] of grouped) {
      lane.sort((a, b) => a.fileName.localeCompare(b.fileName));
      grouped.set(status, lane);
    }
    return grouped;
  }, [files]);

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
        <div className="grid min-h-full grid-cols-1 gap-3 p-3 md:grid-cols-2 xl:grid-cols-5">
          {FILE_STATUSES.map((status) => {
            const laneFiles = lanes.get(status) ?? [];
            return (
              <section
                key={status}
                className="flex min-h-[240px] flex-col rounded-md border border-border/40 bg-card/60"
                onDragOver={(event) => {
                  event.preventDefault();
                  setDropStatus(status);
                }}
                onDragLeave={() => setDropStatus((prev) => (prev === status ? null : prev))}
                onDrop={(event) => {
                  event.preventDefault();
                  const fileId = event.dataTransfer.getData("text/casespace-file-id");
                  setDropStatus(null);
                  if (!fileId) return;
                  const dragged = files.find((file) => file.id === fileId);
                  if (!dragged || dragged.status === status) return;
                  onStatusChange(fileId, status);
                }}
              >
                <header className="flex items-center justify-between border-b border-border/40 px-3 py-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {status.replace("_", " ")}
                  </span>
                  <span className="text-xs text-muted-foreground">{laneFiles.length}</span>
                </header>
                <div className="space-y-2 p-2">
                  {laneFiles.length === 0 ? (
                    <p className="p-2 text-xs text-muted-foreground">No files</p>
                  ) : (
                    laneFiles.map((file) => (
                      <article
                        key={file.id}
                        className={cn(
                          "cursor-pointer rounded-md border border-border/40 bg-background p-2 hover:bg-muted/40",
                          viewingFile?.id === file.id && "border-primary/40 bg-primary/5",
                          draggingFileId === file.id && "opacity-50",
                          dropStatus === status && draggingFileId !== null && "ring-1 ring-primary/40",
                        )}
                        onClick={() => onFileOpen(file)}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData("text/casespace-file-id", file.id);
                          event.dataTransfer.effectAllowed = "move";
                          setDraggingFileId(file.id);
                        }}
                        onDragEnd={() => {
                          setDraggingFileId(null);
                          setDropStatus(null);
                        }}
                      >
                        <p className="truncate text-xs font-medium">{file.fileName}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {file.folderPath || "—"}
                        </p>
                        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={file.status}
                            onValueChange={(v) => onStatusChange(file.id, v)}
                          >
                            <SelectTrigger className="h-7 text-[11px]">
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
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
        {files.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No files in this case. Sync sources from the header menu.
          </p>
        )}
      </ScrollArea>
    </div>
  );
});
