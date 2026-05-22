"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { History, PanelLeft, Sparkles } from "lucide-react";
import type {
  CaseFile,
  CaseSummary,
  Finding,
  Note,
  ReportDocument,
  ReportExportHistoryEntry,
  ReportTemplateId,
  TimelineEvent,
} from "@repo/types";
import { Badge } from "@/components/ui/badge";
import { FileStatusDot } from "@/components/ui/file-status-dot";
import { getFileStatusLabel } from "@/lib/file-status";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { commandClient } from "@/lib/command-client";
import {
  REPORT_SECTION_DEFS,
  type ReportSectionId,
} from "@/lib/report-sections";
import { DEFAULT_REPORT_TEMPLATE_ID } from "@/lib/report-templates";
import { ReportTemplatePicker } from "./report-template-picker";
import { ComplianceFooter } from "./compliance-footer";
import { CitationPillList } from "./citation-pill";

const TEMPLATE_STORAGE_KEY = "casespace.reportTemplate";

function loadTemplateForCase(caseId: string): ReportTemplateId {
  if (typeof window === "undefined") return DEFAULT_REPORT_TEMPLATE_ID;
  try {
    const raw = localStorage.getItem(`${TEMPLATE_STORAGE_KEY}.${caseId}`);
    return (raw as ReportTemplateId) || DEFAULT_REPORT_TEMPLATE_ID;
  } catch {
    return DEFAULT_REPORT_TEMPLATE_ID;
  }
}

