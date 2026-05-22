import { useMemo } from "react";

/** Panel size percentages — aligned with v1 `useWorkspacePanels` defaults. */
function visibleCount(flags: boolean[]): number {
  return flags.filter(Boolean).length;
}

function fileViewerSizeFor(count: number): number {
  if (count >= 3) return 35;
  if (count === 2) return 50;
  if (count === 1) return 60;
  return 100;
}

function sidePanelSizeFor(count: number, whenMany: number, whenTwo: number, whenOne: number): number {
  if (count >= 3) return whenMany;
  if (count === 2) return whenTwo;
  if (count === 1) return whenOne;
  return 35;
}

export function useWorkspacePanels(options: {
  notesVisible: boolean;
  findingsVisible: boolean;
  timelineVisible: boolean;
  duplicatesVisible: boolean;
  timeVisible: boolean;
}) {
  const {
    notesVisible,
    findingsVisible,
    timelineVisible,
    duplicatesVisible,
    timeVisible,
  } = options;

  return useMemo(() => {
    const flags = [
      notesVisible,
      findingsVisible,
      timelineVisible,
      duplicatesVisible,
      timeVisible,
    ];
    const count = visibleCount(flags);
    const fileViewerSize = fileViewerSizeFor(count);

    return {
      fileViewerSize,
      notesPanelSize: sidePanelSizeFor(count, 15, 20, 25),
      findingsPanelSize: sidePanelSizeFor(count, 18, 22, 25),
      timelinePanelSize: sidePanelSizeFor(count, 20, 30, 35),
      duplicatesPanelSize: sidePanelSizeFor(count, 20, 30, 35),
      timePanelSize: sidePanelSizeFor(count, 20, 28, 35),
      /** @deprecated Use panel-specific sizes above */
      sidePanelSize: sidePanelSizeFor(count, 18, 22, 35),
      visiblePanelCount: count,
    };
  }, [
    notesVisible,
    findingsVisible,
    timelineVisible,
    duplicatesVisible,
    timeVisible,
  ]);
}
