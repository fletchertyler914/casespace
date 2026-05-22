import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TimerWidget } from "@/components/billing/timer-widget";
import { renderWithProviders } from "@/test/test-utils";
import { MOCK_CASE_ID, mockTimeEntries } from "@/test/fixtures/mock-data";
import { commandClient } from "@/lib/command-client";

vi.mock("@/lib/command-client", () => ({
  commandClient: {
    getTimeEntries: vi.fn(),
    getActiveTimer: vi.fn(),
    startTimer: vi.fn(),
    stopTimer: vi.fn(),
  },
}));

describe("TimerWidget (FLOW-006)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(commandClient.getTimeEntries).mockResolvedValue({
      ok: true,
      data: mockTimeEntries,
    });
    vi.mocked(commandClient.getActiveTimer).mockResolvedValue({
      ok: true,
      data: null,
    });
    vi.mocked(commandClient.startTimer).mockResolvedValue({
      ok: true,
      data: {
        id: "entry-open",
        caseId: MOCK_CASE_ID,
        startedAt: new Date().toISOString(),
        billableMinutes: 0,
      },
    });
  });

  it("loads entries and starts timer", async () => {
    renderWithProviders(<TimerWidget caseId={MOCK_CASE_ID} />);
    await waitFor(() => {
      expect(commandClient.getTimeEntries).toHaveBeenCalledWith(MOCK_CASE_ID);
    });
    await userEvent.click(screen.getByRole("button", { name: /^Start$/i }));
    expect(commandClient.startTimer).toHaveBeenCalledWith(MOCK_CASE_ID);
  });
});
