import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TimeManagementPage } from "./time-management-page";
import { renderWithProviders } from "@/test/test-utils";
import { MOCK_CASE_ID, mockTimeEntries } from "@/test/fixtures/mock-data";
import { commandClient } from "@/lib/command-client";

vi.mock("@/lib/command-client", () => ({
  commandClient: {
    getTimeEntries: vi.fn(),
    getCaseBillingConfig: vi.fn(),
    getTimeEntriesSummary: vi.fn(),
    calculateCaseTotal: vi.fn(),
  },
}));

describe("TimeManagementPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(commandClient.getTimeEntries).mockResolvedValue({
      ok: true,
      data: mockTimeEntries,
    });
    vi.mocked(commandClient.getCaseBillingConfig).mockResolvedValue({
      ok: true,
      data: {
        caseId: MOCK_CASE_ID,
        billingType: "pay_rate",
        payRate: 100,
        rateUnit: "hourly",
      },
    });
    vi.mocked(commandClient.getTimeEntriesSummary).mockResolvedValue({
      ok: true,
      data: { caseId: MOCK_CASE_ID, totalSeconds: 3600, totalDays: 1 },
    });
    vi.mocked(commandClient.calculateCaseTotal).mockResolvedValue({
      ok: true,
      data: {
        caseId: MOCK_CASE_ID,
        totalAmount: 100,
        totalSeconds: 3600,
        totalDays: 1,
      },
    });
  });

  it("renders header stats and list view", async () => {
    renderWithProviders(
      <TimeManagementPage
        open
        onOpenChange={() => {}}
        caseId={MOCK_CASE_ID}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText("Time management")).toBeInTheDocument();
    });
    expect(screen.getByText("Days tracked")).toBeInTheDocument();
    expect(screen.getByText("Review")).toBeInTheDocument();
  });

  it("switches to calendar view", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TimeManagementPage
        open
        onOpenChange={() => {}}
        caseId={MOCK_CASE_ID}
      />,
    );
    await waitFor(() => screen.getByText("Calendar"));
    await user.click(screen.getByRole("button", { name: /Calendar/i }));
    expect(screen.getByText("Sun")).toBeInTheDocument();
  });
});
