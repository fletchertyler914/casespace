"use client";

import { useState } from "react";
import type { CaseFile } from "@repo/types";
import { Button } from "@/components/ui/button";
import { WorkspaceSidePanel } from "@/components/workspace/workspace-side-panel";
import { commandClient } from "@/lib/command-client";

export interface DuplicateGroup {
  groupId: string;
  fileIds: string[];
  primaryFileId?: string;
}

interface DuplicatesPanelProps {
  caseId: string;
  groups: DuplicateGroup[];
  files: CaseFile[];
  onClose: () => void;
  onChanged: () => void;
}

function fileNameById(files: CaseFile[], id: string): string {
  return files.find((f) => f.id === id)?.fileName ?? id;
}

export function DuplicatesPanel({
  caseId,
  groups,
  files,
  onClose,
  onChanged,
}: DuplicatesPanelProps) {
  const [busyGroup, setBusyGroup] = useState<string | null>(null);

  async function setPrimary(groupId: string, fileId: string) {
    setBusyGroup(groupId);
    const res = await commandClient.markDuplicatePrimary(caseId, groupId, fileId);
    setBusyGroup(null);
    if (res.ok) {
      onChanged();
    }
  }

  async function mergeGroup(groupId: string, primaryFileId: string) {
    setBusyGroup(groupId);
    const res = await commandClient.mergeDuplicateMetadata(
      caseId,
      groupId,
      primaryFileId,
    );
    setBusyGroup(null);
    if (res.ok) {
      onChanged();
    }
  }

  return (
    <WorkspaceSidePanel title="Duplicates" onClose={onClose}>
      <div className="space-y-3 p-3">
        {groups.length === 0 ? (
          <p className="text-xs text-muted-foreground">No duplicate groups found.</p>
        ) : (
          groups.map((group) => (
            <div key={group.groupId} className="rounded-md border border-border/50 p-2">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Group {group.groupId.slice(0, 8)} ({group.fileIds.length} files)
              </p>
              <ul className="space-y-2">
                {group.fileIds.map((fileId) => {
                  const isPrimary = group.primaryFileId === fileId;
                  return (
                    <li
                      key={fileId}
                      className="flex items-center justify-between gap-2 rounded border border-border/40 px-2 py-1.5"
                    >
                      <span className="min-w-0 truncate text-xs">
                        {fileNameById(files, fileId)}
                      </span>
                      {isPrimary ? (
                        <span className="text-[11px] font-medium text-primary">Primary</span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-[11px]"
                          disabled={busyGroup === group.groupId}
                          onClick={() => void setPrimary(group.groupId, fileId)}
                        >
                          Set primary
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
              {group.primaryFileId ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 h-7 w-full text-[11px]"
                  disabled={busyGroup === group.groupId}
                  onClick={() => void mergeGroup(group.groupId, group.primaryFileId!)}
                >
                  Merge metadata into primary
                </Button>
              ) : (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Set a primary file before merging metadata.
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </WorkspaceSidePanel>
  );
}
