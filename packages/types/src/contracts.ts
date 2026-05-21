export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PERMISSION_DENIED"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export interface AppErrorEnvelope {
  code: AppErrorCode;
  message: string;
  retryable: boolean;
  context?: Record<string, string | number | boolean>;
}

export interface CommandRequest<TPayload = undefined> {
  requestId: string;
  payload: TPayload;
}

export interface CommandResponse<TData = undefined> {
  ok: boolean;
  data?: TData;
  error?: AppErrorEnvelope;
}

export interface CaseSummary {
  id: string;
  name: string;
  status: string;
  sourcePaths?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCasePayload {
  name: string;
  sourcePaths: string[];
}

/** Result of ingest / sync across one or more case sources. */
export interface IngestResult {
  filesInserted: number;
  filesUpdated: number;
  filesSkipped: number;
  filesDeleted?: number;
  filesProtected?: number;
  errors?: string[] | null;
}

export interface WorkspacePreferences {
  viewMode?: "split" | "board";
  navigatorOpen?: boolean;
  notesVisible?: boolean;
  findingsVisible?: boolean;
  timelineVisible?: boolean;
  duplicatesVisible?: boolean;
  reportsVisible?: boolean;
  timeVisible?: boolean;
  autoSyncEnabled?: boolean;
  autoSyncIntervalMinutes?: number;
}

export interface CaseFile {
  id: string;
  caseId: string;
  fileName: string;
  filePath: string;
  folderPath?: string;
  fileHash?: string;
  sizeBytes: number;
  modifiedAt: string;
  status: string;
}

export interface SearchHit {
  id: string;
  entityType: string;
  title: string;
  snippet: string;
}

export interface Note {
  id: string;
  caseId: string;
  content: string;
  pinned?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Finding {
  id: string;
  caseId: string;
  title: string;
  description: string;
  severity?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TimelineEvent {
  id: string;
  caseId: string;
  description: string;
  occurredAt: string;
  createdAt?: string;
}

export interface TimeEntry {
  id: string;
  caseId: string;
  startedAt: string;
  endedAt?: string;
  billableMinutes: number;
}

export interface BillingSummary {
  caseId: string;
  totalMinutes: number;
  amount: number;
  billingType: string;
}

export interface ReportExport {
  reportType: string;
  filePath: string;
  generatedAt: string;
}

export interface SearchRequest {
  caseId: string;
  query: string;
  limit?: number;
}

export interface OcrPreview {
  filePath: string;
  extractedText: string;
  provider: "local-fallback" | "remote-provider";
}

export interface CaseReport {
  caseId: string;
  summary: string;
  generatedAt: string;
}
