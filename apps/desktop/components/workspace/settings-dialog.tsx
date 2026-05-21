"use client";

import type { WorkspacePreferences } from "@repo/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefs: WorkspacePreferences;
  onSave: (next: WorkspacePreferences) => void;
}

export function SettingsDialog({
  open,
  onOpenChange,
  prefs,
  onSave,
}: SettingsDialogProps) {
  const nextPrefs: WorkspacePreferences = {
    autoSyncEnabled: prefs.autoSyncEnabled ?? true,
    autoSyncIntervalMinutes: prefs.autoSyncIntervalMinutes ?? 5,
    notesVisible: prefs.notesVisible ?? false,
    findingsVisible: prefs.findingsVisible ?? false,
    timelineVisible: prefs.timelineVisible ?? false,
    duplicatesVisible: prefs.duplicatesVisible ?? false,
    reportsVisible: prefs.reportsVisible ?? false,
    timeVisible: prefs.timeVisible ?? false,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Workspace settings</DialogTitle>
          <DialogDescription>
            Configure sync behavior and default side panels for this case.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <p className="text-sm font-medium">Sync</p>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={nextPrefs.autoSyncEnabled}
                onCheckedChange={(checked) =>
                  onSave({ ...nextPrefs, autoSyncEnabled: checked === true })
                }
              />
              Enable auto-sync
            </label>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Auto-sync interval</p>
              <Select
                value={String(nextPrefs.autoSyncIntervalMinutes)}
                onValueChange={(value) =>
                  onSave({
                    ...nextPrefs,
                    autoSyncIntervalMinutes: Number(value),
                  })
                }
              >
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 minute</SelectItem>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Default side panels</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {(
                [
                  ["notesVisible", "Notes"],
                  ["findingsVisible", "Findings"],
                  ["timelineVisible", "Timeline"],
                  ["duplicatesVisible", "Duplicates"],
                  ["reportsVisible", "Reports"],
                  ["timeVisible", "Time"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2">
                  <Checkbox
                    checked={nextPrefs[key] === true}
                    onCheckedChange={(checked) =>
                      onSave({ ...nextPrefs, [key]: checked === true })
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
