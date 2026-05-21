"use client";

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
  if (variant === "markdown") {
    return (
      <ScrollArea className="h-full max-h-[calc(100vh-12rem)]">
        <article className="prose prose-sm dark:prose-invert max-w-none p-6">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
            {content}
          </pre>
        </article>
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
