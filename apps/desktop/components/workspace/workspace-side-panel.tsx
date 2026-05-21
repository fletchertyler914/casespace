"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface WorkspaceSidePanelProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function WorkspaceSidePanel({
  title,
  onClose,
  children,
}: WorkspaceSidePanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col border-l border-border/40 bg-card">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border/40 px-3">
        <span className="text-sm font-medium">{title}</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      <ScrollArea className="min-h-0 flex-1">{children}</ScrollArea>
    </div>
  );
}
