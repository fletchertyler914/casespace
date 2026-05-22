"use client";

import { memo, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  WorkspaceNavigatorShell,
  workspaceNavigatorItemClass,
} from "@/components/workspace/workspace-navigator-shell";

export interface ReportSectionItem {
  id: string;
  label: string;
  count?: number;
}

interface ReportSectionNavigatorProps {
  sections: ReportSectionItem[];
  activeSectionId: string;
  onSectionSelect: (id: string) => void;
  onToggleNavigator: () => void;
}

export const ReportSectionNavigator = memo(function ReportSectionNavigator({
  sections,
  activeSectionId,
  onSectionSelect,
  onToggleNavigator,
}: ReportSectionNavigatorProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return sections;
    return sections.filter((s) => s.label.toLowerCase().includes(q));
  }, [sections, searchQuery]);

  return (
    <WorkspaceNavigatorShell
      onToggleNavigator={onToggleNavigator}
      header={
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter sections…"
            className="h-8 pl-8 text-xs"
          />
        </div>
      }
      listHeader={
        <p className="mb-1 px-3 py-1.5 text-xs font-medium text-muted-foreground">
          Examination outline ({sections.length})
        </p>
      }
    >
      <ul>
        {filtered.map((section) => {
          const active = section.id === activeSectionId;
          return (
            <li key={section.id}>
              <button
                type="button"
                className={workspaceNavigatorItemClass(active)}
                onClick={() => onSectionSelect(section.id)}
              >
                <span className="min-w-0 flex-1 truncate">{section.label}</span>
                {section.count != null ? (
                  <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                    {section.count}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </WorkspaceNavigatorShell>
  );
});
