import Link from "next/link";

export default function Page() {
  return (
    <main className="mx-auto max-w-5xl min-h-screen px-6 py-16 md:px-10">
      <section className="space-y-6">
        <p className="text-sm uppercase tracking-[0.2em] text-neutral-400">
          CaseSpace
        </p>
        <h1 className="text-5xl font-semibold leading-tight max-w-3xl">
          Investigative case intelligence built for speed, security, and offline
          execution.
        </h1>
        <p className="text-neutral-300 max-w-2xl">
          CaseSpace helps investigators and analysts ingest large evidence sets,
          manage findings, and produce defensible outputs from a single desktop
          workflow.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-md bg-white text-black px-5 py-2 font-medium hover:opacity-90"
            href="/download"
          >
            Download Desktop
          </Link>
          <Link
            className="rounded-md border border-neutral-700 px-5 py-2 hover:bg-neutral-900"
            href="/docs"
          >
            Read Docs
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4 mt-14">
        {[
          {
            title: "Offline-First",
            copy: "Core workflows remain operational without network dependency.",
          },
          {
            title: "Secure By Default",
            copy: "Command-risk controls, least-privilege capabilities, and signed releases.",
          },
          {
            title: "High Throughput",
            copy: "Built to ingest and search large case datasets on low-power hardware.",
          },
        ].map((feature) => (
          <article
            key={feature.title}
            className="rounded-xl border border-neutral-800 p-5 bg-neutral-900/30"
          >
            <h2 className="text-lg font-medium">{feature.title}</h2>
            <p className="text-sm text-neutral-300 mt-2">{feature.copy}</p>
          </article>
        ))}
      </section>

      <section className="mt-12 rounded-xl border border-neutral-800 p-6 bg-neutral-900/30">
        <h2 className="text-xl font-semibold">Need enterprise rollout support?</h2>
        <p className="text-sm text-neutral-300 mt-2">
          Contact the CaseSpace team for deployment guidance, workflow tailoring,
          and production hardening.
        </p>
        <Link className="inline-block mt-4 underline" href="/contact">
          Contact sales
        </Link>
      </section>
    </main>
  );
}
