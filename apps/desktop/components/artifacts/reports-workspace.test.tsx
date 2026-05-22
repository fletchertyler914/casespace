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
    calculateBillingAmount: vi.fn(),
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
      data: "# Report\n\nPreview body.",
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
  });

  it("loads history and generates case report", async () => {
    renderWithProviders(<ReportsWorkspace caseId={MOCK_CASE_ID} />);
    await waitFor(() => {
      expect(commandClient.listReportExports).toHaveBeenCalled();
    });
    await userEvent.click(
      screen.getByRole("button", { name: /Generate report/i }),
    );
    await waitFor(() => {
      expect(commandClient.generateCaseReport).toHaveBeenCalledWith(MOCK_CASE_ID);
    });
  });
});
