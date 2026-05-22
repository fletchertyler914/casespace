"use client";

import { marked } from "marked";
import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TextFilePreviewProps {
  content: string;
  variant?: "plain" | "markdown";
  /** When true, render with a monospaced code-style block (used for source code). */
  monospace?: boolean;
}

export function TextFilePreview({
  content,
  variant = "plain",
  monospace = true,
}: TextFilePreviewProps) {
  const markdownHtml = useMemo(() => {
    if (variant !== "markdown") return "";
    return marked.parse(content, { async: false }) as string;
  }, [content, variant]);

  if (variant === "markdown") {
    return (
      <ScrollArea className="h-full max-h-[calc(100vh-12rem)]">
        <article
          className="prose prose-sm dark:prose-invert max-w-none p-6"
          dangerouslySetInnerHTML={{ __html: markdownHtml }}
        />
      </ScrollArea>
    );
  }
  return (
    <ScrollArea className="h-full max-h-[calc(100vh-12rem)]">
      <pre
        className={
          monospace
            ? "whitespace-pre-wrap break-words p-4 font-mono text-xs leading-relaxed"
            : "whitespace-pre-wrap break-words p-4 text-sm leading-relaxed"
        }
      >
        {content}
      </pre>
    </ScrollArea>
  );
}
