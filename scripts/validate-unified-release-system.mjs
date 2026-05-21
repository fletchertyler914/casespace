#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(relativePath) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

function assertIncludes(content, needle, message) {
  if (!content.includes(needle)) {
    throw new Error(message);
  }
}

function validateReleaseWorkflow() {
  const workflow = read(".github/workflows/release.yml");
  assertIncludes(
    workflow,
    'TARGET_FILE="release-assets/casespace-v${VERSION}-macos-${ARCH}.dmg"',
    "Release workflow missing deterministic macOS asset naming.",
  );
  assertIncludes(
    workflow,
    'TARGET_FILE="release-assets/casespace-v${VERSION}-windows-${ARCH}.msi"',
    "Release workflow missing deterministic Windows asset naming.",
  );
  assertIncludes(
    workflow,
    "name: Verify release links for web resolver",
    "Release workflow missing web-resolver link verification job.",
  );
}

function validateWebDownloadIntegration() {
  const downloadPage = read("apps/web/app/download/page.tsx");
  assertIncludes(
    downloadPage,
    "fetchLatestStableRelease",
    "Download page must fetch latest stable release data.",
  );
  assertIncludes(
    downloadPage,
    "classifyAsset",
    "Download page must classify assets by platform.",
  );
  assertIncludes(
    downloadPage,
    "NEXT_PUBLIC_RELEASE_REPOSITORY",
    "Download page must support repository override via environment variable.",
  );
}

function validateRootScripts() {
  const pkg = read("package.json");
  assertIncludes(
    pkg,
    '"release:status": "node ./scripts/release-automation.mjs status"',
    "Missing release:status script in root package.json.",
  );
  assertIncludes(
    pkg,
    '"release:validate": "node ./scripts/release-automation.mjs validate"',
    "Missing release:validate script in root package.json.",
  );
}

function main() {
  validateReleaseWorkflow();
  validateWebDownloadIntegration();
  validateRootScripts();
  console.log("Unified release system contract checks passed.");
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
