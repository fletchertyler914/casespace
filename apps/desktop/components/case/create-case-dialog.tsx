"use client";

import { File, FolderOpen, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
import { selectPaths } from "@/lib/tauri-dialog";
import { useToast } from "@/hooks/use-toast";

interface CreateCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (params: { name: string; sources: string[] }) => Promise<void>;
}

export function CreateCaseDialog({
  open,
  onOpenChange,
  onCreate,
}: CreateCaseDialogProps) {
  const [name, setName] = useState("");
  const [sources, setSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setName("");
      setSources([]);
    }
  }, [open]);

  const addFolders = useCallback(async () => {
    const picked = await selectPaths({
      directory: true,
      multiple: true,
      title: "Select folder(s) for case",
    });
    if (picked.length === 0) return;
    setSources((prev) => Array.from(new Set([...prev, ...picked])));
    if (!name && picked[0]) {
      const folder = picked[0].split(/[/\\]/).pop() ?? "Untitled Case";
      setName(folder);
    }
  }, [name]);

  const addFiles = useCallback(async () => {
    const picked = await selectPaths({
      directory: false,
      multiple: true,
      title: "Select file(s) for case",
    });
    if (picked.length === 0) return;
    setSources((prev) => Array.from(new Set([...prev, ...picked])));
  }, []);

  const removeSource = useCallback((index: number) => {
    setSources((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const submit = useCallback(async () => {
    if (!name.trim() || sources.length === 0) return;
    setLoading(true);
    try {
      await onCreate({ name: name.trim(), sources });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Failed to create case",
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [name, sources, onCreate, onOpenChange, toast]);

  return (
    <Dialog open={open} onOpenChange={loading ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Case</DialogTitle>
          <DialogDescription>
            Create a new case workspace. Select one or more files or folders as
            sources for ingestion.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="case-name">Case Name *</Label>
            <Input
              id="case-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Smith v. Jones Investigation"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Sources *</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={addFolders}
                className="flex-1"
                disabled={loading}
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                Add Folder(s)
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={addFiles}
                className="flex-1"
                disabled={loading}
              >
                <File className="mr-2 h-4 w-4" />
                Add File(s)
              </Button>
            </div>
            {sources.length > 0 ? (
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-border/30 p-2 dark:border-border/40">
                {sources.map((source, index) => (
                  <div
                    key={`${source}-${index}`}
                    className="flex items-center justify-between gap-2 rounded bg-muted p-2 text-sm"
                  >
                    <span className="flex-1 truncate" title={source}>
                      {source.split(/[/\\]/).pop() ?? source}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSource(index)}
                      className="h-6 w-6 flex-shrink-0 p-0"
                      disabled={loading}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No sources selected. Add at least one file or folder.
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!name.trim() || sources.length === 0 || loading}
          >
            {loading ? "Creating..." : "Create Case"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
