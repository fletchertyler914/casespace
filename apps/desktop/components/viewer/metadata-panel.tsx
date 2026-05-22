"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { commandClient } from "@/lib/command-client";

interface FileMetadataJson {
  fileName?: string;
  absolutePath?: string;
  extension?: string;
  sizeBytes?: number;
  modifiedAt?: string;
}

interface MetadataPanelProps {
  caseId: string;
  fileId: string;
}

export function MetadataPanel({ caseId, fileId }: MetadataPanelProps) {
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<FileMetadataJson | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void commandClient.extractFileMetadata(caseId, fileId).then((res) => {
      if (cancelled) return;
      if (res.ok && res.data) {
        try {
          setMeta(JSON.parse(res.data) as FileMetadataJson);
        } catch {
          setMeta(null);
        }
      } else {
        setMeta(null);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [caseId, fileId]);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!meta) {
    return (
      <p className="p-4 text-sm text-muted-foreground">No metadata available.</p>
    );
  }

  const rows: [string, string][] = [
    ["Name", meta.fileName ?? "—"],
    ["Extension", meta.extension ?? "—"],
    ["Size", meta.sizeBytes != null ? `${meta.sizeBytes} bytes` : "—"],
    ["Modified", meta.modifiedAt ?? "—"],
    ["Path", meta.absolutePath ?? "—"],
  ];

  return (
    <ScrollArea className="h-[min(70vh,480px)]">
      <div className="space-y-3 p-4">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 text-xs">
            <span className="shrink-0 text-muted-foreground">{label}</span>
            <span className="break-all text-right font-mono">{value}</span>
          </div>
        ))}
        {meta.absolutePath ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={async () => {
              await navigator.clipboard.writeText(meta.absolutePath!);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            Copy path
          </Button>
        ) : null}
      </div>
    </ScrollArea>
  );
}
