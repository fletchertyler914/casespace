"use client";

import { FileText, ShieldAlert } from "lucide-react";
import type {
  AiEntityDraft,
  AiFindingDraft,
  AiTimelineDraft,
} from "@repo/types";
import { Button } from "@/components/ui/button";

export interface ApprovalItem {
  id: string;
  tool: string;
  summary: string;
}

export type AiDraftApprovalItem =
  | { kind: "finding"; draft: AiFindingDraft }
  | { kind: "timeline"; draft: AiTimelineDraft }
  | { kind: "entity"; draft: AiEntityDraft }
  | { kind: "tool"; item: ApprovalItem };

interface ApprovalsQueueProps {
  items?: ApprovalItem[];
  aiDrafts?: AiDraftApprovalItem[];
  fileNames?: Record<string, string>;
  onApprove: (item: AiDraftApprovalItem | ApprovalItem) => void;
  onReject: (item: AiDraftApprovalItem | ApprovalItem) => void;
}

function normalizeItems(
  items: ApprovalItem[] | undefined,
  aiDrafts: AiDraftApprovalItem[] | undefined,
): AiDraftApprovalItem[] {
  const out: AiDraftApprovalItem[] = aiDrafts ?? [];
  for (const item of items ?? []) {
    out.push({ kind: "tool", item });
  }
  return out;
}

function fileLabel(fileId: string | undefined, fileNames?: Record<string, string>) {
  if (!fileId) return "Unknown file";
  return fileNames?.[fileId] ?? fileId.slice(0, 8);
}

export function ApprovalsQueue({
  items,
  aiDrafts,
  fileNames,
  onApprove,
  onReject,
}: ApprovalsQueueProps) {
  const queue = normalizeItems(items, aiDrafts);
  if (queue.length === 0) return null;

  return (
    <div className="border-b border-border/40 bg-amber-500/5 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium">
        <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
        Pending approvals ({queue.length})
      </div>
      <ul className="space-y-2">
        {queue.map((entry) => {
          if (entry.kind === "tool") {
            const { item } = entry;
            return (
              <li
                key={item.id}
                className="rounded-md border border-amber-500/30 bg-background p-2 text-[11px]"
              >
                <p className="font-medium">{item.tool}</p>
                <p className="text-muted-foreground">{item.summary}</p>
                <ApprovalActions
                  onApprove={() => onApprove(item)}
                  onReject={() => onReject(item)}
                />
              </li>
            );
          }

          if (entry.kind === "finding") {
            const { draft } = entry;
            const anchor = draft.pageAnchors?.[0];
            const fileId = draft.linkedFileIds?.[0];
            return (
              <li
                key={draft.id}
                className="rounded-md border border-amber-500/30 bg-background p-2 text-[11px]"
              >
                <p className="font-medium">AI finding — {draft.title}</p>
                <p className="mt-1 text-muted-foreground line-clamp-3">
                  {draft.description}
                </p>
                <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  {fileLabel(fileId, fileNames)}
                  {anchor ? ` · ${anchor}` : ""}
                  {" · "}
                  {draft.severity}
                </p>
                <ApprovalActions
                  onApprove={() => onApprove(entry)}
                  onReject={() => onReject(entry)}
                />
              </li>
            );
          }

          if (entry.kind === "timeline") {
            const { draft } = entry;
            return (
              <li
                key={draft.id}
                className="rounded-md border border-amber-500/30 bg-background p-2 text-[11px]"
              >
                <p className="font-medium">AI timeline event</p>
                <p className="mt-1 text-muted-foreground">{draft.description}</p>
                <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  {fileLabel(draft.sourceFileId, fileNames)}
                  {draft.pageAnchor ? ` · ${draft.pageAnchor}` : ""}
                </p>
                <ApprovalActions
                  onApprove={() => onApprove(entry)}
                  onReject={() => onReject(entry)}
                />
              </li>
            );
          }

          const { draft } = entry;
          return (
            <li
              key={draft.id}
              className="rounded-md border border-amber-500/30 bg-background p-2 text-[11px]"
            >
              <p className="font-medium">
                AI entity — {draft.kind}: {draft.value}
              </p>
              <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                <FileText className="h-3 w-3" />
                {fileLabel(draft.sourceFileId, fileNames)}
                {draft.pageAnchor ? ` · ${draft.pageAnchor}` : ""}
              </p>
              <ApprovalActions
                onApprove={() => onApprove(entry)}
                onReject={() => onReject(entry)}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ApprovalActions({
  onApprove,
  onReject,
}: {
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="mt-2 flex gap-2">
      <Button size="sm" className="h-6 px-2 text-[10px]" onClick={onApprove}>
        Approve
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-6 px-2 text-[10px]"
        onClick={onReject}
      >
        Reject
      </Button>
    </div>
  );
}
