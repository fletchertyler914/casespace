import type { WorkspacePreferences } from "@repo/types";
import { commandClient } from "@/lib/command-client";

export const DEFAULT_WORKSPACE_PREFERENCES: WorkspacePreferences = {
  viewMode: "split",
  navigatorOpen: true,
  notesVisible: false,
  findingsVisible: false,
  timelineVisible: false,
  autoSyncEnabled: true,
  autoSyncIntervalMinutes: 5,
};

export async function loadWorkspacePreferences(
  caseId: string,
): Promise<WorkspacePreferences> {
  const res = await commandClient.getWorkspacePreferencesDb(caseId);
  if (!res.ok || !res.data) {
    return { ...DEFAULT_WORKSPACE_PREFERENCES };
  }
  try {
    const parsed = JSON.parse(res.data) as WorkspacePreferences;
    return { ...DEFAULT_WORKSPACE_PREFERENCES, ...parsed };
  } catch {
    return { ...DEFAULT_WORKSPACE_PREFERENCES };
  }
}

export async function saveWorkspacePreferences(
  caseId: string,
  prefs: WorkspacePreferences,
): Promise<void> {
  await commandClient.saveWorkspacePreferencesDb(caseId, JSON.stringify(prefs));
}
