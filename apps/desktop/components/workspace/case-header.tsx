"use client";

import { memo } from "react";
import {
  AlertTriangle,
  Calendar,
  Clock3,
  Copy,
  FileText,
  FolderPlus,
  LayoutGrid,
  MoreVertical,
  PanelLeft,
  RefreshCw,
  SplitSquareHorizontal,
  StickyNote,
  TableProperties,
  X,
} from "lucide-react";
import type { CaseSummary } from "@repo/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { TimerWidget } from "@/components/billing/timer-widget";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CaseHeaderProps {
  caseId: string;
  caseSummary: CaseSummary;
  fileCount: number;
  sourceCount: number;
  viewMode: "split" | "board";
  onViewModeChange: (mode: "split" | "board") => void;
  notesVisible: boolean;
  findingsVisible: boolean;
  timelineVisible: boolean;
  duplicatesVisible: boolean;
  reportsVisible: boolean;
  timeVisible: boolean;
  onToggleNotes: () => void;
  onToggleFindings: () => void;
  onToggleTimeline: () => void;
  onToggleDuplicates: () => void;
  onToggleReports: () => void;
  onToggleTime: () => void;
  onSyncFiles: () => void;
  isSyncing: boolean;
  autoSyncEnabled: boolean;
  autoSyncIntervalMinutes: number;
  onToggleAutoSync: () => void;
  onCycleAutoSyncInterval: () => void;
  onAddSources: () => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onOpenAppSettings: () => void;
  onOpenColumnsMapping: () => void;
  onClose: () => void;
}

export const CaseHeader = memo(function CaseHeader({
  caseId,
  caseSummary,
  fileCount,
  sourceCount,
  viewMode,
  onViewModeChange,
  notesVisible,
  findingsVisible,
  timelineVisible,
  duplicatesVisible,
  reportsVisible,
  timeVisible,
  onToggleNotes,
  onToggleFindings,
  onToggleTimeline,
  onToggleDuplicates,
  onToggleReports,
  onToggleTime,
  onSyncFiles,
  isSyncing,
  autoSyncEnabled,
  autoSyncIntervalMinutes,
  onToggleAutoSync,
  onCycleAutoSyncInterval,
  onAddSources,
  onOpenSearch,
  onOpenSettings,
  onOpenAppSettings,
  onOpenColumnsMapping,
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
        <TimerWidget caseId={caseId} />
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
            <Button
              variant={duplicatesVisible ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              title="Duplicates panel"
              onClick={onToggleDuplicates}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant={reportsVisible ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              title="Reports panel"
              onClick={onToggleReports}
            >
              <FileText className="h-4 w-4" />
            </Button>
            <Button
              variant={timeVisible ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              title="Time panel"
              onClick={onToggleTime}
            >
              <Clock3 className="h-4 w-4" />
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
              Auto-sync
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCycleAutoSyncInterval}>
              Auto-sync interval
              <span className="ml-auto text-xs text-muted-foreground">
                {autoSyncIntervalMinutes}m
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onOpenColumnsMapping}>
              <TableProperties className="mr-2 h-4 w-4" />
              Columns &amp; mapping
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenSettings}>
              Workspace settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenAppSettings}>
              App settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onOpenSearch}>
              <PanelLeft className="mr-2 h-4 w-4" />
              Search
              <span className="ml-auto text-xs text-muted-foreground">⌘K</span>
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
