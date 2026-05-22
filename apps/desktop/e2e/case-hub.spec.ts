import { test, expect } from "./fixtures";

test.describe("Case hub (FLOW-001 entry)", () => {
  test("loads case list from mocked commands", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Cases", exact: true }),
    ).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("E2E Test Case")).toBeVisible();
  });
});
