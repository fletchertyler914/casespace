import { Suspense } from "react";
import { CasePageClient } from "./page-client";

export default function CasePage() {
  return (
    <Suspense fallback={<main className="p-6 text-sm text-neutral-400">Loading case workspace…</main>}>
      <CasePageClient />
    </Suspense>
  );
}
