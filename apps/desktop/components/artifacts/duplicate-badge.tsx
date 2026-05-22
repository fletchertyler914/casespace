"use client";

import { cn } from "@/lib/utils";

interface DuplicateBadgeProps {
  /** When true, this file is marked primary in its duplicate group. */
  isPrimary?: boolean;
  className?: string;
  title?: string;
}

export function DuplicateBadge({
  isPrimary = false,
  className,
  title = "Duplicate file",
}: DuplicateBadgeProps) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 shrink-0 rounded-full",
        isPrimary ? "bg-primary" : "bg-amber-500",
        className,
      )}
      title={isPrimary ? "Primary duplicate" : title}
      aria-label={isPrimary ? "Primary duplicate" : title}
    />
  );
}
