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

  test("time management opens from case menu", async ({ page }) => {
    await page.getByTitle("Case actions").click();
    await page.getByRole("menuitem", { name: /Time management/i }).click();
    await expect(
      page.getByRole("heading", { name: "Time management" }),
    ).toBeVisible();
    await expect(page.getByText("Days tracked")).toBeVisible();
  });

  test("report mode shows generate action", async ({ page }) => {
    await page.getByTitle("Examination report").click();
    await expect(
      page.getByRole("button", { name: /Generate report/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Findings/i }).first(),
    ).toBeVisible();
  });

  test("generates case report from report workspace", async ({ page }) => {
    await page.getByTitle("Examination report").click();
    await page.getByRole("button", { name: /Generate report/i }).click();
    await expect(
      page.getByRole("button", { name: /Findings/i }).first(),
    ).toBeVisible({
      timeout: 10_000,
    });
  });
});
