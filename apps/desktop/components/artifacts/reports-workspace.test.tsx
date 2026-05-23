import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReportsWorkspace } from "@/components/artifacts/reports-view";
import { renderWithProviders } from "@/test/test-utils";
import { MOCK_CASE_ID, mockReportHistory } from "@/test/fixtures/mock-data";
import { commandClient } from "@/lib/command-client";

vi.mock("@/lib/command-client", () => ({
  commandClient: {
    listReportExports: vi.fn(),
    generateCaseReport: vi.fn(),
    generateAiCaseReport: vi.fn(),
    calculateBillingAmount: vi.fn(),
    countApprovedAiFindings: vi.fn(),
    getAiSettings: vi.fn(),
    getTesseractAvailable: vi.fn(),
    loadCaseFiles: vi.fn(),
    extractCaseText: vi.fn(),
    analyzeFileWithAi: vi.fn(),
    analyzeCaseWithAi: vi.fn(),
  },
}));

describe("ReportsWorkspace (FLOW-005)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(commandClient.listReportExports).mockResolvedValue({
      ok: true,
      data: mockReportHistory,
    });
    vi.mocked(commandClient.generateCaseReport).mockResolvedValue({
      ok: true,
      data: JSON.stringify({
        templateId: "cfe-long",
        caseId: MOCK_CASE_ID,
        generatedAt: new Date().toISOString(),
        sections: [],
        compliance: [],
        markdown: "# Report\n\nPreview body.",
      }),
    });
    vi.mocked(commandClient.generateAiCaseReport).mockResolvedValue({
      ok: true,
      data: JSON.stringify({
        templateId: "cfe-long",
        caseId: MOCK_CASE_ID,
        generatedAt: new Date().toISOString(),
        sections: [],
        compliance: [],
        markdown: "# Report\n\nPreview body.",
      }),
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
    vi.mocked(commandClient.getTesseractAvailable).mockResolvedValue({
      ok: true,
      data: true,
    });
    vi.mocked(commandClient.loadCaseFiles).mockResolvedValue({
      ok: true,
      data: [],
    });
  });

  it("loads history and generates case report", async () => {
    renderWithProviders(<ReportsWorkspace caseId={MOCK_CASE_ID} />);
    await waitFor(() => {
      expect(commandClient.listReportExports).toHaveBeenCalled();
    });
    await userEvent.click(
      screen.getByRole("button", { name: /Generate AI report/i }),
    );
    await waitFor(() => {
      expect(commandClient.generateAiCaseReport).toHaveBeenCalledWith(
        MOCK_CASE_ID,
        "cfe-long",
      );
    });
  });
});
