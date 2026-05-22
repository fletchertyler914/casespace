"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type CaseStatusFilter = "all" | "active" | "archived" | "closed";

interface CaseFiltersProps {
  value: CaseStatusFilter;
  onChange: (value: CaseStatusFilter) => void;
  counts?: Partial<Record<CaseStatusFilter, number>>;
  className?: string;
}

const FILTERS: { value: CaseStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
  { value: "closed", label: "Closed" },
];

export function CaseFilters({
  value,
  onChange,
  counts,
  className,
}: CaseFiltersProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {FILTERS.map((filter) => {
        const active = value === filter.value;
        const count = counts?.[filter.value];
        return (
          <button
            key={filter.value}
            type="button"
            onClick={() => onChange(filter.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
              active
                ? "border-primary/40 bg-primary/10 text-foreground"
                : "border-border/50 bg-background text-muted-foreground hover:bg-muted/30",
            )}
          >
            {filter.label}
            {count !== undefined ? (
              <Badge
                variant="secondary"
                className="h-4 min-w-4 px-1 text-[10px] font-normal"
              >
                {count}
              </Badge>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
