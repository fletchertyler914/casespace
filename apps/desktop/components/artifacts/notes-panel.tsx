"use client";

import { useState } from "react";
import type { Note } from "@repo/types";
import { CreateNoteDialog } from "@/components/artifacts/create-note-dialog";
import { Button } from "@/components/ui/button";
import {
  TiptapEditor,
  isEmptyEditorContent,
} from "@/components/editor/tiptap-editor";
import { WorkspaceSidePanel } from "@/components/workspace/workspace-side-panel";
import { commandClient } from "@/lib/command-client";

interface NotesPanelProps {
  caseId: string;
  notes: Note[];
  onClose: () => void;
  onChanged: () => void;
}

function noteContentToHtml(content: string): string {
  if (!content.trim()) return "";
  if (content.trimStart().startsWith("<")) return content;
  return `<p>${content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
}

export function NotesPanel({
  caseId,
  notes,
  onClose,
  onChanged,
}: NotesPanelProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

  async function createNote(content: string) {
    setSaving(true);
    const res = await commandClient.createNote(caseId, content);
    setSaving(false);
    if (!res.ok) {
      throw new Error(res.error?.message ?? "Failed to create note");
    }
    onChanged();
  }

  async function saveEdit(noteId: string) {
    if (isEmptyEditorContent(editingContent)) return;
    setSaving(true);
    const res = await commandClient.updateNote(noteId, editingContent);
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
        <Button
          size="sm"
          className="w-full"
          disabled={saving}
          onClick={() => setCreateOpen(true)}
        >
          New note
        </Button>
        <CreateNoteDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onConfirm={createNote}
        />
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
                    <TiptapEditor
                      content={editingContent}
                      onChange={(html) => setEditingContent(html)}
                      placeholder="Edit note…"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-7 px-2 text-[11px]"
                        disabled={saving || isEmptyEditorContent(editingContent)}
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
                    <TiptapEditor
                      content={noteContentToHtml(n.content)}
                      readOnly
                      className="min-h-0 border-0 px-0 py-0"
                    />
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
                          setEditingContent(noteContentToHtml(n.content));
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
