import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FileChangeWarning } from "@/components/viewer/file-change-warning";
import { renderWithProviders } from "@/test/test-utils";

describe("FileChangeWarning", () => {
  it("renders nothing when unchanged", () => {
    renderWithProviders(
      <FileChangeWarning
        changed={false}
        onRefresh={async () => {}}
        onDismiss={() => {}}
      />,
    );
    expect(screen.queryByText(/File changed on disk/i)).not.toBeInTheDocument();
  });

  it("refresh calls onRefresh and dismiss", async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const onDismiss = vi.fn();
    renderWithProviders(
      <FileChangeWarning
        changed
        onRefresh={onRefresh}
        onDismiss={onDismiss}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /Refresh/i }));
    expect(onRefresh).toHaveBeenCalled();
    expect(onDismiss).toHaveBeenCalled();
  });
});
