"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  CaseFile,
  CaseSummary,
  Finding,
  Note,
  TimelineEvent,
} from "@repo/types";
import { Badge } from "@/components/ui/badge";
import { FileStatusDot } from "@/components/ui/file-status-dot";
import { getFileStatusLabel } from "@/lib/file-status";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { commandClient } from "@/lib/command-client";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "executive", label: "Executive Summary" },
  { id: "overview", label: "Case Overview" },
  { id: "findings", label: "Findings" },
  { id: "timeline", label: "Timeline" },
  { id: "inventory", label: "Inventory Summary" },
  { id: "notes", label: "Notes" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

interface ReportsWorkspaceProps {
  caseId: string;
  onBack?: () => void;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export function ReportsWorkspace({ caseId, onBack }: ReportsWorkspaceProps) {
  const [activeSection, setActiveSection] = useState<SectionId>("executive");
  const [loading, setLoading] = useState(true);
  const [caseSummary, setCaseSummary] = useState<CaseSummary | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [files, setFiles] = useState<CaseFile[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [billingAmount, setBillingAmount] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [caseRes, findingsRes, timelineRes, filesRes, notesRes, billingRes] =
      await Promise.all([
        commandClient.getCase(caseId),
        commandClient.listFindings(caseId),
        commandClient.listTimelineEvents(caseId),
        commandClient.loadCaseFiles(caseId),
        commandClient.listNotes(caseId),
        commandClient.calculateBillingAmount(caseId),
      ]);
    if (caseRes.ok && caseRes.data) setCaseSummary(caseRes.data);
    if (findingsRes.ok && findingsRes.data) setFindings(findingsRes.data);
    if (timelineRes.ok && timelineRes.data) setTimeline(timelineRes.data);
    if (filesRes.ok && filesRes.data) setFiles(filesRes.data);
    if (notesRes.ok && notesRes.data) setNotes(notesRes.data);
    if (billingRes.ok && billingRes.data) setBillingAmount(billingRes.data.amount);
    setLoading(false);
  }, [caseId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

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
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-border/40 px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold">Report workspace</h2>
          <p className="text-[11px] text-muted-foreground">
            {caseSummary?.name ?? "Loading…"}
          </p>
        </div>
        {onBack ? (
          <Button size="sm" variant="outline" onClick={onBack}>
            Back to panel
          </Button>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1">
        <nav className="w-40 shrink-0 border-r border-border/40 p-2">
          <ul className="space-y-0.5">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <button
                  type="button"
                  className={cn(
                    "w-full rounded-md px-2 py-1.5 text-left text-[11px] transition-colors",
                    activeSection === section.id
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                  )}
                  onClick={() => setActiveSection(section.id)}
                >
                  {section.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-4 p-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading report data…</p>
            ) : (
              <>
                {activeSection === "executive" && (
                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold">Executive Summary</h3>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <Stat label="Files" value={files.length} />
                      <Stat label="Findings" value={findings.length} />
                      <Stat label="Timeline events" value={timeline.length} />
                      <Stat label="Notes" value={notes.length} />
                      {billingAmount != null ? (
                        <Stat
                          label="Billable amount"
                          value={`$${billingAmount.toFixed(2)}`}
                        />
                      ) : null}
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Case &ldquo;{caseSummary?.name}&rdquo; contains{" "}
                      {files.length.toLocaleString()} evidence file
                      {files.length === 1 ? "" : "s"},{" "}
                      {findings.length} finding
                      {findings.length === 1 ? "" : "s"}, and{" "}
                      {timeline.length} timeline event
                      {timeline.length === 1 ? "" : "s"}.
                    </p>
                  </section>
                )}

                {activeSection === "overview" && caseSummary && (
                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold">Case Overview</h3>
                    <dl className="space-y-2 text-xs">
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
                      <ul className="space-y-1 rounded-md border border-border/40 p-2 text-[11px]">
                        {caseSummary.sourcePaths!.map((path) => (
                          <li key={path} className="truncate text-muted-foreground" title={path}>
                            {path.split(/[/\\]/).pop() ?? path}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
                )}

                {activeSection === "findings" && (
                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold">
                      Findings ({findings.length})
                    </h3>
                    {findings.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No findings recorded.</p>
                    ) : (
                      <ul className="space-y-2">
                        {findings.map((f) => (
                          <li
                            key={f.id}
                            className="rounded-md border border-border/40 p-2 text-xs"
                          >
                            <div className="mb-1 flex items-center gap-2">
                              <span className="font-medium">{f.title}</span>
                              {f.severity ? (
                                <Badge variant="outline" className="text-[10px]">
                                  {f.severity}
                                </Badge>
                              ) : null}
                            </div>
                            <p className="line-clamp-3 text-muted-foreground">
                              {stripHtml(f.description) || "—"}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                )}

                {activeSection === "timeline" && (
                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold">
                      Timeline ({timeline.length})
                    </h3>
                    {sortedTimeline.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No timeline events.</p>
                    ) : (
                      <ul className="space-y-2">
                        {sortedTimeline.map((event) => (
                          <li
                            key={event.id}
                            className="rounded-md border border-border/40 p-2 text-xs"
                          >
                            <p className="text-[10px] text-muted-foreground">
                              {formatDate(event.occurredAt)}
                              {event.eventType ? ` · ${event.eventType}` : ""}
                            </p>
                            <p className="mt-0.5">{event.description}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                )}

                {activeSection === "inventory" && (
                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold">
                      Inventory Summary ({files.length} files)
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(statusCounts).map(([status, count]) => (
                        <Badge key={status} variant="secondary" className="text-[10px]">
                          {status}: {count}
                        </Badge>
                      ))}
                    </div>
                    {files.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No files ingested.</p>
                    ) : (
                      <ul className="max-h-64 space-y-1 overflow-y-auto rounded-md border border-border/40 p-2 text-[11px]">
                        {files.slice(0, 100).map((file) => (
                          <li
                            key={file.id}
                            className="flex items-center justify-between gap-2"
                          >
                            <span className="truncate">{file.fileName}</span>
                            <FileStatusDot
                              status={file.status}
                              className="h-2.5 w-2.5 shrink-0"
                              showTitle
                            />
                            <span className="sr-only">
                              {getFileStatusLabel(file.status)}
                            </span>
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
                )}

                {activeSection === "notes" && (
                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold">Notes ({notes.length})</h3>
                    {sortedNotes.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No notes recorded.</p>
                    ) : (
                      <ul className="space-y-2">
                        {sortedNotes.map((note) => (
                          <li
                            key={note.id}
                            className="rounded-md border border-border/40 p-2 text-xs"
                          >
                            <div className="mb-1 flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground">
                                {formatDate(note.createdAt)}
                              </span>
                              {note.pinned ? (
                                <Badge variant="default" className="text-[9px]">
                                  Pinned
                                </Badge>
                              ) : null}
                            </div>
                            <p className="line-clamp-4 text-muted-foreground">
                              {stripHtml(note.content) || "—"}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border/40 bg-muted/20 px-2 py-1.5">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1">{value}</dd>
    </div>
  );
}
