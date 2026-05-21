"use client";

import { ScrollArea } from "@/components/ui/scroll-area";

interface DocxFilePreviewProps {
  html: string;
}

export function DocxFilePreview({ html }: DocxFilePreviewProps) {
  return (
    <ScrollArea className="h-full max-h-[calc(100vh-12rem)]">
      <article
        className="prose prose-sm dark:prose-invert max-w-none p-6"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </ScrollArea>
  );
}
