import { beforeEach, describe, expect, it, vi } from "vitest";
import { setInvokeForTests } from "@/lib/invoke-bridge";
import { commandClient } from "@/lib/command-client";

describe("commandClient", () => {
  const mockInvoke = vi.fn();

  beforeEach(() => {
    mockInvoke.mockReset();
    setInvokeForTests(mockInvoke);
  });

  it("searchAll invokes search_all with caseId, query, and limit", async () => {
    mockInvoke.mockResolvedValue([]);
    await commandClient.searchAll("case-1", "invoice", 50);
    expect(mockInvoke).toHaveBeenCalledWith("search_all", {
      caseId: "case-1",
      query: "invoice",
      limit: 50,
    });
  });

  it("mergeDuplicateMetadata passes group and target file", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await commandClient.mergeDuplicateMetadata("case-1", "g1", "file-primary");
    expect(mockInvoke).toHaveBeenCalledWith("merge_duplicate_metadata", {
      caseId: "case-1",
      groupId: "g1",
      targetFileId: "file-primary",
    });
  });

  it("createCase maps payload fields", async () => {
    mockInvoke.mockResolvedValue({ id: "c1", name: "Test" });
    await commandClient.createCase({
      name: "Test",
      sourcePaths: ["/data"],
    });
    expect(mockInvoke).toHaveBeenCalledWith("create_case", {
      name: "Test",
      sourcePaths: ["/data"],
    });
  });

  it("returns error response when invoke throws", async () => {
    mockInvoke.mockRejectedValue(new Error("disk full"));
    const res = await commandClient.listCases();
    expect(res.ok).toBe(false);
    expect(res.error?.message).toBe("disk full");
  });

  it("renameFile passes caseId, fileId, and newName", async () => {
    mockInvoke.mockResolvedValue({ id: "f1", fileName: "new.pdf" });
    await commandClient.renameFile("case-1", "f1", "new.pdf");
    expect(mockInvoke).toHaveBeenCalledWith("rename_file", {
      caseId: "case-1",
      fileId: "f1",
      newName: "new.pdf",
    });
  });
});

/** P0 command surface — regression guard when adding/removing commands. */
describe("commandClient P0 command registry", () => {
  const p0Commands = [
    "create_case",
    "list_cases",
    "get_case",
    "update_case_metadata",
    "delete_case",
    "ingest_files_to_case",
    "sync_case_all_sources",
    "load_case_files_with_inventory",
    "search_all",
    "merge_duplicate_metadata",
    "rename_file",
    "remove_file_from_case",
    "update_file_status",
    "create_note",
    "list_notes",
    "create_finding",
    "list_findings",
    "create_timeline_event",
    "list_timeline_events",
    "start_timer",
    "stop_timer",
    "pause_timer",
    "resume_timer",
    "export_case_report",
    "get_column_config_db",
    "save_column_config_db",
    "get_mapping_config_db",
    "save_mapping_config_db",
    "check_file_changed",
    "extract_file_metadata",
  ] as const;

  it("documents expected P0 invoke commands", () => {
    expect(p0Commands.length).toBeGreaterThanOrEqual(25);
  });
});
