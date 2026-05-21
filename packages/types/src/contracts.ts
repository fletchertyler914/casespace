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
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface CreateCasePayload {
  name: string;
  sourcePaths: string[];
}

export interface InventoryItem {
  id: string;
  caseId: string;
  fileName: string;
  filePath: string;
  hash?: string;
  sizeBytes: number;
  modifiedAt: string;
}

export interface SearchRequest {
  caseId: string;
  query: string;
  limit?: number;
}

export interface SearchResult {
  id: string;
  type: "file" | "note" | "finding" | "timeline";
  title: string;
  snippet: string;
}

export interface Note {
  id: string;
  caseId: string;
  content: string;
  createdAt: string;
}

export interface TimeEntry {
  id: string;
  caseId: string;
  startedAt: string;
  endedAt?: string;
  billableMinutes: number;
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
