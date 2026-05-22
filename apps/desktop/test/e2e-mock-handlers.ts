import type {
  CaseFile,
  CaseSummary,
  Finding,
  Note,
  ReportExportHistoryEntry,
  SearchHit,
  TimeEntry,
  TimelineEvent,
} from "@repo/types";
import type { InvokeFn } from "@/lib/invoke-bridge";

export const E2E_CASE_ID = "e2e-case-1";

const mockCase: CaseSummary = {
  id: E2E_CASE_ID,
  name: "E2E Test Case",
  status: "active",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  sourcePaths: ["/tmp/e2e-sources"],
};

const mockFiles: CaseFile[] = [
  {
    id: "file-1",
    caseId: E2E_CASE_ID,
    fileName: "report.pdf",
    filePath: "/tmp/e2e-sources/report.pdf",
    folderPath: "",
    status: "unreviewed",
    sizeBytes: 1024,
    modifiedAt: "2026-01-01T00:00:00Z",
    fileHash: "hash1",
  },
  {
    id: "file-2",
    caseId: E2E_CASE_ID,
    fileName: "notes.txt",
    filePath: "/tmp/e2e-sources/notes.txt",
    folderPath: "",
    status: "reviewed",
    sizeBytes: 256,
    modifiedAt: "2026-01-02T00:00:00Z",
    fileHash: "hash2",
  },
];

const mockNotes: Note[] = [
  {
    id: "note-1",
    caseId: E2E_CASE_ID,
    content: "<p>E2E field note</p>",
    pinned: false,
    createdAt: "2026-01-01T00:00:00Z",
  },
];

const mockFindings: Finding[] = [
  {
    id: "finding-1",
    caseId: E2E_CASE_ID,
    title: "E2E finding",
    description: "<p>Details</p>",
    severity: "high",
    createdAt: "2026-01-01T00:00:00Z",
  },
];

const mockTimeline: TimelineEvent[] = [
  {
    id: "event-1",
    caseId: E2E_CASE_ID,
    description: "E2E interview",
    occurredAt: "2026-01-15T10:00:00Z",
    eventType: "meeting",
  },
];

const mockDuplicateGroups = [
  {
    groupId: "dup-e2e-1",
    fileIds: ["file-1", "file-2"],
    primaryFileId: "file-1",
  },
];

const mockTimeEntries: TimeEntry[] = [
  {
    id: "entry-1",
    caseId: E2E_CASE_ID,
    entryDate: "2026-01-01T00:00:00+00:00",
    totalSeconds: 3600,
    summary: "Review",
    createdAt: "2026-01-01T09:00:00Z",
    updatedAt: "2026-01-01T10:00:00Z",
    segments: [
      {
        id: "seg-1",
        entryId: "entry-1",
        startedAt: "2026-01-01T09:00:00Z",
        endedAt: "2026-01-01T10:00:00Z",
        durationSeconds: 3600,
        discountPercent: 0,
      },
    ],
  },
];

const mockReportHistory: ReportExportHistoryEntry[] = [
  {
    id: "export-1",
    caseId: E2E_CASE_ID,
    reportType: "narrative",
    filePath: "/tmp/e2e-report.md",
    generatedAt: "2026-01-01T12:00:00Z",
  },
];

const mockSearchHits: SearchHit[] = [
  {
    id: "file-1",
    entityType: "file",
    title: "report.pdf",
    snippet: "report content",
  },
  {
    id: "note-1",
    entityType: "note",
    title: "Field note",
    snippet: "E2E field note",
  },
];

/** Browser E2E invoke stub — covers P0 UI flows without Tauri. */
export const e2eMockInvoke = (async (command, args = {}) => {
  switch (command) {
    case "list_cases":
      return [mockCase];
    case "get_case":
      if (args.caseId === E2E_CASE_ID) return mockCase;
      throw new Error("case not found");
    case "load_case_files_with_inventory":
    case "load_case_files":
      if (args.caseId && args.caseId !== E2E_CASE_ID) return [];
      return mockFiles;
    case "list_case_sources":
      return mockCase.sourcePaths;
    case "sync_case_all_sources":
    case "ingest_files_to_case":
      return {
        filesInserted: 0,
        filesUpdated: 0,
        filesSkipped: 0,
      };
    case "find_duplicate_files":
      return mockDuplicateGroups;
    case "list_notes":
      return mockNotes;
    case "get_file_note_counts":
      return [{ fileId: "file-1", count: 1 }];
    case "list_case_file_metadata":
      return [{ fileId: "file-1", metadataJson: "{\"title\":\"report\"}" }];
    case "get_system_file_filter_config":
      return ".DS_Store,Thumbs.db";
    case "save_system_file_filter_config":
      return null;
    case "list_findings":
      return mockFindings;
    case "list_timeline_events":
      return mockTimeline;
    case "get_time_entries":
      return mockTimeEntries;
    case "get_time_entry": {
      const date = String(args.date ?? "").slice(0, 10);
      const match = mockTimeEntries.find(
        (e) => e.entryDate.slice(0, 10) === date,
      );
      return match ?? null;
    }
    case "get_time_entries_summary":
      return {
        caseId: E2E_CASE_ID,
        totalSeconds: 3600,
        totalDays: 1,
      };
    case "calculate_case_total":
      return {
        caseId: E2E_CASE_ID,
        totalAmount: 100,
        totalSeconds: 3600,
        totalDays: 1,
      };
    case "get_active_timer":
      return null;
    case "start_timer":
    case "pause_timer":
    case "resume_timer":
      return {
        id: "entry-open",
        caseId: E2E_CASE_ID,
        entryDate: new Date().toISOString().slice(0, 10) + "T00:00:00+00:00",
        totalSeconds: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        segments: [
          {
            id: "seg-open",
            entryId: "entry-open",
            startedAt: new Date().toISOString(),
            durationSeconds: 0,
            discountPercent: 0,
          },
        ],
      };
    case "stop_timer":
      return mockTimeEntries[0];
    case "get_workspace_preferences_db":
      return null;
    case "get_case_billing_config":
      return {
        caseId: E2E_CASE_ID,
        billingType: "hourly",
        payRate: 100,
        rateUnit: "hour",
      };
    case "calculate_billing_amount":
      return { caseId: E2E_CASE_ID, amount: 100, currency: "USD" };
    case "list_report_exports":
      return mockReportHistory;
    case "export_case_report":
      return {
        reportType: String(args.reportType ?? "narrative"),
        filePath: "/tmp/e2e-export.md",
        generatedAt: new Date().toISOString(),
      };
    case "generate_case_report":
      return "# E2E Report\n\nPreview body.";
    case "search_all": {
      const q = String(args.query ?? "").toLowerCase();
      if (q.length < 2) return [];
      return mockSearchHits.filter(
        (h) =>
          h.title.toLowerCase().includes(q) ||
          h.snippet.toLowerCase().includes(q),
      );
    }
    case "read_file_text":
      return "Sample text for E2E preview.";
    case "check_file_changed":
      return { fileId: String(args.fileId), changed: false };
    case "toggle_note_pinned":
      return { ...mockNotes[0]!, pinned: true };
    case "mark_duplicate_primary":
      return mockDuplicateGroups[0];
    case "merge_duplicate_metadata":
    case "remove_file_from_case":
    case "update_file_status":
    case "save_column_config_db":
    case "save_workspace_preferences_db":
      return null;
    default:
      if (command.startsWith("get_") || command.startsWith("list_")) {
        return [];
      }
      return null;
  }
}) as InvokeFn;
