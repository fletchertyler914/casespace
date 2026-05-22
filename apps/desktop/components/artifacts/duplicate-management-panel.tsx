"use client";

import { useState } from "react";
import type { CaseFile } from "@repo/types";
import { Button } from "@/components/ui/button";
import { WorkspaceSidePanel } from "@/components/workspace/workspace-side-panel";
import { DuplicateBadge } from "@/components/artifacts/duplicate-badge";
import { DuplicateDecisionDialog } from "@/components/artifacts/duplicate-decision-dialog";
import { commandClient } from "@/lib/command-client";
import {
  duplicateStats,
  fileNameById,
  type DuplicateGroup,
} from "@/lib/duplicate-utils";

interface DuplicateManagementPanelProps {
  caseId: string;
  groups: DuplicateGroup[];
  files: CaseFile[];
  onClose: () => void;
  onChanged: () => void;
  onFileSelect?: (file: CaseFile) => void;
}

type PendingDecision = {
  action: "merge" | "remove";
  groupId: string;
  primaryFileId: string;
  targetFileId: string;
};

export function DuplicateManagementPanel({
  caseId,
  groups,
  files,
  onClose,
  onChanged,
  onFileSelect,
}: DuplicateManagementPanelProps) {
  const [busyGroup, setBusyGroup] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingDecision | null>(null);

  const stats = duplicateStats(groups);

  async function setPrimary(groupId: string, fileId: string) {
    setBusyGroup(groupId);
    const res = await commandClient.markDuplicatePrimary(caseId, groupId, fileId);
    setBusyGroup(null);
    if (res.ok) onChanged();
  }

  async function executeDecision(decision: PendingDecision) {
    setBusyGroup(decision.groupId);
    try {
      if (decision.action === "merge") {
        const res = await commandClient.mergeDuplicateMetadata(
          caseId,
          decision.groupId,
          decision.primaryFileId,
        );
        if (res.ok) onChanged();
      } else {
        const res = await commandClient.removeFileFromCase(caseId, decision.targetFileId);
        if (res.ok) onChanged();
      }
    } finally {
      setBusyGroup(null);
      setPending(null);
    }
  }

  return (
    <>
      <WorkspaceSidePanel title="Duplicates" onClose={onClose}>
        <div className="space-y-3 p-3">
          <div className="flex gap-3 rounded-md border border-border/50 bg-muted/20 px-3 py-2">
            <div>
              <p className="text-lg font-semibold tabular-nums">{stats.groupCount}</p>
              <p className="text-[11px] text-muted-foreground">
                group{stats.groupCount === 1 ? "" : "s"}
              </p>
            </div>
            <div>
              <p className="text-lg font-semibold tabular-nums">{stats.fileCount}</p>
              <p className="text-[11px] text-muted-foreground">
                duplicate file{stats.fileCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>

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
                    const file = files.find((f) => f.id === fileId);
                    return (
                      <li
                        key={fileId}
                        className="flex items-center justify-between gap-2 rounded border border-border/40 px-2 py-1.5"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <DuplicateBadge isPrimary={isPrimary} />
                          <button
                            type="button"
                            className="min-w-0 truncate text-left text-xs hover:underline"
                            disabled={!file || !onFileSelect}
                            onClick={() => file && onFileSelect?.(file)}
                          >
                            {fileNameById(files, fileId)}
                          </button>
                        </div>
                        {isPrimary ? (
                          <span className="text-[11px] font-medium text-primary">Primary</span>
                        ) : (
                          <div className="flex shrink-0 gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-[11px]"
                              disabled={busyGroup === group.groupId}
                              onClick={() => void setPrimary(group.groupId, fileId)}
                            >
                              Set primary
                            </Button>
                            {group.primaryFileId && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-[11px]"
                                disabled={busyGroup === group.groupId}
                                onClick={() =>
                                  setPending({
                                    action: "remove",
                                    groupId: group.groupId,
                                    primaryFileId: group.primaryFileId!,
                                    targetFileId: fileId,
                                  })
                                }
                              >
                                Remove
                              </Button>
                            )}
                          </div>
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
                    onClick={() =>
                      setPending({
                        action: "merge",
                        groupId: group.groupId,
                        primaryFileId: group.primaryFileId!,
                        targetFileId: group.fileIds.find(
                          (id) => id !== group.primaryFileId,
                        )!,
                      })
                    }
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

      {pending && (
        <DuplicateDecisionDialog
          open={pending != null}
          onOpenChange={(open) => !open && setPending(null)}
          action={pending.action}
          primaryFileName={fileNameById(files, pending.primaryFileId)}
          targetFileName={fileNameById(files, pending.targetFileId)}
          onConfirm={() => void executeDecision(pending)}
        />
      )}
    </>
  );
}
