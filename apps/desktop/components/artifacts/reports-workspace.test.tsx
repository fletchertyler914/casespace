import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReportDraft } from "@repo/types";
import { ReportsWorkspace } from "@/components/artifacts/reports-view";
import { renderWithProviders } from "@/test/test-utils";
import {
  MOCK_CASE_ID,
  mockCaseSummary,
  mockFiles,
  mockFindings,
  mockNotes,
  mockTimeline,
} from "@/test/fixtures/mock-data";
import { commandClient } from "@/lib/command-client";

vi.mock("@/lib/command-client", () => ({
  commandClient: {
    getReportDraft: vi.fn(),
    generateAndSaveReportDraft: vi.fn(),
    listReportSnapshots: vi.fn(),
    calculateBillingAmount: vi.fn(),
    countApprovedAiFindings: vi.fn(),
    regenerateReport: vi.fn(),
    runReportComplianceScan: vi.fn(),
    getAiSettings: vi.fn(),
  },
}));

const mockDraft: ReportDraft = {
  id: "draft-1",
  caseId: MOCK_CASE_ID,
  templateId: "cfe-long",
  document: {
    templateId: "cfe-long",
    caseId: MOCK_CASE_ID,
    generatedAt: new Date().toISOString(),
    sections: [
      {
        id: "findings",
        heading: "Findings",
        text: "Mock findings.",
        citations: [],
        standardsTags: [],
      },
    ],
    compliance: [],
    markdown: "# Report\n\nPreview body.",
  },
  sectionStatus: { findings: "aiDrafted" },
  generatedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("ReportsWorkspace (FLOW-005)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(commandClient.getReportDraft).mockResolvedValue({ ok: true, data: null });
    vi.mocked(commandClient.listReportSnapshots).mockResolvedValue({ ok: true, data: [] });
    vi.mocked(commandClient.generateAndSaveReportDraft).mockResolvedValue({
      ok: true,
      data: mockDraft,
    });
    vi.mocked(commandClient.calculateBillingAmount).mockResolvedValue({
      ok: true,
      data: {
        caseId: MOCK_CASE_ID,
        amount: 0,
        totalSeconds: 0,
        totalMinutes: 0,
        billingType: "hourly",
      },
    });
    vi.mocked(commandClient.countApprovedAiFindings).mockResolvedValue({
      ok: true,
      data: 0,
    });
    vi.mocked(commandClient.getAiSettings).mockResolvedValue({
      ok: true,
      data: {
        apiKeySet: true,
        apiKeySource: "keychain",
        model: "gpt-4o-mini",
        baseUrl: "https://api.openai.com/v1/chat/completions",
      },
    });
  });

  it("loads draft state and generates first draft", async () => {
    renderWithProviders(
      <ReportsWorkspace
        caseId={MOCK_CASE_ID}
        caseSummary={mockCaseSummary}
        files={mockFiles}
        notes={mockNotes}
        findings={mockFindings}
        timeline={mockTimeline}
        navigatorOpen
        onExpandNavigator={() => {}}
      />,
    );
    await waitFor(() => {
      expect(commandClient.getReportDraft).toHaveBeenCalledWith(
        MOCK_CASE_ID,
        "cfe-long",
      );
    });
    await userEvent.click(
      screen.getAllByRole("button", { name: /Generate first draft/i })[0]!,
    );
    await waitFor(() => {
      expect(commandClient.generateAndSaveReportDraft).toHaveBeenCalledWith(
        MOCK_CASE_ID,
        "cfe-long",
      );
    });
  });
});
