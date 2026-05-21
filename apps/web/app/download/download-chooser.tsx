"use client";

import { useEffect, useState } from "react";

type Asset = {
  name: string;
  browser_download_url: string;
};

type Props = {
  assets: Asset[];
};

type Target = {
  os: "macos" | "windows" | "unknown";
  arch: "arm64" | "x64" | "unknown";
  confidence: "high" | "low";
};

type UADataNavigator = Navigator & {
  userAgentData?: {
    platform: string;
    getHighEntropyValues: (hints: string[]) => Promise<{
      architecture?: string;
      bitness?: string;
      platform?: string;
    }>;
  };
};

async function detectTarget(): Promise<Target> {
  if (typeof navigator === "undefined") {
    return { os: "unknown", arch: "unknown", confidence: "low" };
  }

  const nav = navigator as UADataNavigator;
  const ua = nav.userAgent;
  const platform = (nav.platform || "").toLowerCase();
  const isMac = /mac/.test(platform) || /Mac OS X/.test(ua);
  const isWindows = /win/.test(platform) || /Windows/.test(ua);
  const os: Target["os"] = isMac ? "macos" : isWindows ? "windows" : "unknown";

  if (os === "windows") {
    return { os, arch: "x64", confidence: "high" };
  }

  if (os !== "macos") {
    return { os, arch: "unknown", confidence: "low" };
  }

  if (nav.userAgentData?.getHighEntropyValues) {
    try {
      const values = await nav.userAgentData.getHighEntropyValues([
        "architecture",
        "bitness",
      ]);
      if (values.architecture === "arm") {
        return { os, arch: "arm64", confidence: "high" };
      }
      if (values.architecture === "x86" && values.bitness === "64") {
        return { os, arch: "x64", confidence: "high" };
      }
    } catch {
      // ignore, fall back to GPU probe
    }
  }

  try {
    const canvas = document.createElement("canvas");
    const gl =
      (canvas.getContext("webgl") as WebGLRenderingContext | null) ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (gl) {
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      const renderer = debugInfo
        ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL))
        : "";
      if (/Apple\s*(M\d|GPU)/i.test(renderer)) {
        return { os, arch: "arm64", confidence: "high" };
      }
      if (/Intel|AMD|Radeon|NVIDIA|GeForce/i.test(renderer)) {
        return { os, arch: "x64", confidence: "high" };
      }
    }
  } catch {
    // ignore, fall back to UA heuristic
  }

  return { os, arch: "arm64", confidence: "low" };
}

function findMatch(
  assets: Asset[],
  os: "macos" | "windows",
  arch: "arm64" | "x64",
): Asset | undefined {
  const exact = assets.find((asset) =>
    new RegExp(`-${os}-${arch}\\.`).test(asset.name),
  );
  if (exact) return exact;
  return assets.find((asset) => new RegExp(`-${os}-`).test(asset.name));
}

const ARCH_LABEL: Record<"arm64" | "x64", string> = {
  arm64: "Apple Silicon (M1/M2/M3/M4)",
  x64: "Intel",
};

export function DownloadChooser({ assets }: Props) {
  const [target, setTarget] = useState<Target | null>(null);

  useEffect(() => {
    let cancelled = false;
    detectTarget().then((result) => {
      if (!cancelled) setTarget(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!target) {
    return (
      <div className="rounded-lg border border-neutral-800 p-6 bg-neutral-900/40">
        <h2 className="text-xl font-semibold mb-2">Detecting your system…</h2>
        <p className="text-sm text-neutral-400">
          Choose from the manual list below if this takes too long.
        </p>
      </div>
    );
  }

  if (target.os === "unknown" || target.arch === "unknown") {
    return (
      <div className="rounded-lg border border-neutral-800 p-6 bg-neutral-900/40">
        <h2 className="text-xl font-semibold mb-2">
          Select your platform below
        </h2>
        <p className="text-sm text-neutral-300">
          We could not auto-detect your system. Pick the right build from the
          lists below.
        </p>
      </div>
    );
  }

  const recommended = findMatch(assets, target.os, target.arch);
  const altArch = target.arch === "arm64" ? "x64" : "arm64";
  const alternate =
    target.os === "macos" ? findMatch(assets, "macos", altArch) : undefined;

  return (
    <div className="rounded-lg border border-neutral-800 p-6 bg-neutral-900/40">
      <h2 className="text-xl font-semibold mb-1">Recommended Download</h2>
      <p className="text-xs uppercase tracking-wide text-neutral-400 mb-3">
        Detected: {target.os === "macos" ? "macOS" : "Windows"} ·{" "}
        {ARCH_LABEL[target.arch]}
        {target.confidence === "low" ? " (best guess)" : ""}
      </p>
      {recommended ? (
        <a
          className="inline-flex rounded-md bg-white text-black px-4 py-2 font-medium hover:opacity-90"
          href={recommended.browser_download_url}
        >
          Download {recommended.name}
        </a>
      ) : (
        <p className="text-sm text-neutral-300">
          No matching asset is published yet. Use the manual links below.
        </p>
      )}
      {target.os === "macos" && alternate && (
        <p className="mt-4 text-xs text-neutral-400">
          On an {ARCH_LABEL[altArch]} Mac instead?{" "}
          <a
            className="underline hover:text-neutral-200"
            href={alternate.browser_download_url}
          >
            Download {alternate.name}
          </a>
        </p>
      )}
    </div>
  );
}
