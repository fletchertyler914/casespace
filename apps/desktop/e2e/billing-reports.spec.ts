import { test, expect } from "./fixtures";
import { E2E_CASE_URL, waitForCaseWorkspace } from "./helpers";

test.describe("Time and reports (FLOW-005/006)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(E2E_CASE_URL);
    await waitForCaseWorkspace(page);
  });

  test("timer widget shows start control in header", async ({ page }) => {
    await expect(page.getByRole("button", { name: /^Start$/ })).toBeVisible();
  });

  test("reports panel loads export history", async ({ page }) => {
    await page.getByTitle("Reports panel").click();
    await expect(page.getByText("Export history")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /narrative/i }).filter({ hasText: "2026" }),
    ).toBeVisible();
  });

  test("exports narrative report from panel", async ({ page }) => {
    await page.getByTitle("Reports panel").click();
    await page.getByRole("button", { name: /Export Narrative/i }).click();
    await expect(page.getByText("Open last export")).toBeVisible({
      timeout: 10_000,
    });
  });
});
