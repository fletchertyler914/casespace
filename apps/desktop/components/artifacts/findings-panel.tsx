"use client";

import { useState } from "react";
import type { Finding } from "@repo/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { WorkspaceSidePanel } from "@/components/workspace/workspace-side-panel";
import { commandClient } from "@/lib/command-client";

interface FindingsPanelProps {
  caseId: string;
  findings: Finding[];
  onClose: () => void;
  onChanged: () => void;
}

export function FindingsPanel({
  caseId,
  findings,
  onClose,
  onChanged,
}: FindingsPanelProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingBody, setEditingBody] = useState("");

  async function createFinding() {
    if (!title.trim()) return;
    setSaving(true);
    const res = await commandClient.createFinding(
      caseId,
      title.trim(),
      body.trim(),
    );
    setSaving(false);
    if (res.ok) {
      setTitle("");
      setBody("");
      onChanged();
    }
  }

  async function saveFinding(findingId: string) {
    if (!editingTitle.trim()) return;
    setSaving(true);
    const res = await commandClient.updateFinding(
      findingId,
      editingTitle.trim(),
      editingBody.trim(),
    );
    setSaving(false);
    if (res.ok) {
      setEditingId(null);
      setEditingTitle("");
      setEditingBody("");
      onChanged();
    }
  }

  async function deleteFinding(findingId: string) {
    setSaving(true);
    const res = await commandClient.deleteFinding(findingId);
    setSaving(false);
    if (res.ok) {
      onChanged();
    }
  }

  return (
    <WorkspaceSidePanel title="Findings" onClose={onClose}>
      <div className="space-y-3 p-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Finding title"
          className="h-8 text-xs"
        />
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Description"
          rows={2}
          className="text-xs"
        />
        <Button
          size="sm"
          className="w-full"
          disabled={!title.trim() || saving}
          onClick={() => void createFinding()}
        >
          {saving ? "Saving…" : "Add finding"}
        </Button>
        <ul className="space-y-2">
          {findings.length === 0 ? (
            <li className="text-xs text-muted-foreground">No findings yet</li>
          ) : (
            findings.map((f) => (
              <li
                key={f.id}
                className="rounded-md border border-border/50 p-2 text-xs"
              >
                {editingId === f.id ? (
                  <div className="space-y-2">
                    <Input
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      className="h-8 text-xs"
                    />
                    <Textarea
                      value={editingBody}
                      onChange={(e) => setEditingBody(e.target.value)}
                      rows={2}
                      className="text-xs"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-7 px-2 text-[11px]"
                        disabled={saving}
                        onClick={() => void saveFinding(f.id)}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-[11px]"
                        onClick={() => {
                          setEditingId(null);
                          setEditingTitle("");
                          setEditingBody("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="font-medium">{f.title}</p>
                    <p className="text-muted-foreground">{f.description}</p>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-[11px]"
                        onClick={() => {
                          setEditingId(f.id);
                          setEditingTitle(f.title);
                          setEditingBody(f.description);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-[11px]"
                        disabled={saving}
                        onClick={() => void deleteFinding(f.id)}
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
