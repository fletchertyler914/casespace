"use client";

import { useState } from "react";
import type { Finding } from "@repo/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TiptapEditor,
  isEmptyEditorContent,
} from "@/components/editor/tiptap-editor";
import { WorkspaceSidePanel } from "@/components/workspace/workspace-side-panel";
import { commandClient } from "@/lib/command-client";

const SEVERITIES = ["low", "medium", "high", "critical"] as const;
type Severity = (typeof SEVERITIES)[number];

interface FindingsPanelProps {
  caseId: string;
  findings: Finding[];
  onClose: () => void;
  onChanged: () => void;
}

function descriptionToHtml(description: string): string {
  if (!description.trim()) return "";
  if (description.trimStart().startsWith("<")) return description;
  return `<p>${description.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
}

function severityLabel(severity: string): string {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

export function FindingsPanel({
  caseId,
  findings,
  onClose,
  onChanged,
}: FindingsPanelProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingBody, setEditingBody] = useState("");
  const [editingSeverity, setEditingSeverity] = useState<Severity>("medium");

  async function createFinding() {
    if (!title.trim()) return;
    setSaving(true);
    const res = await commandClient.createFinding(
      caseId,
      title.trim(),
      body,
      severity,
    );
    setSaving(false);
    if (res.ok) {
      setTitle("");
      setBody("");
      setSeverity("medium");
      onChanged();
    }
  }

  async function saveFinding(findingId: string) {
    if (!editingTitle.trim()) return;
    setSaving(true);
    const res = await commandClient.updateFinding(
      findingId,
      editingTitle.trim(),
      editingBody,
      editingSeverity,
    );
    setSaving(false);
    if (res.ok) {
      setEditingId(null);
      setEditingTitle("");
      setEditingBody("");
      setEditingSeverity("medium");
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
        <div className="space-y-1.5">
          <Label className="text-[11px] text-muted-foreground">Severity</Label>
          <Select
            value={severity}
            onValueChange={(value) => setSeverity(value as Severity)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEVERITIES.map((level) => (
                <SelectItem key={level} value={level}>
                  {severityLabel(level)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <TiptapEditor
          content={body}
          onChange={(html) => setBody(html)}
          placeholder="Description"
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
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground">
                        Severity
                      </Label>
                      <Select
                        value={editingSeverity}
                        onValueChange={(value) =>
                          setEditingSeverity(value as Severity)
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SEVERITIES.map((level) => (
                            <SelectItem key={level} value={level}>
                              {severityLabel(level)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <TiptapEditor
                      content={editingBody}
                      onChange={(html) => setEditingBody(html)}
                      placeholder="Description"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-7 px-2 text-[11px]"
                        disabled={saving || !editingTitle.trim()}
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
                          setEditingSeverity("medium");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{f.title}</p>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {severityLabel(f.severity ?? "medium")}
                      </span>
                    </div>
                    {!isEmptyEditorContent(descriptionToHtml(f.description)) ? (
                      <TiptapEditor
                        content={descriptionToHtml(f.description)}
                        readOnly
                        className="min-h-0 border-0 px-0 py-0"
                      />
                    ) : null}
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-[11px]"
                        onClick={() => {
                          setEditingId(f.id);
                          setEditingTitle(f.title);
                          setEditingBody(descriptionToHtml(f.description));
                          setEditingSeverity(
                            (f.severity as Severity | undefined) ?? "medium",
                          );
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
