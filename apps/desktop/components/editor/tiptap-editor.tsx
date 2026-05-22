"use client";

import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

export interface TiptapEditorProps {
  content?: string;
  onChange?: (html: string, text: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
}

export function TiptapEditor({
  content = "",
  onChange,
  placeholder = "Start writing…",
  readOnly = false,
  className,
}: TiptapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: readOnly }),
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor: nextEditor }) => {
      onChange?.(nextEditor.getHTML(), nextEditor.getText());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none min-h-[80px] px-3 py-2 text-xs focus:outline-none",
          readOnly && "cursor-default",
          className,
        ),
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (content !== editor.getHTML()) {
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!readOnly);
  }, [readOnly, editor]);

  if (!editor) {
    return (
      <div
        className={cn(
          "min-h-[80px] rounded-md border border-border/50 bg-background px-3 py-2 text-xs text-muted-foreground",
          className,
        )}
      >
        Loading editor…
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-md border border-border/50 bg-background",
        readOnly && "border-transparent bg-transparent px-0 py-0",
        className,
      )}
    >
      <EditorContent editor={editor} />
    </div>
  );
}

export function isEmptyEditorContent(html: string): boolean {
  return html.replace(/<[^>]*>/g, "").trim().length === 0;
}
