import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RenameFileDialog } from "@/components/ui/rename-file-dialog";
import { renderWithProviders } from "@/test/test-utils";

describe("RenameFileDialog", () => {
  it("blocks rename when name is unchanged", async () => {
    const onConfirm = vi.fn();
    renderWithProviders(
      <RenameFileDialog
        open
        onOpenChange={() => {}}
        currentFileName="doc.pdf"
        onConfirm={onConfirm}
      />,
    );
    const renameBtn = screen.getByRole("button", { name: /^Rename$/i });
    expect(renameBtn).toBeDisabled();
    await userEvent.click(renameBtn);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("calls onConfirm with full filename including extension", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(
      <RenameFileDialog
        open
        onOpenChange={() => {}}
        currentFileName="doc.pdf"
        onConfirm={onConfirm}
      />,
    );
    const input = screen.getByLabelText(/New name/i);
    await userEvent.clear(input);
    await userEvent.type(input, "renamed");
    await userEvent.click(screen.getByRole("button", { name: /^Rename$/i }));
    expect(onConfirm).toHaveBeenCalledWith("renamed.pdf");
  });
});
