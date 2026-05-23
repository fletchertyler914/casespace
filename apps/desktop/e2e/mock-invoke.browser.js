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
  const mockReportHistory = [
    {
      id: "export-1",
      caseId: E2E_CASE_ID,
      reportType: "narrative",
      filePath: "/tmp/e2e-report.md",
      generatedAt: "2026-01-01T12:00:00Z",
    },
  ];
  const mockExaminerProfile = {
    fullName: "Jane Examiner, CFE",
    credentials: "CFE, CPA",
    firmName: "Forensic Partners LLC",
    qualificationsMd: "20 years fraud examination experience.",
    priorTestimonyMd: "Testified in 12 matters (2022–2025).",
    compensationDisclosure: "Hourly at $350/hr; no contingency.",
    signatureBlock: "Jane Examiner, CFE\nForensic Partners LLC",
    confidentialityClause: "This report is confidential.",
    limitationsClause: "Scope limited to documents provided.",
    updatedAt: "2026-01-01T00:00:00Z",
  };
  const mockReportDraftStore = {};
  const mockReportSnapshots = [];

  function reportDraftKey(caseId, templateId) {
    return caseId + ":" + templateId;
  }

  function buildMockReportDraft(caseId, templateId) {
    var now = new Date().toISOString();
    return {
      id: "draft-" + caseId + "-" + templateId,
      caseId: caseId,
      templateId: templateId,
      document: {
        templateId: templateId,
        caseId: caseId,
        generatedAt: now,
        sections: [
          {
            id: "executive",
            heading: "Executive Summary",
            text: "E2E executive summary.",
            citations: [],
            standardsTags: [],
          },
          {
            id: "findings",
            heading: "Findings",
            text: "E2E mock finding content.",
            citations: [{ kind: "finding", id: "finding-1", label: "Finding: Mock" }],
            standardsTags: ["ACFE-EVIDENCE"],
          },
        ],
        compliance: [
          {
            id: "ACFE-III.C.2",
            label: "No guilt/innocence opinion",
            status: "verified",
          },
        ],
        markdown: "# E2E Report\n\nPreview body.",
      },
      sectionStatus: { executive: "aiDrafted", findings: "aiDrafted" },
      generatedAt: now,
      updatedAt: now,
    };
  }

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
      case "get_file_note_counts":
        return [{ fileId: "file-1", count: 1 }];
      case "list_case_file_metadata":
        return [{ fileId: "file-1", metadataJson: '{"title":"report"}' }];
      case "get_system_file_filter_config":
        return ".DS_Store,Thumbs.db";
      case "save_system_file_filter_config":
        return null;
      case "get_ai_settings":
        return {
          apiKeySet: true,
          apiKeySource: "keychain",
          model: "gpt-4o-mini",
          baseUrl: "https://api.openai.com/v1/chat/completions",
        };
      case "save_ai_settings":
      case "clear_ai_api_key":
        return null;
      case "test_ai_connection":
        return {
          ok: true,
          message: "Connected to https://api.openai.com/v1/chat/completions with gpt-4o-mini",
          latencyMs: 12,
        };
      case "get_mapping_config_db":
        return null;
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
        return {
          caseId: E2E_CASE_ID,
          totalSeconds: 3600,
          totalMinutes: 60,
          amount: 100,
          billingType: "pay_rate",
        };
      case "list_report_exports":
        return mockReportHistory;
      case "export_case_report":
        return {
          reportType: String(args.reportType || "narrative"),
          filePath: "/tmp/e2e-export.md",
          generatedAt: new Date().toISOString(),
        };
      case "generate_ai_case_report":
        return JSON.stringify({
          templateId: args.templateId || "cfe-long",
          caseId: "e2e-case-1",
          generatedAt: new Date().toISOString(),
          sections: [
            {
              id: "findings",
              heading: "Findings",
              text: "E2E mock finding.",
              citations: [{ kind: "finding", id: "f1", label: "Finding: Mock" }],
              standardsTags: [],
            },
          ],
          compliance: [
            {
              id: "ACFE-III.C.2",
              label: "No guilt/innocence opinion",
              status: "verified",
            },
          ],
          markdown: "# E2E Report\n\nPreview body.",
        });
      case "get_report_draft":
        return (
          mockReportDraftStore[reportDraftKey(String(args.caseId || E2E_CASE_ID), String(args.templateId || "cfe-long"))] ||
          null
        );
      case "generate_and_save_report_draft":
      case "regenerate_report": {
        var cid = String(args.caseId || E2E_CASE_ID);
        var tid = String(args.templateId || "cfe-long");
        var key = reportDraftKey(cid, tid);
        var fresh = buildMockReportDraft(cid, tid);
        mockReportDraftStore[key] = fresh;
        return fresh;
      }
      case "update_report_section": {
        var uCase = String(args.caseId || E2E_CASE_ID);
        var uTpl = String(args.templateId || "cfe-long");
        var uKey = reportDraftKey(uCase, uTpl);
        var draft = mockReportDraftStore[uKey] || buildMockReportDraft(uCase, uTpl);
        draft.document.sections = draft.document.sections.map(function (s) {
          return s.id === args.sectionId ? Object.assign({}, s, { text: String(args.text) }) : s;
        });
        draft.sectionStatus[args.sectionId] = args.status;
        draft.updatedAt = new Date().toISOString();
        mockReportDraftStore[uKey] = draft;
        return draft;
      }
      case "create_report_snapshot": {
        var snap = {
          id: "snap-" + (mockReportSnapshots.length + 1),
          caseId: String(args.caseId || E2E_CASE_ID),
          templateId: String(args.templateId || "cfe-long"),
          label: String(args.label || "Snapshot"),
          document: buildMockReportDraft(String(args.caseId || E2E_CASE_ID), String(args.templateId || "cfe-long")).document,
          sectionStatus: { executive: "aiDrafted", findings: "aiDrafted" },
          createdAt: new Date().toISOString(),
        };
        mockReportSnapshots.push(snap);
        return snap;
      }
      case "list_report_snapshots":
        return mockReportSnapshots.filter(function (s) {
          return (
            s.caseId === String(args.caseId || E2E_CASE_ID) &&
            s.templateId === String(args.templateId || "cfe-long")
          );
        });
      case "restore_report_snapshot": {
        var found = mockReportSnapshots.find(function (s) {
          return s.id === args.snapshotId;
        });
        if (!found) throw new Error("snapshot not found");
        var restored = {
          id: "draft-" + found.caseId + "-" + found.templateId,
          caseId: found.caseId,
          templateId: found.templateId,
          document: found.document,
          sectionStatus: found.sectionStatus,
          generatedAt: found.createdAt,
          updatedAt: new Date().toISOString(),
        };
        mockReportDraftStore[reportDraftKey(found.caseId, found.templateId)] = restored;
        return restored;
      }
      case "export_report_markdown":
        return "# E2E Report\n\nPreview body.";
      case "export_report_docx":
        return null;
      case "get_examiner_profile":
        return mockExaminerProfile;
      case "save_examiner_profile":
        Object.assign(mockExaminerProfile, args.profile || {});
        mockExaminerProfile.updatedAt = new Date().toISOString();
        return mockExaminerProfile;
      case "run_report_compliance_scan":
        return {
          ok: true,
          items: [
            { id: "citations", label: "Findings cite evidence", passed: true },
            { id: "reviewed", label: "All sections reviewed", passed: true },
            { id: "persona", label: "Examiner profile complete", passed: true },
          ],
        };
      case "generate_case_report":
        return JSON.stringify({
          templateId: args.templateId || "cfe-long",
          caseId: E2E_CASE_ID,
          generatedAt: new Date().toISOString(),
          sections: [
            {
              id: "findings",
              heading: "Findings",
              text: "E2E mock finding.",
              citations: [{ kind: "finding", id: "f1", label: "Finding: Mock" }],
              standardsTags: [],
            },
          ],
          compliance: [],
          markdown: "# E2E Report\n\nPreview body.",
        });
      case "seed_sample_fraud_case":
        return {
          id: "sample-fraud-examination",
          name: "Sample — Asset Misappropriation Examination",
          status: "active",
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
          sourcePaths: [],
        };
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
