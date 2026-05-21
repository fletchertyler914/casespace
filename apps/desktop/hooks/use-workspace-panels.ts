import { useMemo } from "react";

export function useWorkspacePanels(options: {
  notesVisible: boolean;
  findingsVisible: boolean;
  timelineVisible: boolean;
  duplicatesVisible: boolean;
  reportsVisible: boolean;
  timeVisible: boolean;
}) {
  const {
    notesVisible,
    findingsVisible,
    timelineVisible,
    duplicatesVisible,
    reportsVisible,
    timeVisible,
  } = options;

  return useMemo(() => {
    const sideCount = [
      notesVisible,
      findingsVisible,
      timelineVisible,
      duplicatesVisible,
      reportsVisible,
      timeVisible,
    ].filter(Boolean).length;
    const sideTotal = sideCount > 0 ? Math.min(60, sideCount * 18) : 0;
    return {
      fileViewerSize: 100 - sideTotal,
      sidePanelSize: sideCount > 0 ? sideTotal / sideCount : 20,
    };
  }, [
    notesVisible,
    findingsVisible,
    timelineVisible,
    duplicatesVisible,
    reportsVisible,
    timeVisible,
  ]);
}
