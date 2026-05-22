import { test, expect } from "./fixtures";
import { E2E_CASE_URL, openWorkspacePanel, waitForCaseWorkspace } from "./helpers";

test.describe("Artifacts panels (FLOW-003)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(E2E_CASE_URL);
    await waitForCaseWorkspace(page);
  });

  test("opens notes panel with mocked note content", async ({ page }) => {
    await openWorkspacePanel(page, "Notes");
    await expect(page.getByText("E2E field note")).toBeVisible();
  });

  test("opens findings panel with severity", async ({ page }) => {
    await openWorkspacePanel(page, "Findings");
    await expect(page.getByText("E2E finding")).toBeVisible();
    await expect(page.getByText("High")).toBeVisible();
  });

  test("opens timeline panel", async ({ page }) => {
    await openWorkspacePanel(page, "Timeline");
    await expect(page.getByText("E2E interview")).toBeVisible();
  });
});
