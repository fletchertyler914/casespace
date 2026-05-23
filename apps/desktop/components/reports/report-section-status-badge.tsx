"use client";

import type { ReportSectionStatus } from "@repo/types";
import { Badge } from "@/components/ui/badge";

const LABELS: Record<ReportSectionStatus, string> = {
  empty: "Empty",
  aiDrafted: "AI drafted",
  edited: "Edited",
  reviewed: "Reviewed",
  locked: "Locked",
};

const VARIANT: Record<
  ReportSectionStatus,
  "outline" | "secondary" | "default" | "destructive"
> = {
  empty: "outline",
  aiDrafted: "secondary",
  edited: "default",
  reviewed: "default",
  locked: "destructive",
};

export function ReportSectionStatusBadge({
  status,
}: {
  status: ReportSectionStatus;
}) {
  return (
    <Badge variant={VARIANT[status]} className="text-[10px] font-normal">
      {LABELS[status]}
    </Badge>
  );
}

export function ReportSectionStatusDot({ status }: { status: ReportSectionStatus }) {
  const color =
    status === "locked"
      ? "bg-amber-500"
      : status === "reviewed"
        ? "bg-emerald-500"
        : status === "edited"
          ? "bg-blue-500"
          : status === "aiDrafted"
            ? "bg-violet-500"
            : "bg-muted-foreground/40";
  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${color}`}
      title={LABELS[status]}
    />
  );
}
