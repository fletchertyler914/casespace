import { test, expect } from "./fixtures";
import { E2E_CASE_URL, waitForCaseWorkspace } from "./helpers";

test.describe("Workspace (FLOW-002 review)", () => {
  test("shows navigator and file tree without status word badges", async ({
    page,
  }) => {
    await page.goto(E2E_CASE_URL);
    await waitForCaseWorkspace(page);
    await expect(page.getByText("unreviewed")).toHaveCount(0);
  });

  test("opens search dialog and returns file hits", async ({ page }) => {
    await page.goto(E2E_CASE_URL);
    await waitForCaseWorkspace(page);
    await page.keyboard.press("Control+KeyK");
    const input = page.getByPlaceholder(/Search files/i);
    await expect(input).toBeVisible();
    await input.fill("rep");
    await expect(page.getByText("report.pdf")).toBeVisible({ timeout: 5000 });
  });
});
