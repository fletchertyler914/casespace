import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteFileDialog } from "@/components/ui/delete-file-dialog";
import { renderWithProviders } from "@/test/test-utils";

describe("DeleteFileDialog", () => {
  it("requires confirmation before remove", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(
      <DeleteFileDialog
        open
        onOpenChange={() => {}}
        fileName="secret.pdf"
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByText(/secret\.pdf/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Remove/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
