"use client";

import type { TimeEntry } from "@repo/types";
import { cn } from "@/lib/utils";
import { entryBillableAmount, formatCurrency } from "@/lib/billing-calc";
import type { CaseBillingConfig } from "@repo/types";
import {
  entryDisplaySeconds,
  formatDurationShort,
  formatEntryDate,
} from "@/lib/time-format";

interface TimeCalendarDayButtonProps {
  date: Date;
  entry?: TimeEntry;
  billingConfig: CaseBillingConfig | null;
  isSelected: boolean;
  isToday: boolean;
  inMonth: boolean;
  onClick: () => void;
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function TimeCalendarDayButton({
  date,
  entry,
  billingConfig,
  isSelected,
  isToday,
  inMonth,
  onClick,
}: TimeCalendarDayButtonProps) {
  const seconds = entry ? entryDisplaySeconds(entry, Date.now()) : 0;
  const hasOpen = entry?.segments?.some((s) => !s.endedAt);
  const billable =
    entry && billingConfig
      ? formatCurrency(entryBillableAmount(entry, billingConfig))
      : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-[5.5rem] flex-col rounded-md border p-1.5 text-left transition-colors",
        inMonth ? "border-border/40 bg-card/50" : "border-transparent bg-muted/20 opacity-50",
        isSelected && "ring-2 ring-primary border-primary/40",
        isToday && !isSelected && "border-primary/30",
        "hover:bg-accent/50",
      )}
      aria-label={formatEntryDate(date.toISOString())}
      aria-pressed={isSelected}
    >
      <span
        className={cn(
          "text-xs font-medium",
          isToday ? "text-primary" : "text-muted-foreground",
        )}
      >
        {date.getUTCDate()}
      </span>
      {entry ? (
        <>
          <span className="mt-1 font-mono text-[10px] tabular-nums text-foreground">
            {formatDurationShort(seconds)}
          </span>
          {billable ? (
            <span className="text-[10px] text-muted-foreground">{billable}</span>
          ) : null}
          {entry.summary ? (
            <span className="mt-0.5 line-clamp-2 text-[10px] text-muted-foreground">
              {entry.summary}
            </span>
          ) : null}
          <span
            className={cn(
              "mt-auto h-0.5 w-full rounded-full",
              hasOpen ? "bg-info" : seconds > 0 ? "bg-success" : "bg-muted",
            )}
            aria-hidden
          />
        </>
      ) : (
        <span className="mt-auto text-[10px] text-muted-foreground/60">—</span>
      )}
    </button>
  );
}

export function entryForCalendarDay(
  entries: TimeEntry[],
  date: Date,
): TimeEntry | undefined {
  const key = dayKey(date);
  return entries.find((e) => e.entryDate.slice(0, 10) === key);
}
