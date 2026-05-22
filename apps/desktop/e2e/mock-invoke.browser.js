/**
 * Standalone Tauri invoke mock for Playwright (no imports).
 * Keep in sync with test/e2e-mock-handlers.ts behavior.
 */
(function () {
  const E2E_CASE_ID = "e2e-case-1";
  const mockCase = {
    id: E2E_CASE_ID,
    name: "E2E Test Case",
    status: "active",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    sourcePaths: ["/tmp/e2e-sources"],
  };
  const mockFiles = [
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
  const mockNotes = [
    {
      id: "note-1",
      caseId: E2E_CASE_ID,
      content: "<p>E2E field note</p>",
      pinned: false,
      createdAt: "2026-01-01T00:00:00Z",
    },
  ];
  const mockFindings = [
    {
      id: "finding-1",
      caseId: E2E_CASE_ID,
      title: "E2E finding",
      description: "<p>Details</p>",
      severity: "high",
      createdAt: "2026-01-01T00:00:00Z",
    },
  ];
  const mockTimeline = [
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
  const mockTimeEntries = [
    {
      id: "entry-1",
      caseId: E2E_CASE_ID,
      startedAt: "2026-01-01T09:00:00Z",
      endedAt: "2026-01-01T10:00:00Z",
      billableMinutes: 60,
      summary: "Review",
      segments: [],
    },
  ];
  const mockReportHistory = [
    {
      id: "export-1",
      caseId: E2E_CASE_ID,
      reportType: "narrative",
      filePath: "/tmp/e2e-report.md",
      generatedAt: "2026-01-01T12:00:00Z",
    },
  ];
  const mockSearchHits = [
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

  window.__CASESPACE_MOCK_INVOKE__ = async function (command, args) {
    args = args || {};
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
      case "list_findings":
        return mockFindings;
      case "list_timeline_events":
        return mockTimeline;
      case "get_time_entries":
        return mockTimeEntries;
      case "get_active_timer":
        return null;
      case "start_timer":
        return {
          id: "entry-open",
          caseId: E2E_CASE_ID,
          startedAt: new Date().toISOString(),
          billableMinutes: 0,
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
          reportType: String(args.reportType || "narrative"),
          filePath: "/tmp/e2e-export.md",
          generatedAt: new Date().toISOString(),
        };
      case "generate_case_report":
        return "# E2E Report\n\nPreview body.";
      case "search_all": {
        const q = String(args.query || "").toLowerCase();
        if (q.length < 2) return [];
        return mockSearchHits.filter(function (h) {
          return (
            h.title.toLowerCase().includes(q) ||
            h.snippet.toLowerCase().includes(q)
          );
        });
      }
      case "read_file_text":
        return "Sample text for E2E preview.";
      case "check_file_changed":
        return { fileId: String(args.fileId), changed: false };
      case "toggle_note_pinned":
        return Object.assign({}, mockNotes[0], { pinned: true });
      case "mark_duplicate_primary":
        return mockDuplicateGroups[0];
      case "merge_duplicate_metadata":
      case "remove_file_from_case":
      case "update_file_status":
      case "save_column_config_db":
      case "save_workspace_preferences_db":
        return null;
      default:
        if (command.indexOf("get_") === 0 || command.indexOf("list_") === 0) {
          return [];
        }
        return null;
    }
  };
})();
