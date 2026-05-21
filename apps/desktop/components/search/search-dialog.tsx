"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Search, StickyNote, AlertTriangle, Clock3 } from "lucide-react";
import type { CaseFile, SearchHit } from "@repo/types";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { commandClient } from "@/lib/command-client";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  files: CaseFile[];
  onFileOpen: (file: CaseFile) => void;
}

function getEntityIcon(entityType: string) {
  const normalized = entityType.toLowerCase();
  if (normalized.includes("note")) return StickyNote;
  if (normalized.includes("finding")) return AlertTriangle;
  if (normalized.includes("timeline")) return Clock3;
  if (normalized.includes("file")) return FileText;
  return Search;
}

export function SearchDialog({
  open,
  onOpenChange,
  caseId,
  files,
  onFileOpen,
}: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [hits, setHits] = useState<SearchHit[]>([]);

  const fileIndex = useMemo(() => new Map(files.map((f) => [f.id, f])), [files]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setHits([]);
      setLoading(false);
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      const res = await commandClient.searchFiles(caseId, trimmed, 50);
      if (cancelled) return;
      if (res.ok && res.data) {
        setHits(res.data);
      } else {
        setHits([]);
      }
      setLoading(false);
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [caseId, open, query]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search files, notes, findings, timeline…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {loading ? "Searching…" : query.trim().length < 2 ? "Type at least 2 characters." : "No results."}
        </CommandEmpty>
        <CommandGroup heading="Results">
          {hits.map((hit) => {
            const Icon = getEntityIcon(hit.entityType);
            const value = `${hit.entityType}:${hit.id}:${hit.title}`;
            const matchingFile =
              fileIndex.get(hit.id) ??
              files.find((f) => f.fileName.toLowerCase() === hit.title.toLowerCase());

            return (
              <CommandItem
                key={value}
                value={value}
                onSelect={() => {
                  if (matchingFile) {
                    onFileOpen(matchingFile);
                  }
                  onOpenChange(false);
                }}
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{hit.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {hit.entityType} · {hit.snippet}
                  </p>
                </div>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
