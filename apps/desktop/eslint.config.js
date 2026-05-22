import { globalIgnores } from "eslint/config";
import { nextJsConfig } from "@repo/eslint-config/next-js";

/** @type {import("eslint").Linter.Config} */
export default [
  ...nextJsConfig,
  globalIgnores([
    "public/**",
    "e2e/**",
    "test-results/**",
    "playwright-report/**",
  ]),
  {
    files: ["playwright.config.ts"],
    rules: { "turbo/no-undeclared-env-vars": "off" },
  },
];
