"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";

interface ReportSectionEditorProps {
  value: string;
  disabled?: boolean;
  onChange: (text: string) => void;
  onBlur?: () => void;
}

/** Plain-text oriented Tiptap editor for report section bodies. */
export function ReportSectionEditor({
  value,
  disabled,
  onChange,
  onBlur,
}: ReportSectionEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [3, 4] } }),
      Link.configure({ openOnClick: false }),
    ],
    content: valueToHtml(value),
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getText({ blockSeparator: "\n" }));
    },
    onBlur: () => onBlur?.(),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none min-h-[120px] rounded-md border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getText({ blockSeparator: "\n" });
    if (current !== value) {
      editor.commands.setContent(valueToHtml(value), false);
    }
  }, [editor, value]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  if (!editor) return null;

  return <EditorContent editor={editor} />;
}

function valueToHtml(text: string): string {
  if (!text.trim()) return "<p></p>";
  return text
    .split("\n")
    .map((line) => `<p>${escapeHtml(line) || "<br>"}</p>`)
    .join("");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
