import { DownloadChooser } from "./download-chooser";
import {
  classifyAsset,
  fetchLatestStableRelease,
} from "../../lib/releases";

const DEFAULT_REPO = "tyler/casespace";

export default async function DownloadPage() {
  const repo = process.env.NEXT_PUBLIC_RELEASE_REPOSITORY ?? DEFAULT_REPO;
  const release = await fetchLatestStableRelease(repo, process.env.GITHUB_TOKEN);

  const assets = release?.assets ?? [];
  const macAssets = assets.filter((asset) => classifyAsset(asset.name) === "macos");
  const windowsAssets = assets.filter(
    (asset) => classifyAsset(asset.name) === "windows",
  );

  return (
    <main className="mx-auto max-w-4xl min-h-screen p-8 md:p-16">
      <h1 className="text-4xl font-bold mb-4">Download CaseSpace</h1>
      <p className="text-neutral-300 mb-8">
        Download the latest production release artifact for your machine.
      </p>

      <DownloadChooser assets={assets} />

      <section className="mt-8 grid md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-neutral-800 p-6">
          <h2 className="text-lg font-semibold mb-3">macOS</h2>
          <ul className="space-y-2">
            {macAssets.length === 0 && (
              <li className="text-sm text-neutral-400">No macOS assets published yet.</li>
            )}
            {macAssets.map((asset) => (
              <li key={asset.name}>
                <a
                  className="text-sm underline hover:text-neutral-200"
                  href={asset.browser_download_url}
                >
                  {asset.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-neutral-800 p-6">
          <h2 className="text-lg font-semibold mb-3">Windows</h2>
          <ul className="space-y-2">
            {windowsAssets.length === 0 && (
              <li className="text-sm text-neutral-400">
                No Windows assets published yet.
              </li>
            )}
            {windowsAssets.map((asset) => (
              <li key={asset.name}>
                <a
                  className="text-sm underline hover:text-neutral-200"
                  href={asset.browser_download_url}
                >
                  {asset.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {release && (
        <p className="mt-8 text-sm text-neutral-400">
          Latest stable release:{" "}
          <a className="underline" href={release.html_url}>
            {release.tag_name}
          </a>
        </p>
      )}
    </main>
  );
}
