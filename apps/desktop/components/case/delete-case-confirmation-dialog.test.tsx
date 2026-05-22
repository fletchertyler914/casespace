import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteCaseConfirmationDialog } from "@/components/case/delete-case-confirmation-dialog";
import { renderWithProviders } from "@/test/test-utils";

describe("DeleteCaseConfirmationDialog", () => {
  it("requires explicit confirm for case delete (AC-SEC-02)", async () => {
    const onConfirm = vi.fn();
    renderWithProviders(
      <DeleteCaseConfirmationDialog
        open
        onOpenChange={() => {}}
        caseName="Sensitive Case"
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByText(/Sensitive Case/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Delete Case/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
