import { useMemo } from "react";

export function useWorkspacePanels(options: {
  notesVisible: boolean;
  findingsVisible: boolean;
  timelineVisible: boolean;
}) {
  const { notesVisible, findingsVisible, timelineVisible } = options;

  return useMemo(() => {
    const sideCount = [notesVisible, findingsVisible, timelineVisible].filter(
      Boolean,
    ).length;
    const sideTotal = sideCount > 0 ? Math.min(50, sideCount * 18) : 0;
    return {
      fileViewerSize: 100 - sideTotal,
      sidePanelSize: sideCount > 0 ? sideTotal / sideCount : 20,
    };
  }, [notesVisible, findingsVisible, timelineVisible]);
}
