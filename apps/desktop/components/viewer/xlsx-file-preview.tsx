"use client";

import { ScrollArea } from "@/components/ui/scroll-area";

type SheetRow = Array<string | number | null | undefined>;

interface XlsxFilePreviewProps {
  rows: SheetRow[];
  sheetName?: string;
}

function cellValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

export function XlsxFilePreview({ rows, sheetName }: XlsxFilePreviewProps) {
  if (rows.length === 0) {
    return (
      <p className="p-6 text-sm text-muted-foreground">This spreadsheet has no data.</p>
    );
  }

  const colCount = Math.max(...rows.map((r) => r.length), 1);

  return (
    <ScrollArea className="h-full max-h-[calc(100vh-12rem)]">
      {sheetName ? (
        <p className="border-b border-border/40 px-4 py-2 text-xs text-muted-foreground">
          Sheet: {sheetName}
        </p>
      ) : null}
      <div className="overflow-x-auto p-4">
        <table className="w-full min-w-max border-collapse text-xs">
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={
                  rowIndex === 0
                    ? "bg-muted/60 font-medium"
                    : rowIndex % 2 === 0
                      ? "bg-background"
                      : "bg-muted/20"
                }
              >
                {Array.from({ length: colCount }, (_, colIndex) => (
                  <td
                    key={colIndex}
                    className="border border-border/40 px-2 py-1 align-top whitespace-pre-wrap"
                  >
                    {cellValue(row[colIndex])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ScrollArea>
  );
}
