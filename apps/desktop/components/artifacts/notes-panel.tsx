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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

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

  async function saveEdit(noteId: string) {
    if (!editingContent.trim()) return;
    setSaving(true);
    const res = await commandClient.updateNote(noteId, editingContent.trim());
    setSaving(false);
    if (res.ok) {
      setEditingId(null);
      setEditingContent("");
      onChanged();
    }
  }

  async function deleteNote(noteId: string) {
    setSaving(true);
    const res = await commandClient.deleteNote(noteId);
    setSaving(false);
    if (res.ok) {
      onChanged();
    }
  }

  async function togglePinned(noteId: string) {
    const res = await commandClient.toggleNotePinned(noteId);
    if (res.ok) {
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
                {editingId === n.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      rows={3}
                      className="text-xs"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-7 px-2 text-[11px]"
                        disabled={saving}
                        onClick={() => void saveEdit(n.id)}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-[11px]"
                        onClick={() => {
                          setEditingId(null);
                          setEditingContent("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p>{n.content}</p>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant={n.pinned ? "default" : "outline"}
                        className="h-6 px-2 text-[11px]"
                        onClick={() => void togglePinned(n.id)}
                      >
                        {n.pinned ? "Pinned" : "Pin"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-[11px]"
                        onClick={() => {
                          setEditingId(n.id);
                          setEditingContent(n.content);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-[11px]"
                        disabled={saving}
                        onClick={() => void deleteNote(n.id)}
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
