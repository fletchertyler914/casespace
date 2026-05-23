"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useReportWorkspace } from "./report-workspace-context";

interface FinalizeChecklistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FinalizeChecklistDialog({
  open,
  onOpenChange,
}: FinalizeChecklistDialogProps) {
  const { runComplianceScan, complianceScan, exportDocx, caseSummary } =
    useReportWorkspace();
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (open) void runComplianceScan();
  }, [open, runComplianceScan]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { save } = await import("@tauri-apps/plugin-dialog");
      const path = await save({
        defaultPath: `${caseSummary.name.replace(/\s+/g, "-")}-report.docx`,
        filters: [{ name: "Word Document", extensions: ["docx"] }],
      });
      if (path) {
        await exportDocx(path);
        onOpenChange(false);
      }
    } catch {
      /* browser dev */
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Finalize & export</DialogTitle>
          <DialogDescription>
            Confirm your report passes delivery checks before exporting to Word.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 py-2">
          {(complianceScan?.items ?? []).map((item) => (
            <li key={item.id} className="flex items-start gap-2 text-sm">
              {item.passed ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              )}
              <div>
                <p className="font-medium">{item.label}</p>
                {item.detail ? (
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                ) : null}
              </div>
            </li>
          ))}
          {!complianceScan && (
            <li className="text-sm text-muted-foreground">Running checks…</li>
          )}
        </ul>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!complianceScan?.ok || exporting}
            onClick={() => void handleExport()}
          >
            {exporting ? "Exporting…" : "Export DOCX"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
