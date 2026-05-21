"use client";

interface TextFilePreviewProps {
  content: string;
  variant?: "plain" | "markdown";
}

export function TextFilePreview({
  content,
  variant = "plain",
}: TextFilePreviewProps) {
  if (variant === "markdown") {
    return (
      <article className="prose prose-sm dark:prose-invert max-w-none p-6">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
          {content}
        </pre>
      </article>
    );
  }
  return (
    <pre className="whitespace-pre-wrap break-words p-4 font-mono text-xs leading-relaxed">
      {content}
    </pre>
  );
}
