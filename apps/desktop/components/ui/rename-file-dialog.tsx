"use client";

import { useEffect, useMemo, useState } from "react";
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
  extractExtension,
  getFilenameWithoutExtension,
  validateFilename,
} from "@/lib/file-validation";

interface RenameFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFileName: string;
  onConfirm: (newName: string) => Promise<void>;
}

export function RenameFileDialog({
  open,
  onOpenChange,
  currentFileName,
  onConfirm,
}: RenameFileDialogProps) {
  const [baseName, setBaseName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const ext = useMemo(() => extractExtension(currentFileName), [currentFileName]);

  useEffect(() => {
    if (open) {
      setBaseName(getFilenameWithoutExtension(currentFileName));
      setError(null);
      setLoading(false);
    }
  }, [open, currentFileName]);

  useEffect(() => {
    if (!open || !baseName.trim()) {
      setError(null);
      return;
    }
    const full = baseName.trim() + ext;
    const v = validateFilename(full);
    if (!v.valid) setError(v.error ?? "Invalid name");
    else if (full === currentFileName) setError("Name must be different");
    else setError(null);
  }, [baseName, currentFileName, ext, open]);

  async function handleConfirm() {
    const full = baseName.trim() + ext;
    if (error || full === currentFileName) return;
    setLoading(true);
    try {
      await onConfirm(full);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rename failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename file</DialogTitle>
          <DialogDescription>
            Current: {currentFileName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="rename-base">New name</Label>
          <div className="flex gap-2">
            <Input
              id="rename-base"
              value={baseName}
              onChange={(e) => setBaseName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void handleConfirm()}
            />
            {ext ? (
              <span className="flex items-center text-sm text-muted-foreground">
                {ext}
              </span>
            ) : null}
          </div>
          {error ? (
            <p className="text-xs text-destructive">{error}</p>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!!error || loading} onClick={() => void handleConfirm()}>
            {loading ? "Renaming…" : "Rename"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
