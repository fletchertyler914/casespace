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
import {
  TiptapEditor,
  isEmptyEditorContent,
} from "@/components/editor/tiptap-editor";

interface CreateNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (content: string) => Promise<void>;
  initialContent?: string;
  title?: string;
  description?: string;
  confirmLabel?: string;
}

export function CreateNoteDialog({
  open,
  onOpenChange,
  onConfirm,
  initialContent = "",
  title = "New note",
  description = "Add a rich-text note to this case.",
  confirmLabel = "Save note",
}: CreateNoteDialogProps) {
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setContent(initialContent);
      setError(null);
      setLoading(false);
    }
  }, [open, initialContent]);

  async function handleConfirm() {
    if (isEmptyEditorContent(content)) {
      setError("Note content is required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onConfirm(content);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save note");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <TiptapEditor
          content={content}
          onChange={(html) => setContent(html)}
          placeholder="Write your note…"
        />
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={loading || isEmptyEditorContent(content)}
            onClick={() => void handleConfirm()}
          >
            {loading ? "Saving…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
