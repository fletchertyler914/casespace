import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReportsPanel } from "@/components/artifacts/reports-panel";
import { renderWithProviders } from "@/test/test-utils";
import { MOCK_CASE_ID, mockReportHistory } from "@/test/fixtures/mock-data";
import { commandClient } from "@/lib/command-client";

vi.mock("@/lib/command-client", () => ({
  commandClient: {
    listReportExports: vi.fn(),
    exportCaseReport: vi.fn(),
    generateCaseReport: vi.fn(),
  },
}));

vi.mock("@/lib/tauri-dialog", () => ({
  openInShell: vi.fn(),
}));

describe("ReportsPanel (FLOW-005)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(commandClient.listReportExports).mockResolvedValue({
      ok: true,
      data: mockReportHistory,
    });
    vi.mocked(commandClient.exportCaseReport).mockResolvedValue({
      ok: true,
      data: {
        reportType: "narrative",
        filePath: "/tmp/report.md",
        generatedAt: new Date().toISOString(),
      },
    });
    vi.mocked(commandClient.generateCaseReport).mockResolvedValue({
      ok: true,
      data: "# Report\n\nPreview body.",
    });
  });

  it("loads export history and exports narrative report", async () => {
    renderWithProviders(
      <ReportsPanel caseId={MOCK_CASE_ID} onClose={() => {}} />,
    );
    await waitFor(() => {
      expect(commandClient.listReportExports).toHaveBeenCalled();
    });
    await userEvent.click(
      screen.getByRole("button", { name: /Export Narrative/i }),
    );
    await waitFor(() => {
      expect(commandClient.exportCaseReport).toHaveBeenCalledWith(
        MOCK_CASE_ID,
        "narrative",
      );
    });
  });
});
