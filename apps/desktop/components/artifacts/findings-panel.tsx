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
                <p className="font-medium">{f.title}</p>
                <p className="text-muted-foreground">{f.description}</p>
              </li>
            ))
          )}
        </ul>
      </div>
    </WorkspaceSidePanel>
  );
}
