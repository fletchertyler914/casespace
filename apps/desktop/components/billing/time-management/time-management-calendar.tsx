"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CaseBillingConfig, TimeEntry } from "@repo/types";
import { Button } from "@/components/ui/button";
import {
  TimeCalendarDayButton,
  entryForCalendarDay,
} from "./time-calendar-day-button";
import { TimeManagementDayPanel } from "./time-management-day-panel";
import type { TimeSegment } from "@repo/types";

interface TimeManagementCalendarProps {
  entries: TimeEntry[];
  billingConfig: CaseBillingConfig | null;
  onEditSegment: (entry: TimeEntry, segment: TimeSegment) => void;
  onAddSegment: (entry: TimeEntry) => void;
  onDeleteSegment: (entry: TimeEntry, segment: TimeSegment) => void;
}

function monthStart(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function addMonths(d: Date, n: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
}

export function TimeManagementCalendar({
  entries,
  billingConfig,
  onEditSegment,
  onAddSegment,
  onDeleteSegment,
}: TimeManagementCalendarProps) {
  const [cursor, setCursor] = useState(() => monthStart(new Date()));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const { weeks, monthLabel } = useMemo(() => {
    const start = monthStart(cursor);
    const startDow = start.getUTCDay();
    const gridStart = new Date(start);
    gridStart.setUTCDate(gridStart.getUTCDate() - startDow);

    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setUTCDate(d.getUTCDate() + i);
      days.push(d);
    }
    const weeks: Date[][] = [];
    for (let w = 0; w < 6; w++) weeks.push(days.slice(w * 7, w * 7 + 7));

    const monthLabel = start.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    return { weeks, monthLabel };
  }, [cursor]);

  const selectedEntry = selectedDay
    ? entries.find((e) => e.entryDate.slice(0, 10) === selectedDay.slice(0, 10))
    : undefined;

  const todayKey = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex min-h-0 flex-1">
      <div className="min-w-0 flex-1">
        <div className="mb-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Previous month"
            onClick={() => setCursor((c) => addMonths(c, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">{monthLabel}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Next month"
            onClick={() => setCursor((c) => addMonths(c, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weeks.flat().map((date) => {
            const entry = entryForCalendarDay(entries, date);
            const key = date.toISOString().slice(0, 10);
            const inMonth = date.getUTCMonth() === cursor.getUTCMonth();
            return (
              <TimeCalendarDayButton
                key={key}
                date={date}
                entry={entry}
                billingConfig={billingConfig}
                isSelected={selectedDay === key}
                isToday={key === todayKey}
                inMonth={inMonth}
                onClick={() => setSelectedDay(key)}
              />
            );
          })}
        </div>
      </div>
      {selectedDay ? (
        <TimeManagementDayPanel
          entry={selectedEntry ?? null}
          entryDate={selectedDay + "T00:00:00+00:00"}
          billingConfig={billingConfig}
          onClose={() => setSelectedDay(null)}
          onEditSegment={(seg) => {
            if (selectedEntry) onEditSegment(selectedEntry, seg);
          }}
          onAddSegment={() => {
            if (selectedEntry) onAddSegment(selectedEntry);
          }}
          onDeleteSegment={(seg) => {
            if (selectedEntry) onDeleteSegment(selectedEntry, seg);
          }}
        />
      ) : null}
    </div>
  );
}
