"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type {
  BillingSummary,
  CaseFile,
  CaseSummary,
  Finding,
  Note,
  ReportExport,
  TimelineEvent,
  TimeEntry,
} from "@repo/types";
import { commandClient } from "../lib/command-client";

const FILE_STATUSES = [
  "unreviewed",
  "in_review",
  "reviewed",
  "flagged",
  "excluded",
] as const;

const REPORT_TYPES = [
  { id: "narrative", label: "Narrative" },
  { id: "executive", label: "Executive summary" },
  { id: "evidence_index", label: "Evidence index" },
  { id: "financial", label: "Financial package" },
  { id: "billing_invoice", label: "Billing invoice" },
] as const;

export function CaseWorkspace({ initialCaseId = "" }: { initialCaseId?: string }) {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState(initialCaseId);
  const [newCaseName, setNewCaseName] = useState("");
  const [sourcePath, setSourcePath] = useState("");
  const [files, setFiles] = useState<CaseFile[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [billing, setBilling] = useState<BillingSummary | null>(null);
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [previewPath, setPreviewPath] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [previewImageSrc, setPreviewImageSrc] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [findingTitle, setFindingTitle] = useState("");
  const [findingBody, setFindingBody] = useState("");
  const [timelineDraft, setTimelineDraft] = useState("");
  const [lastExport, setLastExport] = useState<ReportExport | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [message, setMessage] = useState("");

  const refreshCases = useCallback(async () => {
    const response = await commandClient.listCases();
    if (!response.ok || !response.data) {
      setMessage(response.error?.message ?? "Unable to list cases");
      return;
    }
    setCases(response.data);
    if (!selectedCaseId && response.data[0]) {
      setSelectedCaseId(response.data[0].id);
    }
  }, [selectedCaseId]);

  const refreshWorkspace = useCallback(async (caseId: string) => {
    if (!caseId) return;
    const [fileRes, noteRes, findingRes, timelineRes, timeRes, billRes] =
      await Promise.all([
        commandClient.loadCaseFiles(caseId),
        commandClient.listNotes(caseId),
        commandClient.listFindings(caseId),
        commandClient.listTimelineEvents(caseId),
        commandClient.getTimeEntries(caseId),
        commandClient.calculateBillingAmount(caseId),
      ]);
    if (fileRes.ok && fileRes.data) setFiles(fileRes.data);
    if (noteRes.ok && noteRes.data) setNotes(noteRes.data);
    if (findingRes.ok && findingRes.data) setFindings(findingRes.data);
    if (timelineRes.ok && timelineRes.data) setTimeline(timelineRes.data);
    if (timeRes.ok && timeRes.data) {
      setTimeEntries(timeRes.data);
      const open = timeRes.data.find((e) => !e.endedAt);
      setActiveTimerId(open?.id ?? null);
    }
    if (billRes.ok && billRes.data) setBilling(billRes.data);
  }, []);

  useEffect(() => {
    void refreshCases();
  }, [refreshCases]);

  useEffect(() => {
    if (initialCaseId) {
      setSelectedCaseId(initialCaseId);
    }
  }, [initialCaseId]);

  useEffect(() => {
    if (selectedCaseId) {
      void refreshWorkspace(selectedCaseId);
    }
  }, [selectedCaseId, refreshWorkspace]);

  async function createCase() {
    if (!newCaseName.trim() || !sourcePath.trim()) {
      setMessage("Case name and source path are required.");
      return;
    }
    const response = await commandClient.createCase({
      name: newCaseName,
      sourcePaths: [sourcePath.trim()],
    });
    if (!response.ok || !response.data) {
      setMessage(response.error?.message ?? "Unable to create case.");
      return;
    }
    setNewCaseName("");
    setSourcePath("");
    setSelectedCaseId(response.data.id);
    await refreshCases();
    setMessage("Case created.");
  }

  async function ingestCase() {
    if (!selectedCaseId) return;
    const response = await commandClient.ingestFilesToCase(selectedCaseId);
    if (!response.ok) {
      setMessage(response.error?.message ?? "Ingest failed.");
      return;
    }
    await refreshWorkspace(selectedCaseId);
    setMessage(`Ingested ${response.data ?? 0} file(s).`);
  }

  async function runSearch() {
    if (!selectedCaseId || !searchQuery.trim()) return;
    const response = await commandClient.searchAll(selectedCaseId, searchQuery);
    if (!response.ok || !response.data) {
      setMessage(response.error?.message ?? "Search failed.");
      return;
    }
    setSearchResults(response.data);
    setMessage(`Search: ${response.data.length} hit(s).`);
  }

  async function addNote() {
    if (!selectedCaseId || !noteDraft.trim()) return;
    const response = await commandClient.createNote(
      selectedCaseId,
      noteDraft.trim(),
    );
    if (!response.ok) {
      setMessage(response.error?.message ?? "Could not create note.");
      return;
    }
    setNoteDraft("");
    await refreshWorkspace(selectedCaseId);
  }

  async function addFinding() {
    if (!selectedCaseId || !findingTitle.trim()) return;
    const response = await commandClient.createFinding(
      selectedCaseId,
      findingTitle.trim(),
      findingBody.trim(),
    );
    if (!response.ok) {
      setMessage(response.error?.message ?? "Could not create finding.");
      return;
    }
    setFindingTitle("");
    setFindingBody("");
    await refreshWorkspace(selectedCaseId);
  }

  async function addTimeline() {
    if (!selectedCaseId || !timelineDraft.trim()) return;
    const response = await commandClient.createTimelineEvent(
      selectedCaseId,
      timelineDraft.trim(),
    );
    if (!response.ok) {
      setMessage(response.error?.message ?? "Could not create timeline event.");
      return;
    }
    setTimelineDraft("");
    await refreshWorkspace(selectedCaseId);
  }

  async function toggleTimer() {
    if (!selectedCaseId) return;
    if (activeTimerId) {
      const response = await commandClient.stopTimer(activeTimerId);
      if (!response.ok) {
        setMessage(response.error?.message ?? "Stop timer failed.");
        return;
      }
      setActiveTimerId(null);
    } else {
      const response = await commandClient.startTimer(selectedCaseId);
      if (!response.ok || !response.data) {
        setMessage(response.error?.message ?? "Start timer failed.");
        return;
      }
      setActiveTimerId(response.data.id);
    }
    await refreshWorkspace(selectedCaseId);
  }

  async function exportReport(reportType: string) {
    if (!selectedCaseId) return;
    const response = await commandClient.exportCaseReport(
      selectedCaseId,
      reportType,
    );
    if (!response.ok || !response.data) {
      setMessage(response.error?.message ?? "Export failed.");
      return;
    }
    setLastExport(response.data);
    setMessage(`Exported ${reportType} to ${response.data.filePath}`);
  }

  async function previewFile(path: string) {
    if (!selectedCaseId) return;
    setPreviewPath(path);
    setPreviewImageSrc("");
    const lower = path.toLowerCase();
    if (
      lower.endsWith(".png") ||
      lower.endsWith(".jpg") ||
      lower.endsWith(".jpeg") ||
      lower.endsWith(".gif") ||
      lower.endsWith(".webp")
    ) {
      const image = await commandClient.readFileBase64(selectedCaseId, path);
      if (!image.ok || !image.data) {
        setPreviewText(image.error?.message ?? "Image preview unavailable.");
        return;
      }
      const mime = lower.endsWith(".png")
        ? "image/png"
        : lower.endsWith(".gif")
          ? "image/gif"
          : lower.endsWith(".webp")
            ? "image/webp"
            : "image/jpeg";
      setPreviewImageSrc(`data:${mime};base64,${image.data}`);
      setPreviewText("");
      return;
    }
    const response = await commandClient.readFileText(selectedCaseId, path);
    if (!response.ok || !response.data) {
      setPreviewText(response.error?.message ?? "Preview unavailable.");
      return;
    }
    setPreviewText(response.data.slice(0, 8000));
  }

  async function updateStatus(fileId: string, status: string) {
    const response = await commandClient.updateFileStatus(fileId, status);
    if (!response.ok) {
      setMessage(response.error?.message ?? "Status update failed.");
      return;
    }
    if (selectedCaseId) await refreshWorkspace(selectedCaseId);
  }

  async function deleteSelectedCase() {
    if (!selectedCaseId || !deleteConfirm) {
      setMessage("Check confirm before deleting a case.");
      return;
    }
    const response = await commandClient.deleteCase(selectedCaseId);
    if (!response.ok) {
      setMessage(response.error?.message ?? "Delete failed.");
      return;
    }
    setSelectedCaseId("");
    setDeleteConfirm(false);
    await refreshCases();
    setMessage("Case deleted.");
  }

  const selectedCase = cases.find((c) => c.id === selectedCaseId);

  return (
    <main className="mx-auto max-w-7xl p-6 space-y-6">
      <header className="rounded-xl border border-neutral-800 p-5 flex items-center gap-4">
        <Image
          src="/casespace-owl-icon.png"
          alt="CaseSpace"
          width={48}
          height={48}
          priority
        />
        <div>
          <h1 className="text-2xl font-semibold">CaseSpace</h1>
          <p className="text-sm text-neutral-400">
            Core parity workspace — ingest, review, artifacts, search, billing,
            reports.
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <section className="rounded-xl border border-neutral-800 p-4 space-y-2">
            <h2 className="font-medium">New case</h2>
            <input
              className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
              placeholder="Case name"
              value={newCaseName}
              onChange={(e) => setNewCaseName(e.target.value)}
            />
            <input
              className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
              placeholder="Source folder (absolute)"
              value={sourcePath}
              onChange={(e) => setSourcePath(e.target.value)}
            />
            <button
              type="button"
              className="w-full rounded bg-white text-black py-2 text-sm font-medium"
              onClick={() => void createCase()}
            >
              Create case
            </button>
          </section>

          <section className="rounded-xl border border-neutral-800 p-4 space-y-2">
            <h2 className="font-medium">Cases</h2>
            <ul className="space-y-1 max-h-48 overflow-y-auto">
              {cases.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className={`w-full text-left rounded px-2 py-1.5 text-sm ${
                      c.id === selectedCaseId
                        ? "bg-neutral-700"
                        : "hover:bg-neutral-800"
                    }`}
                    onClick={() => setSelectedCaseId(c.id)}
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
            {selectedCaseId && (
              <div className="pt-2 space-y-2 border-t border-neutral-800">
                <label className="flex items-center gap-2 text-xs text-neutral-400">
                  <input
                    type="checkbox"
                    checked={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.checked)}
                  />
                  Confirm delete
                </label>
                <button
                  type="button"
                  className="w-full rounded border border-red-800 text-red-300 py-1.5 text-sm"
                  onClick={() => void deleteSelectedCase()}
                >
                  Delete case
                </button>
              </div>
            )}
          </section>
        </aside>

        <div className="space-y-4">
          {selectedCase ? (
            <>
              <section className="rounded-xl border border-neutral-800 p-4 flex flex-wrap gap-3 items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium">{selectedCase.name}</h2>
                  <p className="text-xs text-neutral-400">
                    {files.length} files · {notes.length} notes ·{" "}
                    {findings.length} findings
                    {billing
                      ? ` · $${billing.amount.toFixed(2)} billable`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded bg-white text-black px-3 py-1.5 text-sm font-medium"
                    onClick={() => void ingestCase()}
                  >
                    Ingest sources
                  </button>
                  <button
                    type="button"
                    className={`rounded px-3 py-1.5 text-sm font-medium ${
                      activeTimerId
                        ? "bg-amber-500 text-black"
                        : "border border-neutral-600"
                    }`}
                    onClick={() => void toggleTimer()}
                  >
                    {activeTimerId ? "Stop timer" : "Start timer"}
                  </button>
                </div>
              </section>

              <div className="grid gap-4 lg:grid-cols-2">
                <section className="rounded-xl border border-neutral-800 p-4 space-y-2">
                  <h3 className="font-medium">Files</h3>
                  <ul className="max-h-64 overflow-y-auto text-sm space-y-1">
                    {files.map((f) => (
                      <li
                        key={f.id}
                        className="flex items-center gap-2 justify-between"
                      >
                        <button
                          type="button"
                          className="text-left truncate flex-1 hover:underline"
                          onClick={() => void previewFile(f.filePath)}
                        >
                          {f.fileName}
                        </button>
                        <select
                          className="rounded border border-neutral-700 bg-neutral-900 text-xs"
                          value={f.status}
                          onChange={(e) =>
                            void updateStatus(f.id, e.target.value)
                          }
                        >
                          {FILE_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="rounded-xl border border-neutral-800 p-4 space-y-2">
                  <h3 className="font-medium">Preview</h3>
                  <p className="text-xs text-neutral-500 truncate">
                    {previewPath || "Select a file"}
                  </p>
                  {previewImageSrc ? (
                    <Image
                      src={previewImageSrc}
                      alt="Case file preview"
                      width={640}
                      height={360}
                      unoptimized
                      className="max-h-64 w-auto rounded border border-neutral-800"
                    />
                  ) : null}
                  <pre className="text-xs text-neutral-300 max-h-64 overflow-auto whitespace-pre-wrap">
                    {previewText || "—"}
                  </pre>
                </section>
              </div>

              <section className="rounded-xl border border-neutral-800 p-4 space-y-2">
                <h3 className="font-medium">Search</h3>
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="FTS search"
                  />
                  <button
                    type="button"
                    className="rounded bg-white text-black px-3 py-2 text-sm"
                    onClick={() => void runSearch()}
                  >
                    Search
                  </button>
                </div>
                <ul className="text-xs text-neutral-400 list-disc list-inside">
                  {searchResults.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </section>

              <div className="grid gap-4 lg:grid-cols-3">
                <ArtifactPanel
                  title="Notes"
                  draft={noteDraft}
                  onDraft={setNoteDraft}
                  onAdd={() => void addNote()}
                  items={notes.map((n) => n.content)}
                />
                <ArtifactPanel
                  title="Findings"
                  draft={findingTitle}
                  onDraft={setFindingTitle}
                  onAdd={() => void addFinding()}
                  items={findings.map((f) => `${f.title}: ${f.description}`)}
                  extra={
                    <textarea
                      className="w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm"
                      placeholder="Description"
                      value={findingBody}
                      onChange={(e) => setFindingBody(e.target.value)}
                    />
                  }
                />
                <ArtifactPanel
                  title="Timeline"
                  draft={timelineDraft}
                  onDraft={setTimelineDraft}
                  onAdd={() => void addTimeline()}
                  items={timeline.map(
                    (t) => `${t.occurredAt}: ${t.description}`,
                  )}
                />
              </div>

              <section className="rounded-xl border border-neutral-800 p-4 space-y-2">
                <h3 className="font-medium">Reports</h3>
                <div className="flex flex-wrap gap-2">
                  {REPORT_TYPES.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      className="rounded border border-neutral-600 px-3 py-1.5 text-sm"
                      onClick={() => void exportReport(r.id)}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                {lastExport && (
                  <p className="text-xs text-neutral-400 break-all">
                    Last: {lastExport.filePath}
                  </p>
                )}
              </section>

              <section className="rounded-xl border border-neutral-800 p-4">
                <h3 className="font-medium mb-2">Time entries</h3>
                <ul className="text-sm text-neutral-400 space-y-1">
                  {timeEntries.map((e) => (
                    <li key={e.id}>
                      {e.startedAt} → {e.endedAt ?? "running"} (
                      {e.billableMinutes} min)
                    </li>
                  ))}
                </ul>
              </section>
            </>
          ) : (
            <p className="text-neutral-400 text-sm">
              Create or select a case to open the workspace.
            </p>
          )}
        </div>
      </div>

      {message && (
        <p className="text-sm text-neutral-400 border-t border-neutral-800 pt-3">
          {message}
        </p>
      )}
    </main>
  );
}

function ArtifactPanel({
  title,
  draft,
  onDraft,
  onAdd,
  items,
  extra,
}: {
  title: string;
  draft: string;
  onDraft: (v: string) => void;
  onAdd: () => void;
  items: string[];
  extra?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-neutral-800 p-4 space-y-2">
      <h3 className="font-medium">{title}</h3>
      <input
        className="w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm"
        value={draft}
        onChange={(e) => onDraft(e.target.value)}
        placeholder={`New ${title.toLowerCase()}`}
      />
      {extra}
      <button
        type="button"
        className="rounded bg-white text-black px-3 py-1 text-sm"
        onClick={onAdd}
      >
        Add
      </button>
      <ul className="text-xs text-neutral-400 max-h-32 overflow-y-auto space-y-1">
        {items.map((item, i) => (
          <li key={`${title}-${i}`} className="truncate">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
