"use client";

import { memo } from "react";
import {
  Briefcase,
  Clock,
  Edit2,
  FileText,
  FolderOpen,
  Loader2,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow, fromUnixTime } from "date-fns";
import type { CaseSummary } from "@repo/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface CaseWithCounts extends CaseSummary {
  fileCount?: number;
  sources?: string[];
}

interface CaseListCardProps {
  case_: CaseWithCounts;
  currentCaseId?: string;
  loadingFileCount?: boolean;
  isRecent?: boolean;
  viewMode?: "grid" | "list";
  onSelect: (case_: CaseSummary) => void;
  onEdit?: (case_: CaseSummary, e: React.MouseEvent) => void;
  onDelete?: (case_: CaseSummary, e: React.MouseEvent) => void;
}

function relativeFromIso(iso: string | undefined) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return formatDistanceToNow(date, { addSuffix: true });
}

function relativeFromUnix(seconds: number | undefined) {
  if (!seconds) return "—";
  return formatDistanceToNow(fromUnixTime(seconds), { addSuffix: true });
}

export const CaseListCard = memo(function CaseListCard({
  case_,
  currentCaseId,
  loadingFileCount,
  isRecent = false,
  viewMode = "grid",
  onSelect,
  onEdit,
  onDelete,
}: CaseListCardProps) {
  const isSelected = currentCaseId === case_.id;
  const relativeTime = case_.updatedAt
    ? relativeFromIso(case_.updatedAt)
    : relativeFromUnix(undefined);

  const sources = case_.sources ?? case_.sourcePaths ?? [];

  if (viewMode === "list") {
    return (
      <button
        type="button"
        className={cn(
          "group flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-all duration-200",
          "border-border/30 dark:border-border/40",
          "hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md hover:shadow-primary/5",
          isSelected &&
            "border-primary bg-primary/5 ring-2 ring-primary shadow-md shadow-primary/10",
          isRecent &&
            !isSelected &&
            "border-primary/20 bg-primary/5 dark:border-primary/30",
        )}
        onClick={() => onSelect(case_)}
      >
        <div className="flex-shrink-0 rounded-lg border border-primary/30 bg-primary/10 p-2 transition-colors group-hover:bg-primary/20 dark:border-primary/40">
          <Briefcase className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-3">
            <h3 className="truncate text-base font-semibold transition-colors group-hover:text-primary">
              {case_.name}
            </h3>
            {isRecent ? (
              <Badge variant="default" className="pointer-events-none text-xs">
                Recent
              </Badge>
            ) : null}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Badge
              variant={case_.status === "active" ? "secondary" : "outline"}
              className="pointer-events-none px-1.5 py-0 text-[10px]"
            >
              {case_.status}
            </Badge>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {relativeTime}
            </span>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-4">
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {onEdit ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={(e) => onEdit(case_, e)}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            ) : null}
            {onDelete ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={(e) => onDelete(case_, e)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            ) : null}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium">
            {loadingFileCount ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            ) : (
              <>
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-foreground">
                  {case_.fileCount !== undefined
                    ? case_.fileCount.toLocaleString()
                    : "—"}
                </span>
              </>
            )}
          </div>
        </div>
      </button>
    );
  }

  return (
    <Card
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(case_);
        }
      }}
      className={cn(
        "group cursor-pointer transition-all duration-200",
        "hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5",
        "border-border/30 hover:border-primary/50 dark:border-border/40 dark:hover:border-primary/50",
        isSelected &&
          "border-primary ring-2 ring-primary shadow-lg shadow-primary/10",
        isRecent &&
          !isSelected &&
          "border-primary/20 bg-primary/5 dark:border-primary/30",
      )}
      onClick={() => onSelect(case_)}
    >
      <CardHeader className="pb-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <div className="rounded-md border border-primary/30 bg-primary/10 p-1.5 transition-colors group-hover:bg-primary/20 dark:border-primary/40">
                <Briefcase className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="truncate text-lg font-bold transition-colors group-hover:text-primary">
                {case_.name}
              </CardTitle>
              {isRecent ? (
                <Badge
                  variant="default"
                  className="pointer-events-none ml-auto text-xs"
                >
                  Recent
                </Badge>
              ) : null}
            </div>
            <CardDescription className="mt-1 flex items-start gap-1.5 text-xs">
              <FolderOpen className="mt-0.5 h-3 w-3 flex-shrink-0 text-muted-foreground/60" />
              <span className="truncate text-muted-foreground/70">
                {sources.length > 0
                  ? `${sources.length} source${sources.length !== 1 ? "s" : ""}`
                  : "No sources"}
              </span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={case_.status === "active" ? "secondary" : "outline"}
            className="pointer-events-none px-2 py-0.5 text-xs font-medium"
          >
            {case_.status}
          </Badge>
        </div>
        <div className="flex items-center justify-between border-t border-border/30 pt-2 dark:border-border/40">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{relativeTime}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              {onEdit ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={(e) => onEdit(case_, e)}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
              ) : null}
              {onDelete ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={(e) => onDelete(case_, e)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              ) : null}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium">
              {loadingFileCount ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-foreground">
                    {case_.fileCount !== undefined
                      ? case_.fileCount.toLocaleString()
                      : "—"}
                  </span>
                  <span className="text-muted-foreground">files</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
