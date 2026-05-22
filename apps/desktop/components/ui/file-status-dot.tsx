"use client";

import { cn } from "@/lib/utils";
import {
  getFileStatusDotClass,
  getFileStatusLabel,
} from "@/lib/file-status";

interface FileStatusDotProps {
  status: string | undefined;
  className?: string;
  /** When true, expose status as native tooltip on hover. */
  showTitle?: boolean;
}

/** v1-style colored dot for file review status (no text label). */
export function FileStatusDot({
  status,
  className,
  showTitle = false,
}: FileStatusDotProps) {
  return (
    <span
      role="img"
      aria-hidden={!showTitle}
      title={showTitle ? getFileStatusLabel(status) : undefined}
      className={cn(
        "inline-block shrink-0 rounded-full",
        getFileStatusDotClass(status),
        className ?? "h-2 w-2",
      )}
    />
  );
}
