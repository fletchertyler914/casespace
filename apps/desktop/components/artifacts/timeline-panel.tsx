"use client";

import { useState } from "react";
import type { TimelineEvent } from "@repo/types";
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
import { Textarea } from "@/components/ui/textarea";
import { WorkspaceSidePanel } from "@/components/workspace/workspace-side-panel";
import { commandClient } from "@/lib/command-client";

const EVENT_TYPES = [
  "manual",
  "document",
  "meeting",
  "deadline",
  "other",
] as const;
type EventType = (typeof EVENT_TYPES)[number];

interface TimelinePanelProps {
  caseId: string;
  events: TimelineEvent[];
  onClose: () => void;
  onChanged: () => void;
}

function toDatetimeLocal(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocal(value: string): string {
  return new Date(value).toISOString();
}

function defaultDatetimeLocal(): string {
  return toDatetimeLocal(new Date().toISOString());
}

function eventTypeLabel(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function TimelinePanel({
  caseId,
  events,
  onClose,
  onChanged,
}: TimelinePanelProps) {
  const [draft, setDraft] = useState("");
  const [occurredAt, setOccurredAt] = useState(defaultDatetimeLocal);
  const [eventType, setEventType] = useState<EventType>("manual");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDescription, setEditingDescription] = useState("");
  const [editingOccurredAt, setEditingOccurredAt] = useState("");
  const [editingEventType, setEditingEventType] = useState<EventType>("manual");

  async function createEvent() {
    if (!draft.trim()) return;
    setSaving(true);
    const res = await commandClient.createTimelineEvent(
      caseId,
      draft.trim(),
      fromDatetimeLocal(occurredAt),
      eventType,
    );
    setSaving(false);
    if (res.ok) {
      setDraft("");
      setOccurredAt(defaultDatetimeLocal());
      setEventType("manual");
      onChanged();
    }
  }

  async function saveEvent(eventId: string) {
    if (!editingDescription.trim()) return;
    setSaving(true);
    const res = await commandClient.updateTimelineEvent(
      eventId,
      editingDescription.trim(),
      fromDatetimeLocal(editingOccurredAt),
      editingEventType,
    );
    setSaving(false);
    if (res.ok) {
      setEditingId(null);
      setEditingDescription("");
      setEditingOccurredAt("");
      setEditingEventType("manual");
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
        <div className="space-y-1.5">
          <Label htmlFor="timeline-occurred-at" className="text-[11px] text-muted-foreground">
            Occurred at
          </Label>
          <Input
            id="timeline-occurred-at"
            type="datetime-local"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] text-muted-foreground">Event type</Label>
          <Select
            value={eventType}
            onValueChange={(value) => setEventType(value as EventType)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {eventTypeLabel(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground">
                        Occurred at
                      </Label>
                      <Input
                        type="datetime-local"
                        value={editingOccurredAt}
                        onChange={(event) => setEditingOccurredAt(event.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground">
                        Event type
                      </Label>
                      <Select
                        value={editingEventType}
                        onValueChange={(value) =>
                          setEditingEventType(value as EventType)
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EVENT_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {eventTypeLabel(type)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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
                          setEditingOccurredAt("");
                          setEditingEventType("manual");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p>{e.description}</p>
                      <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {eventTypeLabel(e.eventType ?? "manual")}
                      </span>
                    </div>
                    <p className="text-muted-foreground">
                      {new Date(e.occurredAt).toLocaleString()}
                    </p>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-[11px]"
                        onClick={() => {
                          setEditingId(e.id);
                          setEditingDescription(e.description);
                          setEditingOccurredAt(toDatetimeLocal(e.occurredAt));
                          setEditingEventType(
                            (e.eventType as EventType | undefined) ?? "manual",
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
