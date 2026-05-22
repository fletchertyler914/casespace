"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { syntaxLanguageFromFileName } from "@/lib/code-language";

const CodeHighlighter = dynamic(
  () =>
    import("./code-highlighter-inner").then((m) => m.CodeHighlighterInner),
  {
    ssr: false,
    loading: () => <Skeleton className="mx-4 h-64 w-[calc(100%-2rem)]" />,
  },
);

interface CodeFilePreviewProps {
  content: string;
  fileName: string;
}

export function CodeFilePreview({ content, fileName }: CodeFilePreviewProps) {
  const language = syntaxLanguageFromFileName(fileName);
  return <CodeHighlighter content={content} language={language} />;
}
