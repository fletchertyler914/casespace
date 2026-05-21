"use client";

import { ExternalLink, FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { unsupportedPreviewLabel } from "@/lib/file-preview";

interface ExternalFilePreviewProps {
  fileName: string;
  onOpenExternal: () => void;
  opening?: boolean;
}

export function ExternalFilePreview({
  fileName,
  onOpenExternal,
  opening,
}: ExternalFilePreviewProps) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <FileIcon className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">{fileName}</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          {unsupportedPreviewLabel(fileName)} is not supported in CaseSpace
          preview. Open it in your default app instead.
        </p>
      </div>
      <Button onClick={onOpenExternal} disabled={opening}>
        <ExternalLink className="mr-2 h-4 w-4" />
        {opening ? "Opening…" : "Open externally"}
      </Button>
    </div>
  );
}
