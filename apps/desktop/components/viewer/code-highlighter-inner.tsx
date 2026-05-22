"use client";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodeHighlighterInnerProps {
  content: string;
  language: string;
}

export function CodeHighlighterInner({
  content,
  language,
}: CodeHighlighterInnerProps) {
  return (
    <div className="min-h-0 p-2">
      <SyntaxHighlighter
        language={language}
        style={oneLight}
        customStyle={{
          margin: 0,
          padding: "1rem",
          fontSize: "0.75rem",
          lineHeight: 1.6,
          borderRadius: "0.375rem",
          maxHeight: "calc(100vh - 12rem)",
        }}
        showLineNumbers
        wrapLongLines
      >
        {content}
      </SyntaxHighlighter>
    </div>
  );
}
