import type { CaseFile } from "@repo/types";

export interface FolderNode {
  name: string;
  path: string;
  files: CaseFile[];
  subfolders: Map<string, FolderNode>;
}

const treeCache = new WeakMap<CaseFile[], FolderNode>();

export function buildFolderTree(items: CaseFile[]): FolderNode {
  if (treeCache.has(items)) {
    return treeCache.get(items)!;
  }

  const root: FolderNode = {
    name: "",
    path: "",
    files: [],
    subfolders: new Map(),
  };

  for (const item of items) {
    const folderPath = item.folderPath ?? "";
    const pathParts = folderPath.split("/").filter((p) => p.trim());

    if (pathParts.length === 0) {
      root.files.push(item);
      continue;
    }

    let current = root;
    pathParts.forEach((part, index) => {
      if (!current.subfolders.has(part)) {
        current.subfolders.set(part, {
          name: part,
          path: pathParts.slice(0, index + 1).join("/"),
          files: [],
          subfolders: new Map(),
        });
      }
      current = current.subfolders.get(part)!;
    });
    current.files.push(item);
  }

  treeCache.set(items, root);
  return root;
}

export function flattenFileTree(tree: FolderNode): CaseFile[] {
  const flattened: CaseFile[] = [];

  const flattenNode = (node: FolderNode) => {
    const sortedSubfolders = Array.from(node.subfolders.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    for (const subfolder of sortedSubfolders) {
      flattenNode(subfolder);
    }
    const sortedFiles = [...node.files].sort((a, b) =>
      a.fileName.localeCompare(b.fileName),
    );
    flattened.push(...sortedFiles);
  };

  flattenNode(tree);
  return flattened;
}

export function getFlattenedFileList(items: CaseFile[]): CaseFile[] {
  return flattenFileTree(buildFolderTree(items));
}

export function filterFilesByFolder(
  items: CaseFile[],
  folderPath: string | null,
): CaseFile[] {
  if (folderPath === null) return items;
  return items.filter((f) => (f.folderPath ?? "") === folderPath);
}
