"use client";

import { memo } from "react";
import {
  AlertTriangle,
  Calendar,
  Clock3,
  DollarSign,
  Copy,
  FileText,
  FolderPlus,
  Layers,
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
import { CaseSwitcher } from "@/components/case/case-switcher";
import { TimerWidget } from "@/components/billing/timer-widget";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { WorkspaceViewMode } from "@/lib/workspace-view";

interface CaseHeaderProps {
  caseId: string;
  caseSummary: CaseSummary;
  fileCount: number;
  viewMode: WorkspaceViewMode;
  onViewModeChange: (mode: WorkspaceViewMode) => void;
  notesVisible: boolean;
  findingsVisible: boolean;
  timelineVisible: boolean;
  duplicatesVisible: boolean;
  timeVisible: boolean;
  onToggleNotes: () => void;
  onToggleFindings: () => void;
  onToggleTimeline: () => void;
  onToggleDuplicates: () => void;
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
  onOpenTimeManagement?: () => void;
  onOpenBillingConfig?: () => void;
  onClose: () => void;
}

const MODE_BUTTON_CLASS =
  "h-7 min-w-[2.25rem] gap-1 px-2 text-xs sm:min-w-[4.5rem]";

export const CaseHeader = memo(function CaseHeader({
  caseId,
  caseSummary,
  fileCount,
  viewMode,
  onViewModeChange,
  notesVisible,
  findingsVisible,
  timelineVisible,
  duplicatesVisible,
  timeVisible,
  onToggleNotes,
  onToggleFindings,
  onToggleTimeline,
  onToggleDuplicates,
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
  onOpenTimeManagement,
  onOpenBillingConfig,
  onClose,
}: CaseHeaderProps) {
  const panelCount = [
    notesVisible,
    findingsVisible,
    timelineVisible,
    duplicatesVisible,
    timeVisible,
  ].filter(Boolean).length;

  return (
    <header className="grid h-12 shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 border-b border-border/40 bg-card px-3">
      <div className="flex min-w-0 items-center gap-2 justify-self-start">
        <CaseSwitcher
          currentCaseId={caseId}
          currentCaseName={caseSummary.name}
          className="max-w-[min(200px,100%)]"
        />
        <span className="hidden shrink-0 text-xs text-muted-foreground lg:inline">
          {fileCount} files
        </span>
      </div>

      <nav
        className="flex items-center rounded-md border border-border/40 bg-background/50 p-0.5 shadow-sm"
        aria-label="Workspace mode"
      >
        <Button
          variant={viewMode === "split" ? "secondary" : "ghost"}
          size="sm"
          className={MODE_BUTTON_CLASS}
          title="Evidence review"
          onClick={() => onViewModeChange("split")}
        >
          <SplitSquareHorizontal className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Evidence</span>
        </Button>
        <Button
          variant={viewMode === "board" ? "secondary" : "ghost"}
          size="sm"
          className={MODE_BUTTON_CLASS}
          title="Workflow board"
          onClick={() => onViewModeChange("board")}
        >
          <LayoutGrid className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Board</span>
        </Button>
        <Button
          variant={viewMode === "reports" ? "secondary" : "ghost"}
          size="sm"
          className={MODE_BUTTON_CLASS}
          title="Examination report"
          onClick={() => onViewModeChange("reports")}
        >
          <FileText className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Report</span>
        </Button>
      </nav>

      <div className="flex items-center justify-end gap-1.5 justify-self-end">
        <div
          className={cn(
            "shrink-0",
            viewMode !== "split" && "pointer-events-none invisible",
          )}
          aria-hidden={viewMode !== "split"}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 min-w-[5.5rem] gap-1 px-2 text-xs"
                tabIndex={viewMode === "split" ? 0 : -1}
              >
                <Layers className="h-3.5 w-3.5 shrink-0" />
                Panels
                <span
                  className={cn(
                    "inline-flex min-w-[1rem] justify-center rounded bg-primary/15 px-1 text-[10px] font-medium text-primary",
                    panelCount === 0 && "invisible",
                  )}
                >
                  {panelCount || "0"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuCheckboxItem
                checked={notesVisible}
                onCheckedChange={(checked) => {
                  if (checked !== notesVisible) onToggleNotes();
                }}
              >
                <StickyNote className="mr-2 h-3.5 w-3.5" />
                Notes
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={findingsVisible}
                onCheckedChange={(checked) => {
                  if (checked !== findingsVisible) onToggleFindings();
                }}
              >
                <AlertTriangle className="mr-2 h-3.5 w-3.5" />
                Findings
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={timelineVisible}
                onCheckedChange={(checked) => {
                  if (checked !== timelineVisible) onToggleTimeline();
                }}
              >
                <Calendar className="mr-2 h-3.5 w-3.5" />
                Timeline
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={duplicatesVisible}
                onCheckedChange={(checked) => {
                  if (checked !== duplicatesVisible) onToggleDuplicates();
                }}
              >
                <Copy className="mr-2 h-3.5 w-3.5" />
                Duplicates
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={timeVisible}
                onCheckedChange={(checked) => {
                  if (checked !== timeVisible) onToggleTime();
                }}
              >
                <Clock3 className="mr-2 h-3.5 w-3.5" />
                Time
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div
          className={cn(
            "shrink-0",
            viewMode === "reports" && "pointer-events-none invisible",
          )}
          aria-hidden={viewMode === "reports"}
        >
          <TimerWidget caseId={caseId} />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              title="Case actions"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={onAddSources}>
              <FolderPlus className="mr-2 h-4 w-4" />
              Add sources…
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSyncFiles} disabled={isSyncing}>
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`}
              />
              {isSyncing ? "Syncing…" : "Sync sources"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              onClick={onToggleAutoSync}
            >
              Auto-sync {autoSyncEnabled ? "on" : "off"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCycleAutoSyncInterval}>
              Sync interval
              <span className="ml-auto text-xs text-muted-foreground">
                {autoSyncIntervalMinutes}m
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {onOpenTimeManagement ? (
              <DropdownMenuItem onClick={onOpenTimeManagement}>
                <Clock3 className="mr-2 h-4 w-4" />
                Time management
              </DropdownMenuItem>
            ) : null}
            {onOpenBillingConfig ? (
              <DropdownMenuItem onClick={onOpenBillingConfig}>
                <DollarSign className="mr-2 h-4 w-4" />
                Billing configuration
              </DropdownMenuItem>
            ) : null}
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
          className="h-7 w-7 shrink-0 hover:bg-destructive/10 hover:text-destructive"
          title="Close case"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
});
