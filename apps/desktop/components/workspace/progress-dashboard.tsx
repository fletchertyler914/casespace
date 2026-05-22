"use client";

import { useMemo } from "react";
import type { CaseFile } from "@repo/types";
import { BOARD_STATUSES, normalizeBoardStatus } from "@/lib/board-status";

interface ProgressDashboardProps {
  files: CaseFile[];
}

export function ProgressDashboard({ files }: ProgressDashboardProps) {
  const stats = useMemo(() => {
    const total = files.length;
    const counts: Record<string, number> = {};
    for (const { value } of BOARD_STATUSES) {
      counts[value] = 0;
    }
    for (const file of files) {
      const status = normalizeBoardStatus(file.status);
      counts[status] = (counts[status] ?? 0) + 1;
    }
    const completedCount = counts.excluded ?? 0;
    const remainingCount = total - completedCount;
    const progressPercentage =
      total > 0 ? Math.round((completedCount / total) * 100) : 0;

    const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);

    return {
      total,
      completedCount,
      remainingCount,
      progressPercentage,
      unreviewedPercent: pct(counts.unreviewed ?? 0),
      inReviewPercent: pct(counts.in_review ?? 0),
      reviewedPercent: pct(counts.reviewed ?? 0),
      flaggedPercent: pct(counts.flagged ?? 0),
      excludedPercent: pct(counts.excluded ?? 0),
    };
  }, [files]);

  if (stats.total === 0) return null;

  return (
    <div className="flex items-center gap-6">
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Review progress</span>
          <span className="font-medium text-foreground">
            {stats.progressPercentage}%
          </span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/30">
          <div className="absolute inset-0 flex">
            {stats.unreviewedPercent > 0 && (
              <div
                className="bg-muted-foreground/40"
                style={{ width: `${stats.unreviewedPercent}%` }}
              />
            )}
            {stats.inReviewPercent > 0 && (
              <div
                className="bg-blue-400"
                style={{ width: `${stats.inReviewPercent}%` }}
              />
            )}
            {stats.reviewedPercent > 0 && (
              <div
                className="bg-green-400"
                style={{ width: `${stats.reviewedPercent}%` }}
              />
            )}
            {stats.flaggedPercent > 0 && (
              <div
                className="bg-yellow-400"
                style={{ width: `${stats.flaggedPercent}%` }}
              />
            )}
            {stats.excludedPercent > 0 && (
              <div
                className="bg-emerald-500"
                style={{ width: `${stats.excludedPercent}%` }}
              />
            )}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 text-xs">
        <div className="text-right">
          <div className="text-[10px] leading-tight text-muted-foreground">
            Remaining
          </div>
          <div className="font-semibold leading-tight text-foreground">
            {stats.remainingCount}
          </div>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="text-right">
          <div className="text-[10px] leading-tight text-muted-foreground">
            Completed
          </div>
          <div className="font-semibold leading-tight text-green-500">
            {stats.completedCount}
          </div>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="text-right">
          <div className="text-[10px] leading-tight text-muted-foreground">
            Total
          </div>
          <div className="font-semibold leading-tight text-foreground">
            {stats.total}
          </div>
        </div>
      </div>
    </div>
  );
}
