"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { commandClient } from "@/lib/command-client";
import {
  DEFAULT_COLUMN_CONFIG,
  DEFAULT_MAPPING_CONFIG,
  parseColumnConfig,
  parseMappingConfig,
  type FieldMapping,
  type MappingConfig,
  type TableColumnConfig,
} from "@/lib/mapping/types";
import {
  ColumnManager,
  MappingListEditor,
} from "@/components/table/column-manager";
import { FieldMapperStepper } from "@/components/mapping/field-mapper-stepper";

interface ColumnsMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  onSaved?: () => void;
}

type DialogSection = "columns" | "mapping";

export function ColumnsMappingDialog({
  open,
  onOpenChange,
  caseId,
  onSaved,
}: ColumnsMappingDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [section, setSection] = useState<DialogSection>("columns");
  const [columnConfig, setColumnConfig] =
    useState<TableColumnConfig>(DEFAULT_COLUMN_CONFIG);
  const [mappingConfig, setMappingConfig] =
    useState<MappingConfig>(DEFAULT_MAPPING_CONFIG);
  const [showRuleForm, setShowRuleForm] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const [colRes, mapRes] = await Promise.all([
        commandClient.getColumnConfigDb(caseId),
        commandClient.getMappingConfigDb(caseId),
      ]);
      if (cancelled) return;
      if (colRes.ok) {
        setColumnConfig(parseColumnConfig(colRes.data));
      }
      if (mapRes.ok) {
        setMappingConfig(parseMappingConfig(mapRes.data));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [caseId, open]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const [colSave, mapSave] = await Promise.all([
        commandClient.saveColumnConfigDb(caseId, JSON.stringify(columnConfig)),
        commandClient.saveMappingConfigDb(caseId, JSON.stringify(mappingConfig)),
      ]);

      if (!colSave.ok || !mapSave.ok) {
        toast({
          title: "Save failed",
          description:
            colSave.error?.message ??
            mapSave.error?.message ??
            "Could not save configuration",
          variant: "destructive",
        });
        return;
      }

      const reapply = await commandClient.reapplyMappingsToCase(caseId);
      if (!reapply.ok) {
        toast({
          title: "Mappings saved",
          description:
            "Column config saved, but re-applying mappings failed: " +
            (reapply.error?.message ?? "unknown error"),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Configuration saved",
          description:
            reapply.data && reapply.data > 0
              ? `Updated ${reapply.data} file(s) with new mappings.`
              : "Column and mapping preferences saved.",
        });
      }

      onSaved?.();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }, [caseId, columnConfig, mappingConfig, onOpenChange, onSaved, toast]);

  const addMapping = useCallback((mapping: FieldMapping) => {
    setMappingConfig((prev) => ({
      ...prev,
      mappings: [...prev.mappings, mapping],
    }));
    setShowRuleForm(false);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Columns &amp; mapping</DialogTitle>
          <DialogDescription>
            Choose visible table columns and define rules to extract inventory
            fields from file paths.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-1 rounded-md border p-1">
              {(
                [
                  ["columns", "Columns"],
                  ["mapping", "Field mapping"],
                ] as const
              ).map(([id, label]) => (
                <Button
                  key={id}
                  type="button"
                  variant={section === id ? "default" : "ghost"}
                  size="sm"
                  className={cn("flex-1 h-8 text-xs")}
                  onClick={() => setSection(id)}
                >
                  {label}
                </Button>
              ))}
            </div>

            {section === "columns" ? (
              <ColumnManager config={columnConfig} onChange={setColumnConfig} />
            ) : (
              <div className="space-y-3">
                <MappingListEditor
                  mappings={mappingConfig.mappings}
                  onChange={(mappings) =>
                    setMappingConfig((prev) => ({ ...prev, mappings }))
                  }
                  onAddMapping={() => setShowRuleForm(true)}
                />
                {showRuleForm && (
                  <FieldMapperStepper
                    onAdd={addMapping}
                    onCancel={() => setShowRuleForm(false)}
                  />
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={loading || saving} onClick={() => void handleSave()}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save & apply"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
