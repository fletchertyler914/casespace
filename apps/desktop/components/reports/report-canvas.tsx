"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { ComplianceFooter } from "@/components/artifacts/compliance-footer";
import { useReportWorkspace } from "./report-workspace-context";
import { ReportSectionBlock } from "./report-section-block";
import { ReportEmptyState } from "./report-empty-state";

export function ReportCanvas() {
  const { draft, loading, generating } = useReportWorkspace();

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        Loading report draft…
      </div>
    );
  }

  if (!draft) {
    return <ReportEmptyState />;
  }

  return (
    <ScrollArea className="min-h-0 flex-1">
      <article className="mx-auto max-w-3xl px-6 py-8 print:max-w-none">
        {generating && (
          <p className="mb-4 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-primary">
            Generating report sections…
          </p>
        )}
        {draft.document.sections.map((section) => (
          <ReportSectionBlock
            key={section.id}
            section={section}
            status={draft.sectionStatus[section.id] ?? "empty"}
          />
        ))}
        {draft.document.compliance.length > 0 ? (
          <ComplianceFooter checks={draft.document.compliance} />
        ) : null}
      </article>
    </ScrollArea>
  );
}
