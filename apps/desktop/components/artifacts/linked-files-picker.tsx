"use client";

import { useMemo } from "react";
import type { CaseFile } from "@repo/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

interface LinkedFilesPickerProps {
  files: CaseFile[];
  value: string[];
  onChange: (fileIds: string[]) => void;
  maxFiles?: number;
}

export function LinkedFilesPicker({
  files,
  value,
  onChange,
  maxFiles = 8,
}: LinkedFilesPickerProps) {
  const available = useMemo(
    () =>
      files
        .filter((f) => !value.includes(f.id))
        .sort((a, b) => a.fileName.localeCompare(b.fileName)),
    [files, value],
  );

  const linked = useMemo(
    () => value.map((id) => files.find((f) => f.id === id)).filter(Boolean) as CaseFile[],
    [files, value],
  );

  function addFile(fileId: string) {
    if (!fileId || value.includes(fileId) || value.length >= maxFiles) return;
    onChange([...value, fileId]);
  }

  function removeFile(fileId: string) {
    onChange(value.filter((id) => id !== fileId));
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] text-muted-foreground">Linked files</Label>
      {linked.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {linked.map((file) => (
            <Badge
              key={file.id}
              variant="secondary"
              className="gap-1 pr-1 text-[10px] font-normal"
            >
              <span className="max-w-[140px] truncate">{file.fileName}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-4 w-4"
                onClick={() => removeFile(file.id)}
                aria-label={`Remove ${file.fileName}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-muted-foreground">No linked files</p>
      )}
      {value.length < maxFiles && available.length > 0 ? (
        <Select onValueChange={addFile}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Add evidence file…" />
          </SelectTrigger>
          <SelectContent>
            {available.slice(0, 200).map((file) => (
              <SelectItem key={file.id} value={file.id}>
                {file.fileName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  );
}
