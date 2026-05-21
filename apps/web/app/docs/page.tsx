import Link from "next/link";

export default function DocsPage() {
  return (
    <main className="mx-auto max-w-4xl min-h-screen px-6 py-16">
      <h1 className="text-4xl font-semibold mb-4">CaseSpace Documentation</h1>
      <p className="text-neutral-300 mb-8">
        Start with migration, architecture, and readiness guidance.
      </p>
      <ul className="space-y-3 list-disc list-inside">
        <li>
          <Link className="underline" href="/download">
            Download and installation
          </Link>
        </li>
        <li>Architecture and migration deep dives are being integrated.</li>
      </ul>
    </main>
  );
}
