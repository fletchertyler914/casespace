"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme, type Theme } from "@/components/providers/theme-provider";
import { commandClient } from "@/lib/command-client";
import { useToast } from "@/hooks/use-toast";

interface AppSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppSettingsDialog({ open, onOpenChange }: AppSettingsDialogProps) {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [fileFilterPatterns, setFileFilterPatterns] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    void commandClient.getSystemFileFilterConfig().then((res) => {
      if (res.ok) {
        setFileFilterPatterns(res.data ?? "");
      }
    });
  }, [open]);

  async function handleSave() {
    setSaving(true);
    const res = await commandClient.saveSystemFileFilterConfig(
      fileFilterPatterns.trim(),
    );
    setSaving(false);
    if (!res.ok) {
      toast({
        title: "Failed to save settings",
        description: res.error?.message ?? "Unknown error",
        variant: "destructive",
      });
      return;
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>App settings</DialogTitle>
          <DialogDescription>
            Application-wide preferences. Workspace settings are configured per case.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="app-theme">Theme</Label>
            <Select value={theme} onValueChange={(v) => setTheme(v as Theme)}>
              <SelectTrigger id="app-theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="file-filter-patterns">
              System file filter patterns
            </Label>
            <Input
              id="file-filter-patterns"
              value={fileFilterPatterns}
              onChange={(e) => setFileFilterPatterns(e.target.value)}
              placeholder="e.g. .DS_Store, Thumbs.db, *.tmp"
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated patterns to skip during ingest (e.g. .DS_Store,
              Thumbs.db, desktop.ini).
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}