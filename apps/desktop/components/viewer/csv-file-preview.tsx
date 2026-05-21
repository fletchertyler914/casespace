"use client";

import { useMemo } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

function parseDelimited(text: string, delimiter: string): string[][] {
  const lines = text.split(/\r?\n/).filter((line) => line.length > 0);
  return lines.slice(0, 500).map((line) => {
    if (delimiter === "\t") {
      return line.split("\t");
    }
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (ch === delimiter && !inQuotes) {
        cells.push(current.trim());
        current = "";
        continue;
      }
      current += ch;
    }
    cells.push(current.trim());
    return cells;
  });
}

interface CsvFilePreviewProps {
  content: string;
  fileName: string;
}

export function CsvFilePreview({ content, fileName }: CsvFilePreviewProps) {
  const delimiter = fileName.toLowerCase().endsWith(".tsv") ? "\t" : ",";
  const rows = useMemo(
    () => parseDelimited(content, delimiter),
    [content, delimiter],
  );
  const colCount = rows.reduce((max, r) => Math.max(max, r.length), 0);

  if (rows.length === 0) {
    return <p className="p-6 text-sm text-muted-foreground">Empty file</p>;
  }

  return (
    <ScrollArea className="h-full w-full">
      <table className="w-full border-collapse text-xs">
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              className={
                ri === 0
                  ? "bg-muted/80 font-medium"
                  : "border-t border-border/30 hover:bg-muted/30"
              }
            >
              {Array.from({ length: colCount }, (_, ci) => (
                <td
                  key={ci}
                  className="max-w-[240px] truncate whitespace-nowrap px-3 py-1.5"
                >
                  {row[ci] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length >= 500 && (
        <p className="p-2 text-center text-xs text-muted-foreground">
          Showing first 500 rows
        </p>
      )}
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
