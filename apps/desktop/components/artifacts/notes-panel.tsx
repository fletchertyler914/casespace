"use client";

import { useState } from "react";
import type { Note } from "@repo/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { WorkspaceSidePanel } from "@/components/workspace/workspace-side-panel";
import { commandClient } from "@/lib/command-client";

interface NotesPanelProps {
  caseId: string;
  notes: Note[];
  onClose: () => void;
  onChanged: () => void;
}

export function NotesPanel({
  caseId,
  notes,
  onClose,
  onChanged,
}: NotesPanelProps) {
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  async function createNote() {
    if (!draft.trim()) return;
    setSaving(true);
    const res = await commandClient.createNote(caseId, draft.trim());
    setSaving(false);
    if (res.ok) {
      setDraft("");
      onChanged();
    }
  }

  return (
    <WorkspaceSidePanel title="Notes" onClose={onClose}>
      <div className="space-y-3 p-3">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="New note…"
          rows={3}
          className="text-xs"
        />
        <Button
          size="sm"
          className="w-full"
          disabled={!draft.trim() || saving}
          onClick={() => void createNote()}
        >
          {saving ? "Saving…" : "Add note"}
        </Button>
        <ul className="space-y-2">
          {notes.length === 0 ? (
            <li className="text-xs text-muted-foreground">No notes yet</li>
          ) : (
            notes.map((n) => (
              <li
                key={n.id}
                className="rounded-md border border-border/50 p-2 text-xs leading-relaxed"
              >
                {n.content}
              </li>
            ))
          )}
        </ul>
      </div>
    </WorkspaceSidePanel>
  );
}
