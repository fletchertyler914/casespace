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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDescription, setEditingDescription] = useState("");

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

  async function saveEvent(eventId: string) {
    if (!editingDescription.trim()) return;
    setSaving(true);
    const res = await commandClient.updateTimelineEvent(
      eventId,
      editingDescription.trim(),
    );
    setSaving(false);
    if (res.ok) {
      setEditingId(null);
      setEditingDescription("");
      onChanged();
    }
  }

  async function deleteEvent(eventId: string) {
    setSaving(true);
    const res = await commandClient.deleteTimelineEvent(eventId);
    setSaving(false);
    if (res.ok) {
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
                {editingId === e.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editingDescription}
                      onChange={(event) => setEditingDescription(event.target.value)}
                      rows={2}
                      className="text-xs"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-7 px-2 text-[11px]"
                        disabled={saving}
                        onClick={() => void saveEvent(e.id)}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-[11px]"
                        onClick={() => {
                          setEditingId(null);
                          setEditingDescription("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p>{e.description}</p>
                    <p className="text-muted-foreground">{e.occurredAt}</p>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-[11px]"
                        onClick={() => {
                          setEditingId(e.id);
                          setEditingDescription(e.description);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-[11px]"
                        disabled={saving}
                        onClick={() => void deleteEvent(e.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    </WorkspaceSidePanel>
  );
}
