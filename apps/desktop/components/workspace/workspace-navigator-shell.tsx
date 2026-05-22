"use client";

import type { ReactNode } from "react";
import { PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface WorkspaceNavigatorShellProps {
  onToggleNavigator: () => void;
  header: ReactNode;
  children: ReactNode;
  /** Optional pinned row above list (e.g. “All files (45)”). */
  listHeader?: ReactNode;
}

/** Shared left-rail chrome for file tree and report section lists. */
export function WorkspaceNavigatorShell({
  onToggleNavigator,
  header,
  children,
  listHeader,
}: WorkspaceNavigatorShellProps) {
  return (
    <div className="flex h-full min-h-0 flex-col border-r border-border/40 bg-card">
      <div className="flex items-center gap-2 border-b border-border/40 px-2 py-2">
        <div className="relative min-w-0 flex-1">{header}</div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          title="Hide navigator"
          onClick={onToggleNavigator}
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="py-1">
          {listHeader}
          {children}
        </div>
      </ScrollArea>
    </div>
  );
}

export function workspaceNavigatorItemClass(active: boolean) {
  return cn(
    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted/60",
    active && "bg-primary/10 text-foreground",
  );
}

export function workspaceNavigatorListHeaderClass(active: boolean) {
  return cn(
    "mb-1 flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-xs font-medium text-muted-foreground hover:bg-muted/60",
    active && "bg-muted text-foreground",
  );
}
