"use client";

import { invoke } from "@tauri-apps/api/core";
import type {
  BillingSummary,
  CaseFile,
  CaseSummary,
  CommandResponse,
  CreateCasePayload,
  IngestResult,
  Finding,
  Note,
  ReportExport,
  SearchHit,
  TimelineEvent,
  TimeEntry,
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
  deleteCase(caseId: string) {
    return safeInvoke<void>("delete_case", { caseId });
  },
  addCaseSource(caseId: string, sourcePath: string) {
    return safeInvoke<void>("add_case_source", { caseId, sourcePath });
  },
  listCaseSources(caseId: string) {
    return safeInvoke<string[]>("list_case_sources", { caseId });
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
  createNote(caseId: string, content: string) {
    return safeInvoke<Note>("create_note", { caseId, content });
  },
  listNotes(caseId: string) {
    return safeInvoke<Note[]>("list_notes", { caseId });
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
  createFinding(caseId: string, title: string, description: string) {
    return safeInvoke<Finding>("create_finding", {
      caseId,
      title,
      description,
    });
  },
  listFindings(caseId: string) {
    return safeInvoke<Finding[]>("list_findings", { caseId });
  },
  updateFinding(findingId: string, title: string, description: string) {
    return safeInvoke<Finding>("update_finding", {
      findingId,
      title,
      description,
    });
  },
  deleteFinding(findingId: string) {
    return safeInvoke<void>("delete_finding", { findingId });
  },
  createTimelineEvent(
    caseId: string,
    description: string,
    occurredAt?: string,
  ) {
    return safeInvoke<TimelineEvent>("create_timeline_event", {
      caseId,
      description,
      occurredAt,
    });
  },
  listTimelineEvents(caseId: string) {
    return safeInvoke<TimelineEvent[]>("list_timeline_events", { caseId });
  },
  updateTimelineEvent(eventId: string, description: string, occurredAt?: string) {
    return safeInvoke<TimelineEvent>("update_timeline_event", {
      eventId,
      description,
      occurredAt,
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
  stopTimer(entryId: string) {
    return safeInvoke<TimeEntry>("stop_timer", { entryId });
  },
  pauseTimer(caseId: string) {
    return safeInvoke<TimeEntry>("pause_timer", { caseId });
  },
  resumeTimer(caseId: string) {
    return safeInvoke<TimeEntry>("resume_timer", { caseId });
  },
  getTimeEntries(caseId: string) {
    return safeInvoke<TimeEntry[]>("get_time_entries", { caseId });
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
  generateCaseReport(caseId: string) {
    return safeInvoke<string>("generate_case_report", { caseId });
  },
};
