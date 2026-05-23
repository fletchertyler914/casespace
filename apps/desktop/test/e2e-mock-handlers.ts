import type {
  CaseFile,
  CaseSummary,
  ExaminerProfile,
  Finding,
  Note,
  ReportComplianceScan,
  ReportDocument,
  ReportDraft,
  ReportExportHistoryEntry,
  ReportSectionStatus,
  ReportSnapshot,
  SaveReportDraftInput,
  SearchHit,
  TimeEntry,
  TimelineEvent,
} from "@repo/types";
import type { InvokeFn } from "@/lib/invoke-bridge";

export const E2E_CASE_ID = "e2e-case-1";

function mockReportDocument(templateId = "cfe-long"): string {
  const doc: ReportDocument = {
    templateId: templateId as ReportDocument["templateId"],
    caseId: E2E_CASE_ID,
    generatedAt: new Date().toISOString(),
    sections: [
      {
        id: "findings",
        heading: "Findings",
        text: "E2E mock finding content.",
        citations: [
          {
            kind: "finding",
            id: "f1",
            label: "Finding: Mock",
          },
        ],
        standardsTags: ["ACFE-EVIDENCE"],
      },
    ],
    compliance: [
      {
        id: "ACFE-III.C.2",
        label: "ACFE Code III.C.2 — No guilt/innocence opinion",
        status: "verified",
      },
    ],
    markdown: "# E2E Report\n\nPreview body.",
  };
  return JSON.stringify(doc);
}

