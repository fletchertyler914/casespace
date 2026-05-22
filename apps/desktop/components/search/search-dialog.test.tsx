import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchDialog } from "@/components/search/search-dialog";
import { renderWithProviders } from "@/test/test-utils";
import { commandClient } from "@/lib/command-client";

vi.mock("@/lib/command-client", () => ({
  commandClient: {
    searchAll: vi.fn(),
  },
}));

const files = [
  {
    id: "file-1",
    caseId: "c1",
    fileName: "report.pdf",
    filePath: "/report.pdf",
    status: "unreviewed",
    sizeBytes: 1,
    modifiedAt: "2026-01-01T00:00:00Z",
  },
];

describe("SearchDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  it("does not search until query is at least 2 characters", async () => {
    renderWithProviders(
      <SearchDialog
        open
        onOpenChange={() => {}}
        caseId="c1"
        files={files}
        onFileOpen={() => {}}
        onOpenEntityPanel={() => {}}
      />,
    );
    await userEvent.type(screen.getByPlaceholderText(/Search files/i), "a");
    vi.advanceTimersByTime(300);
    expect(commandClient.searchAll).not.toHaveBeenCalled();
  });

  it("shows grouped results after debounced search", async () => {
    vi.mocked(commandClient.searchAll).mockResolvedValue({
      ok: true,
      data: [
        {
          id: "file-1",
          entityType: "file",
          title: "report.pdf",
          snippet: "match",
        },
      ],
    });
    renderWithProviders(
      <SearchDialog
        open
        onOpenChange={() => {}}
        caseId="c1"
        files={files}
        onFileOpen={() => {}}
        onOpenEntityPanel={() => {}}
      />,
    );
    await userEvent.type(screen.getByPlaceholderText(/Search files/i), "rep");
    vi.advanceTimersByTime(250);
    await waitFor(() => {
      expect(commandClient.searchAll).toHaveBeenCalledWith("c1", "rep", 80);
    });
    await waitFor(() => {
      expect(screen.getByText("report.pdf")).toBeInTheDocument();
    });
  });
});
