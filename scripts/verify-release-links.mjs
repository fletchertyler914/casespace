#!/usr/bin/env node

const repo = process.env.GITHUB_REPOSITORY ?? process.env.CASESPACE_RELEASE_REPO;

if (!repo) {
  console.error("Missing GITHUB_REPOSITORY or CASESPACE_RELEASE_REPO.");
  process.exit(1);
}

const apiUrl = `https://api.github.com/repos/${repo}/releases`;
const response = await fetch(apiUrl, {
  headers: {
    Accept: "application/vnd.github+json",
    ...(process.env.GITHUB_TOKEN
      ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
      : {}),
  },
});

if (!response.ok) {
  console.error(`Failed to read releases: ${response.status}`);
  process.exit(1);
}

const releases = await response.json();
const stableRelease = releases.find((release) => !release.draft && !release.prerelease);

if (!stableRelease) {
  console.error("No stable release found.");
  process.exit(1);
}

const requiredPatterns = [
  /casespace-v\d+\.\d+\.\d+-macos-(arm64|x64)\./,
  /casespace-v\d+\.\d+\.\d+-windows-(arm64|x64)\./,
];

for (const pattern of requiredPatterns) {
  const match = stableRelease.assets.some((asset) => pattern.test(asset.name));
  if (!match) {
    console.error(`Missing expected release asset matching ${pattern}`);
    process.exit(1);
  }
}

console.log(
  `Release ${stableRelease.tag_name} has required macOS and Windows assets.`,
);
