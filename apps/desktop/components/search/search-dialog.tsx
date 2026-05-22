"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Search, StickyNote, AlertTriangle, Clock3 } from "lucide-react";
import type { CaseFile, Finding, SearchHit, TimelineEvent } from "@repo/types";
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
  findings?: Finding[];
  timeline?: TimelineEvent[];
  onFileOpen: (file: CaseFile) => void;
  onOpenEntityPanel: (entityType: string) => void;
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
  findings = [],
  timeline = [],
  onFileOpen,
  onOpenEntityPanel,
}: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [hits, setHits] = useState<SearchHit[]>([]);

  const fileIndex = useMemo(() => new Map(files.map((f) => [f.id, f])), [files]);
  const groupedHits = useMemo(() => {
    const groups = new Map<string, SearchHit[]>();
    for (const hit of hits) {
      const key = hit.entityType || "other";
      groups.set(key, [...(groups.get(key) ?? []), hit]);
    }
    return groups;
  }, [hits]);

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
      const res = await commandClient.searchAll(caseId, trimmed, 80);
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
        {Array.from(groupedHits.entries()).map(([entityType, entityHits]) => (
          <CommandGroup key={entityType} heading={entityType}>
            {entityHits.map((hit) => {
              const Icon = getEntityIcon(hit.entityType);
              const value = `${hit.entityType}:${hit.id}:${hit.title}`;
              const entity = hit.entityType.toLowerCase();
              const matchingFile =
                entity.includes("file")
                  ? fileIndex.get(hit.id) ??
                    files.find(
                      (f) =>
                        f.fileName.toLowerCase() === hit.title.toLowerCase(),
                    )
                  : undefined;
              const matchingFinding =
                entity.includes("finding")
                  ? findings.find((f) => f.id === hit.id)
                  : undefined;
              const matchingTimeline =
                entity.includes("timeline")
                  ? timeline.find((t) => t.id === hit.id)
                  : undefined;

              return (
                <CommandItem
                  key={value}
                  value={value}
                  onSelect={() => {
                    if (matchingFile) {
                      onFileOpen(matchingFile);
                    } else if (matchingFinding || matchingTimeline) {
                      onOpenEntityPanel(hit.entityType);
                    } else {
                      onOpenEntityPanel(hit.entityType);
                    }
                    onOpenChange(false);
                  }}
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{hit.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{hit.snippet}</p>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
