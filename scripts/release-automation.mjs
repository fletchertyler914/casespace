#!/usr/bin/env node

import { execFileSync } from "node:child_process";

const WORKFLOWS = ["CI", "Release", "Promote RC to Prod"];

function run(command, args, options = {}) {
  try {
    return execFileSync(command, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      ...options,
    }).trim();
  } catch (error) {
    const stderr = error?.stderr?.toString()?.trim();
    const stdout = error?.stdout?.toString()?.trim();
    const detail = stderr || stdout || error.message;
    throw new Error(`${command} ${args.join(" ")} failed: ${detail}`);
  }
}

function getRepo() {
  return (
    process.env.CASESPACE_RELEASE_REPO ||
    process.env.GITHUB_REPOSITORY ||
    run("gh", ["repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"])
  );
}

function getToken() {
  return process.env.GITHUB_TOKEN || run("gh", ["auth", "token"]);
}

function getLatestWorkflowRun(workflowName) {
  const raw = run("gh", [
    "run",
    "list",
    "--workflow",
    workflowName,
    "--limit",
    "1",
    "--json",
    "databaseId,displayTitle,status,conclusion,url,headBranch,event,createdAt",
  ]);
  const runs = JSON.parse(raw);
  return runs[0] ?? null;
}

async function getLatestStableRelease(repo, token) {
  const response = await fetch(`https://api.github.com/repos/${repo}/releases`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch releases (${response.status}).`);
  }

  const releases = await response.json();
  return releases.find((release) => !release.draft && !release.prerelease) ?? null;
}

function printWorkflowSummary(latestRuns) {
  console.log("Latest workflow runs:");
  for (const [workflow, runData] of latestRuns) {
    if (!runData) {
      console.log(`- ${workflow}: no runs found`);
      continue;
    }
    console.log(
      `- ${workflow}: ${runData.status}/${runData.conclusion ?? "n/a"} (${runData.url})`,
    );
  }
}

function assertSuccessfulRun(latestRuns, workflowName) {
  const runData = latestRuns.get(workflowName);
  if (!runData) {
    throw new Error(`${workflowName} has no runs yet.`);
  }
  if (runData.status !== "completed" || runData.conclusion !== "success") {
    throw new Error(
      `${workflowName} latest run is ${runData.status}/${runData.conclusion ?? "n/a"} (${runData.url})`,
    );
  }
}

function verifyReleaseLinks(repo, token) {
  const env = {
    ...process.env,
    GITHUB_REPOSITORY: repo,
    GITHUB_TOKEN: token,
  };

  const output = run("node", ["./scripts/verify-release-links.mjs"], { env });
  if (output) {
    console.log(output);
  }
}

async function validateDownloadPage(baseUrl, expectedTag) {
  const normalizedBaseUrl = baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl;
  const downloadUrl = `${normalizedBaseUrl}/download`;
  const response = await fetch(downloadUrl);

  if (!response.ok) {
    throw new Error(`Download page returned ${response.status} at ${downloadUrl}`);
  }

  const page = await response.text();
  if (expectedTag && !page.includes(expectedTag)) {
    throw new Error(
      `Download page does not reference latest stable tag ${expectedTag} at ${downloadUrl}`,
    );
  }

  console.log(`Download page OK: ${downloadUrl}`);
}

async function runStatus() {
  const latestRuns = new Map();
  for (const workflow of WORKFLOWS) {
    latestRuns.set(workflow, getLatestWorkflowRun(workflow));
  }
  printWorkflowSummary(latestRuns);
}

async function runValidate() {
  const repo = getRepo();
  const token = getToken();
  console.log(`Repository: ${repo}`);

  const latestRuns = new Map();
  for (const workflow of WORKFLOWS) {
    latestRuns.set(workflow, getLatestWorkflowRun(workflow));
  }
  printWorkflowSummary(latestRuns);

  assertSuccessfulRun(latestRuns, "CI");
  assertSuccessfulRun(latestRuns, "Release");

  const stableRelease = await getLatestStableRelease(repo, token);
  if (!stableRelease) {
    throw new Error("No stable release found.");
  }

  console.log(`Latest stable release: ${stableRelease.tag_name}`);
  verifyReleaseLinks(repo, token);

  const webUrl = process.env.CASESPACE_WEB_URL;
  if (!webUrl) {
    console.log(
      "Skipping download page probe: set CASESPACE_WEB_URL to validate live website links.",
    );
    return;
  }

  await validateDownloadPage(webUrl, stableRelease.tag_name);
}

async function main() {
  const subcommand = process.argv[2] ?? "status";

  if (subcommand === "status") {
    await runStatus();
    return;
  }

  if (subcommand === "validate") {
    await runValidate();
    return;
  }

  throw new Error(`Unknown command "${subcommand}". Use "status" or "validate".`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
