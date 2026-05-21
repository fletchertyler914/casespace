"use client";

import { invoke } from "@tauri-apps/api/core";
import type {
  CaseSummary,
  CommandResponse,
  CreateCasePayload,
  Note,
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
  payload: Record<string, unknown>,
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
    return safeInvoke<CaseSummary[]>("list_cases", {});
  },
  createNote(caseId: string, content: string) {
    return safeInvoke<Note>("create_note", { caseId, content });
  },
  listNotes(caseId: string) {
    return safeInvoke<Note[]>("list_notes", { caseId });
  },
  searchAll(caseId: string, query: string) {
    return safeInvoke<string[]>("search_all", { caseId, query });
  },
  startTimer(caseId: string) {
    return safeInvoke<TimeEntry>("start_timer", { caseId });
  },
  stopTimer(entryId: string) {
    return safeInvoke<TimeEntry>("stop_timer", { entryId });
  },
  getTimeEntries(caseId: string) {
    return safeInvoke<TimeEntry[]>("get_time_entries", { caseId });
  },
  runOcrPreview(caseId: string, filePath: string) {
    return safeInvoke<string>("run_ocr_preview", { caseId, filePath });
  },
  generateCaseReport(caseId: string) {
    return safeInvoke<string>("generate_case_report", { caseId });
  },
};
