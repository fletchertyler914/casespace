"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FieldMapping, TableColumnConfig } from "@/lib/mapping/types";
import { DEFAULT_COLUMN_CONFIG } from "@/lib/mapping/types";

interface ColumnManagerProps {
  config: TableColumnConfig;
  onChange: (config: TableColumnConfig) => void;
}

export function ColumnManager({ config, onChange }: ColumnManagerProps) {
  const [localConfig, setLocalConfig] = useState<TableColumnConfig>(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const sync = useCallback(
    (next: TableColumnConfig) => {
      setLocalConfig(next);
      onChange(next);
    },
    [onChange],
  );

  const toggleVisibility = useCallback(
    (columnId: string) => {
      sync({
        ...localConfig,
        columns: localConfig.columns.map((col) =>
          col.id === columnId ? { ...col, visible: !col.visible } : col,
        ),
      });
    },
    [localConfig, sync],
  );

  const handleReset = useCallback(() => {
    sync(DEFAULT_COLUMN_CONFIG);
  }, [sync]);

  const visibleCount = localConfig.columns.filter((c) => c.visible).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {visibleCount} of {localConfig.columns.length} columns visible
        </p>
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleReset}>
          Reset defaults
        </Button>
      </div>

      <ScrollArea className="h-[240px] rounded-md border p-2">
        <div className="space-y-1">
          {localConfig.columns.map((column) => (
            <label
              key={column.id}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
            >
              <Checkbox
                checked={column.visible}
                onCheckedChange={() => toggleVisibility(column.id)}
              />
              <span className="flex-1 text-sm">{column.label}</span>
              <span className="text-xs text-muted-foreground">{column.id}</span>
            </label>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

interface MappingListEditorProps {
  mappings: FieldMapping[];
  onChange: (mappings: FieldMapping[]) => void;
  onAddMapping: () => void;
}

export function MappingListEditor({
  mappings,
  onChange,
  onAddMapping,
}: MappingListEditorProps) {
  const removeMapping = useCallback(
    (id: string) => {
      onChange(mappings.filter((m) => m.id !== id));
    },
    [mappings, onChange],
  );

  const toggleEnabled = useCallback(
    (id: string) => {
      onChange(
        mappings.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m)),
      );
    },
    [mappings, onChange],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {mappings.filter((m) => m.enabled).length} active mapping
          {mappings.length === 1 ? "" : "s"}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={onAddMapping}
        >
          <Plus className="h-3.5 w-3.5" />
          Add mapping
        </Button>
      </div>

      {mappings.length === 0 ? (
        <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
          No field mappings yet. Add a mapping to extract data from file names or
          folder paths into inventory columns.
        </p>
      ) : (
        <ScrollArea className="h-[200px] rounded-md border p-2">
          <div className="space-y-1">
            {mappings.map((mapping) => (
              <div
                key={mapping.id}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/40"
              >
                <Checkbox
                  checked={mapping.enabled}
                  onCheckedChange={() => toggleEnabled(mapping.id)}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {mapping.description ?? mapping.columnId}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {mapping.sourceType} → {mapping.extractionMethod} →{" "}
                    {mapping.columnId}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => removeMapping(mapping.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
