"use client";

import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ApprovalItem {
  id: string;
  tool: string;
  summary: string;
}

interface ApprovalsQueueProps {
  items: ApprovalItem[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function ApprovalsQueue({
  items,
  onApprove,
  onReject,
}: ApprovalsQueueProps) {
  if (items.length === 0) return null;

  return (
    <div className="border-b border-border/40 bg-amber-500/5 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium">
        <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
        Pending approvals
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-md border border-amber-500/30 bg-background p-2 text-[11px]"
          >
            <p className="font-medium">{item.tool}</p>
            <p className="text-muted-foreground">{item.summary}</p>
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                className="h-6 px-2 text-[10px]"
                onClick={() => onApprove(item.id)}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-6 px-2 text-[10px]"
                onClick={() => onReject(item.id)}
              >
                Reject
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
