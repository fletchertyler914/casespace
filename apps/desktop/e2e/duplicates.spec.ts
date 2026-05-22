import { test, expect } from "./fixtures";
import { E2E_CASE_URL, waitForCaseWorkspace } from "./helpers";

test.describe("Duplicates (FLOW-002)", () => {
  test("opens duplicate management with group files", async ({ page }) => {
    await page.goto(E2E_CASE_URL);
    await waitForCaseWorkspace(page);
    await page.getByTitle("Duplicates panel").click();
    await expect(page.getByText("Duplicates", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "report.pdf", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "notes.txt", exact: true })).toBeVisible();
  });
});
