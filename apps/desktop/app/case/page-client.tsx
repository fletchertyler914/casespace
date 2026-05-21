"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CaseWorkspaceShell } from "@/components/workspace/case-workspace-shell";

export function CasePageClient() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id") ?? "";

  useEffect(() => {
    if (!id) {
      router.replace("/");
    }
  }, [id, router]);

  if (!id) {
    return (
      <main className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Redirecting…
      </main>
    );
  }

  return <CaseWorkspaceShell caseId={id} />;
}
