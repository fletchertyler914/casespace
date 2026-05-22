import Image from "next/image";
import Link from "next/link";

export default function Page() {
  return (
    <main className="mx-auto max-w-5xl min-h-screen px-6 py-16 md:px-10">
      <section className="grid gap-10 md:grid-cols-[1.4fr_1fr] items-center">
        <div className="space-y-6">
          <p className="text-sm uppercase tracking-[0.2em] text-neutral-400">
            CaseSpace
          </p>
          <h1 className="text-5xl font-semibold leading-tight max-w-3xl">
            Fraud examination workspace built for CFEs — fast, secure, and
            offline-ready.
          </h1>
          <p className="text-neutral-300 max-w-2xl">
            CaseSpace helps Certified Fraud Examiners and investigative
            professionals ingest evidence, document findings and chronology,
            resolve duplicates, and produce defensible examination reports from
            one desktop workflow.
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
        </div>
        <div className="relative mx-auto md:mx-0 w-full max-w-sm aspect-square">
          <div className="absolute inset-6 rounded-full bg-amber-400/10 blur-3xl" />
          <Image
            src="/casespace-owl.png"
            alt="The CaseSpace owl mascot"
            fill
            priority
            sizes="(min-width: 768px) 22rem, 18rem"
            className="relative object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
          />
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4 mt-14">
        {[
          {
            title: "Evidence-First",
            copy: "Review, flag, and link files to findings and timeline events.",
          },
          {
            title: "Examination Reports",
            copy: "Assemble findings, chronology, and evidence index for client deliverables.",
          },
          {
            title: "Offline-First",
            copy: "Core examination workflows run without network dependency.",
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
        <h2 className="text-xl font-semibold">
          Need enterprise rollout support?
        </h2>
        <p className="text-sm text-neutral-300 mt-2">
          Contact the CaseSpace team for deployment guidance, workflow
          tailoring, and production hardening.
        </p>
        <Link className="inline-block mt-4 underline" href="/contact">
          Contact sales
        </Link>
      </section>
    </main>
  );
}
