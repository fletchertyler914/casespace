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

export type ApiKeySource = "keychain" | "env" | "none";

export interface AiSettings {
  apiKeySet: boolean;
  apiKeySource: ApiKeySource;
  model: string;
  baseUrl: string;
}

export interface AiConnectionTestResult {
  ok: boolean;
  message: string;
  latencyMs: number;
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
  templateId?: string;
  citationsJson?: string;
}

export type ReportPersona = "cfe" | "private_investigator" | "litigation_expert";

export type ReportTemplateId =
  | "cfe-long"
  | "cfe-short"
  | "expert-witness-frcp26"
  | "engagement-letter"
  | "pi-surveillance"
  | "pi-background"
  | "fraud-incident-log";

export type ReportSectionId =
  | "findings"
  | "timeline"
  | "inventory"
  | "overview"
  | "executive"
  | "notes"
  | "scope"
  | "approach"
  | "methodology"
  | "recommendations"
  | "qualifications"
  | "compensation"
  | "prior_testimony"
  | "observation_log"
  | "subject_profile"
  | "osint_findings"
  | "opinions"
  | "exhibits"
  | "parties"
  | "limitations"
  | "fees"
  | "confidentiality";

export type CitationKind = "file" | "finding" | "note" | "timeline" | "case_field";

export interface Citation {
  kind: CitationKind;
  id: string;
  anchor?: string;
  label: string;
}

export interface ReportSectionSpec {
  id: ReportSectionId;
  label: string;
  required?: boolean;
}

export interface ReportSection {
  id: ReportSectionId;
  heading: string;
  text: string;
  citations: Citation[];
  standardsTags: string[];
}

export type StandardsComplianceStatus =
  | "verified"
  | "not_applicable"
  | "missing_data";

export interface StandardsComplianceCheck {
  id: string;
  label: string;
  status: StandardsComplianceStatus;
  detail?: string;
}

export interface ReportDocument {
  templateId: ReportTemplateId;
  caseId: string;
  generatedAt: string;
  sections: ReportSection[];
  compliance: StandardsComplianceCheck[];
  markdown: string;
}

export type ReportSectionStatus =
  | "empty"
  | "aiDrafted"
  | "edited"
  | "reviewed"
  | "locked";

export interface ReportDraft {
  id: string;
  caseId: string;
  templateId: ReportTemplateId;
  document: ReportDocument;
  sectionStatus: Record<string, ReportSectionStatus>;
  generatedAt: string;
  updatedAt: string;
}

export interface ReportSnapshot {
  id: string;
  caseId: string;
  templateId: ReportTemplateId;
  label: string;
  document: ReportDocument;
  sectionStatus: Record<string, ReportSectionStatus>;
  createdAt: string;
}

export interface ExaminerProfile {
  fullName: string;
  credentials: string;
  firmName: string;
  qualificationsMd: string;
  priorTestimonyMd: string;
  compensationDisclosure: string;
  signatureBlock: string;
  confidentialityClause: string;
  limitationsClause: string;
  updatedAt: string;
}

export interface ComplianceScanItem {
  id: string;
  label: string;
  passed: boolean;
  detail?: string;
}

export interface ReportComplianceScan {
  ok: boolean;
  items: ComplianceScanItem[];
}

export interface RegenerateReportOptions {
  scope: "all" | "unreviewed" | "section";
  sectionId?: string;
}

export interface SaveReportDraftInput {
  sections: ReportSection[];
  compliance: StandardsComplianceCheck[];
  sectionStatus: Record<string, ReportSectionStatus>;
  generatedAt: string;
}

export interface ReportTemplate {
  id: ReportTemplateId;
  persona: ReportPersona;
  name: string;
  description: string;
  tier: "free" | "pro" | "pro_plus";
  wave: "A" | "B";
  standardsCited: string[];
  sections: ReportSectionSpec[];
  evidenceLinking: "required" | "preferred" | "optional";
  guardrails: string[];
  complianceChecks: string[];
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

/** Result of batch text extraction across a case corpus. */
export interface ExtractCaseTextSummary {
  processed: number;
  succeeded: number;
  failed: number;
}

/** Per-file text extraction progress event payload. */
export interface TextExtractProgress {
  fileId: string;
  ok: boolean;
  ocrUsed: boolean;
  charCount: number;
  error?: string;
}

export interface FileTextExtractResult {
  fileId: string;
  charCount: number;
  extractor: string;
  ocrUsed: boolean;
  extractedAt: string;
  extractError?: string;
}

export interface AiFindingDraft {
  id: string;
  caseId: string;
  title: string;
  description: string;
  severity: string;
  linkedFileIds?: string[];
  pageAnchors?: string[];
  model?: string;
  status: string;
  createdAt: string;
}

export interface AiTimelineDraft {
  id: string;
  caseId: string;
  description: string;
  occurredAt: string;
  sourceFileId?: string;
  pageAnchor?: string;
  model?: string;
  status: string;
  createdAt: string;
}

export interface AiEntityDraft {
  id: string;
  caseId: string;
  kind: string;
  value: string;
  sourceFileId?: string;
  pageAnchor?: string;
  count: number;
  model?: string;
  status: string;
  createdAt: string;
}

export interface AiDraftsBundle {
  findingDrafts: AiFindingDraft[];
  timelineDrafts: AiTimelineDraft[];
  entityDrafts: AiEntityDraft[];
}
