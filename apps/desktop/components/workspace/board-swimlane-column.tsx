"use client";

import { memo, type ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { FileText, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { BoardStatus } from "@/lib/board-status";
import { cn } from "@/lib/utils";

interface BoardSwimlaneColumnProps {
  status: BoardStatus;
  label: string;
  headerClass: string;
  count: number;
  isOver: boolean;
  itemIds: string[];
  filterQuery: string;
  filterVisible: boolean;
  onFilterToggle: () => void;
  onFilterChange: (query: string) => void;
  onFilterClear: () => void;
  children: ReactNode;
}

export const BoardSwimlaneColumn = memo(function BoardSwimlaneColumn({
  status,
  label,
  headerClass,
  count,
  isOver,
  itemIds,
  filterQuery,
  filterVisible,
  onFilterToggle,
  onFilterChange,
  onFilterClear,
  children,
}: BoardSwimlaneColumnProps) {
  const { setNodeRef, isOver: isDroppableOver } = useDroppable({
    id: `column-${status}`,
  });

  const highlighted = isOver || isDroppableOver;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full min-h-[240px] w-[340px] min-w-[340px] shrink-0 flex-col rounded-lg border bg-card shadow-sm transition-all duration-200",
        "border-border/30",
        highlighted
          ? "scale-[1.01] border-2 border-primary bg-primary/5 shadow-lg"
          : "hover:border-border/50",
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-between rounded-t-lg border-b px-3 py-2.5 transition-colors",
          highlighted
            ? "border-primary bg-primary/10"
            : "border-border/30 bg-card",
        )}
      >
        <h3 className={cn("truncate text-sm font-semibold", headerClass)}>
          {label}
        </h3>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-0 hover:bg-muted"
            onClick={onFilterToggle}
            title="Filter files"
          >
            <Search className="h-3.5 w-3.5" />
          </Button>
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 border-current/40 bg-transparent px-1.5 py-0 text-[10px] font-medium",
              headerClass,
              count === 0 && "opacity-50",
            )}
          >
            {count}
          </Badge>
        </div>
      </div>

      {filterVisible && (
        <div className="flex shrink-0 items-center gap-2 border-b border-border/30 bg-muted/20 px-3 py-2">
          <div className="relative flex flex-1 items-center">
            <Input
              type="text"
              placeholder="Filter files..."
              value={filterQuery}
              onChange={(event) => onFilterChange(event.target.value)}
              className="h-8 pr-8 text-sm"
              autoFocus
            />
            {filterQuery ? (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 h-6 w-6 p-0 hover:bg-muted"
                onClick={onFilterClear}
                title="Clear filter"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            ) : null}
          </div>
        </div>
      )}

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-2 p-2">
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            {children}
          </SortableContext>
        </div>
      </ScrollArea>
    </div>
  );
});

export function BoardSwimlaneEmpty({ isOver }: { isOver: boolean }) {
  return (
    <div
      className={cn(
        "mx-2 rounded-md border-2 border-dashed py-12 text-center transition-all duration-200",
        isOver
          ? "scale-[1.02] border-primary bg-primary/10"
          : "border-border/30 bg-muted/20",
      )}
    >
      <div className="flex flex-col items-center gap-2">
        <FileText className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-xs font-medium text-muted-foreground/60">
          {isOver ? "Drop here" : "No files"}
        </p>
      </div>
    </div>
  );
}
