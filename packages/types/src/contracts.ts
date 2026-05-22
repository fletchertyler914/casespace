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
  viewMode?: "split" | "board" | "reports";
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
  fileId?: string;
  content: string;
  pinned?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface FileNoteCount {
  fileId: string;
  count: number;
}

export interface CaseFileMetadata {
  fileId: string;
  metadataJson: string;
}

export interface Finding {
  id: string;
  caseId: string;
  title: string;
  description: string;
  severity?: string;
  linkedFiles?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface TimelineEvent {
  id: string;
  caseId: string;
  description: string;
  occurredAt: string;
  eventType?: string;
  sourceFileId?: string;
  createdAt?: string;
}

export interface TimeSegment {
  id: string;
  entryId: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
  rateOverride?: number;
  discountPercent?: number;
  notes?: string;
}

export interface TimeEntry {
  id: string;
  caseId: string;
  entryDate: string;
  totalSeconds: number;
  summary?: string;
  createdAt: string;
  updatedAt: string;
  segments?: TimeSegment[];
}

export interface TimeEntriesSummary {
  caseId: string;
  totalSeconds: number;
  totalDays: number;
}

export interface CaseBillingTotal {
  caseId: string;
  totalAmount: number;
  totalSeconds: number;
  totalDays: number;
}

export interface ActiveTimer {
  caseId: string;
  entryId: string;
  startedAt: string;
}

export interface CaseBillingConfig {
  caseId: string;
  billingType: string;
  fixedPrice?: number;
  payRate: number;
  rateUnit: string;
}

export interface BillingSummary {
  caseId: string;
  totalSeconds: number;
  totalMinutes: number;
  amount: number;
  billingType: string;
}

export interface ReportExport {
  reportType: string;
  filePath: string;
  generatedAt: string;
}

export interface ReportExportHistoryEntry {
  id: string;
  caseId: string;
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
