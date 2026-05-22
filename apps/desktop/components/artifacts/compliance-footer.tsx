"use client";

import type { StandardsComplianceCheck } from "@repo/types";
import { CheckCircle2, CircleAlert, MinusCircle } from "lucide-react";
import { COMPLIANCE_CHECK_DEFS } from "@/lib/report-templates";

interface ComplianceFooterProps {
  checks: StandardsComplianceCheck[];
}

function StatusIcon({ status }: { status: StandardsComplianceCheck["status"] }) {
  if (status === "verified") {
    return <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />;
  }
  if (status === "not_applicable") {
    return <MinusCircle className="h-4 w-4 text-muted-foreground" aria-hidden />;
  }
  return <CircleAlert className="h-4 w-4 text-amber-600" aria-hidden />;
}

export function ComplianceFooter({ checks }: ComplianceFooterProps) {
  if (checks.length === 0) return null;

  return (
    <div className="mt-6 rounded-lg border border-border/60 bg-muted/30 p-4">
      <h3 className="mb-3 text-sm font-semibold">Standards Compliance</h3>
      <ul className="space-y-2">
        {checks.map((check) => {
          const def = COMPLIANCE_CHECK_DEFS[check.id];
          return (
            <li key={check.id} className="flex items-start gap-2 text-xs">
              <StatusIcon status={check.status} />
              <div>
                <p className="font-medium">{check.label}</p>
                {def?.description ? (
                  <p className="text-muted-foreground">{def.description}</p>
                ) : null}
                {check.detail ? (
                  <p className="text-muted-foreground">{check.detail}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
