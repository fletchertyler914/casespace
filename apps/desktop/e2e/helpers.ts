import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export const E2E_CASE_URL = "/case?id=e2e-case-1";

/** Wait until the case workspace shell has loaded mocked data. */
export async function waitForCaseWorkspace(page: Page) {
  await expect(page.getByText("E2E Test Case")).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText("report.pdf")).toBeVisible({ timeout: 15_000 });
}

/** Toggle a workspace side panel via the header Panels menu (split view). */
export async function openWorkspacePanel(
  page: Page,
  panel: "Notes" | "Findings" | "Timeline" | "Duplicates" | "Time",
) {
  await page.getByRole("button", { name: /^Panels/i }).click();
  await page.getByRole("menuitemcheckbox", { name: panel }).click();
}
