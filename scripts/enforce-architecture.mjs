#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const violations = [];

const forbiddenPaths = [
  "apps/desktop-backend/index.html",
  "apps/desktop-backend/vite.config.ts",
  "apps/desktop-backend/src",
];

for (const relativePath of forbiddenPaths) {
  if (existsSync(resolve(root, relativePath))) {
    violations.push(`Forbidden path present: ${relativePath}`);
  }
}

const tauriConfigPath = resolve(
  root,
  "apps/desktop-backend/src-tauri/tauri.conf.json",
);
const tauriConfig = JSON.parse(readFileSync(tauriConfigPath, "utf8"));
const devUrl = tauriConfig?.build?.devUrl;
const frontendDist = tauriConfig?.build?.frontendDist;

if (devUrl !== "http://localhost:3000") {
  violations.push(`Unexpected devUrl in tauri.conf.json: ${devUrl}`);
}
if (frontendDist !== "../../desktop/out") {
  violations.push(`Unexpected frontendDist in tauri.conf.json: ${frontendDist}`);
}

if (violations.length > 0) {
  console.error("Architecture guard failed:");
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log("Architecture guard passed.");
