"use client";

import { useState } from "react";
import type { TimelineEvent } from "@repo/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { WorkspaceSidePanel } from "@/components/workspace/workspace-side-panel";
import { commandClient } from "@/lib/command-client";

interface TimelinePanelProps {
  caseId: string;
  events: TimelineEvent[];
  onClose: () => void;
  onChanged: () => void;
}

export function TimelinePanel({
  caseId,
  events,
  onClose,
  onChanged,
}: TimelinePanelProps) {
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  async function createEvent() {
    if (!draft.trim()) return;
    setSaving(true);
    const res = await commandClient.createTimelineEvent(caseId, draft.trim());
    setSaving(false);
    if (res.ok) {
      setDraft("");
      onChanged();
    }
  }

  return (
    <WorkspaceSidePanel title="Timeline" onClose={onClose}>
      <div className="space-y-3 p-3">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Event description"
          rows={2}
          className="text-xs"
        />
        <Button
          size="sm"
          className="w-full"
          disabled={!draft.trim() || saving}
          onClick={() => void createEvent()}
        >
          {saving ? "Saving…" : "Add event"}
        </Button>
        <ul className="space-y-2">
          {events.length === 0 ? (
            <li className="text-xs text-muted-foreground">No events yet</li>
          ) : (
            events.map((e) => (
              <li
                key={e.id}
                className="rounded-md border border-border/50 p-2 text-xs"
              >
                <p>{e.description}</p>
                <p className="text-muted-foreground">{e.occurredAt}</p>
              </li>
            ))
          )}
        </ul>
      </div>
    </WorkspaceSidePanel>
  );
}
