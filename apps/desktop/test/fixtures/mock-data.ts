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
import type { DuplicateGroup } from "@/lib/duplicate-utils";

export const MOCK_CASE_ID = "case-test-1";

export const mockCaseSummary: CaseSummary = {
  id: MOCK_CASE_ID,
  name: "Test Case",
  status: "active",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-02T00:00:00Z",
  sourcePaths: ["/data/case-root"],
};

export const mockFiles: CaseFile[] = [
  {
    id: "file-a",
    caseId: MOCK_CASE_ID,
    fileName: "alpha.pdf",
    filePath: "/data/case-root/docs/alpha.pdf",
    folderPath: "docs",
    status: "unreviewed",
    sizeBytes: 2048,
    modifiedAt: "2026-01-01T00:00:00Z",
    fileHash: "h1",
  },
  {
    id: "file-b",
    caseId: MOCK_CASE_ID,
    fileName: "beta.txt",
    filePath: "/data/case-root/beta.txt",
    folderPath: "",
    status: "reviewed",
    sizeBytes: 512,
    modifiedAt: "2026-01-02T00:00:00Z",
    fileHash: "h2",
  },
];

export const mockNotes: Note[] = [
  {
    id: "note-1",
    caseId: MOCK_CASE_ID,
    content: "<p>First note</p>",
    pinned: true,
    createdAt: "2026-01-01T00:00:00Z",
  },
];

export const mockFindings: Finding[] = [
  {
    id: "finding-1",
    caseId: MOCK_CASE_ID,
    title: "Key finding",
    description: "<p>Details</p>",
    severity: "high",
    createdAt: "2026-01-01T00:00:00Z",
  },
];

export const mockTimeline: TimelineEvent[] = [
  {
    id: "event-1",
    caseId: MOCK_CASE_ID,
    description: "Interview conducted",
    occurredAt: "2026-01-15T10:00:00Z",
    eventType: "meeting",
  },
];

export const mockDuplicateGroups: DuplicateGroup[] = [
  {
    groupId: "dup-g1",
    fileIds: ["file-a", "file-b"],
    primaryFileId: "file-a",
  },
];

export const mockSearchHits: SearchHit[] = [
  {
    id: "file-a",
    entityType: "file",
    title: "alpha.pdf",
    snippet: "alpha content",
  },
  {
    id: "note-1",
    entityType: "note",
    title: "Field note",
    snippet: "First note",
  },
];

export const mockTimeEntries: TimeEntry[] = [
  {
    id: "entry-1",
    caseId: MOCK_CASE_ID,
    startedAt: "2026-01-01T09:00:00Z",
    endedAt: "2026-01-01T10:00:00Z",
    billableMinutes: 60,
    summary: "Review",
    segments: [
      {
        id: "seg-1",
        entryId: "entry-1",
        startedAt: "2026-01-01T09:00:00Z",
        endedAt: "2026-01-01T10:00:00Z",
      },
    ],
  },
];

export const mockReportHistory: ReportExportHistoryEntry[] = [
  {
    id: "export-1",
    caseId: MOCK_CASE_ID,
    reportType: "narrative",
    filePath: "/tmp/report.md",
    generatedAt: "2026-01-01T12:00:00Z",
  },
];
