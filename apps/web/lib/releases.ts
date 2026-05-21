export type ReleaseAsset = {
  name: string;
  browser_download_url: string;
};

export type StableRelease = {
  tag_name: string;
  html_url: string;
  published_at: string;
  assets: ReleaseAsset[];
};

const MAC_PATTERN = /casespace-v\d+\.\d+\.\d+-macos-(x64|arm64)\.(dmg|zip)$/i;
const WINDOWS_PATTERN =
  /casespace-v\d+\.\d+\.\d+-windows-(x64|arm64)\.(msi|exe|zip)$/i;

export function classifyAsset(assetName: string): "macos" | "windows" | null {
  if (MAC_PATTERN.test(assetName)) return "macos";
  if (WINDOWS_PATTERN.test(assetName)) return "windows";
  return null;
}

export function detectArchFromUserAgent(userAgent: string): "x64" | "arm64" {
  return /arm|aarch64/i.test(userAgent) ? "arm64" : "x64";
}

export async function fetchLatestStableRelease(
  repo: string,
  token?: string,
): Promise<StableRelease | null> {
  const res = await fetch(`https://api.github.com/repos/${repo}/releases`, {
    headers: {
      Accept: "application/vnd.github+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    next: { revalidate: 300 },
  });

  if (!res.ok) return null;
  const releases = (await res.json()) as StableRelease[];
  const stable = releases.find((release) => {
    // GitHub response includes fields we do not model here.
    const maybe = release as StableRelease & {
      draft?: boolean;
      prerelease?: boolean;
    };
    return !maybe.draft && !maybe.prerelease;
  });
  return stable ?? null;
}
