"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  DataSourceType,
  ExtractionMethod,
  FieldMapping,
} from "@/lib/mapping/types";
import { slugifyColumnId } from "@/lib/mapping/types";

interface FieldMapperStepperProps {
  onAdd: (mapping: FieldMapping) => void;
  onCancel?: () => void;
}

export function FieldMapperStepper({ onAdd, onCancel }: FieldMapperStepperProps) {
  const [sourceType, setSourceType] = useState<DataSourceType>("file_name");
  const [extractionMethod, setExtractionMethod] =
    useState<ExtractionMethod>("direct");
  const [pattern, setPattern] = useState("");
  const [endPattern, setEndPattern] = useState("");
  const [fieldName, setFieldName] = useState("");

  const needsPattern =
    extractionMethod === "pattern" ||
    extractionMethod === "text_before" ||
    extractionMethod === "text_after" ||
    extractionMethod === "text_between";

  const canAdd =
    fieldName.trim().length > 0 &&
    (!needsPattern || pattern.trim().length > 0) &&
    (extractionMethod !== "text_between" || endPattern.trim().length > 0);

  const handleAdd = useCallback(() => {
    const columnId = slugifyColumnId(fieldName);

    const mapping: FieldMapping = {
      id: `mapping_${Date.now()}`,
      columnId,
      sourceType,
      extractionMethod,
      enabled: true,
      description: fieldName.trim(),
      ...(extractionMethod !== "direct" && pattern
        ? {
            patternConfig: {
              pattern,
              ...(endPattern ? { endPattern } : {}),
              group: 0,
            },
          }
        : {}),
    };

    onAdd(mapping);
    setPattern("");
    setEndPattern("");
    setFieldName("");
    setExtractionMethod("direct");
    setSourceType("file_name");
  }, [endPattern, extractionMethod, fieldName, onAdd, pattern, sourceType]);

  return (
    <div className="space-y-3 rounded-md border bg-muted/20 p-3">
      <p className="text-sm font-medium">New mapping rule</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Source type</Label>
          <Select
            value={sourceType}
            onValueChange={(v) => setSourceType(v as DataSourceType)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="file_name">File name</SelectItem>
              <SelectItem value="folder_name">Folder name</SelectItem>
              <SelectItem value="folder_path">Folder path</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Extraction method</Label>
          <Select
            value={extractionMethod}
            onValueChange={(v) => setExtractionMethod(v as ExtractionMethod)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="direct">Direct (as-is)</SelectItem>
              <SelectItem value="pattern">Pattern (regex)</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="text_before">Text before</SelectItem>
              <SelectItem value="text_after">Text after</SelectItem>
              <SelectItem value="text_between">Text between</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {needsPattern && (
        <div className="space-y-1">
          <Label className="text-xs">Pattern (regex)</Label>
          <Input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="e.g. \\d{4}-\\d{2}-\\d{2}"
            className="h-8 font-mono text-xs"
          />
        </div>
      )}

      {extractionMethod === "text_between" && (
        <div className="space-y-1">
          <Label className="text-xs">End pattern (regex)</Label>
          <Input
            value={endPattern}
            onChange={(e) => setEndPattern(e.target.value)}
            placeholder="e.g. \\.pdf"
            className="h-8 font-mono text-xs"
          />
        </div>
      )}

      <div className="space-y-1">
        <Label className="text-xs">Target column name</Label>
        <Input
          value={fieldName}
          onChange={(e) => setFieldName(e.target.value)}
          placeholder="e.g. Document date"
          className="h-8 text-xs"
        />
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          className="h-8 text-xs"
          disabled={!canAdd}
          onClick={handleAdd}
        >
          Add rule
        </Button>
        {onCancel && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
