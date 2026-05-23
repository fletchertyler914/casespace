"use client";

import { invoke } from "@/lib/invoke-bridge";
import type {
  ActiveTimer,
  BillingSummary,
  CaseBillingConfig,
  CaseFile,
  CaseFileMetadata,
  CaseSummary,
  FileNoteCount,
  CommandResponse,
  CreateCasePayload,
  IngestResult,
  Finding,
  Note,
  ReportExport,
  ReportExportHistoryEntry,
  SearchHit,
  TimelineEvent,
  CaseBillingTotal,
  TimeEntriesSummary,
  TimeEntry,
  TimeSegment,
  ExtractCaseTextSummary,
  FileTextExtractResult,
  AiDraftsBundle,
  AiConnectionTestResult,
  AiSettings,
} from "@repo/types";

function toResponse<T>(data: T): CommandResponse<T> {
  return { ok: true, data };
}

function toErrorResponse(message: string): CommandResponse<never> {
  return {
    ok: false,
    error: {
      code: "INTERNAL_ERROR",
      message,
      retryable: false,
    },
  };
}

async function safeInvoke<T>(
  command: string,
  payload: Record<string, unknown> = {},
) {
  try {
    const data = await invoke<T>(command, payload);
    return toResponse(data);
  } catch (error) {
    return toErrorResponse(
      error instanceof Error ? error.message : String(error),
    );
  }
}

