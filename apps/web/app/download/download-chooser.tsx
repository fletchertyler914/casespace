"use client";

import { useMemo } from "react";

type Asset = {
  name: string;
  browser_download_url: string;
};

type Props = {
  assets: Asset[];
};

function detectTarget(): { os: "macos" | "windows"; arch: "x64" | "arm64" } {
  const platform = navigator.platform.toLowerCase();
  const ua = navigator.userAgent.toLowerCase();
  const arch = /arm|aarch64/.test(ua) ? "arm64" : "x64";
  const os = /mac/.test(platform) ? "macos" : "windows";
  return { os, arch };
}

function findMatch(
  assets: Asset[],
  os: "macos" | "windows",
  arch: "x64" | "arm64",
): Asset | undefined {
  const exact = assets.find((asset) =>
    new RegExp(`-${os}-${arch}\\.`).test(asset.name),
  );
  if (exact) return exact;
  return assets.find((asset) => new RegExp(`-${os}-`).test(asset.name));
}

export function DownloadChooser({ assets }: Props) {
  const recommendation = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    const { os, arch } = detectTarget();
    return findMatch(assets, os, arch);
  }, [assets]);

  return (
    <div className="rounded-lg border border-neutral-800 p-6 bg-neutral-900/40">
      <h2 className="text-xl font-semibold mb-2">Recommended Download</h2>
      {recommendation ? (
        <a
          className="inline-flex rounded-md bg-white text-black px-4 py-2 font-medium hover:opacity-90"
          href={recommendation.browser_download_url}
        >
          Download {recommendation.name}
        </a>
      ) : (
        <p className="text-sm text-neutral-300">
          No recommended asset was detected. Use manual links below.
        </p>
      )}
    </div>
  );
}
