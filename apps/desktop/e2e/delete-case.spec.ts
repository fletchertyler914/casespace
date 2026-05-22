import { test, expect } from "./fixtures";

test.describe("Delete case confirmation (AC-SEC-02)", () => {
  test("trash control opens delete confirmation dialog", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Cases", exact: true }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("E2E Test Case")).toBeVisible();
    const card = page.locator("div").filter({ hasText: "E2E Test Case" }).first();
    await card.getByRole("button").filter({ has: page.locator("svg") }).last().click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await expect(page.getByText(/cannot be undone/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Delete Case/i })).toBeVisible();
  });
});
