import { describe, expect, it } from "vitest";
import { isAutonomous, requiresConfirmation } from "./tool-policy.js";

describe("tool-policy", () => {
  it("marks destructive commands as confirm_required", () => {
    expect(requiresConfirmation("delete_case")).toBe(true);
    expect(requiresConfirmation("merge_duplicate_metadata")).toBe(true);
  });

  it("marks routine commands as autonomous", () => {
    expect(isAutonomous("generate_case_report")).toBe(true);
    expect(isAutonomous("search_all")).toBe(true);
  });
});
