"use client";

import { useMemo, useState } from "react";
import type { ReportTemplate, ReportTemplateId } from "@repo/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DEFAULT_REPORT_TEMPLATE_ID,
  REPORT_TEMPLATES,
  waveATemplates,
} from "@/lib/report-templates";
import { Lock } from "lucide-react";

export type LicenseTier = "free" | "pro" | "pro_plus";

interface ReportTemplatePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedId?: ReportTemplateId;
  licenseTier?: LicenseTier;
  includeWaveB?: boolean;
  onSelect: (templateId: ReportTemplateId) => void;
}

function tierAllows(template: ReportTemplate, tier: LicenseTier): boolean {
  const order = { free: 0, pro: 1, pro_plus: 2 };
  return order[tier] >= order[template.tier];
}

export function ReportTemplatePicker({
  open,
  onOpenChange,
  selectedId = DEFAULT_REPORT_TEMPLATE_ID,
  licenseTier = "pro",
  includeWaveB = false,
  onSelect,
}: ReportTemplatePickerProps) {
  const [pending, setPending] = useState<ReportTemplateId>(selectedId);

  const templates = useMemo(() => {
    const base = includeWaveB ? REPORT_TEMPLATES : waveATemplates();
    return base.filter((t) => t.wave === "A" || (includeWaveB && t.wave === "B"));
  }, [includeWaveB]);

  const grouped = useMemo(() => {
    const map = new Map<string, ReportTemplate[]>();
    for (const t of templates) {
      const key = t.persona;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return map;
  }, [templates]);

  function confirm() {
    const tpl = templates.find((t) => t.id === pending);
    if (tpl && tierAllows(tpl, licenseTier)) {
      onSelect(pending);
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Choose report template</DialogTitle>
          <DialogDescription>
            ACFE-aligned examination and expert witness templates with standards compliance
            footer and citation backing.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[420px] pr-3">
          <div className="space-y-4">
            {[...grouped.entries()].map(([persona, items]) => (
              <div key={persona}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {persona.replace(/_/g, " ")}
                </p>
                <ul className="space-y-2">
                  {items.map((tpl) => {
                    const locked = !tierAllows(tpl, licenseTier);
                    const active = pending === tpl.id;
                    return (
                      <li key={tpl.id}>
                        <button
                          type="button"
                          disabled={locked}
                          onClick={() => setPending(tpl.id)}
                          className={`w-full rounded-md border p-3 text-left text-sm transition-colors ${
                            active
                              ? "border-primary bg-primary/5"
                              : "border-border/60 hover:bg-muted/50"
                          } ${locked ? "cursor-not-allowed opacity-60" : ""}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">{tpl.name}</span>
                            <div className="flex items-center gap-1">
                              {tpl.tier !== "free" ? (
                                <Badge variant="outline" className="text-[10px]">
                                  {tpl.tier}
                                </Badge>
                              ) : null}
                              {locked ? (
                                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                              ) : null}
                            </div>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {tpl.description}
                          </p>
                          {tpl.standardsCited.length > 0 ? (
                            <p className="mt-2 text-[10px] text-muted-foreground">
                              {tpl.standardsCited.join(" · ")}
                            </p>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={confirm}>Use template</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
