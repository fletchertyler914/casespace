import type { ReactNode } from "react";

export function mockTiptapModule() {
  return {
    TiptapEditor: ({
      content = "",
      onChange,
      placeholder,
      readOnly,
    }: {
      content?: string;
      onChange?: (html: string, text: string) => void;
      placeholder?: string;
      readOnly?: boolean;
    }) => (
      <textarea
        aria-label={placeholder ?? "editor"}
        data-testid="tiptap-editor"
        readOnly={readOnly}
        value={content}
        onChange={(e) => {
          const v = e.target.value;
          onChange?.(`<p>${v}</p>`, v);
        }}
      />
    ),
    isEmptyEditorContent: (html: string) =>
      !html.replace(/<[^>]+>/g, "").trim(),
  };
}

export function withTiptapMock(children: ReactNode) {
  return children;
}
