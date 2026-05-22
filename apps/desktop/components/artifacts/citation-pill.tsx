"use client";

import type { Citation, CitationKind } from "@repo/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { FileText, StickyNote, AlertTriangle, Clock, Briefcase } from "lucide-react";

const KIND_ICON: Record<CitationKind, typeof FileText> = {
  file: FileText,
  finding: AlertTriangle,
  note: StickyNote,
  timeline: Clock,
  case_field: Briefcase,
};

interface CitationPillProps {
  citation: Citation;
  onNavigate?: (citation: Citation) => void;
}

export function CitationPill({ citation, onNavigate }: CitationPillProps) {
  const Icon = KIND_ICON[citation.kind] ?? FileText;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="secondary"
            className="mr-1 mb-1 cursor-default text-[10px] font-normal"
            onClick={() => onNavigate?.(citation)}
          >
            <Icon className="mr-1 h-3 w-3 shrink-0" />
            {citation.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          <p className="font-medium">{citation.kind}</p>
          <p className="text-muted-foreground">{citation.id}</p>
          {citation.anchor ? (
            <p className="text-muted-foreground">{citation.anchor}</p>
          ) : null}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface CitationPillListProps {
  citations: Citation[];
  onNavigate?: (citation: Citation) => void;
}

export function CitationPillList({ citations, onNavigate }: CitationPillListProps) {
  if (citations.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap">
      {citations.map((c, i) => (
        <CitationPill key={`${c.kind}-${c.id}-${i}`} citation={c} onNavigate={onNavigate} />
      ))}
    </div>
  );
}