const mockExaminerProfile: ExaminerProfile = {
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

const mockReportDraftStore = new Map<string, ReportDraft>();
const mockReportSnapshots: ReportSnapshot[] = [];

function reportDraftKey(caseId: string, templateId: string) {
  return `${caseId}:${templateId}`;
}

function buildMockReportDraft(caseId: string, templateId: string): ReportDraft {
  const doc = JSON.parse(mockReportDocument(templateId)) as ReportDocument;
  doc.caseId = caseId;
  if (doc.sections.length === 0) {
    doc.sections = [
      {
        id: "executive",
        heading: "Executive Summary",
        text: "E2E executive summary with evidence context.",
        citations: [],
        standardsTags: [],
      },
      {
        id: "findings",
        heading: "Findings",
        text: "E2E mock finding content.",
        citations: [
          { kind: "finding", id: "finding-1", label: "Finding: Mock" },
        ],
        standardsTags: ["ACFE-EVIDENCE"],
      },
    ];
  }
  const sectionStatus: Record<string, ReportSectionStatus> = {};
  for (const section of doc.sections) {
    sectionStatus[section.id] = "aiDrafted";
  }
  const now = new Date().toISOString();
  return {
    id: `draft-${caseId}-${templateId}`,
    caseId,
    templateId: templateId as ReportDraft["templateId"],
    document: doc,
    sectionStatus,
    generatedAt: now,
    updatedAt: now,
  };
}

function mockComplianceScan(draft: ReportDraft | null): ReportComplianceScan {
  const hasCitations = (draft?.document.sections ?? []).some(
    (s) => s.citations.length > 0,
  );
  const reviewed = draft
    ? Object.values(draft.sectionStatus).every(
        (s) => s === "reviewed" || s === "locked",
      )
    : false;
  const items = [
    {
      id: "citations",
      label: "Findings cite evidence",
      passed: hasCitations,
      detail: hasCitations ? undefined : "Add citations to findings sections.",
    },
    {
      id: "reviewed",
      label: "All sections reviewed or locked",
      passed: reviewed,
      detail: reviewed ? undefined : "Mark each section reviewed before export.",
    },
    {
      id: "persona",
      label: "Examiner profile complete",
      passed: Boolean(mockExaminerProfile.fullName.trim()),
    },
  ];
  return { ok: items.every((i) => i.passed), items };
}


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
      return mockReportDocument(String(args.templateId ?? "cfe-long"));
    case "generate_ai_case_report":
      return mockReportDocument(String(args.templateId ?? "cfe-long"));
    case "get_report_draft": {
      const caseId = String(args.caseId ?? E2E_CASE_ID);
      const templateId = String(args.templateId ?? "cfe-long");
      return mockReportDraftStore.get(reportDraftKey(caseId, templateId)) ?? null;
    }
    case "save_report_draft": {
      const caseId = String(args.caseId ?? E2E_CASE_ID);
      const templateId = String(args.templateId ?? "cfe-long");
      const draftInput = args.draft as SaveReportDraftInput;
      const existing =
        mockReportDraftStore.get(reportDraftKey(caseId, templateId)) ??
        buildMockReportDraft(caseId, templateId);
      const updated: ReportDraft = {
        ...existing,
        document: {
          ...existing.document,
          sections: draftInput.sections ?? existing.document.sections,
          compliance: draftInput.compliance ?? existing.document.compliance,
          generatedAt: draftInput.generatedAt ?? existing.generatedAt,
        },
        sectionStatus: draftInput.sectionStatus ?? existing.sectionStatus,
        updatedAt: new Date().toISOString(),
      };
      mockReportDraftStore.set(reportDraftKey(caseId, templateId), updated);
      return updated;
    }
    case "update_report_section": {
      const caseId = String(args.caseId ?? E2E_CASE_ID);
      const templateId = String(args.templateId ?? "cfe-long");
      const key = reportDraftKey(caseId, templateId);
      const draft =
        mockReportDraftStore.get(key) ?? buildMockReportDraft(caseId, templateId);
      const sectionId = String(args.sectionId);
      const text = String(args.text);
      const status = args.status as ReportSectionStatus;
      draft.document.sections = draft.document.sections.map((s) =>
        s.id === sectionId ? { ...s, text } : s,
      );
      draft.sectionStatus[sectionId] = status;
      draft.updatedAt = new Date().toISOString();
      mockReportDraftStore.set(key, draft);
      return draft;
    }
    case "generate_and_save_report_draft":
    case "regenerate_report": {
      const caseId = String(args.caseId ?? E2E_CASE_ID);
      const templateId = String(args.templateId ?? "cfe-long");
      const key = reportDraftKey(caseId, templateId);
      const existing = mockReportDraftStore.get(key);
      const fresh = buildMockReportDraft(caseId, templateId);
      if (!existing || command === "generate_and_save_report_draft") {
        mockReportDraftStore.set(key, fresh);
        return fresh;
      }
      const options = args.options as { scope?: string; sectionId?: string } | undefined;
      if (options?.scope === "section" && options.sectionId) {
        const lockedOrEdited =
          existing.sectionStatus[options.sectionId] === "edited" ||
          existing.sectionStatus[options.sectionId] === "locked";
        if (lockedOrEdited) return existing;
      }
      const merged: ReportDraft = {
        ...existing,
        document: fresh.document,
        sectionStatus: { ...fresh.sectionStatus, ...existing.sectionStatus },
        updatedAt: new Date().toISOString(),
      };
      for (const [id, status] of Object.entries(existing.sectionStatus)) {
        if (status === "edited" || status === "locked") {
          const prev = existing.document.sections.find((s) => s.id === id);
          if (prev) {
            merged.document.sections = merged.document.sections.map((s) =>
              s.id === id ? { ...s, text: prev.text } : s,
            );
            merged.sectionStatus[id] = status;
          }
        }
      }
      mockReportDraftStore.set(key, merged);
      return merged;
    }
    case "create_report_snapshot": {
      const caseId = String(args.caseId ?? E2E_CASE_ID);
      const templateId = String(args.templateId ?? "cfe-long");
      const draft =
        mockReportDraftStore.get(reportDraftKey(caseId, templateId)) ??
        buildMockReportDraft(caseId, templateId);
      const snap: ReportSnapshot = {
        id: `snap-${mockReportSnapshots.length + 1}`,
        caseId,
        templateId: templateId as ReportSnapshot["templateId"],
        label: String(args.label ?? "Snapshot"),
        document: draft.document,
        sectionStatus: { ...draft.sectionStatus },
        createdAt: new Date().toISOString(),
      };
      mockReportSnapshots.push(snap);
      return snap;
    }
    case "list_report_snapshots": {
      const caseId = String(args.caseId ?? E2E_CASE_ID);
      const templateId = String(args.templateId ?? "cfe-long");
      return mockReportSnapshots.filter(
        (s) => s.caseId === caseId && s.templateId === templateId,
      );
    }
    case "restore_report_snapshot": {
      const snap = mockReportSnapshots.find((s) => s.id === args.snapshotId);
      if (!snap) throw new Error("snapshot not found");
      const draft: ReportDraft = {
        id: `draft-${snap.caseId}-${snap.templateId}`,
        caseId: snap.caseId,
        templateId: snap.templateId,
        document: snap.document,
        sectionStatus: { ...snap.sectionStatus },
        generatedAt: snap.createdAt,
        updatedAt: new Date().toISOString(),
      };
      mockReportDraftStore.set(
        reportDraftKey(snap.caseId, snap.templateId),
        draft,
      );
      return draft;
    }
    case "export_report_markdown": {
      const caseId = String(args.caseId ?? E2E_CASE_ID);
      const templateId = String(args.templateId ?? "cfe-long");
      const draft =
        mockReportDraftStore.get(reportDraftKey(caseId, templateId)) ??
        buildMockReportDraft(caseId, templateId);
      return draft.document.markdown || "# E2E Report\n\nPreview body.";
    }
    case "export_report_docx":
      return null;
    case "get_examiner_profile":
      return mockExaminerProfile;
    case "save_examiner_profile":
      Object.assign(mockExaminerProfile, args.profile as ExaminerProfile);
      mockExaminerProfile.updatedAt = new Date().toISOString();
      return mockExaminerProfile;
    case "run_report_compliance_scan": {
      const caseId = String(args.caseId ?? E2E_CASE_ID);
      const templateId = String(args.templateId ?? "cfe-long");
      const draft =
        mockReportDraftStore.get(reportDraftKey(caseId, templateId)) ?? null;
      return mockComplianceScan(draft);
    }
    case "extract_case_text":
      return { processed: 2, succeeded: 2, failed: 0 };
    case "extract_file_text":
      return {
        fileId: String(args.fileId ?? "file-1"),
        charCount: 1200,
        extractor: "plain",
        ocrUsed: false,
        extractedAt: new Date().toISOString(),
      };
    case "analyze_file_with_ai":
      return 1;
    case "analyze_case_with_ai":
      return 0;
    case "list_ai_drafts":
      return {
        findingDrafts: [
          {
            id: "draft-1",
            caseId: E2E_CASE_ID,
            title: "Mock AI finding",
            description: "E2E mock finding from evidence on p.1.",
            severity: "medium",
            linkedFileIds: ["file-1"],
            pageAnchors: ["p.1"],
            status: "pending",
            createdAt: new Date().toISOString(),
          },
        ],
        timelineDrafts: [],
        entityDrafts: [],
      };
    case "approve_ai_finding_draft":
    case "approve_ai_timeline_draft":
    case "approve_ai_entity_draft":
      return "approved-id";
    case "reject_ai_finding_draft":
    case "reject_ai_timeline_draft":
    case "reject_ai_entity_draft":
      return null;
    case "count_approved_ai_findings":
      return 1;
    case "seed_sample_fraud_case":
      return {
        id: "sample-fraud-examination",
        name: "Sample — Asset Misappropriation Examination",
        status: "active",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
        sourcePaths: [],
      } satisfies CaseSummary;
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
