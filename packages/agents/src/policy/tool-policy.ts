export type ToolPolicyTier = "autonomous" | "confirm_required" | "human_only";

/** Native CaseSpace command names mapped to policy tiers (see docs/architecture-agents.md). */
export const TOOL_POLICY: Record<string, ToolPolicyTier> = {
  load_case_files: "autonomous",
  search_all: "autonomous",
  generate_case_report: "autonomous",
  create_note: "autonomous",
  update_file_status: "autonomous",
  create_finding: "autonomous",
  create_timeline_event: "autonomous",
  delete_case: "confirm_required",
  remove_file_from_case: "confirm_required",
  merge_duplicate_metadata: "confirm_required",
  delete_finding: "confirm_required",
  delete_timeline_event: "confirm_required",
};

export function requiresConfirmation(command: string): boolean {
  return TOOL_POLICY[command] === "confirm_required";
}

export function isAutonomous(command: string): boolean {
  return TOOL_POLICY[command] === "autonomous";
}
