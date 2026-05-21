"use client";

import { memo } from "react";
import {
  AlertTriangle,
  Calendar,
  FolderPlus,
  LayoutGrid,
  MoreVertical,
  PanelLeft,
  RefreshCw,
  SplitSquareHorizontal,
  StickyNote,
  X,
} from "lucide-react";
import type { CaseSummary } from "@repo/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CaseHeaderProps {
  caseSummary: CaseSummary;
  fileCount: number;
  sourceCount: number;
  viewMode: "split" | "board";
  onViewModeChange: (mode: "split" | "board") => void;
  notesVisible: boolean;
  findingsVisible: boolean;
  timelineVisible: boolean;
  onToggleNotes: () => void;
  onToggleFindings: () => void;
  onToggleTimeline: () => void;
  onSyncFiles: () => void;
  isSyncing: boolean;
  autoSyncEnabled: boolean;
  onToggleAutoSync: () => void;
  onAddSources: () => void;
  onClose: () => void;
}

export const CaseHeader = memo(function CaseHeader({
  caseSummary,
  fileCount,
  sourceCount,
  viewMode,
  onViewModeChange,
  notesVisible,
  findingsVisible,
  timelineVisible,
  onToggleNotes,
  onToggleFindings,
  onToggleTimeline,
  onSyncFiles,
  isSyncing,
  autoSyncEnabled,
  onToggleAutoSync,
  onAddSources,
  onClose,
}: CaseHeaderProps) {
  return (
    <header className="relative flex h-14 shrink-0 items-center border-b border-border/40 bg-card px-3 shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <h1 className="truncate text-lg font-semibold">{caseSummary.name}</h1>
        <Badge variant="outline" className="shrink-0 text-xs">
          {fileCount} files · {sourceCount} source{sourceCount === 1 ? "" : "s"}
        </Badge>
      </div>

      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
        <div className="flex items-center gap-0.5 rounded-md border border-border/40 p-0.5">
          <Button
            variant={viewMode === "split" ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            title="Split view"
            onClick={() => onViewModeChange("split")}
          >
            <SplitSquareHorizontal className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "board" ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            title="Board view"
            onClick={() => onViewModeChange("board")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>

        {viewMode === "split" && (
          <div className="flex items-center gap-0.5 rounded-md border border-border/40 p-0.5">
            <Button
              variant={notesVisible ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              title="Notes panel"
              onClick={onToggleNotes}
            >
              <StickyNote className="h-4 w-4" />
            </Button>
            <Button
              variant={findingsVisible ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              title="Findings panel"
              onClick={onToggleFindings}
            >
              <AlertTriangle className="h-4 w-4" />
            </Button>
            <Button
              variant={timelineVisible ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              title="Timeline panel"
              onClick={onToggleTimeline}
            >
              <Calendar className="h-4 w-4" />
            </Button>
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={onAddSources}>
              <FolderPlus className="mr-2 h-4 w-4" />
              Add folders or files…
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSyncFiles} disabled={isSyncing}>
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`}
              />
              {isSyncing ? "Syncing…" : "Sync all sources"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="cursor-pointer"
              onClick={onToggleAutoSync}
            >
              <Checkbox
                checked={autoSyncEnabled}
                className="mr-2 pointer-events-none"
              />
              Auto-sync (5 min)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <PanelLeft className="mr-2 h-4 w-4" />
              Search (U10)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
          title="Close case"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
});
