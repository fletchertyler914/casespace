import { useCallback, useMemo, useRef } from "react";

export interface UseWorkflowSelectionOptions {
  selectedIds: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  fileIds: string[];
}

export function useWorkflowSelection({
  selectedIds,
  onSelectionChange,
  fileIds,
}: UseWorkflowSelectionOptions) {
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const lastSelectedIndexRef = useRef<number | null>(null);
  const idToIndex = useMemo(() => {
    const map = new Map<string, number>();
    fileIds.forEach((id, index) => map.set(id, index));
    return map;
  }, [fileIds]);

  const handleSelect = useCallback(
    (fileId: string, event: React.MouseEvent) => {
      const index = idToIndex.get(fileId);
      if (index === undefined) return;

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modifierKey = isMac ? event.metaKey : event.ctrlKey;
      const shiftKey = event.shiftKey;

      let newSelection: string[];

      if (shiftKey && lastSelectedIndexRef.current !== null) {
        const lastIndex = lastSelectedIndexRef.current;
        const start = Math.min(lastIndex, index);
        const end = Math.max(lastIndex, index);
        const rangeIds: string[] = [];
        for (let i = start; i <= end; i++) {
          const id = fileIds[i];
          if (id) rangeIds.push(id);
        }
        newSelection = modifierKey
          ? Array.from(new Set([...selectedIds, ...rangeIds]))
          : rangeIds;
      } else if (modifierKey) {
        const next = new Set(selectedIds);
        if (next.has(fileId)) {
          next.delete(fileId);
        } else {
          next.add(fileId);
        }
        newSelection = Array.from(next);
      } else {
        newSelection = [fileId];
      }

      lastSelectedIndexRef.current = index;
      onSelectionChange?.(newSelection);
    },
    [fileIds, idToIndex, onSelectionChange, selectedIds],
  );

  const isSelected = useCallback(
    (fileId: string) => selectedSet.has(fileId),
    [selectedSet],
  );

  return {
    isSelected,
    handleSelect,
    selectedCount: selectedSet.size,
    selectedSet,
  };
}
