"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Search,
  Trash2,
} from "lucide-react";
import type { CaseFile } from "@repo/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { commandClient } from "@/lib/command-client";
import {
  compareFiles,
  FILE_TABLE_COLUMNS,
  formatFileSize,
  formatModifiedAt,
  type FileTableSortKey,
  type SortDirection,
} from "@/lib/file-table/columns";
import {
  DEFAULT_COLUMN_CONFIG,
  parseColumnConfig,
  type TableColumn,
} from "@/lib/mapping/types";
import { getFileIcon } from "@/lib/file-icon-utils";
import { DuplicateBadge } from "@/components/artifacts/duplicate-badge";
import { findGroupForFile, type DuplicateGroup } from "@/lib/duplicate-utils";

const FILE_STATUSES = [
  "unreviewed",
  "in_review",
  "reviewed",
  "flagged",
  "excluded",
] as const;

const ALL_STATUSES = "all" as const;

interface FileTableProps {
  caseId: string;
  files: CaseFile[];
  currentFile: CaseFile | null;
  duplicateGroups: DuplicateGroup[];
  duplicateFileIds: Set<string>;
  onFileSelect: (file: CaseFile) => void;
  onStatusChange: (fileId: string, status: string) => void;
  onFilesChanged: () => void;
}

export const FileTable = memo(function FileTable({
  caseId,
  files,
  currentFile,
  duplicateGroups,
  duplicateFileIds,
  onFileSelect,
  onStatusChange,
  onFilesChanged,
}: FileTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUSES);
  const [sortKey, setSortKey] = useState<FileTableSortKey>("fileName");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [tableColumns, setTableColumns] = useState<TableColumn[]>(
    DEFAULT_COLUMN_CONFIG.columns,
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await commandClient.getColumnConfigDb(caseId);
      if (cancelled) return;
      const parsed = parseColumnConfig(res.ok ? res.data ?? null : null);
      setTableColumns(
        [...parsed.columns]
          .filter((col) => col.visible)
          .sort((a, b) => a.order - b.order),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  const columnById = useMemo(
    () => new Map(FILE_TABLE_COLUMNS.map((col) => [col.id, col])),
    [],
  );

  const visibleTableColumns = useMemo(
    () =>
      tableColumns
        .map((col) => {
          const meta = columnById.get(col.id as FileTableSortKey);
          return meta ? { ...meta, label: col.label || meta.label } : null;
        })
        .filter((col): col is NonNullable<typeof col> => col !== null),
    [columnById, tableColumns],
  );

  const filteredFiles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return files.filter((file) => {
      if (statusFilter !== ALL_STATUSES && file.status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        file.fileName.toLowerCase().includes(q) ||
        (file.folderPath ?? "").toLowerCase().includes(q) ||
        file.status.toLowerCase().includes(q)
      );
    });
  }, [files, searchQuery, statusFilter]);

  const sortedFiles = useMemo(() => {
    const copy = [...filteredFiles];
    copy.sort((a, b) => compareFiles(a, b, sortKey, sortDirection));
    return copy;
  }, [filteredFiles, sortKey, sortDirection]);

  const visibleIds = useMemo(
    () => new Set(sortedFiles.map((f) => f.id)),
    [sortedFiles],
  );

  const allVisibleSelected =
    sortedFiles.length > 0 &&
    sortedFiles.every((file) => selectedIds.has(file.id));

  const someVisibleSelected =
    sortedFiles.some((file) => selectedIds.has(file.id)) && !allVisibleSelected;

  const toggleSort = useCallback((key: FileTableSortKey) => {
    setSortKey((prevKey) => {
      if (prevKey === key) {
        setSortDirection((prevDir) => (prevDir === "asc" ? "desc" : "asc"));
        return prevKey;
      }
      setSortDirection("asc");
      return key;
    });
  }, []);

  const toggleRowSelection = useCallback((fileId: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(fileId);
      else next.delete(fileId);
      return next;
    });
  }, []);

  const toggleAllVisible = useCallback(
    (checked: boolean) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const file of sortedFiles) {
          if (checked) next.add(file.id);
          else next.delete(file.id);
        }
        return next;
      });
    },
    [sortedFiles],
  );

  const handleRowClick = useCallback(
    (file: CaseFile, event: React.MouseEvent) => {
      if (event.metaKey || event.ctrlKey) {
        event.preventDefault();
        toggleRowSelection(file.id, !selectedIds.has(file.id));
        return;
      }
      onFileSelect(file);
    },
    [onFileSelect, selectedIds, toggleRowSelection],
  );

  const handleBulkStatus = useCallback(
    async (status: string) => {
      const ids = [...selectedIds].filter((id) => visibleIds.has(id));
      if (ids.length === 0) return;
      setBulkBusy(true);
      try {
        for (const fileId of ids) {
          const res = await commandClient.updateFileStatus(fileId, status);
          if (!res.ok) continue;
        }
        setSelectedIds(new Set());
        onFilesChanged();
      } finally {
        setBulkBusy(false);
      }
    },
    [onFilesChanged, selectedIds, visibleIds],
  );

  const handleBulkRemove = useCallback(async () => {
    const ids = [...selectedIds].filter((id) => visibleIds.has(id));
    if (ids.length === 0) return;
    setBulkBusy(true);
    try {
      for (const fileId of ids) {
        await commandClient.removeFileFromCase(caseId, fileId);
      }
      setSelectedIds(new Set());
      onFilesChanged();
    } finally {
      setBulkBusy(false);
    }
  }, [caseId, onFilesChanged, selectedIds, visibleIds]);

  const selectionCount = [...selectedIds].filter((id) =>
    visibleIds.has(id),
  ).length;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-border/40 px-2 py-2">
        <div className="relative min-w-[140px] flex-1">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter files…"
            className="h-8 pl-8 text-xs"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
            {FILE_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectionCount > 0 && (
        <div className="flex items-center gap-2 border-b border-border/40 bg-muted/30 px-2 py-1.5">
          <span className="text-xs text-muted-foreground">
            {selectionCount} selected
          </span>
          <Select
            disabled={bulkBusy}
            onValueChange={(status) => void handleBulkStatus(status)}
          >
            <SelectTrigger className="h-7 w-[140px] text-xs">
              <SelectValue placeholder="Set status" />
            </SelectTrigger>
            <SelectContent>
              {FILE_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 text-xs"
            disabled={bulkBusy}
            onClick={() => void handleBulkRemove()}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove from case
          </Button>
        </div>
      )}

      <ScrollArea className="min-h-0 flex-1">
        <table className="w-full caption-bottom text-xs">
          <thead className="sticky top-0 z-10 bg-card">
            <tr className="border-b border-border/40">
              <th className="w-8 px-2 py-2 text-left">
                <Checkbox
                  checked={
                    allVisibleSelected
                      ? true
                      : someVisibleSelected
                        ? "indeterminate"
                        : false
                  }
                  onCheckedChange={(checked) =>
                    toggleAllVisible(checked === true)
                  }
                  aria-label="Select all visible files"
                />
              </th>
              {visibleTableColumns.map((column) => {
                const active = sortKey === column.sortKey;
                const SortIcon = active
                  ? sortDirection === "asc"
                    ? ArrowUp
                    : ArrowDown
                  : ArrowUpDown;
                return (
                  <th
                    key={column.id}
                    className="px-2 py-2 text-left font-medium text-muted-foreground"
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-foreground"
                        onClick={() => toggleSort(column.sortKey)}
                      >
                        {column.label}
                        <SortIcon
                          className={cn(
                            "h-3 w-3",
                            active ? "text-foreground" : "opacity-40",
                          )}
                        />
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedFiles.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleTableColumns.length + 1}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No files match the current filters.
                </td>
              </tr>
            ) : (
              sortedFiles.map((file) => {
                const Icon = getFileIcon(file.fileName);
                const active = currentFile?.id === file.id;
                const selected = selectedIds.has(file.id);
                const isDuplicate = duplicateFileIds.has(file.id);
                const group = isDuplicate
                  ? findGroupForFile(duplicateGroups, file.id)
                  : undefined;
                return (
                  <tr
                    key={file.id}
                    className={cn(
                      "cursor-pointer border-b border-border/20 hover:bg-muted/40",
                      active && "bg-primary/10",
                      selected && "bg-muted/50",
                    )}
                    onClick={(e) => handleRowClick(file, e)}
                  >
                    <td className="w-8 px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selected}
                        onCheckedChange={(checked) =>
                          toggleRowSelection(file.id, checked === true)
                        }
                        aria-label={`Select ${file.fileName}`}
                      />
                    </td>
                    {visibleTableColumns.map((column) => {
                      switch (column.id) {
                        case "fileName":
                          return (
                            <td
                              key={column.id}
                              className="max-w-[200px] px-2 py-1.5"
                            >
                              <div className="flex min-w-0 items-center gap-1.5">
                                <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <span className="truncate font-medium">
                                  {file.fileName}
                                </span>
                                {isDuplicate && (
                                  <DuplicateBadge
                                    isPrimary={group?.primaryFileId === file.id}
                                  />
                                )}
                              </div>
                            </td>
                          );
                        case "folderPath":
                          return (
                            <td
                              key={column.id}
                              className="max-w-[160px] truncate px-2 py-1.5 text-muted-foreground"
                            >
                              {file.folderPath || "—"}
                            </td>
                          );
                        case "status":
                          return (
                            <td
                              key={column.id}
                              className="px-2 py-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Select
                                value={file.status}
                                onValueChange={(v) => onStatusChange(file.id, v)}
                              >
                                <SelectTrigger className="h-7 w-[120px] text-[11px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {FILE_STATUSES.map((s) => (
                                    <SelectItem key={s} value={s}>
                                      {s.replace("_", " ")}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                          );
                        case "size":
                          return (
                            <td
                              key={column.id}
                              className="whitespace-nowrap px-2 py-1.5 text-muted-foreground"
                            >
                              {formatFileSize(file.sizeBytes)}
                            </td>
                          );
                        case "modifiedAt":
                          return (
                            <td
                              key={column.id}
                              className="whitespace-nowrap px-2 py-1.5 text-muted-foreground"
                            >
                              {formatModifiedAt(file.modifiedAt)}
                            </td>
                          );
                        default:
                          return null;
                      }
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  );
});