function saveTemplateForCase(caseId: string, templateId: ReportTemplateId) {
  try {
    localStorage.setItem(`${TEMPLATE_STORAGE_KEY}.${caseId}`, templateId);
  } catch {
    /* ignore */
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export interface ReportsViewProps {
  caseId: string;
  caseSummary: CaseSummary;
  activeSection: ReportSectionId;
  files: CaseFile[];
  notes: Note[];
  findings: Finding[];
  timeline: TimelineEvent[];
  navigatorOpen: boolean;
  onExpandNavigator: () => void;
}

export function ReportsView({
  caseId,
  caseSummary,
  activeSection,
  files,
  notes,
  findings,
  timeline,
  navigatorOpen,
  onExpandNavigator,
}: ReportsViewProps) {
  const [loading, setLoading] = useState(true);
  const [billingAmount, setBillingAmount] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState("");
  const [reportDocument, setReportDocument] = useState<ReportDocument | null>(null);
  const [templateId, setTemplateId] = useState<ReportTemplateId>(() =>
    loadTemplateForCase(caseId),
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [history, setHistory] = useState<ReportExportHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    setTemplateId(loadTemplateForCase(caseId));
  }, [caseId]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    const res = await commandClient.listReportExports(caseId);
    if (res.ok && res.data) setHistory(res.data);
    setHistoryLoading(false);
  }, [caseId]);

  const loadBilling = useCallback(async () => {
    setLoading(true);
    const billingRes = await commandClient.calculateBillingAmount(caseId);
    if (billingRes.ok && billingRes.data) {
      setBillingAmount(billingRes.data.amount);
    }
    setLoading(false);
  }, [caseId]);

  useEffect(() => {
    void loadBilling();
    void loadHistory();
  }, [loadBilling, loadHistory]);

  async function generateReport(selectedTemplate?: ReportTemplateId) {
    const tid = selectedTemplate ?? templateId;
    setGenerating(true);
    const res = await commandClient.generateCaseReport(caseId, tid);
    setGenerating(false);
    if (res.ok && res.data) {
      try {
        const doc = JSON.parse(res.data) as ReportDocument;
        setReportDocument(doc);
        setGeneratedPreview(doc.markdown);
        setTemplateId(tid);
        saveTemplateForCase(caseId, tid);
      } catch {
        setReportDocument(null);
        setGeneratedPreview(res.data);
      }
      void loadHistory();
    } else {
      setGeneratedPreview("Report generation failed. Try again.");
      setReportDocument(null);
    }
  }

  const activeLabel =
    REPORT_SECTION_DEFS.find((s) => s.id === activeSection)?.label ?? "Section";

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const file of files) {
      counts[file.status] = (counts[file.status] ?? 0) + 1;
    }
    return counts;
  }, [files]);

  const sortedTimeline = useMemo(
    () =>
      [...timeline].sort(
        (a, b) =>
          new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
      ),
    [timeline],
  );

  const sortedNotes = useMemo(
    () =>
      [...notes].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }),
    [notes],
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="shrink-0 border-b border-border/40 px-4 pt-3 pb-3">
        <div className="mb-3 flex items-center gap-2">
          {!navigatorOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              title="Show navigator"
              onClick={onExpandNavigator}
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold">Examination report</h2>
            <p className="text-xs text-muted-foreground">
              {caseSummary.name} — CFE deliverables from linked artifacts
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setPickerOpen(true)}
            >
              Template: {templateId}
            </Button>
            <Button
              size="sm"
              className="h-8"
              disabled={generating}
              onClick={() => void generateReport()}
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              {generating ? "Generating…" : "Generate report"}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <History className="h-3.5 w-3.5" />
                  History
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <p className="px-2 py-1.5 text-[11px] text-muted-foreground">
                  Legacy export history
                </p>
                {historyLoading ? (
                  <DropdownMenuItem disabled>Loading…</DropdownMenuItem>
                ) : history.length === 0 ? (
                  <DropdownMenuItem disabled>No exports yet</DropdownMenuItem>
                ) : (
                  history.slice(0, 10).map((item) => (
                    <DropdownMenuItem key={item.id} className="text-xs">
                      {item.reportType} —{" "}
                      {new Date(item.generatedAt).toLocaleString()}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-4 text-xs">
          <ReportStat label="Evidence files" value={files.length} />
          <ReportStat label="Findings" value={findings.length} />
          <ReportStat label="Timeline" value={timeline.length} />
          <ReportStat label="Notes" value={notes.length} />
          {billingAmount != null ? (
            <ReportStat
              label="Billable"
              value={`$${billingAmount.toFixed(2)}`}
            />
          ) : null}
        </div>

      </div>

      <div className="shrink-0 border-b border-border/20 px-4 py-2">
        <p className="text-xs text-muted-foreground/80">
          Viewing <span className="font-medium text-foreground">{activeLabel}</span>
          {loading ? " — loading…" : null}
        </p>
      </div>

      {generatedPreview ? (
        <div className="shrink-0 border-b border-border/40 bg-muted/10 px-4 py-2">
          <pre className="max-h-32 overflow-auto rounded-md border border-border/40 bg-card p-3 text-xs leading-relaxed whitespace-pre-wrap">
            {generatedPreview.slice(0, 1600)}
            {generatedPreview.length > 1600 ? "…" : ""}
          </pre>
          {reportDocument?.sections?.length ? (
            <div className="mt-2 space-y-2">
              {reportDocument.sections.slice(0, 2).map((section) => (
                <div key={section.id}>
                  <p className="text-[11px] font-medium">{section.heading}</p>
                  <CitationPillList citations={section.citations} />
                </div>
              ))}
            </div>
          ) : null}
          {reportDocument?.compliance?.length ? (
            <ComplianceFooter checks={reportDocument.compliance} />
          ) : null}
        </div>
      ) : null}

      <ReportTemplatePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        selectedId={templateId}
        onSelect={(id) => {
          setTemplateId(id);
          saveTemplateForCase(caseId, id);
          void generateReport(id);
        }}
      />

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 p-4 pb-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading report data…</p>
          ) : (
            <ReportSectionContent
              activeSection={activeSection}
              caseSummary={caseSummary}
              findings={findings}
              timeline={sortedTimeline}
              files={files}
              notes={sortedNotes}
              statusCounts={statusCounts}
              billingAmount={billingAmount}
            />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function ReportStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function SectionHeading({
  title,
  count,
}: {
  title: string;
  count?: number;
}) {
  return (
    <h3 className="text-sm font-semibold text-foreground">
      {title}
      {count != null ? (
        <span className="ml-1.5 font-normal text-muted-foreground">({count})</span>
      ) : null}
    </h3>
  );
}

function ReportCard({ children }: { children: ReactNode }) {
  return (
    <li className="rounded-lg border border-border/40 bg-card p-3 text-sm shadow-sm">
      {children}
    </li>
  );
}

function ReportSectionContent({
  activeSection,
  caseSummary,
  findings,
  timeline,
  files,
  notes,
  statusCounts,
  billingAmount,
}: {
  activeSection: ReportSectionId;
  caseSummary: CaseSummary;
  findings: Finding[];
  timeline: TimelineEvent[];
  files: CaseFile[];
  notes: Note[];
  statusCounts: Record<string, number>;
  billingAmount: number | null;
}) {
  if (activeSection === "executive") {
    return (
      <section className="space-y-4">
        <SectionHeading title="Executive Summary" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Files" value={files.length} />
          <MetricCard label="Findings" value={findings.length} />
          <MetricCard label="Timeline events" value={timeline.length} />
          <MetricCard label="Notes" value={notes.length} />
          {billingAmount != null ? (
            <MetricCard
              label="Billable amount"
              value={`$${billingAmount.toFixed(2)}`}
            />
          ) : null}
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Case &ldquo;{caseSummary.name}&rdquo; contains{" "}
          {files.length.toLocaleString()} evidence file
          {files.length === 1 ? "" : "s"}, {findings.length} finding
          {findings.length === 1 ? "" : "s"}, and {timeline.length} timeline
          event{timeline.length === 1 ? "" : "s"}.
        </p>
      </section>
    );
  }

  if (activeSection === "overview") {
    return (
      <section className="space-y-4">
        <SectionHeading title="Case Overview" />
        <dl className="space-y-2 rounded-lg border border-border/40 bg-card p-4 text-sm">
          <Row label="Name" value={caseSummary.name} />
          <Row label="Status" value={caseSummary.status} />
          <Row label="Created" value={formatDate(caseSummary.createdAt)} />
          <Row label="Updated" value={formatDate(caseSummary.updatedAt)} />
          <Row
            label="Sources"
            value={
              (caseSummary.sourcePaths?.length ?? 0) > 0
                ? `${caseSummary.sourcePaths!.length} configured`
                : "None"
            }
          />
        </dl>
        {(caseSummary.sourcePaths?.length ?? 0) > 0 ? (
          <ul className="space-y-1 rounded-lg border border-border/40 bg-card p-3 text-xs">
            {caseSummary.sourcePaths!.map((path) => (
              <li key={path} className="truncate text-muted-foreground" title={path}>
                {path.split(/[/\\]/).pop() ?? path}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    );
  }

  if (activeSection === "findings") {
    return (
      <section className="space-y-4">
        <SectionHeading title="Findings" count={findings.length} />
        {findings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No findings recorded.</p>
        ) : (
          <ul className="space-y-2">
            {findings.map((f) => (
              <ReportCard key={f.id}>
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="font-medium">{f.title}</span>
                  {f.severity ? (
                    <Badge variant="outline" className="text-[10px]">
                      {f.severity}
                    </Badge>
                  ) : null}
                </div>
                <p className="line-clamp-4 text-muted-foreground">
                  {stripHtml(f.description) || "—"}
                </p>
              </ReportCard>
            ))}
          </ul>
        )}
      </section>
    );
  }

  if (activeSection === "timeline") {
    return (
      <section className="space-y-4">
        <SectionHeading title="Chronology" count={timeline.length} />
        {timeline.length === 0 ? (
          <p className="text-sm text-muted-foreground">No timeline events.</p>
        ) : (
          <ul className="space-y-2">
            {timeline.map((event) => (
              <ReportCard key={event.id}>
                <p className="text-xs text-muted-foreground">
                  {formatDate(event.occurredAt)}
                  {event.eventType ? ` · ${event.eventType}` : ""}
                </p>
                <p className="mt-1">{event.description}</p>
              </ReportCard>
            ))}
          </ul>
        )}
      </section>
    );
  }

  if (activeSection === "inventory") {
    return (
      <section className="space-y-4">
        <SectionHeading title="Evidence Index" count={files.length} />
        <div className="flex flex-wrap gap-2">
          {Object.entries(statusCounts).map(([status, count]) => (
            <Badge key={status} variant="secondary" className="text-xs">
              {status}: {count}
            </Badge>
          ))}
        </div>
        {files.length === 0 ? (
          <p className="text-sm text-muted-foreground">No files in this scope.</p>
        ) : (
          <ul className="max-h-[min(24rem,50vh)] space-y-1 overflow-y-auto rounded-lg border border-border/40 bg-card p-3 text-xs">
            {files.slice(0, 100).map((file) => (
              <li
                key={file.id}
                className="flex items-center justify-between gap-2 py-0.5"
              >
                <span className="truncate">{file.fileName}</span>
                <FileStatusDot
                  status={file.status}
                  className="h-2.5 w-2.5 shrink-0"
                  showTitle
                />
                <span className="sr-only">{getFileStatusLabel(file.status)}</span>
              </li>
            ))}
            {files.length > 100 ? (
              <li className="pt-1 text-muted-foreground">
                …and {files.length - 100} more
              </li>
            ) : null}
          </ul>
        )}
      </section>
    );
  }

  if (activeSection === "notes") {
    return (
      <section className="space-y-4">
        <SectionHeading title="Working Notes" count={notes.length} />
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notes recorded.</p>
        ) : (
          <ul className="space-y-2">
            {notes.map((note) => (
              <ReportCard key={note.id}>
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(note.createdAt)}
                  </span>
                  {note.pinned ? (
                    <Badge variant="default" className="text-[10px]">
                      Pinned
                    </Badge>
                  ) : null}
                </div>
                <p className="line-clamp-6 text-muted-foreground">
                  {stripHtml(note.content) || "—"}
                </p>
              </ReportCard>
            ))}
          </ul>
        )}
      </section>
    );
  }

  return null;
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border/40 bg-card px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 text-sm">
      <dt className="w-24 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1">{value}</dd>
    </div>
  );
}

/** @deprecated Use ReportsView in workspace shell — kept for unit tests */
export function ReportsWorkspace(props: { caseId: string }) {
  const emptyCase: CaseSummary = {
    id: props.caseId,
    name: "Test",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sourcePaths: [],
  };
  return (
    <ReportsView
      caseId={props.caseId}
      caseSummary={emptyCase}
      activeSection="findings"
      files={[]}
      notes={[]}
      findings={[]}
      timeline={[]}
      navigatorOpen={false}
      onExpandNavigator={() => {}}
    />
  );
}
