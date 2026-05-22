"use client";

import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface SyncProgressBannerProps {
  visible: boolean;
  label?: string;
}

export function SyncProgressBanner({
  visible,
  label = "Syncing case sources…",
}: SyncProgressBannerProps) {
  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 border-b border-border/40 bg-muted/20 px-4 py-2"
    >
      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-xs font-medium text-foreground">{label}</p>
        <Progress value={undefined} className="h-1" />
      </div>
    </div>
  );
}
