import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SegmentEditDialog } from "@/components/billing/segment-edit-dialog";
import { renderWithProviders } from "@/test/test-utils";
import { commandClient } from "@/lib/command-client";

vi.mock("@/lib/command-client", () => ({
  commandClient: {
    createTimeSegment: vi.fn(),
    updateTimeSegment: vi.fn(),
  },
}));

describe("SegmentEditDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(commandClient.createTimeSegment).mockResolvedValue({
      ok: true,
      data: {
        id: "s-new",
        entryId: "e1",
        startedAt: "2026-01-01T09:00:00Z",
        endedAt: "2026-01-01T10:00:00Z",
        durationSeconds: 3600,
        discountPercent: 0,
      },
    });
  });

  it("validates end after start in create mode", async () => {
    renderWithProviders(
      <SegmentEditDialog
        open
        onOpenChange={() => {}}
        entryId="e1"
        segment={null}
      />,
    );
    expect(screen.getByText("Add time segment")).toBeInTheDocument();
    const start = screen.getByLabelText("Started");
    const end = screen.getByLabelText("Ended");
    await userEvent.clear(start);
    await userEvent.type(start, "2026-01-02T14:00");
    await userEvent.clear(end);
    await userEvent.type(end, "2026-01-02T10:00");
    await userEvent.click(screen.getByRole("button", { name: /Add segment/i }));
    expect(
      screen.getByText(/End time must be after start time/i),
    ).toBeInTheDocument();
  });
});
