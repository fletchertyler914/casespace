"use client";

import { useSearchParams } from "next/navigation";
import { CaseWorkspace } from "../../components/case-workspace";

export function CasePageClient() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  return <CaseWorkspace initialCaseId={id} />;
}
