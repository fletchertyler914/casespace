import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useWorkspacePanels } from "@/hooks/use-workspace-panels";

describe("useWorkspacePanels", () => {
  it("allocates ~60% viewer when one side panel is open", () => {
    const { result } = renderHook(() =>
      useWorkspacePanels({
        notesVisible: false,
        findingsVisible: false,
        timelineVisible: false,
        duplicatesVisible: true,
        timeVisible: false,
      }),
    );
    expect(result.current.fileViewerSize).toBe(60);
    expect(result.current.duplicatesPanelSize).toBe(35);
  });

  it("uses full width when no side panels", () => {
    const { result } = renderHook(() =>
      useWorkspacePanels({
        notesVisible: false,
        findingsVisible: false,
        timelineVisible: false,
        duplicatesVisible: false,
        timeVisible: false,
      }),
    );
    expect(result.current.fileViewerSize).toBe(100);
  });

  it("shrinks viewer when three panels open", () => {
    const { result } = renderHook(() =>
      useWorkspacePanels({
        notesVisible: true,
        findingsVisible: true,
        timelineVisible: true,
        duplicatesVisible: false,
        timeVisible: false,
      }),
    );
    expect(result.current.fileViewerSize).toBe(35);
    expect(result.current.visiblePanelCount).toBe(3);
  });
});
