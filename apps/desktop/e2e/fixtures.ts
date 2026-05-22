import path from "node:path";
import { fileURLToPath } from "node:url";
import { test as base } from "@playwright/test";

const mockScript = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "mock-invoke.browser.js",
);

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript({ path: mockScript });
    await use(page);
  },
});

export { expect } from "@playwright/test";
