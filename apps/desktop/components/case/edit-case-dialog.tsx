"use client";

import { useEffect, useState } from "react";
import type { CaseSummary } from "@repo/types";
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
import { commandClient } from "@/lib/command-client";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On hold" },
  { value: "closed", label: "Closed" },
  { value: "archived", label: "Archived" },
] as const;

interface EditCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  case_: CaseSummary | null;
  onSaved?: (updated: CaseSummary) => void;
}

export function EditCaseDialog({
  open,
  onOpenChange,
  case_,
  onSaved,
}: EditCaseDialogProps) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState("active");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && case_) {
      setName(case_.name);
      setStatus(case_.status || "active");
      setError(null);
    }
  }, [open, case_]);

  async function handleSave() {
    if (!case_ || !name.trim()) return;
    setLoading(true);
    setError(null);
    const res = await commandClient.updateCaseMetadata(case_.id, {
      name: name.trim(),
      status,
    });
    setLoading(false);
    if (!res.ok || !res.data) {
      setError(res.error?.message ?? "Failed to update case");
      return;
    }
    onSaved?.(res.data);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={loading ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Edit case</DialogTitle>
          <DialogDescription>
            Update the case name and status.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="edit-case-name">Case name</Label>
            <Input
              id="edit-case-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-case-status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="edit-case-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={!name.trim() || loading}>
            {loading ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
