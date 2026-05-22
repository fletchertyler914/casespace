import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotesPanel } from "@/components/artifacts/notes-panel";
import { renderWithProviders } from "@/test/test-utils";
import { mockNotes, MOCK_CASE_ID } from "@/test/fixtures/mock-data";
import { commandClient } from "@/lib/command-client";

vi.mock("@/lib/command-client", () => ({
  commandClient: {
    createNote: vi.fn(),
    updateNote: vi.fn(),
    deleteNote: vi.fn(),
    toggleNotePinned: vi.fn(),
  },
}));

describe("NotesPanel (FLOW-003)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(commandClient.toggleNotePinned).mockResolvedValue({
      ok: true,
      data: { ...mockNotes[0]!, pinned: false },
    });
  });

  it("lists notes and toggles pin", async () => {
    const onChanged = vi.fn();
    renderWithProviders(
      <NotesPanel
        caseId={MOCK_CASE_ID}
        notes={mockNotes}
        onClose={() => {}}
        onChanged={onChanged}
      />,
    );
    expect(screen.getByText(/First note/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /^Pinned$/i }));
    expect(commandClient.toggleNotePinned).toHaveBeenCalledWith("note-1");
    expect(onChanged).toHaveBeenCalled();
  });
});
