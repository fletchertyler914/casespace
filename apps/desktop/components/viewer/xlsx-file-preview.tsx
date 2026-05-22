"use client";

import { useMemo, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

type SheetRow = Array<string | number | null | undefined>;

export type XlsxSheetData = Record<string, SheetRow[]>;

interface XlsxFilePreviewProps {
  sheets: XlsxSheetData;
  initialSheet?: string;
}

function cellValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function SheetTable({ rows }: { rows: SheetRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="p-6 text-sm text-muted-foreground">This sheet has no data.</p>
    );
  }

  const colCount = Math.max(...rows.map((r) => r.length), 1);
  const headerRow = rows[0] ?? [];

  return (
    <div className="overflow-x-auto p-4">
      <table className="w-full min-w-max border-collapse text-xs">
        <thead>
          <tr className="bg-muted/60 font-medium">
            {Array.from({ length: colCount }, (_, colIndex) => (
              <th
                key={colIndex}
                className="border border-border/40 px-2 py-1 text-left align-top whitespace-pre-wrap"
              >
                {cellValue(headerRow[colIndex]) || `Col ${colIndex + 1}`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(1).map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={rowIndex % 2 === 0 ? "bg-background" : "bg-muted/20"}
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
  );
}

export function XlsxFilePreview({ sheets, initialSheet }: XlsxFilePreviewProps) {
  const sheetNames = useMemo(() => Object.keys(sheets), [sheets]);
  const [activeSheet, setActiveSheet] = useState(
    initialSheet && sheets[initialSheet] ? initialSheet : sheetNames[0] ?? "",
  );

  const rows = sheets[activeSheet] ?? [];

  if (sheetNames.length === 0) {
    return (
      <p className="p-6 text-sm text-muted-foreground">
        This spreadsheet has no data.
      </p>
    );
  }

  return (
    <ScrollArea className="h-full max-h-[calc(100vh-12rem)]">
      {sheetNames.length > 1 ? (
        <div className="flex flex-wrap gap-1 border-b border-border/40 px-2 py-2">
          {sheetNames.map((name) => (
            <Button
              key={name}
              type="button"
              size="sm"
              variant={name === activeSheet ? "secondary" : "ghost"}
              className="h-7 text-xs"
              onClick={() => setActiveSheet(name)}
            >
              {name}
            </Button>
          ))}
        </div>
      ) : (
        <p className="border-b border-border/40 px-4 py-2 text-xs text-muted-foreground">
          Sheet: {activeSheet}
        </p>
      )}
      <SheetTable rows={rows} />
    </ScrollArea>
  );
}
