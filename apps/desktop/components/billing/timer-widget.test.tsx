import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TimerWidget } from "@/components/billing/timer-widget";
import { renderWithProviders } from "@/test/test-utils";
import { MOCK_CASE_ID, mockTimeEntries } from "@/test/fixtures/mock-data";
import { commandClient } from "@/lib/command-client";

vi.mock("@/lib/command-client", () => ({
  commandClient: {
    getTimeEntry: vi.fn(),
    getActiveTimer: vi.fn(),
    startTimer: vi.fn(),
    pauseTimer: vi.fn(),
    resumeTimer: vi.fn(),
    stopTimer: vi.fn(),
    calculateBillingAmount: vi.fn(),
    listCases: vi.fn(),
  },
}));

describe("TimerWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(commandClient.getTimeEntry).mockResolvedValue({
      ok: true,
      data: null,
    });
    vi.mocked(commandClient.getActiveTimer).mockResolvedValue({
      ok: true,
      data: null,
    });
    vi.mocked(commandClient.listCases).mockResolvedValue({ ok: true, data: [] });
    vi.mocked(commandClient.calculateBillingAmount).mockResolvedValue({
      ok: true,
      data: {
        caseId: MOCK_CASE_ID,
        totalSeconds: 3600,
        totalMinutes: 60,
        amount: 100,
        billingType: "pay_rate",
      },
    });
    vi.mocked(commandClient.startTimer).mockResolvedValue({
      ok: true,
      data: mockTimeEntries[0]!,
    });
  });

  it("shows idle state with start control", async () => {
    renderWithProviders(<TimerWidget caseId={MOCK_CASE_ID} />);
    await waitFor(() => {
      expect(commandClient.getTimeEntry).toHaveBeenCalled();
    });
    expect(screen.getByRole("button", { name: /^Start$/i })).toBeInTheDocument();
  });

  it("starts timer on click", async () => {
    renderWithProviders(<TimerWidget caseId={MOCK_CASE_ID} />);
    await waitFor(() => expect(commandClient.getTimeEntry).toHaveBeenCalled());
    await userEvent.click(screen.getByRole("button", { name: /^Start$/i }));
    expect(commandClient.startTimer).toHaveBeenCalledWith(MOCK_CASE_ID);
  });

  it("shows pause and stop when running", async () => {
    vi.mocked(commandClient.getActiveTimer).mockResolvedValue({
      ok: true,
      data: {
        caseId: MOCK_CASE_ID,
        entryId: "entry-1",
        startedAt: new Date().toISOString(),
      },
    });
    renderWithProviders(<TimerWidget caseId={MOCK_CASE_ID} />);
    await waitFor(() => {
      expect(screen.getByLabelText("Pause timer")).toBeInTheDocument();
    });
    expect(screen.getByLabelText("Stop timer")).toBeInTheDocument();
  });

  it("opens daily summary dialog on stop", async () => {
    vi.mocked(commandClient.getActiveTimer).mockResolvedValue({
      ok: true,
      data: {
        caseId: MOCK_CASE_ID,
        entryId: "entry-1",
        startedAt: new Date().toISOString(),
      },
    });
    renderWithProviders(<TimerWidget caseId={MOCK_CASE_ID} />);
    await waitFor(() => screen.getByLabelText("Stop timer"));
    await userEvent.click(screen.getByLabelText("Stop timer"));
    expect(screen.getByText("Daily summary")).toBeInTheDocument();
  });
});
