export interface DuplicateGroup {
  groupId: string;
  fileIds: string[];
  primaryFileId?: string;
}

export function buildDuplicateFileIdSet(groups: DuplicateGroup[]): Set<string> {
  const ids = new Set<string>();
  for (const group of groups) {
    for (const fileId of group.fileIds) {
      ids.add(fileId);
    }
  }
  return ids;
}

export function findGroupForFile(
  groups: DuplicateGroup[],
  fileId: string,
): DuplicateGroup | undefined {
  return groups.find((group) => group.fileIds.includes(fileId));
}

export function duplicateStats(groups: DuplicateGroup[]): {
  groupCount: number;
  fileCount: number;
} {
  return {
    groupCount: groups.length,
    fileCount: groups.reduce((sum, g) => sum + g.fileIds.length, 0),
  };
}

export function fileNameById(
  files: { id: string; fileName: string }[],
  id: string,
): string {
  return files.find((f) => f.id === id)?.fileName ?? id;
}
