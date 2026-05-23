"use client";

import { memo, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  WorkspaceNavigatorShell,
  workspaceNavigatorItemClass,
} from "@/components/workspace/workspace-navigator-shell";
import type { ReportSectionId } from "@/lib/report-sections";
import { useReportWorkspace } from "./report-workspace-context";
import { ReportSectionStatusDot } from "./report-section-status-badge";

interface ReportOutlineProps {
  onToggleNavigator: () => void;
  onSectionChange?: (section: ReportSectionId) => void;
}

export const ReportOutline = memo(function ReportOutline({
  onToggleNavigator,
  onSectionChange,
}: ReportOutlineProps) {
  const { outline, activeSectionId, scrollToSection } = useReportWorkspace();
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return outline;
    return outline.filter((s) => s.label.toLowerCase().includes(q));
  }, [outline, searchQuery]);

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
          Examination outline ({outline.length})
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
                onClick={() => {
                  scrollToSection(section.id);
                  onSectionChange?.(section.id as ReportSectionId);
                }}
              >
                <ReportSectionStatusDot status={section.status} />
                <span className="min-w-0 flex-1 truncate text-left">
                  {section.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </WorkspaceNavigatorShell>
  );
});

