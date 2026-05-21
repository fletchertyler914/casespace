export default function ContactPage() {
  return (
    <main className="mx-auto max-w-4xl min-h-screen px-6 py-16">
      <h1 className="text-4xl font-semibold mb-4">Contact</h1>
      <p className="text-neutral-300 mb-8">
        For deployment support, pricing, and partnership requests, contact the
        CaseSpace team.
      </p>
      <div className="rounded-xl border border-neutral-800 p-6 bg-neutral-900/30">
        <p>
          Email:{" "}
          <a className="underline" href="mailto:team@casespace.app">
            team@casespace.app
          </a>
        </p>
      </div>
    </main>
  );
}
