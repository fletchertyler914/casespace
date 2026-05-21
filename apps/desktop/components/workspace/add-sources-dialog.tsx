"use client";

import { File, FolderOpen, X } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { selectPaths } from "@/lib/tauri-dialog";

interface AddSourcesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (paths: string[]) => Promise<void>;
}

export function AddSourcesDialog({
  open,
  onOpenChange,
  onAdd,
}: AddSourcesDialogProps) {
  const [paths, setPaths] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addFolders = useCallback(async () => {
    const picked = await selectPaths({
      directory: true,
      multiple: true,
      title: "Add folder sources",
    });
    if (picked.length) {
      setPaths((prev) => Array.from(new Set([...prev, ...picked])));
    }
  }, []);

  const addFiles = useCallback(async () => {
    const picked = await selectPaths({
      directory: false,
      multiple: true,
      title: "Add file sources",
    });
    if (picked.length) {
      setPaths((prev) => Array.from(new Set([...prev, ...picked])));
    }
  }, []);

  const submit = useCallback(async () => {
    if (paths.length === 0) return;
    setLoading(true);
    try {
      await onAdd(paths);
      setPaths([]);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }, [paths, onAdd, onOpenChange]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!loading) {
          onOpenChange(v);
          if (!v) setPaths([]);
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add sources</DialogTitle>
          <DialogDescription>
            Add folders or individual files. Each source is synced independently
            and kept up to date when auto-sync is enabled.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={addFolders}
              disabled={loading}
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              Folders
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={addFiles}
              disabled={loading}
            >
              <File className="mr-2 h-4 w-4" />
              Files
            </Button>
          </div>
          {paths.length > 0 ? (
            <ul className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-2 text-sm">
              {paths.map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate" title={p}>
                    {p.split(/[/\\]/).pop() ?? p}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() =>
                      setPaths((prev) => prev.filter((x) => x !== p))
                    }
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No paths selected.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={paths.length === 0 || loading}
          >
            {loading ? "Adding…" : "Add & sync"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
