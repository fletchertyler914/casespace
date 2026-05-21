"use client";

import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CaseListViewModeProps {
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
}

export function CaseListViewMode({
  viewMode,
  onViewModeChange,
}: CaseListViewModeProps) {
  return (
    <div className="flex items-center rounded-md border border-border/30 p-0.5 dark:border-border/40">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon-sm"
            aria-label="Grid view"
            onClick={() => onViewModeChange("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Grid view</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon-sm"
            aria-label="List view"
            onClick={() => onViewModeChange("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>List view</TooltipContent>
      </Tooltip>
    </div>
  );
}
