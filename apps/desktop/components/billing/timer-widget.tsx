"use client";

import { useEffect, useState } from "react";
import { Clock, Pause, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DailySummaryDialog } from "@/components/billing/daily-summary-dialog";
import { useTimer } from "@/hooks/use-timer";
import { useToast } from "@/hooks/use-toast";
import { commandClient } from "@/lib/command-client";
import { formatCurrency } from "@/lib/billing-calc";
import { cn } from "@/lib/utils";

interface TimerWidgetProps {
  caseId: string;
}

export function TimerWidget({ caseId }: TimerWidgetProps) {
  const { toast } = useToast();
  const timer = useTimer(caseId, {
    onOtherCaseStopped: (name) => {
      toast({
        title: "Timer stopped",
        description: `Stopped timer on “${name}”.`,
      });
    },
  });
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [stopSeconds, setStopSeconds] = useState(0);
  const [billablePreview, setBillablePreview] = useState<string | undefined>();

  useEffect(() => {
    if (!summaryOpen) return;
    void (async () => {
      const res = await commandClient.calculateBillingAmount(caseId);
      if (res.ok && res.data) {
        setBillablePreview(formatCurrency(res.data.amount));
      }
    })();
  }, [summaryOpen, caseId]);

  async function handleStopClick() {
    setStopSeconds(timer.elapsedSeconds);
    setSummaryOpen(true);
  }

  async function handleSummarySave(summary: string) {
    await timer.stop(summary);
    setSummaryOpen(false);
  }

  return (
    <>
      <div
        className={cn(
          "inline-flex h-8 items-center gap-1 rounded-md border border-border/40 bg-card/50 px-2",
          timer.isRunning && "animate-pulse",
        )}
        title="Case time tracking"
      >
        <Clock
          className={cn(
            "h-3.5 w-3.5 shrink-0",
            timer.isRunning ? "text-primary" : "text-muted-foreground",
          )}
          aria-hidden
        />
        <span
          className={cn(
            "min-w-[5.25rem] text-center font-mono text-sm tabular-nums",
            timer.isRunning && "text-primary",
            timer.isPaused && "italic text-muted-foreground",
            !timer.isRunning && !timer.isPaused && "text-muted-foreground",
          )}
        >
          {timer.formattedTime}
        </span>

        {timer.isRunning ? (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0"
              title="Pause"
              aria-label="Pause timer"
              disabled={timer.loading}
              onClick={() => void timer.pause()}
            >
              <Pause className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0"
              title="Stop"
              aria-label="Stop timer"
              disabled={timer.loading}
              onClick={() => void handleStopClick()}
            >
              <Square className="h-4 w-4" />
            </Button>
          </>
        ) : timer.isPaused ? (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0"
              title="Resume"
              aria-label="Resume timer"
              disabled={timer.loading}
              onClick={() => void timer.resume()}
            >
              <Play className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0"
              title="Stop"
              aria-label="Stop timer"
              disabled={timer.loading}
              onClick={() => void handleStopClick()}
            >
              <Square className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="default"
            size="sm"
            className="h-7 shrink-0 px-2 text-xs"
            disabled={timer.loading}
            onClick={() => void timer.start()}
          >
            Start
          </Button>
        )}
      </div>

      <DailySummaryDialog
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
        totalSeconds={stopSeconds}
        billablePreview={billablePreview}
        onSave={(summary) => handleSummarySave(summary)}
      />
    </>
  );
}