export const commandClient = {
  createCase(payload: CreateCasePayload) {
    return safeInvoke<CaseSummary>("create_case", {
      name: payload.name,
      sourcePaths: payload.sourcePaths,
    });
  },
  listCases() {
    return safeInvoke<CaseSummary[]>("list_cases");
  },
  getCase(caseId: string) {
    return safeInvoke<CaseSummary>("get_case", { caseId });
  },
  updateCaseMetadata(
    caseId: string,
    updates: { name?: string; status?: string },
  ) {
    return safeInvoke<CaseSummary>("update_case_metadata", {
      caseId,
      name: updates.name,
      status: updates.status,
    });
  },
  deleteCase(caseId: string) {
    return safeInvoke<void>("delete_case", { caseId });
  },
  addCaseSource(caseId: string, sourcePath: string) {
    return safeInvoke<void>("add_case_source", { caseId, sourcePath });
  },
  listCaseSources(caseId: string) {
    return safeInvoke<string[]>("list_case_sources", { caseId });
  },
  countDirectoryFiles(path: string) {
    return safeInvoke<number>("count_directory_files", { path });
  },
  ingestFilesToCase(
    caseId: string,
    options?: {
      sourcePath?: string;
      incremental?: boolean;
      maxFiles?: number;
    },
  ) {
    return safeInvoke<IngestResult>("ingest_files_to_case", {
      caseId,
      sourcePath: options?.sourcePath,
      incremental: options?.incremental,
      maxFiles: options?.maxFiles,
    });
  },
  loadCaseFilesWithInventory(caseId: string) {
    return safeInvoke<CaseFile[]>("load_case_files_with_inventory", { caseId });
  },
  syncCaseAllSources(
    caseId: string,
    incremental = true,
    maxFiles?: number,
  ) {
    return safeInvoke<IngestResult>("sync_case_all_sources", {
      caseId,
      incremental,
      maxFiles,
    });
  },
  refreshSingleFile(caseId: string, filePath: string) {
    return safeInvoke<CaseFile>("refresh_single_file", { caseId, filePath });
  },
  refreshFilesBulk(caseId: string, filePaths: string[]) {
    return safeInvoke<CaseFile[]>("refresh_files_bulk", { caseId, filePaths });
  },
  checkFileChanged(caseId: string, fileId: string) {
    return safeInvoke<{ fileId: string; changed: boolean }>("check_file_changed", {
      caseId,
      fileId,
    });
  },
  loadCaseFiles(caseId: string) {
    return safeInvoke<CaseFile[]>("load_case_files", { caseId });
  },
  renameFile(caseId: string, fileId: string, newName: string) {
    return safeInvoke<CaseFile>("rename_file", { caseId, fileId, newName });
  },
  removeFileFromCase(caseId: string, fileId: string) {
    return safeInvoke<void>("remove_file_from_case", { caseId, fileId });
  },
  updateFileStatus(fileId: string, status: string) {
    return safeInvoke<void>("update_file_status", { fileId, status });
  },
  findDuplicateFiles(caseId: string) {
    return safeInvoke<
      { groupId: string; fileIds: string[]; primaryFileId?: string }[]
    >("find_duplicate_files", { caseId });
  },
  markDuplicatePrimary(caseId: string, groupId: string, primaryFileId: string) {
    return safeInvoke<{
      groupId: string;
      fileIds: string[];
      primaryFileId?: string;
    }>("mark_duplicate_primary", { caseId, groupId, primaryFileId });
  },
  mergeDuplicateMetadata(caseId: string, groupId: string, targetFileId: string) {
    return safeInvoke<void>("merge_duplicate_metadata", {
      caseId,
      groupId,
      targetFileId,
    });
  },
  createNote(caseId: string, content: string, fileId?: string) {
    return safeInvoke<Note>("create_note", { caseId, content, fileId: fileId ?? null });
  },
  listNotes(caseId: string) {
    return safeInvoke<Note[]>("list_notes", { caseId });
  },
  getFileNoteCounts(caseId: string) {
    return safeInvoke<FileNoteCount[]>("get_file_note_counts", { caseId });
  },
  listCaseFileMetadata(caseId: string) {
    return safeInvoke<CaseFileMetadata[]>("list_case_file_metadata", { caseId });
  },
  getSystemFileFilterConfig() {
    return safeInvoke<string | null>("get_system_file_filter_config", {});
  },
  saveSystemFileFilterConfig(patterns: string) {
    return safeInvoke<void>("save_system_file_filter_config", { patterns });
  },
  getAiSettings() {
    return safeInvoke<AiSettings>("get_ai_settings", {});
  },
  saveAiSettings(payload: {
    apiKey?: string;
    model: string;
    baseUrl: string;
  }) {
    return safeInvoke<void>("save_ai_settings", {
      apiKey: payload.apiKey ?? null,
      model: payload.model,
      baseUrl: payload.baseUrl,
    });
  },
  clearAiApiKey() {
    return safeInvoke<void>("clear_ai_api_key", {});
  },
  testAiConnection() {
    return safeInvoke<AiConnectionTestResult>("test_ai_connection", {});
  },
  updateNote(noteId: string, content: string) {
    return safeInvoke<Note>("update_note", { noteId, content });
  },
  toggleNotePinned(noteId: string) {
    return safeInvoke<Note>("toggle_note_pinned", { noteId });
  },
  deleteNote(noteId: string) {
    return safeInvoke<void>("delete_note", { noteId });
  },
  createFinding(
    caseId: string,
    title: string,
    description: string,
    severity = "medium",
    linkedFiles?: string[],
  ) {
    return safeInvoke<Finding>("create_finding", {
      caseId,
      title,
      description,
      severity,
      linkedFiles: linkedFiles ?? null,
    });
  },
  listFindings(caseId: string) {
    return safeInvoke<Finding[]>("list_findings", { caseId });
  },
  updateFinding(
    findingId: string,
    title: string,
    description: string,
    severity?: string,
    linkedFiles?: string[],
  ) {
    return safeInvoke<Finding>("update_finding", {
      findingId,
      title,
      description,
      severity,
      linkedFiles: linkedFiles ?? null,
    });
  },
  deleteFinding(findingId: string) {
    return safeInvoke<void>("delete_finding", { findingId });
  },
  createTimelineEvent(
    caseId: string,
    description: string,
    occurredAt?: string,
    eventType = "manual",
    sourceFileId?: string,
  ) {
    return safeInvoke<TimelineEvent>("create_timeline_event", {
      caseId,
      description,
      occurredAt,
      eventType,
      sourceFileId: sourceFileId ?? null,
    });
  },
  listTimelineEvents(caseId: string) {
    return safeInvoke<TimelineEvent[]>("list_timeline_events", { caseId });
  },
  updateTimelineEvent(
    eventId: string,
    description: string,
    occurredAt?: string,
    eventType?: string,
    sourceFileId?: string,
  ) {
    return safeInvoke<TimelineEvent>("update_timeline_event", {
      eventId,
      description,
      occurredAt,
      eventType,
      sourceFileId: sourceFileId ?? null,
    });
  },
  deleteTimelineEvent(eventId: string) {
    return safeInvoke<void>("delete_timeline_event", { eventId });
  },
  searchAll(caseId: string, query: string, limit?: number) {
    return safeInvoke<SearchHit[]>("search_all", { caseId, query, limit });
  },
  searchFiles(caseId: string, query: string, limit?: number) {
    return safeInvoke<SearchHit[]>("search_files", { caseId, query, limit });
  },
  startTimer(caseId: string) {
    return safeInvoke<TimeEntry>("start_timer", { caseId });
  },
  stopTimer(caseId: string, summary?: string) {
    return safeInvoke<TimeEntry>("stop_timer", { caseId, summary });
  },
  pauseTimer(caseId: string) {
    return safeInvoke<TimeEntry>("pause_timer", { caseId });
  },
  resumeTimer(caseId: string) {
    return safeInvoke<TimeEntry>("resume_timer", { caseId });
  },
  getTimeEntries(caseId: string, limit?: number, offset?: number) {
    return safeInvoke<TimeEntry[]>("get_time_entries", { caseId, limit, offset });
  },
  getTimeEntry(caseId: string, date: string) {
    return safeInvoke<TimeEntry | null>("get_time_entry", { caseId, date });
  },
  getTimeEntriesSummary(caseId: string) {
    return safeInvoke<TimeEntriesSummary>("get_time_entries_summary", { caseId });
  },
  calculateCaseTotal(caseId: string) {
    return safeInvoke<CaseBillingTotal>("calculate_case_total", { caseId });
  },
  getActiveTimer(caseId: string) {
    return safeInvoke<ActiveTimer | null>("get_active_timer", { caseId });
  },
  updateTimeEntry(
    entryId: string,
    updates: {
      entryDate?: string;
      summary?: string;
    },
  ) {
    return safeInvoke<TimeEntry>("update_time_entry", {
      entryId,
      entryDate: updates.entryDate,
      summary: updates.summary,
    });
  },
  createTimeSegment(
    entryId: string,
    payload: {
      startedAt: string;
      endedAt?: string;
      rateOverride?: number;
      discountPercent?: number;
      notes?: string;
    },
  ) {
    return safeInvoke<TimeSegment>("create_time_segment", {
      entryId,
      startedAt: payload.startedAt,
      endedAt: payload.endedAt,
      rateOverride: payload.rateOverride,
      discountPercent: payload.discountPercent,
      notes: payload.notes,
    });
  },
  updateTimeSegment(
    segmentId: string,
    payload: {
      startedAt?: string;
      endedAt?: string;
      rateOverride?: number;
      discountPercent?: number;
      notes?: string;
    },
  ) {
    return safeInvoke<TimeSegment>("update_time_segment", {
      segmentId,
      startedAt: payload.startedAt,
      endedAt: payload.endedAt,
      rateOverride: payload.rateOverride,
      discountPercent: payload.discountPercent,
      notes: payload.notes,
    });
  },
  deleteTimeSegment(segmentId: string) {
    return safeInvoke<void>("delete_time_segment", { segmentId });
  },
  deleteTimeEntry(entryId: string) {
    return safeInvoke<void>("delete_time_entry", { entryId });
  },
  getCaseBillingConfig(caseId: string) {
    return safeInvoke<CaseBillingConfig>("get_case_billing_config", { caseId });
  },
  setCaseBillingConfig(
    caseId: string,
    payload: {
      billingType: string;
      fixedPrice?: number;
      payRate?: number;
      rateUnit?: string;
    },
  ) {
    return safeInvoke<CaseBillingConfig>("set_case_billing_config", {
      caseId,
      billingType: payload.billingType,
      fixedPrice: payload.fixedPrice,
      payRate: payload.payRate,
      rateUnit: payload.rateUnit,
    });
  },
  calculateBillingAmount(caseId: string) {
    return safeInvoke<BillingSummary>("calculate_billing_amount", { caseId });
  },
  readFileText(caseId: string, path: string) {
    return safeInvoke<string>("read_file_text", { caseId, path });
  },
  openFile(caseId: string, path: string) {
    return safeInvoke<string>("open_file", { caseId, path });
  },
  readFileBase64(caseId: string, path: string) {
    return safeInvoke<string>("read_file_base64", { caseId, path });
  },
  extractFileMetadata(caseId: string, fileId: string) {
    return safeInvoke<string>("extract_file_metadata", { caseId, fileId });
  },
  getColumnConfigDb(caseId: string) {
    return safeInvoke<string | null>("get_column_config_db", { caseId });
  },
  saveColumnConfigDb(caseId: string, configData: string) {
    return safeInvoke<void>("save_column_config_db", { caseId, configData });
  },
  getMappingConfigDb(caseId: string) {
    return safeInvoke<string | null>("get_mapping_config_db", { caseId });
  },
  saveMappingConfigDb(caseId: string, configData: string) {
    return safeInvoke<void>("save_mapping_config_db", { caseId, configData });
  },
  reapplyMappingsToCase(caseId: string) {
    return safeInvoke<number>("reapply_mappings_to_case", { caseId });
  },
  getWorkspacePreferencesDb(caseId: string) {
    return safeInvoke<string | null>("get_workspace_preferences_db", { caseId });
  },
  saveWorkspacePreferencesDb(caseId: string, prefsData: string) {
    return safeInvoke<void>("save_workspace_preferences_db", { caseId, prefsData });
  },
  exportCaseReport(caseId: string, reportType: string) {
    return safeInvoke<ReportExport>("export_case_report", {
      caseId,
      reportType,
    });
  },
  listReportExports(caseId: string) {
    return safeInvoke<ReportExportHistoryEntry[]>("list_report_exports", {
      caseId,
    });
  },
  generateCaseReport(caseId: string, templateId?: string) {
    return safeInvoke<string>("generate_case_report", { caseId, templateId });
  },
  generateAiCaseReport(caseId: string, templateId?: string) {
    return safeInvoke<string>("generate_ai_case_report", { caseId, templateId });
  },
  extractFileText(caseId: string, fileId: string, force?: boolean) {
    return safeInvoke<FileTextExtractResult>("extract_file_text", {
      caseId,
      fileId,
      force,
    });
  },
  extractCaseText(caseId: string, force?: boolean) {
    return safeInvoke<ExtractCaseTextSummary>("extract_case_text", {
      caseId,
      force,
    });
  },
  analyzeFileWithAi(caseId: string, fileId: string) {
    return safeInvoke<number>("analyze_file_with_ai", { caseId, fileId });
  },
  analyzeCaseWithAi(caseId: string) {
    return safeInvoke<number>("analyze_case_with_ai", { caseId });
  },
  listAiDrafts(caseId: string) {
    return safeInvoke<AiDraftsBundle>("list_ai_drafts", {
      caseId,
    });
  },
  approveAiFindingDraft(draftId: string) {
    return safeInvoke<string>("approve_ai_finding_draft", { draftId });
  },
  rejectAiFindingDraft(draftId: string, reason?: string) {
    return safeInvoke<void>("reject_ai_finding_draft", { draftId, reason });
  },
  approveAiTimelineDraft(draftId: string) {
    return safeInvoke<string>("approve_ai_timeline_draft", { draftId });
  },
  rejectAiTimelineDraft(draftId: string, reason?: string) {
    return safeInvoke<void>("reject_ai_timeline_draft", { draftId, reason });
  },
  approveAiEntityDraft(draftId: string) {
    return safeInvoke<void>("approve_ai_entity_draft", { draftId });
  },
  rejectAiEntityDraft(draftId: string, reason?: string) {
    return safeInvoke<void>("reject_ai_entity_draft", { draftId, reason });
  },
  countApprovedAiFindings(caseId: string) {
    return safeInvoke<number>("count_approved_ai_findings", { caseId });
  },
  getTesseractAvailable() {
    return safeInvoke<boolean>("get_tesseract_available", {});
  },
  seedSampleFraudCase() {
    return safeInvoke<CaseSummary>("seed_sample_fraud_case", {});
  },
};
