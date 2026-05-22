import type { WorkspacePreferences } from "@repo/types";

/** Primary workspace surfaces — reports is a full-page mode, not a side panel. */
export type WorkspaceViewMode = "split" | "board" | "reports";

export function normalizeWorkspaceViewMode(
  prefs: WorkspacePreferences,
): WorkspaceViewMode {
  if (prefs.viewMode === "reports") return "reports";
  if (prefs.reportsVisible) return "reports";
  if (prefs.viewMode === "board") return "board";
  return "split";
}
