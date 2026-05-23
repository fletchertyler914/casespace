"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, ScanSearch } from "lucide-react";
import type { TextExtractProgress } from "@repo/types";
import { Button } from "@/components/ui/button";
import { useAiAvailability } from "@/hooks/use-ai-availability";
import { commandClient } from "@/lib/command-client";

interface AnalyzeCaseButtonProps {
  caseId: string;
  onComplete?: (summary: {
    draftsCreated: number;
    merged: number;
  }) => void;
  className?: string;
  fullWidth?: boolean;
}

export function AnalyzeCaseButton({
  caseId,
  onComplete,
  className,
  fullWidth = true,
}: AnalyzeCaseButtonProps) {
  const { aiAvailable, loading: aiAvailabilityLoading } = useAiAvailability();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{
    current?: string;
    done: number;
    total: number;
  }>({ done: 0, total: 0 });
  const [tesseractOk, setTesseractOk] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void commandClient.getTesseractAvailable().then((res) => {
      if (res.ok) setTesseractOk(res.data ?? false);
    });
  }, []);

  const runPipeline = useCallback(async () => {
    if (!aiAvailable) {
      setError("Add an OpenAI API key in Settings to enable AI features.");
      return;
    }
    setRunning(true);
    setError(null);
    setProgress({ done: 0, total: 0 });

    let unlisten: () => void = () => {};
    try {
      const { listen } = await import("@tauri-apps/api/event");
      unlisten = await listen<TextExtractProgress>(
        "text-extract-progress",
        (event) => {
          setProgress((prev) => ({
            ...prev,
            current: event.payload.fileId,
            done: prev.done + 1,
          }));
        },
      );
    } catch {
      /* browser-only dev — progress events unavailable */
    }

    try {
      const filesRes = await commandClient.loadCaseFiles(caseId);
      const fileIds = (filesRes.data ?? []).map((f) => f.id);
      setProgress({ done: 0, total: fileIds.length, current: undefined });

      const extractRes = await commandClient.extractCaseText(caseId, false);
      if (!extractRes.ok) {
        throw new Error(extractRes.error?.message ?? "extract_case_text failed");
      }

      let draftsCreated = 0;
      for (const fileId of fileIds) {
        setProgress((prev) => ({ ...prev, current: fileId }));
        const analyzeRes = await commandClient.analyzeFileWithAi(caseId, fileId);
        if (analyzeRes.ok && analyzeRes.data != null) {
          draftsCreated += analyzeRes.data;
        }
      }

      const corpusRes = await commandClient.analyzeCaseWithAi(caseId);
      const merged = corpusRes.ok ? (corpusRes.data ?? 0) : 0;

      onComplete?.({ draftsCreated, merged });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      await unlisten();
      setRunning(false);
    }
  }, [aiAvailable, caseId, onComplete]);

  const label =
    progress.total > 0
      ? `Analyzing (${progress.done}/${progress.total})…`
      : running
        ? "Starting analysis…"
        : "Analyze case";

  return (
    <div className={className}>
      <Button
        size="sm"
        className={fullWidth ? "w-full" : "h-8"}
        disabled={running || aiAvailabilityLoading || !aiAvailable}
        title={
          aiAvailable
            ? undefined
            : "Add an OpenAI API key in Settings to enable AI features."
        }
        onClick={() => void runPipeline()}
      >
        {running ? (
          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
        ) : (
          <ScanSearch className="mr-2 h-3.5 w-3.5" />
        )}
        {label}
      </Button>
      {tesseractOk === false && (
        <p className="mt-1.5 text-[10px] text-amber-600">
          Tesseract not found — install with{" "}
          <code className="rounded bg-muted px-1">brew install tesseract</code>{" "}
          for OCR on scans.
        </p>
      )}
      {error && (
        <p className="mt-1.5 text-[10px] text-destructive">{error}</p>
      )}
    </div>
  );
}
