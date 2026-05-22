"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  Search,
} from "lucide-react";
import type { CaseFile } from "@repo/types";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  WorkspaceNavigatorShell,
  workspaceNavigatorItemClass,
  workspaceNavigatorListHeaderClass,
} from "@/components/workspace/workspace-navigator-shell";
import { buildFolderTree, type FolderNode } from "@/lib/file-tree-utils";
import { DuplicateBadge } from "@/components/artifacts/duplicate-badge";
import { findGroupForFile, type DuplicateGroup } from "@/lib/duplicate-utils";
import { getFileIcon } from "@/lib/file-icon-utils";

interface FileNavigatorProps {
  caseId: string;
  files: CaseFile[];
  currentFile: CaseFile | null;
  duplicateGroups: DuplicateGroup[];
  duplicateFileIds: Set<string>;
  onFileSelect: (file: CaseFile) => void;
  onStatusChange: (fileId: string, status: string) => void;
  onFilesChanged: () => void;
  selectedFolderPath: string | null;
  onFolderSelect: (folderPath: string | null) => void;
  onToggleNavigator: () => void;
}

function filterTree(tree: FolderNode, query: string): FolderNode | null {
  const q = query.toLowerCase().trim();
  if (!q) return tree;

  const filterNode = (node: FolderNode): FolderNode | null => {
    const filtered: FolderNode = {
      name: node.name,
      path: node.path,
      files: node.files.filter((f) => f.fileName.toLowerCase().includes(q)),
      subfolders: new Map(),
    };
    node.subfolders.forEach((sub, name) => {
      const fs = filterNode(sub);
      if (
        fs &&
        (fs.files.length > 0 || fs.subfolders.size > 0 || sub.name.toLowerCase().includes(q))
      ) {
        filtered.subfolders.set(name, fs);
      }
    });
    if (
      node.path.toLowerCase().includes(q) ||
      filtered.files.length > 0 ||
      filtered.subfolders.size > 0
    ) {
      return filtered;
    }
    return null;
  };

  return filterNode(tree) ?? tree;
}

function FolderTreeNode({
  node,
  depth,
  expandedFolders,
  toggleFolder,
  currentFile,
  duplicateGroups,
  duplicateFileIds,
  onFileSelect,
  selectedFolderPath,
  onFolderSelect,
}: {
  node: FolderNode;
  depth: number;
  expandedFolders: Set<string>;
  toggleFolder: (path: string) => void;
  currentFile: CaseFile | null;
  duplicateGroups: DuplicateGroup[];
  duplicateFileIds: Set<string>;
  onFileSelect: (file: CaseFile) => void;
  selectedFolderPath: string | null;
  onFolderSelect: (path: string | null) => void;
}) {
  const sortedSubfolders = Array.from(node.subfolders.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const sortedFiles = [...node.files].sort((a, b) =>
    a.fileName.localeCompare(b.fileName),
  );

  return (
    <>
      {node.path !== "" && (
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-1 rounded-md px-2 py-1 text-left text-sm hover:bg-muted/60",
            selectedFolderPath === node.path && "bg-muted",
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => {
            toggleFolder(node.path);
            onFolderSelect(node.path);
          }}
        >
          {expandedFolders.has(node.path) ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <Folder className="h-3.5 w-3.5 shrink-0 text-primary/80" />
          <span className="truncate">{node.name}</span>
        </button>
      )}
      {(node.path === "" || expandedFolders.has(node.path)) &&
        sortedSubfolders.map((sub) => (
          <FolderTreeNode
            key={sub.path}
            node={sub}
            depth={node.path === "" ? depth : depth + 1}
            expandedFolders={expandedFolders}
            toggleFolder={toggleFolder}
            currentFile={currentFile}
            duplicateGroups={duplicateGroups}
            duplicateFileIds={duplicateFileIds}
            onFileSelect={onFileSelect}
            selectedFolderPath={selectedFolderPath}
            onFolderSelect={onFolderSelect}
          />
        ))}
      {(node.path === "" || expandedFolders.has(node.path)) &&
        sortedFiles.map((file) => {
          const Icon = getFileIcon(file.fileName);
          const active = currentFile?.id === file.id;
          const isDuplicate = duplicateFileIds.has(file.id);
          const group = isDuplicate ? findGroupForFile(duplicateGroups, file.id) : undefined;
          return (
            <button
              key={file.id}
              type="button"
              className={workspaceNavigatorItemClass(active)}
              style={{
                paddingLeft: `${(node.path === "" ? depth : depth + 1) * 12 + 8}px`,
              }}
              onClick={() => onFileSelect(file)}
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">{file.fileName}</span>
              {isDuplicate && (
                <DuplicateBadge
                  isPrimary={group?.primaryFileId === file.id}
                />
              )}
            </button>
          );
        })}
    </>
  );
}

export const FileNavigator = memo(function FileNavigator({
  files,
  currentFile,
  duplicateGroups,
  duplicateFileIds,
  onFileSelect,
  selectedFolderPath,
  onFolderSelect,
  onToggleNavigator,
}: FileNavigatorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    () => new Set(),
  );

  const folderTree = useMemo(() => buildFolderTree(files), [files]);
  const displayTree = useMemo(
    () => filterTree(folderTree, searchQuery) ?? folderTree,
    [folderTree, searchQuery],
  );

  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!currentFile?.folderPath) return;
    const parts = currentFile.folderPath.split("/").filter(Boolean);
    let acc = "";
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      for (const part of parts) {
        acc = acc ? `${acc}/${part}` : part;
        next.add(acc);
      }
      return next;
    });
  }, [currentFile?.id, currentFile?.folderPath]);

  return (
    <WorkspaceNavigatorShell
      onToggleNavigator={onToggleNavigator}
      header={
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter files…"
            className="h-8 pl-8 text-xs"
          />
        </div>
      }
      listHeader={
        <button
          type="button"
          className={workspaceNavigatorListHeaderClass(selectedFolderPath === null)}
          onClick={() => onFolderSelect(null)}
        >
          All files ({files.length})
        </button>
      }
    >
      <FolderTreeNode
        node={displayTree}
        depth={0}
        expandedFolders={expandedFolders}
        toggleFolder={toggleFolder}
        currentFile={currentFile}
        duplicateGroups={duplicateGroups}
        duplicateFileIds={duplicateFileIds}
        onFileSelect={onFileSelect}
        selectedFolderPath={selectedFolderPath}
        onFolderSelect={onFolderSelect}
      />
    </WorkspaceNavigatorShell>
  );
});
