import { commandClient } from "@/lib/command-client";

/** Every commandClient method → expected Tauri command name for contract tests. */
export const INVOKE_CONTRACTS: Array<{
  label: string;
  run: () => Promise<unknown>;
  command: string;
  matchArgs?: (args: Record<string, unknown>) => boolean;
}> = [
  {
    label: "createCase",
    run: () =>
      commandClient.createCase({ name: "N", sourcePaths: ["/x"] }),
    command: "create_case",
  },
  { label: "listCases", run: () => commandClient.listCases(), command: "list_cases" },
  {
    label: "getCase",
    run: () => commandClient.getCase("c1"),
    command: "get_case",
    matchArgs: (a) => a.caseId === "c1",
  },
  {
    label: "updateCaseMetadata",
    run: () => commandClient.updateCaseMetadata("c1", { name: "X" }),
    command: "update_case_metadata",
  },
  {
    label: "deleteCase",
    run: () => commandClient.deleteCase("c1"),
    command: "delete_case",
  },
  {
    label: "addCaseSource",
    run: () => commandClient.addCaseSource("c1", "/src"),
    command: "add_case_source",
  },
  {
    label: "listCaseSources",
    run: () => commandClient.listCaseSources("c1"),
    command: "list_case_sources",
  },
  {
    label: "countDirectoryFiles",
    run: () => commandClient.countDirectoryFiles("/src"),
    command: "count_directory_files",
  },
  {
    label: "ingestFilesToCase",
    run: () => commandClient.ingestFilesToCase("c1", { incremental: true }),
    command: "ingest_files_to_case",
  },
  {
    label: "loadCaseFilesWithInventory",
    run: () => commandClient.loadCaseFilesWithInventory("c1"),
    command: "load_case_files_with_inventory",
  },
  {
    label: "syncCaseAllSources",
    run: () => commandClient.syncCaseAllSources("c1", true),
    command: "sync_case_all_sources",
  },
  {
    label: "refreshSingleFile",
    run: () => commandClient.refreshSingleFile("c1", "/f"),
    command: "refresh_single_file",
  },
  {
    label: "refreshFilesBulk",
    run: () => commandClient.refreshFilesBulk("c1", ["/a"]),
    command: "refresh_files_bulk",
  },
  {
    label: "checkFileChanged",
    run: () => commandClient.checkFileChanged("c1", "f1"),
    command: "check_file_changed",
  },
  {
    label: "loadCaseFiles",
    run: () => commandClient.loadCaseFiles("c1"),
    command: "load_case_files",
  },
  {
    label: "renameFile",
    run: () => commandClient.renameFile("c1", "f1", "new.pdf"),
    command: "rename_file",
  },
  {
    label: "removeFileFromCase",
    run: () => commandClient.removeFileFromCase("c1", "f1"),
    command: "remove_file_from_case",
  },
  {
    label: "updateFileStatus",
    run: () => commandClient.updateFileStatus("f1", "reviewed"),
    command: "update_file_status",
  },
  {
    label: "findDuplicateFiles",
    run: () => commandClient.findDuplicateFiles("c1"),
    command: "find_duplicate_files",
  },
  {
    label: "markDuplicatePrimary",
    run: () => commandClient.markDuplicatePrimary("c1", "g1", "f1"),
    command: "mark_duplicate_primary",
  },
  {
    label: "mergeDuplicateMetadata",
    run: () => commandClient.mergeDuplicateMetadata("c1", "g1", "f1"),
    command: "merge_duplicate_metadata",
  },
  {
    label: "createNote",
    run: () => commandClient.createNote("c1", "<p>x</p>"),
    command: "create_note",
  },
  { label: "listNotes", run: () => commandClient.listNotes("c1"), command: "list_notes" },
  {
    label: "getFileNoteCounts",
    run: () => commandClient.getFileNoteCounts("c1"),
    command: "get_file_note_counts",
  },
  {
    label: "listCaseFileMetadata",
    run: () => commandClient.listCaseFileMetadata("c1"),
    command: "list_case_file_metadata",
  },
  {
    label: "updateNote",
    run: () => commandClient.updateNote("n1", "<p>y</p>"),
    command: "update_note",
  },
  {
    label: "toggleNotePinned",
    run: () => commandClient.toggleNotePinned("n1"),
    command: "toggle_note_pinned",
  },
  {
    label: "deleteNote",
    run: () => commandClient.deleteNote("n1"),
    command: "delete_note",
  },
  {
    label: "createFinding",
    run: () => commandClient.createFinding("c1", "t", "d", "high"),
    command: "create_finding",
  },
  {
    label: "listFindings",
    run: () => commandClient.listFindings("c1"),
    command: "list_findings",
  },
  {
    label: "updateFinding",
    run: () => commandClient.updateFinding("f1", "t", "d", "low"),
    command: "update_finding",
  },
  {
    label: "deleteFinding",
    run: () => commandClient.deleteFinding("f1"),
    command: "delete_finding",
  },
  {
    label: "createTimelineEvent",
    run: () =>
      commandClient.createTimelineEvent("c1", "evt", "2026-01-01", "manual"),
    command: "create_timeline_event",
  },
  {
    label: "listTimelineEvents",
    run: () => commandClient.listTimelineEvents("c1"),
    command: "list_timeline_events",
  },
  {
    label: "updateTimelineEvent",
    run: () =>
      commandClient.updateTimelineEvent("e1", "evt2", "2026-01-02", "meeting"),
    command: "update_timeline_event",
  },
  {
    label: "deleteTimelineEvent",
    run: () => commandClient.deleteTimelineEvent("e1"),
    command: "delete_timeline_event",
  },
  {
    label: "searchAll",
    run: () => commandClient.searchAll("c1", "q", 10),
    command: "search_all",
  },
  {
    label: "searchFiles",
    run: () => commandClient.searchFiles("c1", "q", 5),
    command: "search_files",
  },
  {
    label: "startTimer",
    run: () => commandClient.startTimer("c1"),
    command: "start_timer",
  },
  {
    label: "stopTimer",
    run: () => commandClient.stopTimer("c1", "done"),
    command: "stop_timer",
  },
  {
    label: "pauseTimer",
    run: () => commandClient.pauseTimer("c1"),
    command: "pause_timer",
  },
  {
    label: "resumeTimer",
    run: () => commandClient.resumeTimer("c1"),
    command: "resume_timer",
  },
  {
    label: "getTimeEntries",
    run: () => commandClient.getTimeEntries("c1", 50, 0),
    command: "get_time_entries",
  },
  {
    label: "getTimeEntry",
    run: () => commandClient.getTimeEntry("c1", "2026-01-01"),
    command: "get_time_entry",
  },
  {
    label: "getTimeEntriesSummary",
    run: () => commandClient.getTimeEntriesSummary("c1"),
    command: "get_time_entries_summary",
  },
  {
    label: "calculateCaseTotal",
    run: () => commandClient.calculateCaseTotal("c1"),
    command: "calculate_case_total",
  },
  {
    label: "getActiveTimer",
    run: () => commandClient.getActiveTimer("c1"),
    command: "get_active_timer",
  },
  {
    label: "updateTimeEntry",
    run: () =>
      commandClient.updateTimeEntry("e1", { summary: "s" }),
    command: "update_time_entry",
  },
  {
    label: "createTimeSegment",
    run: () =>
      commandClient.createTimeSegment("e1", {
        startedAt: "2026-01-01T00:00:00Z",
      }),
    command: "create_time_segment",
  },
  {
    label: "updateTimeSegment",
    run: () =>
      commandClient.updateTimeSegment("s1", { notes: "n" }),
    command: "update_time_segment",
  },
  {
    label: "deleteTimeSegment",
    run: () => commandClient.deleteTimeSegment("s1"),
    command: "delete_time_segment",
  },
  {
    label: "deleteTimeEntry",
    run: () => commandClient.deleteTimeEntry("e1"),
    command: "delete_time_entry",
  },
  {
    label: "getCaseBillingConfig",
    run: () => commandClient.getCaseBillingConfig("c1"),
    command: "get_case_billing_config",
  },
  {
    label: "setCaseBillingConfig",
    run: () =>
      commandClient.setCaseBillingConfig("c1", {
        billingType: "hourly",
        payRate: 100,
        rateUnit: "hour",
      }),
    command: "set_case_billing_config",
  },
  {
    label: "calculateBillingAmount",
    run: () => commandClient.calculateBillingAmount("c1"),
    command: "calculate_billing_amount",
  },
  {
    label: "readFileText",
    run: () => commandClient.readFileText("c1", "/f"),
    command: "read_file_text",
  },
  {
    label: "openFile",
    run: () => commandClient.openFile("c1", "/f"),
    command: "open_file",
  },
  {
    label: "readFileBase64",
    run: () => commandClient.readFileBase64("c1", "/f"),
    command: "read_file_base64",
  },
  {
    label: "extractFileMetadata",
    run: () => commandClient.extractFileMetadata("c1", "f1"),
    command: "extract_file_metadata",
  },
  {
    label: "getColumnConfigDb",
    run: () => commandClient.getColumnConfigDb("c1"),
    command: "get_column_config_db",
  },
  {
    label: "saveColumnConfigDb",
    run: () => commandClient.saveColumnConfigDb("c1", "{}"),
    command: "save_column_config_db",
  },
  {
    label: "getMappingConfigDb",
    run: () => commandClient.getMappingConfigDb("c1"),
    command: "get_mapping_config_db",
  },
  {
    label: "saveMappingConfigDb",
    run: () => commandClient.saveMappingConfigDb("c1", "{}"),
    command: "save_mapping_config_db",
  },
  {
    label: "reapplyMappingsToCase",
    run: () => commandClient.reapplyMappingsToCase("c1"),
    command: "reapply_mappings_to_case",
  },
  {
    label: "getWorkspacePreferencesDb",
    run: () => commandClient.getWorkspacePreferencesDb("c1"),
    command: "get_workspace_preferences_db",
  },
  {
    label: "saveWorkspacePreferencesDb",
    run: () => commandClient.saveWorkspacePreferencesDb("c1", "{}"),
    command: "save_workspace_preferences_db",
  },
  {
    label: "exportCaseReport",
    run: () => commandClient.exportCaseReport("c1", "narrative"),
    command: "export_case_report",
  },
  {
    label: "listReportExports",
    run: () => commandClient.listReportExports("c1"),
    command: "list_report_exports",
  },
  {
    label: "generateCaseReport",
    run: () => commandClient.generateCaseReport("c1", "cfe-long"),
    command: "generate_case_report",
  },
];
